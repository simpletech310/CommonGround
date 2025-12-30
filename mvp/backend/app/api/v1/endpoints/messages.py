"""
Messaging endpoints with ARIA Sentiment Shield integration.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Body, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    MessageWithFlagResponse,
    InterventionAction,
    ARIAAnalysisResponse,
    AnalyticsResponse,
    TrendResponse,
    TrendDataPoint,
)
from app.services.message import MessageService

router = APIRouter()


@router.post("/analyze")
async def analyze_message(
    case_id: str = Body(..., embed=True),
    content: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze a message with ARIA before sending.

    This endpoint allows the frontend to get ARIA's analysis
    before the user commits to sending the message.

    Args:
        case_id: ID of the case
        content: Message content to analyze

    Returns:
        ARIA analysis with intervention if needed
    """
    message_service = MessageService(db)
    analysis = await message_service.analyze_message(content, case_id, current_user)

    return analysis


class SendMessageRequest(BaseModel):
    """Request to send a message with optional intervention action."""
    message_data: MessageCreate
    intervention_action: Optional[InterventionAction] = None


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message with ARIA tracking.

    Workflow:
    1. Frontend calls /analyze endpoint first
    2. If flagged, ARIA shows intervention UI
    3. User chooses action (accept/modify/reject/cancel)
    4. Frontend calls this endpoint with final content and action

    Args:
        request: Message data and optional intervention action

    Returns:
        Created message
    """
    message_service = MessageService(db)
    message = await message_service.send_message(
        request.message_data,
        current_user,
        request.intervention_action
    )

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
        original_content=message.original_content,
    )


@router.get("/cases/{case_id}", response_model=List[MessageResponse])
async def get_case_messages(
    case_id: str,
    thread_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get messages for a case.

    Args:
        case_id: ID of the case
        thread_id: Optional thread ID to filter by
        limit: Maximum number of messages (1-100)
        offset: Pagination offset

    Returns:
        List of messages in chronological order
    """
    message_service = MessageService(db)
    messages = await message_service.get_messages(
        case_id,
        current_user,
        thread_id,
        limit,
        offset
    )

    return [
        MessageResponse(
            id=m.id,
            case_id=m.case_id,
            thread_id=m.thread_id,
            sender_id=m.sender_id,
            recipient_id=m.recipient_id,
            content=m.content,
            message_type=m.message_type,
            sent_at=m.sent_at,
            delivered_at=m.delivered_at,
            read_at=m.read_at,
            was_flagged=m.was_flagged,
            original_content=m.original_content,
        )
        for m in messages
    ]


@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific message by ID.

    Args:
        message_id: ID of the message

    Returns:
        Message details
    """
    message_service = MessageService(db)
    message = await message_service.get_message(message_id, current_user)

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
        original_content=message.original_content,
    )


@router.get("/cases/{case_id}/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    case_id: str,
    user_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get good faith communication metrics.

    Tracks ARIA interventions, acceptance rates, and toxicity trends
    to measure communication quality over time.

    Args:
        case_id: ID of the case
        user_id: Optional specific user to analyze (defaults to all)
        days: Number of days to analyze (1-365)

    Returns:
        Communication analytics and good faith metrics
    """
    message_service = MessageService(db)
    analytics = await message_service.get_analytics(
        case_id,
        current_user,
        user_id,
        days
    )

    return AnalyticsResponse(**analytics)


@router.get("/cases/{case_id}/trends", response_model=TrendResponse)
async def get_trends(
    case_id: str,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get daily trend data for visualization.

    Provides day-by-day communication metrics to show
    improvement or worsening trends over time.

    Args:
        case_id: ID of the case
        days: Number of days (1-365)

    Returns:
        Daily trend data points
    """
    message_service = MessageService(db)
    trend_data = await message_service.get_trend_data(
        case_id,
        current_user,
        days
    )

    # Determine overall trend
    if len(trend_data) >= 2:
        first_half = trend_data[:len(trend_data)//2]
        second_half = trend_data[len(trend_data)//2:]

        first_avg = (
            sum(d["average_toxicity"] for d in first_half) / len(first_half)
            if first_half else 0.0
        )
        second_avg = (
            sum(d["average_toxicity"] for d in second_half) / len(second_half)
            if second_half else 0.0
        )

        if second_avg < first_avg - 0.1:
            overall_trend = "improving"
        elif second_avg > first_avg + 0.1:
            overall_trend = "worsening"
        else:
            overall_trend = "stable"
    else:
        overall_trend = "insufficient_data"

    return TrendResponse(
        case_id=case_id,
        data_points=[TrendDataPoint(**d) for d in trend_data],
        overall_trend=overall_trend
    )
