"""
Custody Exchange (Pickup/Dropoff) API endpoints.

Dedicated endpoints for managing custody exchanges separate from regular events.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.custody_exchange import (
    CustodyExchangeCreate,
    CustodyExchangeUpdate,
    CustodyExchangeResponse,
    CustodyExchangeInstanceResponse,
    CheckInRequest,
)
from app.services.custody_exchange import CustodyExchangeService

router = APIRouter()


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=CustodyExchangeResponse,
    summary="Create custody exchange",
    description="Create a new pickup/dropoff schedule. Can be one-time or recurring."
)
async def create_exchange(
    exchange_data: CustodyExchangeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new custody exchange (pickup/dropoff).

    - **exchange_type**: pickup, dropoff, or both
    - **is_recurring**: Set to true for repeating exchanges
    - **recurrence_pattern**: weekly, biweekly, monthly, or custom
    - **recurrence_days**: Days of week (0=Sun, 1=Mon, ..., 6=Sat)
    """
    try:
        exchange = await CustodyExchangeService.create_exchange(
            db=db,
            case_id=exchange_data.case_id,
            created_by=current_user.id,
            exchange_type=exchange_data.exchange_type,
            scheduled_time=exchange_data.scheduled_time,
            title=exchange_data.title,
            from_parent_id=exchange_data.from_parent_id,
            to_parent_id=exchange_data.to_parent_id,
            child_ids=exchange_data.child_ids,
            location=exchange_data.location,
            location_notes=exchange_data.location_notes,
            duration_minutes=exchange_data.duration_minutes,
            is_recurring=exchange_data.is_recurring,
            recurrence_pattern=exchange_data.recurrence_pattern,
            recurrence_days=exchange_data.recurrence_days,
            recurrence_end_date=exchange_data.recurrence_end_date,
            items_to_bring=exchange_data.items_to_bring,
            special_instructions=exchange_data.special_instructions,
            notes_visible_to_coparent=exchange_data.notes_visible_to_coparent,
        )

        filtered_data = CustodyExchangeService.filter_for_viewer(
            exchange=exchange,
            viewer_id=current_user.id
        )

        return CustodyExchangeResponse(**filtered_data)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/{exchange_id}",
    response_model=CustodyExchangeResponse,
    summary="Get custody exchange",
    description="Get a custody exchange by ID."
)
async def get_exchange(
    exchange_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a custody exchange by ID."""

    exchange = await CustodyExchangeService.get_exchange(
        db=db,
        exchange_id=exchange_id,
        viewer_id=current_user.id
    )

    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exchange not found or no access"
        )

    filtered_data = CustodyExchangeService.filter_for_viewer(
        exchange=exchange,
        viewer_id=current_user.id
    )

    return CustodyExchangeResponse(**filtered_data)


@router.get(
    "/case/{case_id}",
    response_model=List[CustodyExchangeResponse],
    summary="List exchanges for case",
    description="Get all custody exchanges for a case."
)
async def list_exchanges(
    case_id: str,
    status: Optional[str] = Query(None, pattern="^(active|paused|cancelled)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all custody exchanges for a case."""

    exchanges = await CustodyExchangeService.list_exchanges_for_case(
        db=db,
        case_id=case_id,
        viewer_id=current_user.id,
        status=status,
        include_instances=True
    )

    return [
        CustodyExchangeResponse(**CustodyExchangeService.filter_for_viewer(
            exchange=e,
            viewer_id=current_user.id
        ))
        for e in exchanges
    ]


@router.get(
    "/case/{case_id}/upcoming",
    response_model=List[CustodyExchangeInstanceResponse],
    summary="Get upcoming exchanges",
    description="Get upcoming exchange instances for a case."
)
async def get_upcoming_exchanges(
    case_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get upcoming exchange instances for a case."""

    instances = await CustodyExchangeService.get_upcoming_instances(
        db=db,
        case_id=case_id,
        viewer_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )

    result = []
    for instance in instances:
        exchange_data = CustodyExchangeService.filter_for_viewer(
            exchange=instance.exchange,
            viewer_id=current_user.id
        )

        result.append(CustodyExchangeInstanceResponse(
            id=instance.id,
            exchange_id=instance.exchange_id,
            scheduled_time=instance.scheduled_time,
            status=instance.status,
            from_parent_checked_in=instance.from_parent_checked_in,
            from_parent_check_in_time=instance.from_parent_check_in_time,
            to_parent_checked_in=instance.to_parent_checked_in,
            to_parent_check_in_time=instance.to_parent_check_in_time,
            completed_at=instance.completed_at,
            notes=instance.notes,
            override_location=instance.override_location,
            override_time=instance.override_time,
            exchange=CustodyExchangeResponse(**exchange_data),
            created_at=instance.created_at,
            updated_at=instance.updated_at,
        ))

    return result


@router.put(
    "/{exchange_id}",
    response_model=CustodyExchangeResponse,
    summary="Update custody exchange",
    description="Update a custody exchange."
)
async def update_exchange(
    exchange_id: str,
    exchange_data: CustodyExchangeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a custody exchange."""

    updates = exchange_data.model_dump(exclude_unset=True)

    exchange = await CustodyExchangeService.update_exchange(
        db=db,
        exchange_id=exchange_id,
        user_id=current_user.id,
        **updates
    )

    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exchange not found or no access"
        )

    filtered_data = CustodyExchangeService.filter_for_viewer(
        exchange=exchange,
        viewer_id=current_user.id
    )

    return CustodyExchangeResponse(**filtered_data)


@router.post(
    "/instances/{instance_id}/check-in",
    response_model=CustodyExchangeInstanceResponse,
    summary="Check in for exchange",
    description="Record a parent check-in for an exchange instance."
)
async def check_in(
    instance_id: str,
    check_in_data: CheckInRequest = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record a parent check-in for an exchange instance."""

    notes = check_in_data.notes if check_in_data else None

    instance = await CustodyExchangeService.check_in(
        db=db,
        instance_id=instance_id,
        user_id=current_user.id,
        notes=notes
    )

    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found or no access"
        )

    exchange_data = CustodyExchangeService.filter_for_viewer(
        exchange=instance.exchange,
        viewer_id=current_user.id
    )

    return CustodyExchangeInstanceResponse(
        id=instance.id,
        exchange_id=instance.exchange_id,
        scheduled_time=instance.scheduled_time,
        status=instance.status,
        from_parent_checked_in=instance.from_parent_checked_in,
        from_parent_check_in_time=instance.from_parent_check_in_time,
        to_parent_checked_in=instance.to_parent_checked_in,
        to_parent_check_in_time=instance.to_parent_check_in_time,
        completed_at=instance.completed_at,
        notes=instance.notes,
        override_location=instance.override_location,
        override_time=instance.override_time,
        exchange=CustodyExchangeResponse(**exchange_data),
        created_at=instance.created_at,
        updated_at=instance.updated_at,
    )


@router.post(
    "/instances/{instance_id}/cancel",
    response_model=CustodyExchangeInstanceResponse,
    summary="Cancel exchange instance",
    description="Cancel a specific exchange instance."
)
async def cancel_instance(
    instance_id: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a specific exchange instance."""

    instance = await CustodyExchangeService.cancel_instance(
        db=db,
        instance_id=instance_id,
        user_id=current_user.id,
        notes=notes
    )

    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found or no access"
        )

    exchange_data = CustodyExchangeService.filter_for_viewer(
        exchange=instance.exchange,
        viewer_id=current_user.id
    )

    return CustodyExchangeInstanceResponse(
        id=instance.id,
        exchange_id=instance.exchange_id,
        scheduled_time=instance.scheduled_time,
        status=instance.status,
        from_parent_checked_in=instance.from_parent_checked_in,
        from_parent_check_in_time=instance.from_parent_check_in_time,
        to_parent_checked_in=instance.to_parent_checked_in,
        to_parent_check_in_time=instance.to_parent_check_in_time,
        completed_at=instance.completed_at,
        notes=instance.notes,
        override_location=instance.override_location,
        override_time=instance.override_time,
        exchange=CustodyExchangeResponse(**exchange_data),
        created_at=instance.created_at,
        updated_at=instance.updated_at,
    )


@router.delete(
    "/{exchange_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete custody exchange",
    description="Delete a custody exchange and all its instances."
)
async def delete_exchange(
    exchange_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a custody exchange."""

    exchange = await CustodyExchangeService.get_exchange(
        db=db,
        exchange_id=exchange_id,
        viewer_id=current_user.id
    )

    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exchange not found or no access"
        )

    # Only creator can delete
    if exchange.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator can delete this exchange"
        )

    await db.delete(exchange)
    await db.commit()
