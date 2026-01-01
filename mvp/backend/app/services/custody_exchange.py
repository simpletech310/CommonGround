"""
Service layer for CustodyExchange (Pickup/Dropoff) operations.

Handles creation, recurrence generation, and check-in logic.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.custody_exchange import CustodyExchange, CustodyExchangeInstance
from app.models.case import Case, CaseParticipant


def _strip_tz(dt: Optional[datetime]) -> Optional[datetime]:
    """Convert timezone-aware datetime to UTC naive datetime."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Convert to UTC and remove tzinfo
        from datetime import timezone
        utc_dt = dt.astimezone(timezone.utc)
        return utc_dt.replace(tzinfo=None)
    return dt


class CustodyExchangeService:
    """Service for managing custody exchanges."""

    @staticmethod
    async def create_exchange(
        db: AsyncSession,
        case_id: str,
        created_by: str,
        exchange_type: str,
        scheduled_time: datetime,
        title: Optional[str] = None,
        from_parent_id: Optional[str] = None,
        to_parent_id: Optional[str] = None,
        child_ids: Optional[List[str]] = None,
        location: Optional[str] = None,
        location_notes: Optional[str] = None,
        duration_minutes: int = 30,
        is_recurring: bool = False,
        recurrence_pattern: Optional[str] = None,
        recurrence_days: Optional[List[int]] = None,
        recurrence_end_date: Optional[datetime] = None,
        items_to_bring: Optional[str] = None,
        special_instructions: Optional[str] = None,
        notes_visible_to_coparent: bool = True,
    ) -> CustodyExchange:
        """Create a new custody exchange (pickup/dropoff)."""

        # Verify user is a participant in the case
        participant = await db.execute(
            select(CaseParticipant).where(
                and_(
                    CaseParticipant.case_id == case_id,
                    CaseParticipant.user_id == created_by,
                    CaseParticipant.is_active == True
                )
            )
        )
        if not participant.scalar_one_or_none():
            raise ValueError("User is not a participant in this case")

        # Generate title if not provided
        if not title:
            type_label = {
                "pickup": "Pickup",
                "dropoff": "Dropoff",
                "both": "Exchange"
            }.get(exchange_type, "Exchange")
            title = f"{type_label}"
            if is_recurring:
                title += " (Recurring)"

        # Convert timezone-aware datetimes to naive UTC
        scheduled_time_naive = _strip_tz(scheduled_time)
        recurrence_end_naive = _strip_tz(recurrence_end_date)

        exchange = CustodyExchange(
            id=str(uuid.uuid4()),
            case_id=case_id,
            created_by=created_by,
            exchange_type=exchange_type,
            title=title,
            from_parent_id=from_parent_id,
            to_parent_id=to_parent_id,
            child_ids=child_ids or [],
            location=location,
            location_notes=location_notes,
            scheduled_time=scheduled_time_naive,
            duration_minutes=duration_minutes,
            is_recurring=is_recurring,
            recurrence_pattern=recurrence_pattern,
            recurrence_days=recurrence_days,
            recurrence_end_date=recurrence_end_naive,
            items_to_bring=items_to_bring,
            special_instructions=special_instructions,
            notes_visible_to_coparent=notes_visible_to_coparent,
            status="active",
        )

        db.add(exchange)
        await db.flush()

        # Generate initial instances
        await CustodyExchangeService._generate_instances(
            db=db,
            exchange=exchange,
            start_date=scheduled_time_naive,
            weeks_ahead=8  # Generate 8 weeks of instances
        )

        await db.commit()

        # Reload with instances for the response
        result = await db.execute(
            select(CustodyExchange)
            .options(selectinload(CustodyExchange.instances))
            .where(CustodyExchange.id == exchange.id)
        )
        exchange = result.scalar_one()

        return exchange

    @staticmethod
    async def _generate_instances(
        db: AsyncSession,
        exchange: CustodyExchange,
        start_date: datetime,
        weeks_ahead: int = 8
    ) -> List[CustodyExchangeInstance]:
        """Generate instances for a recurring or one-time exchange."""

        instances = []
        end_date = start_date + timedelta(weeks=weeks_ahead)

        if exchange.recurrence_end_date:
            end_date = min(end_date, exchange.recurrence_end_date)

        if not exchange.is_recurring:
            # One-time exchange - just create one instance
            instance = CustodyExchangeInstance(
                id=str(uuid.uuid4()),
                exchange_id=exchange.id,
                scheduled_time=exchange.scheduled_time,
                status="scheduled",
            )
            db.add(instance)
            instances.append(instance)
        else:
            # Recurring exchange - generate based on pattern
            current_date = start_date

            while current_date <= end_date:
                # Check if this day matches the recurrence pattern
                should_create = False

                if exchange.recurrence_pattern == "weekly":
                    # Check if day of week matches
                    if exchange.recurrence_days:
                        if current_date.weekday() in [
                            (d - 1) % 7 for d in exchange.recurrence_days
                        ]:  # Convert Sun=0 to Python's Mon=0
                            should_create = True
                    else:
                        # Same day each week
                        if current_date.weekday() == exchange.scheduled_time.weekday():
                            should_create = True

                elif exchange.recurrence_pattern == "biweekly":
                    # Every two weeks on the same day
                    days_diff = (current_date - exchange.scheduled_time).days
                    if days_diff >= 0 and days_diff % 14 == 0:
                        should_create = True

                elif exchange.recurrence_pattern == "monthly":
                    # Same day of month
                    if current_date.day == exchange.scheduled_time.day:
                        should_create = True

                elif exchange.recurrence_pattern == "custom":
                    # Use recurrence_days as specific days
                    if exchange.recurrence_days and current_date.weekday() in [
                        (d - 1) % 7 for d in exchange.recurrence_days
                    ]:
                        should_create = True

                if should_create:
                    # Create instance at the scheduled time on this day
                    instance_time = current_date.replace(
                        hour=exchange.scheduled_time.hour,
                        minute=exchange.scheduled_time.minute,
                        second=0,
                        microsecond=0
                    )

                    # Check for exceptions
                    if exchange.recurrence_exceptions:
                        date_str = current_date.strftime("%Y-%m-%d")
                        if date_str in exchange.recurrence_exceptions:
                            current_date += timedelta(days=1)
                            continue

                    instance = CustodyExchangeInstance(
                        id=str(uuid.uuid4()),
                        exchange_id=exchange.id,
                        scheduled_time=instance_time,
                        status="scheduled",
                    )
                    db.add(instance)
                    instances.append(instance)

                current_date += timedelta(days=1)

        await db.flush()
        return instances

    @staticmethod
    async def get_exchange(
        db: AsyncSession,
        exchange_id: str,
        viewer_id: str
    ) -> Optional[CustodyExchange]:
        """Get a custody exchange by ID."""

        result = await db.execute(
            select(CustodyExchange)
            .options(selectinload(CustodyExchange.instances))
            .where(CustodyExchange.id == exchange_id)
        )
        exchange = result.scalar_one_or_none()

        if not exchange:
            return None

        # Verify viewer is a participant
        participant = await db.execute(
            select(CaseParticipant).where(
                and_(
                    CaseParticipant.case_id == exchange.case_id,
                    CaseParticipant.user_id == viewer_id,
                    CaseParticipant.is_active == True
                )
            )
        )
        if not participant.scalar_one_or_none():
            return None

        return exchange

    @staticmethod
    async def list_exchanges_for_case(
        db: AsyncSession,
        case_id: str,
        viewer_id: str,
        status: Optional[str] = None,
        include_instances: bool = False
    ) -> List[CustodyExchange]:
        """List all custody exchanges for a case."""

        # Verify viewer is a participant
        participant = await db.execute(
            select(CaseParticipant).where(
                and_(
                    CaseParticipant.case_id == case_id,
                    CaseParticipant.user_id == viewer_id,
                    CaseParticipant.is_active == True
                )
            )
        )
        if not participant.scalar_one_or_none():
            return []

        query = select(CustodyExchange).where(
            CustodyExchange.case_id == case_id
        )

        if status:
            query = query.where(CustodyExchange.status == status)

        if include_instances:
            query = query.options(selectinload(CustodyExchange.instances))

        query = query.order_by(CustodyExchange.scheduled_time)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_upcoming_instances(
        db: AsyncSession,
        case_id: str,
        viewer_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 20
    ) -> List[CustodyExchangeInstance]:
        """Get upcoming exchange instances for a case."""

        # Verify viewer is a participant
        participant = await db.execute(
            select(CaseParticipant).where(
                and_(
                    CaseParticipant.case_id == case_id,
                    CaseParticipant.user_id == viewer_id,
                    CaseParticipant.is_active == True
                )
            )
        )
        if not participant.scalar_one_or_none():
            return []

        if not start_date:
            start_date = datetime.utcnow()

        query = (
            select(CustodyExchangeInstance)
            .join(CustodyExchange)
            .options(selectinload(CustodyExchangeInstance.exchange))
            .where(
                and_(
                    CustodyExchange.case_id == case_id,
                    CustodyExchange.status == "active",
                    CustodyExchangeInstance.scheduled_time >= start_date,
                    CustodyExchangeInstance.status.in_(["scheduled", "rescheduled"])
                )
            )
        )

        if end_date:
            query = query.where(CustodyExchangeInstance.scheduled_time <= end_date)

        query = query.order_by(CustodyExchangeInstance.scheduled_time).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_exchange(
        db: AsyncSession,
        exchange_id: str,
        user_id: str,
        **updates
    ) -> Optional[CustodyExchange]:
        """Update a custody exchange."""

        exchange = await CustodyExchangeService.get_exchange(db, exchange_id, user_id)
        if not exchange:
            return None

        for key, value in updates.items():
            if value is not None and hasattr(exchange, key):
                setattr(exchange, key, value)

        exchange.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(exchange)

        return exchange

    @staticmethod
    async def check_in(
        db: AsyncSession,
        instance_id: str,
        user_id: str,
        notes: Optional[str] = None
    ) -> Optional[CustodyExchangeInstance]:
        """Record a parent check-in for an exchange instance."""

        result = await db.execute(
            select(CustodyExchangeInstance)
            .options(selectinload(CustodyExchangeInstance.exchange))
            .where(CustodyExchangeInstance.id == instance_id)
        )
        instance = result.scalar_one_or_none()

        if not instance:
            return None

        exchange = instance.exchange

        # Determine which parent is checking in
        if user_id == exchange.from_parent_id:
            instance.from_parent_checked_in = True
            instance.from_parent_check_in_time = datetime.utcnow()
        elif user_id == exchange.to_parent_id:
            instance.to_parent_checked_in = True
            instance.to_parent_check_in_time = datetime.utcnow()
        else:
            # User is a participant but not specified as from/to
            # Allow them to check in as from_parent if not set
            if not instance.from_parent_checked_in:
                instance.from_parent_checked_in = True
                instance.from_parent_check_in_time = datetime.utcnow()
            elif not instance.to_parent_checked_in:
                instance.to_parent_checked_in = True
                instance.to_parent_check_in_time = datetime.utcnow()

        if notes:
            instance.notes = notes

        # Mark as completed if both parents checked in
        if instance.from_parent_checked_in and instance.to_parent_checked_in:
            instance.status = "completed"
            instance.completed_at = datetime.utcnow()

        instance.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(instance)

        return instance

    @staticmethod
    async def cancel_instance(
        db: AsyncSession,
        instance_id: str,
        user_id: str,
        notes: Optional[str] = None
    ) -> Optional[CustodyExchangeInstance]:
        """Cancel a specific exchange instance."""

        result = await db.execute(
            select(CustodyExchangeInstance)
            .options(selectinload(CustodyExchangeInstance.exchange))
            .where(CustodyExchangeInstance.id == instance_id)
        )
        instance = result.scalar_one_or_none()

        if not instance:
            return None

        # Verify user has access
        participant = await db.execute(
            select(CaseParticipant).where(
                and_(
                    CaseParticipant.case_id == instance.exchange.case_id,
                    CaseParticipant.user_id == user_id,
                    CaseParticipant.is_active == True
                )
            )
        )
        if not participant.scalar_one_or_none():
            return None

        instance.status = "cancelled"
        if notes:
            instance.notes = notes
        instance.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(instance)

        return instance

    @staticmethod
    def filter_for_viewer(
        exchange: CustodyExchange,
        viewer_id: str
    ) -> dict:
        """Filter exchange data based on viewer permissions."""

        is_owner = exchange.created_by == viewer_id

        data = {
            "id": exchange.id,
            "case_id": exchange.case_id,
            "created_by": exchange.created_by,
            "exchange_type": exchange.exchange_type,
            "title": exchange.title,
            "from_parent_id": exchange.from_parent_id,
            "to_parent_id": exchange.to_parent_id,
            "child_ids": exchange.child_ids,
            "location": exchange.location,
            "scheduled_time": exchange.scheduled_time,
            "duration_minutes": exchange.duration_minutes,
            "is_recurring": exchange.is_recurring,
            "recurrence_pattern": exchange.recurrence_pattern,
            "recurrence_days": exchange.recurrence_days,
            "recurrence_end_date": exchange.recurrence_end_date,
            "items_to_bring": exchange.items_to_bring,
            "status": exchange.status,
            "notes_visible_to_coparent": exchange.notes_visible_to_coparent,
            "is_owner": is_owner,
            "created_at": exchange.created_at,
            "updated_at": exchange.updated_at,
        }

        # Only show location_notes and special_instructions if visible
        if is_owner or exchange.notes_visible_to_coparent:
            data["location_notes"] = exchange.location_notes
            data["special_instructions"] = exchange.special_instructions
        else:
            data["location_notes"] = None
            data["special_instructions"] = None

        # Calculate next occurrence - only if instances are already loaded
        # Check if instances relationship is loaded to avoid async issues
        from sqlalchemy.orm import object_session
        from sqlalchemy.orm.attributes import instance_state

        state = instance_state(exchange)
        instances_loaded = 'instances' in state.dict

        if instances_loaded and exchange.instances:
            upcoming = [
                i for i in exchange.instances
                if i.status == "scheduled" and i.scheduled_time >= datetime.utcnow()
            ]
            if upcoming:
                data["next_occurrence"] = min(i.scheduled_time for i in upcoming)
            else:
                data["next_occurrence"] = None
        else:
            data["next_occurrence"] = None

        return data
