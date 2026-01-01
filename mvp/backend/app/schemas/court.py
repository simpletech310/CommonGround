"""
Court Access Mode schemas.

Pydantic schemas for court professional access, settings, events, and reports.
"""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.models.court import (
    CourtRole,
    AccessScope,
    GrantStatus,
    CourtEventType,
    CourtMessageType,
    ReportType,
    DEFAULT_ACCESS_DURATION,
)


# =============================================================================
# Court Professional Schemas
# =============================================================================

class CourtProfessionalBase(BaseModel):
    """Base schema for court professional."""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=200)
    phone: Optional[str] = None
    role: CourtRole
    organization: Optional[str] = None
    title: Optional[str] = None
    credentials: Optional[dict] = None


class CourtProfessionalCreate(CourtProfessionalBase):
    """Schema for creating a court professional."""
    pass


class CourtProfessionalUpdate(BaseModel):
    """Schema for updating a court professional."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    title: Optional[str] = None
    credentials: Optional[dict] = None
    is_active: Optional[bool] = None


class CourtProfessionalResponse(CourtProfessionalBase):
    """Schema for court professional response."""
    id: str
    is_verified: bool
    verified_at: Optional[datetime] = None
    mfa_enabled: bool
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CourtProfessionalVerify(BaseModel):
    """Schema for verifying a court professional."""
    verification_method: str = Field(..., description="bar_lookup, court_email, appointment_letter")
    credentials: Optional[dict] = None


# =============================================================================
# Court Access Grant Schemas
# =============================================================================

class AccessGrantRequest(BaseModel):
    """Schema for requesting access to a case."""
    case_id: str
    role: CourtRole
    access_scope: list[AccessScope] = Field(
        default=[AccessScope.AGREEMENT, AccessScope.SCHEDULE, AccessScope.COMPLIANCE]
    )
    data_start_date: Optional[date] = None
    data_end_date: Optional[date] = None
    authorization_type: str = Field(..., description="court_order, parental_consent, appointment")
    authorization_reference: Optional[str] = None
    duration_days: Optional[int] = None  # Uses role default if not specified
    notes: Optional[str] = None


class AccessGrantCreate(BaseModel):
    """Schema for creating an access grant (internal use)."""
    case_id: str
    professional_id: str
    role: CourtRole
    access_scope: list[AccessScope]
    data_start_date: Optional[date] = None
    data_end_date: Optional[date] = None
    authorization_type: str
    authorization_reference: Optional[str] = None
    expires_at: datetime
    sealed_items_access: bool = False
    notes: Optional[str] = None


class AccessGrantResponse(BaseModel):
    """Schema for access grant response."""
    id: str
    case_id: str
    professional_id: str
    role: str
    access_scope: list[str]
    data_start_date: Optional[date] = None
    data_end_date: Optional[date] = None
    authorization_type: str
    authorization_reference: Optional[str] = None
    status: str
    granted_at: datetime
    activated_at: Optional[datetime] = None
    expires_at: datetime
    days_remaining: int
    is_active: bool
    petitioner_approved: bool
    respondent_approved: bool
    access_count: int
    last_accessed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AccessGrantApproval(BaseModel):
    """Schema for parent approval of access grant."""
    approved: bool
    notes: Optional[str] = None


class AccessGrantRevoke(BaseModel):
    """Schema for revoking access."""
    reason: str = Field(..., min_length=10, max_length=500)


class AccessLinkResponse(BaseModel):
    """Schema for access link generation."""
    grant_id: str
    access_link: str
    access_code: str
    expires_at: datetime


# =============================================================================
# Court Access Log Schemas
# =============================================================================

class AccessLogEntry(BaseModel):
    """Schema for access log entry."""
    id: str
    grant_id: str
    professional_id: str
    case_id: str
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    logged_at: datetime

    class Config:
        from_attributes = True


class AccessLogList(BaseModel):
    """Schema for list of access logs."""
    logs: list[AccessLogEntry]
    total: int
    page: int
    per_page: int


# =============================================================================
# Court Case Settings Schemas
# =============================================================================

class CourtSettingsBase(BaseModel):
    """Base schema for court settings."""
    gps_checkins_required: bool = False
    supervised_exchange_required: bool = False
    aria_enforcement_locked: bool = False
    in_app_communication_only: bool = False
    agreement_edits_locked: bool = False
    investigation_mode: bool = False
    child_safety_tracking: bool = False
    financial_verification_required: bool = False


class CourtSettingsCreate(CourtSettingsBase):
    """Schema for creating court settings."""
    case_id: str
    court_order_reference: Optional[str] = None
    notes: Optional[str] = None


class CourtSettingsUpdate(BaseModel):
    """Schema for updating court settings."""
    gps_checkins_required: Optional[bool] = None
    supervised_exchange_required: Optional[bool] = None
    aria_enforcement_locked: Optional[bool] = None
    in_app_communication_only: Optional[bool] = None
    agreement_edits_locked: Optional[bool] = None
    investigation_mode: Optional[bool] = None
    child_safety_tracking: Optional[bool] = None
    financial_verification_required: Optional[bool] = None
    court_order_reference: Optional[str] = None
    notes: Optional[str] = None


class CourtSettingsResponse(CourtSettingsBase):
    """Schema for court settings response."""
    id: str
    case_id: str
    set_by_professional_id: Optional[str] = None
    set_at: Optional[datetime] = None
    court_order_reference: Optional[str] = None
    notes: Optional[str] = None
    active_controls: list[str]
    settings_history: Optional[list] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CourtSettingsPublic(BaseModel):
    """Schema for settings visible to parents (limited info)."""
    gps_checkins_required: bool
    supervised_exchange_required: bool
    aria_enforcement_locked: bool
    in_app_communication_only: bool
    agreement_edits_locked: bool
    active_controls: list[str]
    is_court_controlled: bool = True


# =============================================================================
# Court Event Schemas
# =============================================================================

class CourtEventBase(BaseModel):
    """Base schema for court event."""
    event_type: CourtEventType
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    event_date: date
    start_time: Optional[str] = None  # HH:MM format
    end_time: Optional[str] = None
    location: Optional[str] = None
    virtual_link: Optional[str] = None
    petitioner_required: bool = True
    respondent_required: bool = True
    is_mandatory: bool = True
    shared_notes: Optional[str] = None


class CourtEventCreate(CourtEventBase):
    """Schema for creating a court event."""
    case_id: str
    internal_notes: Optional[str] = None


class CourtEventUpdate(BaseModel):
    """Schema for updating a court event."""
    event_type: Optional[CourtEventType] = None
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    virtual_link: Optional[str] = None
    petitioner_required: Optional[bool] = None
    respondent_required: Optional[bool] = None
    is_mandatory: Optional[bool] = None
    status: Optional[str] = None
    internal_notes: Optional[str] = None
    shared_notes: Optional[str] = None


class CourtEventAttendance(BaseModel):
    """Schema for recording attendance."""
    petitioner_attended: Optional[bool] = None
    respondent_attended: Optional[bool] = None
    petitioner_attendance_notes: Optional[str] = None
    respondent_attendance_notes: Optional[str] = None


class CourtEventResponse(CourtEventBase):
    """Schema for court event response."""
    id: str
    case_id: str
    created_by: str
    status: str
    internal_notes: Optional[str] = None  # Only for court staff
    petitioner_attended: Optional[bool] = None
    respondent_attended: Optional[bool] = None
    attendance_summary: str
    is_past: bool
    reminder_sent: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CourtEventPublic(BaseModel):
    """Schema for event visible to parents (no internal notes)."""
    id: str
    event_type: str
    title: str
    description: Optional[str] = None
    event_date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    virtual_link: Optional[str] = None
    is_mandatory: bool
    status: str
    shared_notes: Optional[str] = None
    is_court_event: bool = True


# =============================================================================
# Court Message Schemas
# =============================================================================

class CourtMessageCreate(BaseModel):
    """Schema for creating a court message."""
    case_id: str
    message_type: CourtMessageType
    subject: Optional[str] = None
    content: str = Field(..., min_length=10)
    to_petitioner: bool = True
    to_respondent: bool = True
    replies_allowed: bool = False
    is_urgent: bool = False
    attachments: Optional[list[dict]] = None


class CourtMessageResponse(BaseModel):
    """Schema for court message response."""
    id: str
    case_id: str
    sent_by: str
    message_type: str
    subject: Optional[str] = None
    content: str
    to_petitioner: bool
    to_respondent: bool
    petitioner_read_at: Optional[datetime] = None
    respondent_read_at: Optional[datetime] = None
    is_fully_read: bool
    replies_allowed: bool
    is_urgent: bool
    attachments: Optional[list[dict]] = None
    sent_at: datetime

    class Config:
        from_attributes = True


class CourtMessagePublic(BaseModel):
    """Schema for message visible to parents."""
    id: str
    message_type: str
    subject: Optional[str] = None
    content: str
    is_urgent: bool
    attachments: Optional[list[dict]] = None
    sent_at: datetime
    is_court_message: bool = True


# =============================================================================
# Investigation Report Schemas
# =============================================================================

class ReportRequest(BaseModel):
    """Schema for requesting a report."""
    case_id: str
    report_type: ReportType
    title: Optional[str] = None
    date_range_start: date
    date_range_end: date
    sections_included: list[str] = Field(
        default=["agreement", "compliance", "schedule"]
    )
    purpose: Optional[str] = None
    is_permanent: bool = True


class ReportResponse(BaseModel):
    """Schema for report response."""
    id: str
    case_id: str
    generated_by: str
    report_number: str
    report_type: str
    title: str
    date_range_start: date
    date_range_end: date
    sections_included: list[str]
    file_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    page_count: Optional[int] = None
    content_hash: str
    watermark_text: str
    verification_url: str
    evidence_counts: Optional[dict] = None
    status: str
    download_count: int
    purpose: Optional[str] = None
    generated_at: datetime
    expires_at: Optional[datetime] = None
    is_expired: bool

    class Config:
        from_attributes = True


class ReportVerification(BaseModel):
    """Schema for report verification response."""
    report_number: str
    is_valid: bool
    content_hash: str
    generated_at: datetime
    generated_by: str  # Professional name
    case_id: str
    verification_timestamp: datetime


# =============================================================================
# ARIA Court Query Schemas
# =============================================================================

class ARIACourtQuery(BaseModel):
    """Schema for ARIA court query."""
    case_id: str
    query: str = Field(..., min_length=5, max_length=500)


class ARIACourtResponse(BaseModel):
    """Schema for ARIA court response."""
    query: str
    response: str
    data: Optional[dict] = None  # Structured data if applicable
    sources: list[str] = []  # What data was referenced
    disclaimer: str = "This response contains factual information only. No recommendations or interpretations are provided."


class ARIASuggestion(BaseModel):
    """Schema for suggested ARIA queries."""
    category: str
    queries: list[str]


class ARIASuggestionList(BaseModel):
    """Schema for list of ARIA suggestions."""
    suggestions: list[ARIASuggestion]


# =============================================================================
# Court Portal Authentication
# =============================================================================

class CourtLoginRequest(BaseModel):
    """Schema for court portal login."""
    email: EmailStr
    access_code: Optional[str] = None  # For initial access link


class CourtMFARequest(BaseModel):
    """Schema for MFA verification."""
    code: str = Field(..., min_length=6, max_length=6)


class CourtLoginResponse(BaseModel):
    """Schema for court login response."""
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    professional: CourtProfessionalResponse
    active_grants: list[AccessGrantResponse]


# =============================================================================
# Summary Schemas
# =============================================================================

class CaseCourtSummary(BaseModel):
    """Summary of court-related info for a case."""
    case_id: str
    has_court_settings: bool
    active_controls: list[str]
    active_grants_count: int
    upcoming_court_events: int
    unread_court_messages: int
    investigation_mode: bool


class CourtDashboardStats(BaseModel):
    """Stats for court professional dashboard."""
    active_cases: int
    pending_approvals: int
    upcoming_events: int
    recent_reports: int
    access_expiring_soon: int  # Grants expiring within 7 days
