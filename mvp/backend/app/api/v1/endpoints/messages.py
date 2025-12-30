"""
Message endpoints with ARIA integration.

Handles parent-to-parent communication with AI-powered conflict prevention.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.message import Message, MessageFlag, MessageThread
from app.models.case import Case, CaseParticipant
from app.models.child import Child
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    MessageWithFlagResponse,
    InterventionAction,
    ARIAAnalysisResponse,
    AnalyticsResponse,
    ThreadCreate,
    ThreadResponse
)
from app.services.aria import aria_service
from app.core.websocket import manager
from datetime import datetime
import uuid


router = APIRouter()


@router.post("/analyze", response_model=ARIAAnalysisResponse)
async def analyze_message_content(
    case_id: str,
    content: str = Query(..., min_length=1),
    use_ai: bool = Query(default=False),
    ai_provider: str = Query(default="claude", regex="^(claude|openai|regex)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze message content before sending (preview mode).

    This allows users to check their message before sending.

    Args:
        case_id: Case ID for context
        content: Message content to analyze
        use_ai: Whether to use AI analysis (slower but more accurate)
        ai_provider: Which AI provider to use (claude, openai, or regex for fast analysis)

    Returns:
        ARIA analysis result
    """
    # Verify user has access to case
    result = await db.execute(
        select(CaseParticipant).where(
            and_(
                CaseParticipant.case_id == case_id,
                CaseParticipant.user_id == current_user.id,
                CaseParticipant.is_active == True
            )
        )
    )
    participant = result.scalar_one_or_none()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this case"
        )
    
    # Get case context (children for context)
    children_result = await db.execute(
        select(Child).where(
            and_(
                Child.case_id == case_id,
                Child.is_active == True
            )
        )
    )
    children = children_result.scalars().all()
    
    case_context = {
        "children": [
            {
                "first_name": child.first_name,
                "age": (datetime.utcnow().date() - child.date_of_birth).days // 365
            }
            for child in children
        ]
    }
    
    # Analyze with ARIA
    if use_ai and ai_provider == "claude":
        analysis = await aria_service.analyze_with_ai(content, case_context)
    elif use_ai and ai_provider == "openai":
        analysis = await aria_service.analyze_with_openai(content, case_context)
    else:
        # Fast regex analysis (default or ai_provider="regex")
        result = aria_service.analyze_message(content)
        analysis = {
            "toxicity_score": result.toxicity_score,
            "categories": [cat.value for cat in result.categories],
            "triggers": result.triggers,
            "explanation": result.explanation,
            "suggestions": [result.suggestion] if result.suggestion else [],
            "ai_powered": False,
            "provider": "regex"
        }
    
    # Determine if flagged
    is_flagged = analysis["toxicity_score"] > 0.3
    
    # Map score to level
    score = analysis["toxicity_score"]
    if score < 0.2:
        toxicity_level = "green"
    elif score < 0.5:
        toxicity_level = "yellow"
    elif score < 0.8:
        toxicity_level = "orange"
    else:
        toxicity_level = "red"
    
    return ARIAAnalysisResponse(
        toxicity_level=toxicity_level,
        toxicity_score=analysis["toxicity_score"],
        categories=analysis.get("categories", []),
        triggers=analysis.get("triggers", []),
        explanation=analysis.get("explanation", ""),
        suggestion=analysis["suggestions"][0] if analysis.get("suggestions") else None,
        is_flagged=is_flagged
    )


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message with ARIA analysis.
    
    Flow:
    1. Verify user access to case
    2. Analyze message with ARIA
    3. If toxic, create intervention flag (frontend will show UI)
    4. Save message and flag (if any)
    5. Broadcast via WebSocket to other parent
    
    Args:
        message_data: Message content and metadata
        
    Returns:
        Created message with ARIA analysis result if flagged
    """
    # Verify access
    result = await db.execute(
        select(CaseParticipant).where(
            and_(
                CaseParticipant.case_id == message_data.case_id,
                CaseParticipant.user_id == current_user.id,
                CaseParticipant.is_active == True
            )
        )
    )
    participant = result.scalar_one_or_none()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this case"
        )
    
    # Verify recipient is in the case
    recipient_result = await db.execute(
        select(CaseParticipant).where(
            and_(
                CaseParticipant.case_id == message_data.case_id,
                CaseParticipant.user_id == message_data.recipient_id,
                CaseParticipant.is_active == True
            )
        )
    )
    recipient_participant = recipient_result.scalar_one_or_none()
    
    if not recipient_participant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient is not a participant in this case"
        )
    
    # Get children for context
    children_result = await db.execute(
        select(Child).where(
            and_(
                Child.case_id == message_data.case_id,
                Child.is_active == True
            )
        )
    )
    children = children_result.scalars().all()
    
    case_context = {
        "children": [
            {"first_name": child.first_name}
            for child in children
        ]
    }
    
    # Analyze with ARIA (fast regex check)
    aria_analysis = aria_service.analyze_message(message_data.content)
    
    # Create message
    new_message = Message(
        id=str(uuid.uuid4()),
        case_id=message_data.case_id,
        thread_id=message_data.thread_id,
        sender_id=current_user.id,
        recipient_id=message_data.recipient_id,
        content=message_data.content,
        message_type=message_data.message_type,
        sent_at=datetime.utcnow(),
        was_flagged=aria_analysis.is_flagged
    )
    
    # If flagged, create MessageFlag for analytics
    message_flag = None
    if aria_analysis.is_flagged:
        message_flag = MessageFlag(
            id=str(uuid.uuid4()),
            message_id=new_message.id,
            flagged_by="aria_auto",
            flag_type="toxicity_detected",
            toxicity_score=aria_analysis.toxicity_score,
            toxicity_categories=[cat.value for cat in aria_analysis.categories],
            suggested_rewrite=aria_analysis.suggestion,
            user_action=None,  # Will be updated when user responds
            created_at=datetime.utcnow()
        )
        db.add(message_flag)
    
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    
    # Broadcast via WebSocket to recipient
    try:
        await manager.send_message(
            case_id=message_data.case_id,
            message={
                "type": "new_message",
                "message_id": new_message.id,
                "sender_id": current_user.id,
                "content": new_message.content,
                "sent_at": new_message.sent_at.isoformat(),
                "was_flagged": new_message.was_flagged
            }
        )
    except Exception as e:
        print(f"WebSocket broadcast failed: {e}")
    
    return MessageResponse(
        id=new_message.id,
        case_id=new_message.case_id,
        thread_id=new_message.thread_id,
        sender_id=new_message.sender_id,
        recipient_id=new_message.recipient_id,
        content=new_message.content,
        message_type=new_message.message_type,
        sent_at=new_message.sent_at,
        delivered_at=new_message.delivered_at,
        read_at=new_message.read_at,
        was_flagged=new_message.was_flagged,
        original_content=None
    )


@router.post("/{message_id}/intervention", response_model=MessageResponse)
async def handle_intervention_response(
    message_id: str,
    action: InterventionAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Handle user's response to ARIA intervention.
    
    User can:
    - Accept the suggestion (use ARIA's rewrite)
    - Modify the suggestion
    - Reject and rewrite themselves
    - Send anyway (if not red level)
    
    Args:
        message_id: Message ID that was flagged
        action: User's intervention action
        
    Returns:
        Updated message
    """
    # Get message
    result = await db.execute(
        select(Message).where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Verify user is sender
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own messages"
        )
    
    # Get the message flag
    flag_result = await db.execute(
        select(MessageFlag).where(MessageFlag.message_id == message_id)
    )
    flag = flag_result.scalar_one_or_none()
    
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No intervention found for this message"
        )
    
    # Update flag with user action
    flag.user_action = action.action
    flag.notes = action.notes
    
    # Update message content based on action
    if action.action == "accepted":
        # Use ARIA's suggestion
        message.original_content = message.content
        message.content = flag.suggested_rewrite
    elif action.action == "modified":
        # Use user's modified version
        message.original_content = message.content
        message.content = action.final_message
    elif action.action == "rejected":
        # User rewrote themselves
        message.original_content = message.content
        message.content = action.final_message
    # "sent_anyway" keeps original content
    
    await db.commit()
    await db.refresh(message)
    
    return MessageResponse(
        id=message.id,
        case_id=message.case_id,
        thread_id=message.thread_id,
        sender_id=message.sender_id,
        recipient_id=message.recipient_id,
        content=message.content,
        message_type=message.message_type,
        sent_at=message.sent_at,
        delivered_at=message.delivered_at,
        read_at=message.read_at,
        was_flagged=message.was_flagged,
        original_content=message.original_content
    )


