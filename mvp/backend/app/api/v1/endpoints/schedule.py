"""
Schedule endpoints for parenting time management.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.child import Child
from app.schemas.schedule import (
    ScheduleEventCreate,
    ScheduleEventUpdate,
    ScheduleEventResponse,
    ExchangeCheckInCreate,
    ExchangeCheckInResponse,
    ComplianceMetrics,
    CalendarEvent,
    CalendarResponse,
)
from app.services.schedule import ScheduleService
from sqlalchemy import select

router = APIRouter()


@router.post("/events", status_code=status.HTTP_201_CREATED, response_model=ScheduleEventResponse)
async def create_event(
    event_data: ScheduleEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a schedule event.

    Args:
        event_data: Event data

    Returns:
        Created event
    """
    schedule_service = ScheduleService(db)
    event = await schedule_service.create_event(event_data, current_user)

    return ScheduleEventResponse(
        id=event.id,
        case_id=event.case_id,
        event_type=event.event_type,
        start_time=event.start_time,
        end_time=event.end_time,
        all_day=event.all_day,
        custodial_parent_id=event.custodial_parent_id,
        transition_from_id=event.transition_from_id,
        transition_to_id=event.transition_to_id,
        child_ids=event.child_ids,
        title=event.title,
        description=event.description,
        location=event.location,
        is_exchange=event.is_exchange,
        exchange_location=event.exchange_location,
        grace_period_minutes=event.grace_period_minutes,
        status=event.status,
        is_agreement_derived=event.is_agreement_derived,
        is_modification=event.is_modification,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.get("/cases/{case_id}/events", response_model=List[ScheduleEventResponse])
async def get_case_events(
    case_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    event_type: Optional[str] = Query(None),
    custodial_parent_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get schedule events for a case.

    Args:
        case_id: ID of the case
        start_date: Optional start date filter
        end_date: Optional end date filter
        event_type: Optional event type filter
        custodial_parent_id: Optional parent filter

    Returns:
        List of events
    """
    schedule_service = ScheduleService(db)
    events = await schedule_service.get_events(
        case_id,
        current_user,
        start_date,
        end_date,
        event_type,
        custodial_parent_id
    )

    return [
        ScheduleEventResponse(
            id=e.id,
            case_id=e.case_id,
            event_type=e.event_type,
            start_time=e.start_time,
            end_time=e.end_time,
            all_day=e.all_day,
            custodial_parent_id=e.custodial_parent_id,
            transition_from_id=e.transition_from_id,
            transition_to_id=e.transition_to_id,
            child_ids=e.child_ids,
            title=e.title,
            description=e.description,
            location=e.location,
            is_exchange=e.is_exchange,
            exchange_location=e.exchange_location,
            grace_period_minutes=e.grace_period_minutes,
            status=e.status,
            is_agreement_derived=e.is_agreement_derived,
            is_modification=e.is_modification,
            created_at=e.created_at,
            updated_at=e.updated_at,
        )
        for e in events
    ]


@router.put("/events/{event_id}", response_model=ScheduleEventResponse)
async def update_event(
    event_id: str,
    event_data: ScheduleEventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a schedule event.

    Args:
        event_id: ID of the event
        event_data: Update data

    Returns:
        Updated event
    """
    schedule_service = ScheduleService(db)
    event = await schedule_service.update_event(event_id, event_data, current_user)

    return ScheduleEventResponse(
        id=event.id,
        case_id=event.case_id,
        event_type=event.event_type,
        start_time=event.start_time,
        end_time=event.end_time,
        all_day=event.all_day,
        custodial_parent_id=event.custodial_parent_id,
        transition_from_id=event.transition_from_id,
        transition_to_id=event.transition_to_id,
        child_ids=event.child_ids,
        title=event.title,
        description=event.description,
        location=event.location,
        is_exchange=event.is_exchange,
        exchange_location=event.exchange_location,
        grace_period_minutes=event.grace_period_minutes,
        status=event.status,
        is_agreement_derived=event.is_agreement_derived,
        is_modification=event.is_modification,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.post("/check-ins", status_code=status.HTTP_201_CREATED, response_model=ExchangeCheckInResponse)
async def create_check_in(
    check_in_data: ExchangeCheckInCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create an exchange check-in.

    Args:
        check_in_data: Check-in data

    Returns:
        Created check-in
    """
    schedule_service = ScheduleService(db)
    check_in = await schedule_service.create_check_in(check_in_data, current_user)

    return ExchangeCheckInResponse(
        id=check_in.id,
        event_id=check_in.event_id,
        user_id=check_in.user_id,
        parent_role=check_in.parent_role,
        checked_in_at=check_in.checked_in_at,
        scheduled_time=check_in.scheduled_time,
        check_in_method=check_in.check_in_method,
        location_lat=check_in.location_lat,
        location_lng=check_in.location_lng,
        minutes_early_late=check_in.minutes_early_late,
        is_on_time=check_in.is_on_time,
        is_within_grace=check_in.is_within_grace,
        notes=check_in.notes,
        children_present=check_in.children_present,
        verified_by_other_parent=check_in.verified_by_other_parent,
        created_at=check_in.created_at,
    )


@router.get("/events/{event_id}/check-ins", response_model=List[ExchangeCheckInResponse])
async def get_event_check_ins(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get check-ins for an event.

    Args:
        event_id: ID of the event

    Returns:
        List of check-ins
    """
    schedule_service = ScheduleService(db)
    check_ins = await schedule_service.get_check_ins(event_id, current_user)

    return [
        ExchangeCheckInResponse(
            id=c.id,
            event_id=c.event_id,
            user_id=c.user_id,
            parent_role=c.parent_role,
            checked_in_at=c.checked_in_at,
            scheduled_time=c.scheduled_time,
            check_in_method=c.check_in_method,
            location_lat=c.location_lat,
            location_lng=c.location_lng,
            minutes_early_late=c.minutes_early_late,
            is_on_time=c.is_on_time,
            is_within_grace=c.is_within_grace,
            notes=c.notes,
            children_present=c.children_present,
            verified_by_other_parent=c.verified_by_other_parent,
            created_at=c.created_at,
        )
        for c in check_ins
    ]


@router.get("/cases/{case_id}/compliance", response_model=ComplianceMetrics)
async def get_compliance_metrics(
    case_id: str,
    user_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get exchange compliance metrics.

    Tracks on-time performance, late arrivals, and no-shows
    to provide objective compliance data for court.

    Args:
        case_id: ID of the case
        user_id: Optional specific user to analyze (defaults to all)
        days: Number of days to analyze (1-365)

    Returns:
        Compliance metrics
    """
    schedule_service = ScheduleService(db)
    metrics = await schedule_service.get_compliance_metrics(
        case_id,
        current_user,
        user_id,
        days
    )

    return ComplianceMetrics(**metrics)


@router.get("/cases/{case_id}/calendar", response_model=CalendarResponse)
async def get_calendar_data(
    case_id: str,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get calendar view data for frontend.

    Provides formatted event data suitable for calendar display,
    including child names and parent information.

    Args:
        case_id: ID of the case
        start_date: Start of calendar view
        end_date: End of calendar view

    Returns:
        Calendar data with formatted events
    """
    schedule_service = ScheduleService(db)
    events = await schedule_service.get_events(
        case_id,
        current_user,
        start_date,
        end_date
    )

    # Get all children for this case
    children_result = await db.execute(
        select(Child).where(Child.case_id == case_id)
    )
    children_map = {c.id: c.first_name for c in children_result.scalars().all()}

    # Format events for calendar
    calendar_events = []
    for event in events:
        child_names = [children_map.get(child_id, "Unknown") for child_id in event.child_ids]

        calendar_event = CalendarEvent(
            id=event.id,
            title=event.title,
            start=event.start_time,
            end=event.end_time,
            all_day=event.all_day,
            event_type=event.event_type,
            custodial_parent=event.custodial_parent_id,
            is_exchange=event.is_exchange,
            location=event.location or event.exchange_location,
            status=event.status,
            child_names=child_names,
        )
        calendar_events.append(calendar_event)

    return CalendarResponse(
        case_id=case_id,
        events=calendar_events,
        start_date=start_date,
        end_date=end_date,
    )
