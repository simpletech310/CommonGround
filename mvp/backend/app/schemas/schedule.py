"""Schedule schemas for request/response validation."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ScheduleEventCreate(BaseModel):
    """Create a new schedule event."""

    case_id: str
    event_type: str  # regular, holiday, vacation, makeup, special
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    custodial_parent_id: str
    transition_from_id: Optional[str] = None
    transition_to_id: Optional[str] = None
    child_ids: List[str]
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    is_exchange: bool = False
    exchange_location: Optional[str] = None
    exchange_lat: Optional[float] = None
    exchange_lng: Optional[float] = None
    grace_period_minutes: int = 15


class ScheduleEventUpdate(BaseModel):
    """Update a schedule event."""

    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    exchange_location: Optional[str] = None
    status: Optional[str] = None
    cancellation_reason: Optional[str] = None


class ScheduleEventResponse(BaseModel):
    """Schedule event response."""

    id: str
    case_id: str
    event_type: str
    start_time: datetime
    end_time: datetime
    all_day: bool
    custodial_parent_id: str
    transition_from_id: Optional[str]
    transition_to_id: Optional[str]
    child_ids: List[str]
    title: str
    description: Optional[str]
    location: Optional[str]
    is_exchange: bool
    exchange_location: Optional[str]
    grace_period_minutes: int
    status: str
    is_agreement_derived: bool
    is_modification: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExchangeCheckInCreate(BaseModel):
    """Create an exchange check-in."""

    event_id: str
    parent_role: str  # dropping_off, picking_up
    check_in_method: str = "manual"  # gps, manual, third_party
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_accuracy: Optional[float] = None
    notes: Optional[str] = None
    children_present: List[str]


class ExchangeCheckInResponse(BaseModel):
    """Exchange check-in response."""

    id: str
    event_id: str
    user_id: str
    parent_role: str
    checked_in_at: datetime
    scheduled_time: datetime
    check_in_method: str
    location_lat: Optional[float]
    location_lng: Optional[float]
    minutes_early_late: int
    is_on_time: bool
    is_within_grace: bool
    notes: Optional[str]
    children_present: List[str]
    verified_by_other_parent: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ComplianceMetrics(BaseModel):
    """Compliance tracking metrics."""

    user_id: str
    case_id: str
    total_exchanges: int
    on_time_count: int
    late_count: int
    no_show_count: int
    on_time_rate: float
    average_lateness_minutes: float
    trend: str  # improving, stable, worsening
    period_start: datetime
    period_end: datetime


class CalendarEvent(BaseModel):
    """Calendar event for frontend display."""

    id: str
    title: str
    start: datetime
    end: datetime
    all_day: bool
    event_type: str
    custodial_parent: str
    is_exchange: bool
    location: Optional[str]
    status: str
    child_names: List[str]


class CalendarResponse(BaseModel):
    """Calendar data for a date range."""

    case_id: str
    events: List[CalendarEvent]
    start_date: datetime
    end_date: datetime


class ScheduleGenerationRequest(BaseModel):
    """Request to generate schedule from agreement."""

    agreement_id: str
    start_date: datetime
    end_date: datetime
    include_holidays: bool = True