@router.get("/case/{case_id}", response_model=List[MessageResponse])
async def list_messages(
    case_id: str,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get messages for a case.
    
    Args:
        case_id: Case ID
        limit: Number of messages to return
        offset: Offset for pagination
        
    Returns:
        List of messages (most recent first)
    """
    # Verify access
    result = await db.execute(
        select(CaseParticipant).where(
            and_(
                CaseParticipant.case_id == case_id,
                CaseParticipant.user_id == current_user.id,
                CaseParticipant.is_active == True
            )
        )
    )
    participant = result.scalar_one_or_none()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this case"
        )
    
    # Get messages
    messages_result = await db.execute(
        select(Message)
        .where(Message.case_id == case_id)
        .order_by(desc(Message.sent_at))
        .limit(limit)
        .offset(offset)
    )
    messages = messages_result.scalars().all()
    
    return [
        MessageResponse(
            id=msg.id,
            case_id=msg.case_id,
            thread_id=msg.thread_id,
            sender_id=msg.sender_id,
            recipient_id=msg.recipient_id,
            content=msg.content,
            message_type=msg.message_type,
            sent_at=msg.sent_at,
            delivered_at=msg.delivered_at,
            read_at=msg.read_at,
            was_flagged=msg.was_flagged,
            original_content=msg.original_content
        )
        for msg in messages
    ]


@router.get("/analytics/{case_id}/user", response_model=AnalyticsResponse)
async def get_user_analytics(
    case_id: str,
    period_days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get good faith communication metrics for current user.
    
    Args:
        case_id: Case ID
        period_days: Analysis period (default: 30 days)
        
    Returns:
        Communication quality metrics
    """
    # Verify access
    result = await db.execute(
        select(CaseParticipant).where(
            and_(
                CaseParticipant.case_id == case_id,
                CaseParticipant.user_id == current_user.id,
                CaseParticipant.is_active == True
            )
        )
    )
    participant = result.scalar_one_or_none()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this case"
        )
    
    # Calculate metrics
    metrics = await aria_service.calculate_good_faith_metrics(
        db=db,
        user_id=current_user.id,
        case_id=case_id,
        period_days=period_days
    )
    
    return AnalyticsResponse(**metrics)


@router.get("/analytics/{case_id}/conversation")
async def get_conversation_health(
    case_id: str,
    period_days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get overall conversation health for the case.
    
    Both parents can see this to understand communication quality.
    
    Args:
        case_id: Case ID
        period_days: Analysis period
        
    Returns:
        Overall conversation health metrics
    """
    # Verify access
    result = await db.execute(
        select(CaseParticipant).where(
            and_(
                CaseParticipant.case_id == case_id,
                CaseParticipant.user_id == current_user.id,
                CaseParticipant.is_active == True
            )
        )
    )
    participant = result.scalar_one_or_none()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this case"
        )
    
    # Get conversation health
    health = await aria_service.get_conversation_health(
        db=db,
        case_id=case_id,
        period_days=period_days
    )
    
    return health
