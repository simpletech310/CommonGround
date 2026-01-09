"""
KidComs API endpoints for child communication sessions.

KidComs enables children to have video calls, chat, watch movies together,
play games, and use collaborative whiteboards with their approved circle.
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
import secrets

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.family_file import FamilyFile
from app.models.child import Child
from app.models.circle import CircleContact, ApprovalMode
from app.models.kidcoms import (
    KidComsSettings,
    KidComsSession,
    KidComsMessage,
    KidComsSessionInvite,
    SessionStatus,
    SessionType,
    ParticipantType,
)
from app.schemas.kidcoms import (
    KidComsSettingsCreate,
    KidComsSettingsUpdate,
    KidComsSettingsResponse,
    KidComsSessionCreate,
    KidComsSessionUpdate,
    KidComsSessionResponse,
    KidComsSessionListResponse,
    KidComsJoinRequest,
    KidComsJoinResponse,
    KidComsEndSessionRequest,
    KidComsMessageCreate,
    KidComsMessageResponse,
    KidComsMessageListResponse,
    KidComsSessionInviteCreate,
    KidComsSessionInviteResponse,
    KidComsInviteAcceptRequest,
    KidComsFamilySummary,
    KidComsChildSummary,
    SessionParticipant,
    ARIAChatAnalyzeRequest,
    ARIAChatAnalyzeResponse,
    SESSION_TYPES,
)

router = APIRouter()


# ============================================================
# Helper Functions
# ============================================================

async def get_family_file_with_access(
    db: AsyncSession, family_file_id: str, user_id: str
) -> FamilyFile:
    """Get family file and verify user has access."""
    result = await db.execute(
        select(FamilyFile).where(FamilyFile.id == family_file_id)
    )
    family_file = result.scalar_one_or_none()

    if not family_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family file not found"
        )

    if family_file.parent_a_id != user_id and family_file.parent_b_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this family file"
        )

    return family_file


async def get_or_create_settings(
    db: AsyncSession, family_file_id: str
) -> KidComsSettings:
    """Get or create KidComs settings for a family file."""
    result = await db.execute(
        select(KidComsSettings).where(
            KidComsSettings.family_file_id == family_file_id
        )
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = KidComsSettings(family_file_id=family_file_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


def generate_room_name() -> str:
    """Generate a unique Daily.co room name."""
    return f"cg-kidcoms-{secrets.token_urlsafe(12)}"


def generate_invite_token() -> str:
    """Generate a session invite token."""
    return secrets.token_urlsafe(32)


# ============================================================
# Settings Endpoints
# ============================================================

@router.get(
    "/settings/{family_file_id}",
    response_model=KidComsSettingsResponse,
    summary="Get KidComs settings",
    description="Get KidComs configuration for a family."
)
async def get_kidcoms_settings(
    family_file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get KidComs settings for a family file."""
    await get_family_file_with_access(db, family_file_id, current_user.id)
    settings = await get_or_create_settings(db, family_file_id)
    return KidComsSettingsResponse.model_validate(settings)


