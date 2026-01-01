"""
Event Service - Business logic for schedule events and attendance.

Handles:
- CRUD operations for events
- Attendance tracking (RSVP for MVP)
- Privacy filtering (co-parent view vs owner view)
- Event invitation management
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schedule import ScheduleEvent
from app.models.event_attendance import EventAttendance
from app.models.my_time_collection import MyTimeCollection
from app.models.case import CaseParticipant
from app.services.time_block import TimeBlockService, normalize_datetime


class EventService:
    """Service for managing events and attendance with privacy."""

    @staticmethod
    async def create_event(
        db: AsyncSession,
        collection_id: str,
        user_id: str,
        title: str,
        start_time: datetime,
        end_time: datetime,
        child_ids: List[str],
        description: Optional[str] = None,
        location: Optional[str] = None,
        location_shared: bool = False,
        visibility: str = "co_parent",
        all_day: bool = False,
        attendance_invites: Optional[List[Dict[str, str]]] = None,
        event_category: str = "general",
        category_data: Optional[Dict[str, Any]] = None
    ) -> ScheduleEvent:
        """
        Create a new event.

        Args:
            db: Database session
            collection_id: Collection UUID
            user_id: User creating event (must own collection)
            title: Event title
            start_time: Event start
            end_time: Event end
            child_ids: List of child UUIDs involved
            description: Event description (optional)
            location: Event location (optional)
            location_shared: Share location with co-parent
            visibility: "private" or "co_parent"
            all_day: Whether this is an all-day event
            attendance_invites: List of {parent_id, invited_role} (optional)

        Returns:
            Created ScheduleEvent with attendance records

        Raises:
            ValueError: If validation fails
        """
        # Verify collection ownership
        collection_result = await db.execute(
            select(MyTimeCollection).where(MyTimeCollection.id == collection_id)
        )
        collection = collection_result.scalar_one_or_none()

        if not collection:
            raise ValueError("Collection not found")

        if collection.owner_id != user_id:
            raise ValueError("You can only create events in your own collections")

        # Validate times
        if end_time <= start_time:
            raise ValueError("End time must be after start time")

        # Normalize datetime objects (strip timezone for PostgreSQL)
        start_time = normalize_datetime(start_time)
        end_time = normalize_datetime(end_time)

        # Create event
        event = ScheduleEvent(
            id=str(uuid.uuid4()),
            case_id=collection.case_id,
            collection_id=collection_id,
            created_by=user_id,
            title=title,
            description=description,
            start_time=start_time,
            end_time=end_time,
            all_day=all_day,
            child_ids=child_ids or [],
            location=location,
            location_shared=location_shared,
            visibility=visibility,
            event_type="event",  # MVP: generic events only
            event_category=event_category,  # V2: category-specific forms
            category_data=category_data,
            custodial_parent_id=user_id,
            status="scheduled"
        )

        db.add(event)
        await db.flush()

        # Create attendance records for invited parents
        if attendance_invites:
            for invite in attendance_invites:
                attendance = EventAttendance(
                    id=str(uuid.uuid4()),
                    event_id=event.id,
                    parent_id=invite["parent_id"],
                    invited_role=invite.get("invited_role", "optional"),
                    invited_at=datetime.utcnow(),
                    rsvp_status="no_response"
                )
                db.add(attendance)

        await db.flush()
        await db.refresh(event)

        return event

    @staticmethod
    async def get_event(
        db: AsyncSession,
        event_id: str,
        viewer_id: str
    ) -> Optional[ScheduleEvent]:
        """
        Get an event by ID (privacy filtered).

        Args:
            db: Database session
            event_id: Event UUID
            viewer_id: User requesting the event

        Returns:
            ScheduleEvent or None
        """
        result = await db.execute(
            select(ScheduleEvent).where(ScheduleEvent.id == event_id)
        )
        event = result.scalar_one_or_none()

        if not event:
            return None

        # Verify viewer has access to this case
        access_result = await db.execute(
            select(CaseParticipant).where(
                CaseParticipant.case_id == event.case_id,
                CaseParticipant.user_id == viewer_id,
                CaseParticipant.is_active == True
            )
        )
        if not access_result.scalar_one_or_none():
            return None

        # Check visibility
        if event.visibility == "private" and event.created_by != viewer_id:
            return None

        return event

    @staticmethod
    async def list_events(
        db: AsyncSession,
        case_id: str,
        viewer_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[ScheduleEvent]:
        """
        List events for a case (privacy filtered).

        Args:
            db: Database session
            case_id: Case UUID
            viewer_id: User requesting events
            start_date: Filter by start date (optional)
            end_date: Filter by end date (optional)

        Returns:
            List of ScheduleEvent (privacy filtered)
        """
        # Verify access
        access_result = await db.execute(
            select(CaseParticipant).where(
                CaseParticipant.case_id == case_id,
                CaseParticipant.user_id == viewer_id,
                CaseParticipant.is_active == True
            )
        )
        if not access_result.scalar_one_or_none():
            raise ValueError("No access to this case")

        # Build query
        query = select(ScheduleEvent).where(
            ScheduleEvent.case_id == case_id,
            or_(
                ScheduleEvent.created_by == viewer_id,
                ScheduleEvent.visibility == "co_parent"
            )
        )

        # Add date filters (normalize to strip timezone for PostgreSQL)
        if start_date:
            start_date = normalize_datetime(start_date)
            query = query.where(ScheduleEvent.end_time >= start_date)
        if end_date:
            end_date = normalize_datetime(end_date)
            query = query.where(ScheduleEvent.start_time <= end_date)

        query = query.order_by(ScheduleEvent.start_time)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_event(
        db: AsyncSession,
        event_id: str,
        user_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        location: Optional[str] = None,
        location_shared: Optional[bool] = None,
        event_category: Optional[str] = None,
        category_data: Optional[Dict[str, Any]] = None
    ) -> ScheduleEvent:
        """
        Update an event.

        Args:
            db: Database session
            event_id: Event UUID
            user_id: User making update (must be creator)
            title: New title (optional)
            description: New description (optional)
            start_time: New start time (optional)
            end_time: New end time (optional)
            location: New location (optional)
            location_shared: New location sharing setting (optional)

        Returns:
            Updated ScheduleEvent
        """
        result = await db.execute(
            select(ScheduleEvent).where(ScheduleEvent.id == event_id)
        )
        event = result.scalar_one_or_none()

        if not event:
            raise ValueError("Event not found")

        if event.created_by != user_id:
            raise ValueError("Only the creator can update this event")

        # Update fields
        if title is not None:
            event.title = title
        if description is not None:
            event.description = description
        if start_time is not None:
            event.start_time = start_time
        if end_time is not None:
            event.end_time = end_time
        if location is not None:
            event.location = location
        if location_shared is not None:
            event.location_shared = location_shared
        if event_category is not None:
            event.event_category = event_category
        if category_data is not None:
            event.category_data = category_data

        # Validate times
        if event.end_time <= event.start_time:
            raise ValueError("End time must be after start time")

        event.updated_at = datetime.utcnow()
        await db.flush()
        await db.refresh(event)

        return event

    @staticmethod
    async def delete_event(
        db: AsyncSession,
        event_id: str,
        user_id: str
    ) -> bool:
        """
        Delete an event (change status to cancelled).

        Args:
            db: Database session
            event_id: Event UUID
            user_id: User requesting deletion (must be creator)

        Returns:
            True if deleted
        """
        result = await db.execute(
            select(ScheduleEvent).where(ScheduleEvent.id == event_id)
        )
        event = result.scalar_one_or_none()

        if not event:
            return False

        if event.created_by != user_id:
            raise ValueError("Only the creator can delete this event")

        event.status = "cancelled"
        event.cancelled_at = datetime.utcnow()
        event.cancelled_by = user_id
        event.updated_at = datetime.utcnow()
        await db.flush()

        return True

    @staticmethod
    async def filter_for_coparent(
        event: ScheduleEvent,
        viewer_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Filter event for co-parent view.

        Privacy Rules:
        - Creator sees full details
        - Co-parent sees limited details based on visibility settings

        Args:
            event: ScheduleEvent to filter
            viewer_id: User viewing the event
            db: Database session

        Returns:
            Filtered dictionary
        """
        if event.created_by == viewer_id:
            # Creator sees everything
            return {
                "id": event.id,
                "case_id": event.case_id,
                "collection_id": event.collection_id,
                "created_by": event.created_by,
                "title": event.title,
                "description": event.description,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat(),
                "all_day": event.all_day,
                "child_ids": event.child_ids,
                "location": event.location,
                "location_shared": event.location_shared,
                "visibility": event.visibility,
                "status": event.status,
                "is_owner": True,
                "event_category": event.event_category,
                "category_data": event.category_data,
                "created_at": event.created_at.isoformat(),
                "updated_at": event.updated_at.isoformat()
            }
        else:
            # Co-parent sees limited view
            # Get viewer's attendance
            attendance_result = await db.execute(
                select(EventAttendance).where(
                    EventAttendance.event_id == event.id,
                    EventAttendance.parent_id == viewer_id
                )
            )
            attendance = attendance_result.scalar_one_or_none()

            return {
                "id": event.id,
                "case_id": event.case_id,
                "created_by": event.created_by,
                "title": event.title if event.visibility == "co_parent" else "Event",
                "description": event.description if event.visibility == "co_parent" else None,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat(),
                "all_day": event.all_day,
                "child_ids": event.child_ids,
                "location": event.location if event.location_shared else None,
                "visibility": event.visibility,
                "status": event.status,
                "is_owner": False,
                "event_category": event.event_category if event.visibility == "co_parent" else "general",
                "category_data": event.category_data if event.visibility == "co_parent" else None,
                "my_attendance": {
                    "invited_role": attendance.invited_role if attendance else "not_invited",
                    "rsvp_status": attendance.rsvp_status if attendance else "no_response"
                } if attendance else None,
                "created_at": event.created_at.isoformat(),
                "updated_at": event.updated_at.isoformat()
            }

    # ========== ATTENDANCE METHODS ==========

    @staticmethod
    async def update_rsvp(
        db: AsyncSession,
        event_id: str,
        parent_id: str,
        rsvp_status: str,
        rsvp_note: Optional[str] = None
    ) -> EventAttendance:
        """
        Update RSVP for an event.

        Args:
            db: Database session
            event_id: Event UUID
            parent_id: Parent updating RSVP
            rsvp_status: "going", "not_going", "maybe", "no_response"
            rsvp_note: Optional note

        Returns:
            Updated EventAttendance

        Raises:
            ValueError: If attendance record not found or invalid status
        """
        valid_statuses = ["going", "not_going", "maybe", "no_response"]
        if rsvp_status not in valid_statuses:
            raise ValueError(f"Invalid RSVP status. Must be one of: {valid_statuses}")

        # Get or create attendance record
        result = await db.execute(
            select(EventAttendance).where(
                EventAttendance.event_id == event_id,
                EventAttendance.parent_id == parent_id
            )
        )
        attendance = result.scalar_one_or_none()

        if not attendance:
            # Create new attendance record
            attendance = EventAttendance(
                id=str(uuid.uuid4()),
                event_id=event_id,
                parent_id=parent_id,
                invited_role="optional",
                invited_at=datetime.utcnow(),
                rsvp_status=rsvp_status,
                rsvp_at=datetime.utcnow(),
                rsvp_note=rsvp_note
            )
            db.add(attendance)
        else:
            # Update existing
            attendance.rsvp_status = rsvp_status
            attendance.rsvp_at = datetime.utcnow()
            if rsvp_note is not None:
                attendance.rsvp_note = rsvp_note
            attendance.updated_at = datetime.utcnow()

        await db.flush()
        await db.refresh(attendance)

        return attendance

    @staticmethod
    async def get_event_attendance(
        db: AsyncSession,
        event_id: str,
        viewer_id: str
    ) -> List[EventAttendance]:
        """
        Get all attendance records for an event.

        Args:
            db: Database session
            event_id: Event UUID
            viewer_id: User requesting (must have access to event)

        Returns:
            List of EventAttendance
        """
        # Verify event access
        event = await EventService.get_event(db, event_id, viewer_id)
        if not event:
            raise ValueError("Event not found or no access")

        # Get attendance records
        result = await db.execute(
            select(EventAttendance).where(EventAttendance.event_id == event_id)
        )

        return list(result.scalars().all())

    @staticmethod
    async def check_event_conflicts(
        db: AsyncSession,
        case_id: str,
        start_time: datetime,
        end_time: datetime,
        exclude_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check for scheduling conflicts before creating an event.

        Uses TimeBlockService for conflict detection.

        Args:
            db: Database session
            case_id: Case UUID
            start_time: Proposed event start
            end_time: Proposed event end
            exclude_user_id: Don't check this user's blocks

        Returns:
            Dict with:
            - has_conflicts: bool
            - conflicts: List[dict] (ARIA warnings)
            - can_proceed: bool
        """
        has_conflicts, conflicts = await TimeBlockService.check_conflicts(
            db, case_id, start_time, end_time, exclude_user_id
        )

        return {
            "has_conflicts": has_conflicts,
            "conflicts": conflicts,
            "can_proceed": True  # MVP: conflicts are warnings, not blockers
        }
