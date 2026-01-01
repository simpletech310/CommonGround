"""
Calendar view endpoint - combines events, busy periods, collections, and exchanges.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession


def _strip_tz(dt: Optional[datetime]) -> Optional[datetime]:
    """Convert timezone-aware datetime to UTC naive datetime."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Convert to UTC and remove tzinfo
        utc_dt = dt.astimezone(timezone.utc)
        return utc_dt.replace(tzinfo=None)
    return dt

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.case import CaseParticipant
from app.schemas.schedule import (
    CalendarDataResponse,
    ScheduleEventResponse,
    BusyPeriod,
    MyTimeCollectionResponse,
    CustodyExchangeInstanceForCalendar,
)
from app.services.event import EventService
from app.services.time_block import TimeBlockService
from app.services.collection import CollectionService
from app.services.custody_exchange import CustodyExchangeService
from sqlalchemy import select

router = APIRouter()


@router.get(
    "/cases/{case_id}",
    response_model=CalendarDataResponse,
    summary="Get calendar data",
    description="Get combined calendar data: events, busy periods, collections."
)
async def get_calendar_data(
    case_id: str,
    start_date: datetime = Query(..., description="Calendar view start date"),
    end_date: datetime = Query(..., description="Calendar view end date"),
    include_busy_periods: bool = Query(True, description="Include other parent's busy blocks"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete calendar data for a case.

    Returns:
    - **events**: All visible events (yours + shared)
    - **busy_periods**: Other parent's availability (anonymous)
    - **my_collections**: Your collections for organization

    Privacy:
    - Events are privacy-filtered
    - Busy periods show no details
    - Only your collections are returned (other parent's filtered)
    """
    # Verify case access
    access_result = await db.execute(
        select(CaseParticipant).where(
            CaseParticipant.case_id == case_id,
            CaseParticipant.user_id == current_user.id,
            CaseParticipant.is_active == True
        )
    )
    if not access_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this case"
        )

    # Get events (privacy filtered)
    try:
        events = await EventService.list_events(
            db=db,
            case_id=case_id,
            viewer_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )

        filtered_events = []
        for event in events:
            filtered_data = await EventService.filter_for_coparent(
                event=event,
                viewer_id=current_user.id,
                db=db
            )
            filtered_events.append(ScheduleEventResponse(**filtered_data))

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching events: {str(e)}"
        )

    # Get busy periods (if requested)
    busy_periods_list = []
    if include_busy_periods:
        # Get other parent ID
        participants_result = await db.execute(
            select(CaseParticipant).where(
                CaseParticipant.case_id == case_id,
                CaseParticipant.user_id != current_user.id,
                CaseParticipant.is_active == True
            )
        )
        other_parent = participants_result.scalar_one_or_none()

        if other_parent:
            try:
                busy_periods_data = await TimeBlockService.get_busy_periods_for_calendar(
                    db=db,
                    case_id=case_id,
                    other_parent_id=other_parent.user_id,
                    start_date=start_date,
                    end_date=end_date
                )
                busy_periods_list = [BusyPeriod(**period) for period in busy_periods_data]
            except Exception as e:
                # Don't fail if busy periods can't be retrieved
                pass

    # Get user's collections
    try:
        collections = await CollectionService.list_collections(
            db=db,
            case_id=case_id,
            viewer_id=current_user.id,
            include_other_parent=False  # Only user's collections
        )

        my_collections = []
        for collection in collections:
            filtered_data = await CollectionService.filter_for_viewer(
                collection=collection,
                viewer_id=current_user.id,
                db=db
            )
            my_collections.append(MyTimeCollectionResponse(**filtered_data))

    except Exception as e:
        my_collections = []

    # Get custody exchange instances
    exchanges_list = []
    try:
        # Strip timezone from dates for database query
        start_date_naive = _strip_tz(start_date)
        end_date_naive = _strip_tz(end_date)

        exchange_instances = await CustodyExchangeService.get_upcoming_instances(
            db=db,
            case_id=case_id,
            viewer_id=current_user.id,
            start_date=start_date_naive,
            end_date=end_date_naive,
            limit=100  # Get all instances in date range
        )

        print(f"[CALENDAR] Found {len(exchange_instances)} exchange instances for calendar")
        for instance in exchange_instances:
            exchange = instance.exchange
            logging.info(f"  - Exchange instance: {instance.scheduled_time} | {exchange.title if exchange else 'No title'}")
            exchanges_list.append(CustodyExchangeInstanceForCalendar(
                id=instance.id,
                exchange_id=instance.exchange_id,
                exchange_type=exchange.exchange_type if exchange else "exchange",
                title=exchange.title if exchange else "Exchange",
                scheduled_time=instance.scheduled_time,
                duration_minutes=exchange.duration_minutes if exchange else 30,
                location=exchange.location if exchange else None,
                status=instance.status,
                is_owner=exchange.created_by == current_user.id if exchange else False,
            ))
    except Exception as e:
        # Don't fail if exchanges can't be retrieved
        import logging
        logging.error(f"Error fetching exchanges for calendar: {e}")

    return CalendarDataResponse(
        case_id=case_id,
        events=filtered_events,
        exchanges=exchanges_list,
        busy_periods=busy_periods_list,
        my_collections=my_collections,
        start_date=start_date,
        end_date=end_date
    )