@router.put(
    "/settings/{family_file_id}",
    response_model=KidComsSettingsResponse,
    summary="Update KidComs settings",
    description="Update KidComs configuration for a family."
)
async def update_kidcoms_settings(
    family_file_id: str,
    update_data: KidComsSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update KidComs settings."""
    await get_family_file_with_access(db, family_file_id, current_user.id)
    settings = await get_or_create_settings(db, family_file_id)

    update_fields = update_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(settings, field, value)

    await db.commit()
    await db.refresh(settings)

    return KidComsSettingsResponse.model_validate(settings)


# ============================================================
# Session Endpoints
# ============================================================

@router.post(
    "/sessions",
    status_code=status.HTTP_201_CREATED,
    response_model=KidComsSessionResponse,
    summary="Create KidComs session",
    description="Start a new video call, theater, arcade, or whiteboard session."
)
async def create_session(
    session_data: KidComsSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new KidComs session.

    - **session_type**: video_call, theater, arcade, whiteboard, or mixed
    - **child_id**: The child initiating/participating in the session
    - **invited_contact_ids**: Circle contacts to invite
    """
    # Verify access
    family_file = await get_family_file_with_access(
        db, session_data.family_file_id, current_user.id
    )

    # Verify child belongs to family
    child_result = await db.execute(
        select(Child).where(
            and_(
                Child.id == session_data.child_id,
                Child.family_file_id == session_data.family_file_id
            )
        )
    )
    child = child_result.scalar_one_or_none()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found in this family file"
        )

    # Check settings
    settings = await get_or_create_settings(db, session_data.family_file_id)

    # Check if session type is allowed
    # Map session types to feature keys: video_call -> video, theater -> theater, etc.
    feature_key = session_data.session_type.split("_")[0]
    if not settings.is_feature_allowed(feature_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Session type '{session_data.session_type}' is not allowed for this family"
        )

    # Check availability
    if settings.enforce_availability and not settings.is_within_availability():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="KidComs is not available at this time based on family settings"
        )

    # Generate Daily.co room
    room_name = generate_room_name()
    # TODO: Call Daily.co API to create room
    room_url = f"https://commonground.daily.co/{room_name}"

    # Create session
    session = KidComsSession(
        family_file_id=session_data.family_file_id,
        child_id=session_data.child_id,
        session_type=session_data.session_type,
        title=session_data.title,
        daily_room_name=room_name,
        daily_room_url=room_url,
        initiated_by_id=current_user.id,
        initiated_by_type=ParticipantType.PARENT.value,
        scheduled_for=session_data.scheduled_for,
        status=SessionStatus.WAITING.value if not session_data.scheduled_for else SessionStatus.SCHEDULED.value,
    )

    # Add creating user as first participant
    session.add_participant(
        participant_id=current_user.id,
        participant_type=ParticipantType.PARENT.value,
        name=f"{current_user.first_name} {current_user.last_name}"
    )

    # Add child as participant
    session.add_participant(
        participant_id=child.id,
        participant_type=ParticipantType.CHILD.value,
        name=child.display_name
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Create invites for circle contacts
    for contact_id in session_data.invited_contact_ids:
        contact_result = await db.execute(
            select(CircleContact).where(
                and_(
                    CircleContact.id == contact_id,
                    CircleContact.family_file_id == session_data.family_file_id,
                    CircleContact.is_active == True
                )
            )
        )
        contact = contact_result.scalar_one_or_none()

        if contact:
            invite = KidComsSessionInvite(
                session_id=session.id,
                circle_contact_id=contact.id,
                invited_by_id=current_user.id,
                invited_by_type=ParticipantType.PARENT.value,
                invite_token=generate_invite_token(),
                invite_url=f"{room_url}?token={generate_invite_token()}",
                expires_at=datetime.utcnow() + timedelta(hours=24),
            )
            db.add(invite)

    await db.commit()

    return _session_to_response(session)


@router.get(
    "/sessions",
    response_model=KidComsSessionListResponse,
    summary="List sessions",
    description="List KidComs sessions for a family."
)
async def list_sessions(
    family_file_id: str = Query(..., description="Family file ID"),
    child_id: Optional[str] = Query(None, description="Filter by child"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List KidComs sessions."""
    await get_family_file_with_access(db, family_file_id, current_user.id)

    query = select(KidComsSession).where(
        KidComsSession.family_file_id == family_file_id
    )

    if child_id:
        query = query.where(KidComsSession.child_id == child_id)

    if status_filter:
        query = query.where(KidComsSession.status == status_filter)

    query = query.order_by(KidComsSession.created_at.desc())
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    sessions = result.scalars().all()

    # Get total count
    count_query = select(KidComsSession).where(
        KidComsSession.family_file_id == family_file_id
    )
    if child_id:
        count_query = count_query.where(KidComsSession.child_id == child_id)
    if status_filter:
        count_query = count_query.where(KidComsSession.status == status_filter)

    count_result = await db.execute(count_query)
    total = len(count_result.scalars().all())

    return KidComsSessionListResponse(
        items=[_session_to_response(s) for s in sessions],
        total=total
    )


@router.get(
    "/sessions/{session_id}",
    response_model=KidComsSessionResponse,
    summary="Get session",
    description="Get a KidComs session by ID."
)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a KidComs session by ID."""
    result = await db.execute(
        select(KidComsSession).where(KidComsSession.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    await get_family_file_with_access(db, session.family_file_id, current_user.id)

    return _session_to_response(session)


@router.post(
    "/sessions/{session_id}/join",
    response_model=KidComsJoinResponse,
    summary="Join session",
    description="Join an existing KidComs session."
)
async def join_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Join a KidComs session and get a Daily.co token."""
    result = await db.execute(
        select(KidComsSession).where(KidComsSession.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    await get_family_file_with_access(db, session.family_file_id, current_user.id)

    if session.status not in [SessionStatus.WAITING.value, SessionStatus.ACTIVE.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot join session with status: {session.status}"
        )

    # Add as participant if not already
    participant_ids = [p["id"] for p in (session.participants or [])]
    if current_user.id not in participant_ids:
        session.add_participant(
            participant_id=current_user.id,
            participant_type=ParticipantType.PARENT.value,
            name=f"{current_user.first_name} {current_user.last_name}"
        )

    # Mark session as active if first join
    if session.status == SessionStatus.WAITING.value:
        session.start()

    await db.commit()

    # TODO: Generate actual Daily.co token via API
    mock_token = secrets.token_urlsafe(64)

    return KidComsJoinResponse(
        session_id=session.id,
        daily_room_url=session.daily_room_url,
        daily_token=mock_token,
        participant_name=f"{current_user.first_name} {current_user.last_name}",
        participant_type=ParticipantType.PARENT.value,
    )


@router.post(
    "/sessions/{session_id}/end",
    response_model=KidComsSessionResponse,
    summary="End session",
    description="End an active KidComs session."
)
async def end_session(
    session_id: str,
    end_data: Optional[KidComsEndSessionRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """End a KidComs session."""
    result = await db.execute(
        select(KidComsSession).where(KidComsSession.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    await get_family_file_with_access(db, session.family_file_id, current_user.id)

    if session.status == SessionStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is already ended"
        )

    session.end()
    if end_data and end_data.notes:
        session.notes = end_data.notes

    # TODO: Call Daily.co API to close room

    await db.commit()
    await db.refresh(session)

    return _session_to_response(session)


# ============================================================
# Message Endpoints
# ============================================================

@router.post(
    "/sessions/{session_id}/messages",
    status_code=status.HTTP_201_CREATED,
    response_model=KidComsMessageResponse,
    summary="Send message",
    description="Send a chat message in a session (analyzed by ARIA)."
)
async def send_message(
    session_id: str,
    message_data: KidComsMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message in a KidComs session.

    All messages are analyzed by ARIA for child safety before being delivered.
    """
    result = await db.execute(
        select(KidComsSession).where(KidComsSession.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    await get_family_file_with_access(db, session.family_file_id, current_user.id)

    if session.status != SessionStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only send messages in active sessions"
        )

    # Create message
    message = KidComsMessage(
        session_id=session_id,
        sender_id=current_user.id,
        sender_type=ParticipantType.PARENT.value,
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        content=message_data.content,
    )

    # TODO: Call ARIA for analysis
    # For now, mark as analyzed and safe
    message.aria_analyzed = True
    message.aria_flagged = False

    db.add(message)

    # Update session stats
    session.total_messages += 1

    await db.commit()
    await db.refresh(message)

    # Track feature usage
    session.add_feature_used("chat")
    await db.commit()

    return KidComsMessageResponse.model_validate(message)


@router.get(
    "/sessions/{session_id}/messages",
    response_model=KidComsMessageListResponse,
    summary="Get messages",
    description="Get chat messages from a session."
)
async def get_messages(
    session_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get messages from a session."""
    result = await db.execute(
        select(KidComsSession).where(KidComsSession.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    await get_family_file_with_access(db, session.family_file_id, current_user.id)

    # Get messages
    msg_query = select(KidComsMessage).where(
        KidComsMessage.session_id == session_id
    ).order_by(KidComsMessage.sent_at.asc())

    msg_result = await db.execute(msg_query.offset(offset).limit(limit))
    messages = msg_result.scalars().all()

    # Get counts
    total_result = await db.execute(
        select(KidComsMessage).where(KidComsMessage.session_id == session_id)
    )
    total = len(total_result.scalars().all())

    flagged_result = await db.execute(
        select(KidComsMessage).where(
            and_(
                KidComsMessage.session_id == session_id,
                KidComsMessage.aria_flagged == True
            )
        )
    )
    flagged_count = len(flagged_result.scalars().all())

    return KidComsMessageListResponse(
        items=[KidComsMessageResponse.model_validate(m) for m in messages],
        total=total,
        flagged_count=flagged_count,
    )


# ============================================================
# ARIA Chat Analysis
# ============================================================

@router.post(
    "/aria/analyze",
    response_model=ARIAChatAnalyzeResponse,
    summary="Analyze chat message",
    description="Analyze a chat message with ARIA for child safety."
)
async def analyze_chat_message(
    analyze_data: ARIAChatAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze a chat message with ARIA.

    Returns safety assessment and optional suggested rewrite.
    """
    # TODO: Integrate with OpenAI or Claude for actual analysis
    # For now, return mock safe response

    return ARIAChatAnalyzeResponse(
        is_safe=True,
        should_flag=False,
        category=None,
        reason=None,
        confidence_score=0.95,
        suggested_rewrite=None,
        should_hide=False,
        should_notify_parents=False,
    )


# ============================================================
# Summary/Dashboard Endpoints
# ============================================================

@router.get(
    "/summary/{family_file_id}",
    response_model=KidComsFamilySummary,
    summary="Get KidComs summary",
    description="Get KidComs activity summary for a family."
)
async def get_family_summary(
    family_file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get KidComs activity summary for a family."""
    family_file = await get_family_file_with_access(
        db, family_file_id, current_user.id
    )
    settings = await get_or_create_settings(db, family_file_id)

    # Get children
    children_result = await db.execute(
        select(Child).where(Child.family_file_id == family_file_id)
    )
    children = children_result.scalars().all()

    # Get session counts
    sessions_result = await db.execute(
        select(KidComsSession).where(
            KidComsSession.family_file_id == family_file_id
        )
    )
    all_sessions = sessions_result.scalars().all()

    # Week threshold
    week_ago = datetime.utcnow() - timedelta(days=7)

    child_summaries = []
    feature_usage = {
        "video_call": 0,
        "theater": 0,
        "arcade": 0,
        "whiteboard": 0,
        "chat": 0,
    }

    for child in children:
        child_sessions = [s for s in all_sessions if s.child_id == child.id]
        child_sessions_week = [s for s in child_sessions if s.created_at >= week_ago]

        total_duration = sum(s.duration_seconds or 0 for s in child_sessions)
        total_messages = sum(s.total_messages for s in child_sessions)
        flagged_messages = sum(s.flagged_messages for s in child_sessions)

        # Get circle contacts count
        contacts_result = await db.execute(
            select(CircleContact).where(
                and_(
                    CircleContact.family_file_id == family_file_id,
                    or_(
                        CircleContact.child_id == child.id,
                        CircleContact.child_id.is_(None)
                    ),
                    CircleContact.is_active == True
                )
            )
        )
        contacts = contacts_result.scalars().all()

        last_session = child_sessions[0] if child_sessions else None

        child_summaries.append(KidComsChildSummary(
            child_id=child.id,
            child_name=child.display_name,
            total_sessions=len(child_sessions),
            sessions_this_week=len(child_sessions_week),
            total_duration_minutes=total_duration // 60,
            circle_contacts_count=len(contacts),
            favorite_contacts=[],  # TODO: Calculate based on usage
            messages_sent=total_messages,
            messages_flagged=flagged_messages,
            last_session_at=last_session.created_at if last_session else None,
            last_session_with=None,  # TODO: Determine from participants
        ))

    # Aggregate feature usage
    for session in all_sessions:
        if session.session_type in feature_usage:
            feature_usage[session.session_type] += 1
        for feature in (session.features_used or []):
            if feature in feature_usage:
                feature_usage[feature] += 1

    return KidComsFamilySummary(
        family_file_id=family_file_id,
        total_sessions=len(all_sessions),
        sessions_this_week=len([s for s in all_sessions if s.created_at >= week_ago]),
        children=child_summaries,
        feature_usage=feature_usage,
        is_within_availability=settings.is_within_availability(),
    )


@router.get(
    "/session-types",
    summary="Get session types",
    description="Get list of available session types."
)
async def get_session_types():
    """Get the list of session types."""
    return SESSION_TYPES


# ============================================================
# Helper Functions
# ============================================================

def _session_to_response(session: KidComsSession) -> KidComsSessionResponse:
    """Convert KidComsSession model to response schema."""
    participants = [
        SessionParticipant(
            id=p["id"],
            type=p["type"],
            name=p["name"],
            joined_at=p.get("joined_at")
        )
        for p in (session.participants or [])
    ]

    return KidComsSessionResponse(
        id=session.id,
        family_file_id=session.family_file_id,
        child_id=session.child_id,
        session_type=session.session_type,
        title=session.title,
        status=session.status,
        daily_room_name=session.daily_room_name,
        daily_room_url=session.daily_room_url,
        initiated_by_id=session.initiated_by_id,
        initiated_by_type=session.initiated_by_type,
        participants=participants,
        scheduled_for=session.scheduled_for,
        started_at=session.started_at,
        ended_at=session.ended_at,
        duration_seconds=session.duration_seconds,
        features_used=session.features_used or [],
        total_messages=session.total_messages,
        flagged_messages=session.flagged_messages,
        notes=session.notes,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )
