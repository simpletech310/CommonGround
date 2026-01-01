"""
Pydantic schemas for CustodyExchange (Pickup/Dropoff).
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CustodyExchangeCreate(BaseModel):
    """Schema for creating a new custody exchange."""
    case_id: str
    exchange_type: str = Field(
        ...,
        pattern=r"^(pickup|dropoff|both)$",
        description="Type of exchange"
    )
    title: Optional[str] = None

    # Parent involvement
    from_parent_id: Optional[str] = None
    to_parent_id: Optional[str] = None
    child_ids: List[str] = Field(default_factory=list)

    # Location
    location: Optional[str] = None
    location_notes: Optional[str] = None

    # Timing
    scheduled_time: datetime
    duration_minutes: int = 30

    # Recurrence
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = Field(
        default=None,
        pattern=r"^(weekly|biweekly|monthly|custom)$"
    )
    recurrence_days: Optional[List[int]] = None  # 0=Sun, 1=Mon, etc.
    recurrence_end_date: Optional[datetime] = None

    # Details
    items_to_bring: Optional[str] = None
    special_instructions: Optional[str] = None
    notes_visible_to_coparent: bool = True


class CustodyExchangeUpdate(BaseModel):
    """Schema for updating a custody exchange."""
    exchange_type: Optional[str] = Field(
        default=None,
        pattern=r"^(pickup|dropoff|both)$"
    )
    title: Optional[str] = None
    from_parent_id: Optional[str] = None
    to_parent_id: Optional[str] = None
    child_ids: Optional[List[str]] = None
    location: Optional[str] = None
    location_notes: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = Field(
        default=None,
        pattern=r"^(weekly|biweekly|monthly|custom)$"
    )
    recurrence_days: Optional[List[int]] = None
    recurrence_end_date: Optional[datetime] = None
    items_to_bring: Optional[str] = None
    special_instructions: Optional[str] = None
    notes_visible_to_coparent: Optional[bool] = None
    status: Optional[str] = Field(
        default=None,
        pattern=r"^(active|paused|cancelled)$"
    )


class CustodyExchangeResponse(BaseModel):
    """Schema for custody exchange response."""
    id: str
    case_id: str
    created_by: str
    exchange_type: str
    title: Optional[str] = None

    from_parent_id: Optional[str] = None
    to_parent_id: Optional[str] = None
    child_ids: List[str] = Field(default_factory=list)

    location: Optional[str] = None
    location_notes: Optional[str] = None

    scheduled_time: datetime
    duration_minutes: int

    is_recurring: bool
    recurrence_pattern: Optional[str] = None
    recurrence_days: Optional[List[int]] = None
    recurrence_end_date: Optional[datetime] = None

    items_to_bring: Optional[str] = None
    special_instructions: Optional[str] = None
    notes_visible_to_coparent: bool

    status: str

    # Computed fields
    is_owner: bool = False
    next_occurrence: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustodyExchangeInstanceCreate(BaseModel):
    """Schema for creating a specific instance (usually auto-generated)."""
    exchange_id: str
    scheduled_time: datetime
    override_location: Optional[str] = None
    override_time: Optional[datetime] = None
    notes: Optional[str] = None


class CustodyExchangeInstanceUpdate(BaseModel):
    """Schema for updating an instance."""
    status: Optional[str] = Field(
        default=None,
        pattern=r"^(scheduled|completed|missed|cancelled|rescheduled)$"
    )
    override_location: Optional[str] = None
    override_time: Optional[datetime] = None
    notes: Optional[str] = None


class CustodyExchangeInstanceResponse(BaseModel):
    """Schema for instance response."""
    id: str
    exchange_id: str
    scheduled_time: datetime
    status: str

    from_parent_checked_in: bool
    from_parent_check_in_time: Optional[datetime] = None
    to_parent_checked_in: bool
    to_parent_check_in_time: Optional[datetime] = None

    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

    override_location: Optional[str] = None
    override_time: Optional[datetime] = None

    # Include parent exchange details for context
    exchange: Optional[CustodyExchangeResponse] = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CheckInRequest(BaseModel):
    """Schema for parent check-in at exchange."""
    notes: Optional[str] = None
    location_override: Optional[str] = None


class UpcomingExchangesRequest(BaseModel):
    """Schema for getting upcoming exchanges."""
    case_id: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = 20
