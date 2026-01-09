"""
Pydantic schemas for KidComs (child communication sessions).

KidComs enables children to have video calls, chat, watch movies together,
play games, and use collaborative whiteboards with their approved circle.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ============================================================
# KidComs Settings Schemas
# ============================================================

class KidComsSettingsCreate(BaseModel):
    """Schema for creating KidComs settings (usually auto-created with family)."""
    family_file_id: str

    # Circle approval settings
    circle_approval_mode: str = Field(
        default="both_parents",
        pattern=r"^(both_parents|either_parent)$",
        description="Mode for approving circle contacts"
    )

    # Availability schedule
    availability_schedule: Optional[Dict[str, Dict[str, str]]] = Field(
        default=None,
        description="Format: {'monday': {'start': '09:00', 'end': '20:00'}, ...}"
    )
    enforce_availability: bool = True

    # Notifications
    require_parent_notification: bool = True
    notify_on_session_start: bool = True
    notify_on_session_end: bool = True
    notify_on_aria_flag: bool = True

    # Feature toggles
    allowed_features: Dict[str, bool] = Field(
        default_factory=lambda: {
            "video": True,
            "chat": True,
            "theater": True,
            "arcade": True,
            "whiteboard": True
        }
    )

    # Session limits
    max_session_duration_minutes: int = Field(default=60, ge=5, le=180)
    max_daily_sessions: int = Field(default=5, ge=1, le=20)
    max_participants_per_session: int = Field(default=4, ge=2, le=10)

    # Parental controls
    require_parent_in_call: bool = False
    allow_child_to_initiate: bool = True
    record_sessions: bool = False


class KidComsSettingsUpdate(BaseModel):
    """Schema for updating KidComs settings."""
    circle_approval_mode: Optional[str] = Field(
        default=None,
        pattern=r"^(both_parents|either_parent)$"
    )

    availability_schedule: Optional[Dict[str, Dict[str, str]]] = None
    enforce_availability: Optional[bool] = None

    require_parent_notification: Optional[bool] = None
    notify_on_session_start: Optional[bool] = None
    notify_on_session_end: Optional[bool] = None
    notify_on_aria_flag: Optional[bool] = None

    allowed_features: Optional[Dict[str, bool]] = None

    max_session_duration_minutes: Optional[int] = Field(default=None, ge=5, le=180)
    max_daily_sessions: Optional[int] = Field(default=None, ge=1, le=20)
    max_participants_per_session: Optional[int] = Field(default=None, ge=2, le=10)

    require_parent_in_call: Optional[bool] = None
    allow_child_to_initiate: Optional[bool] = None
    record_sessions: Optional[bool] = None


class KidComsSettingsResponse(BaseModel):
    """Schema for KidComs settings response."""
    id: str
    family_file_id: str

    circle_approval_mode: str
    availability_schedule: Optional[Dict[str, Dict[str, str]]] = None
    enforce_availability: bool

    require_parent_notification: bool
    notify_on_session_start: bool
    notify_on_session_end: bool
    notify_on_aria_flag: bool

    allowed_features: Dict[str, bool]

    max_session_duration_minutes: int
    max_daily_sessions: int
    max_participants_per_session: int

    require_parent_in_call: bool
    allow_child_to_initiate: bool
    record_sessions: bool

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ============================================================
# KidComs Session Schemas
# ============================================================

class SessionParticipant(BaseModel):
    """Schema for a session participant."""
    id: str
    type: str = Field(
        ...,
        pattern=r"^(child|parent|circle_contact)$"
    )
    name: str
    joined_at: Optional[str] = None


class KidComsSessionCreate(BaseModel):
    """Schema for creating a KidComs session."""
    family_file_id: str
    child_id: str

    session_type: str = Field(
        default="video_call",
        pattern=r"^(video_call|theater|arcade|whiteboard|mixed)$",
        description="Type of session"
    )
    title: Optional[str] = Field(default=None, max_length=200)

    # Invited participants (circle contacts or other family members)
    invited_contact_ids: List[str] = Field(
        default_factory=list,
        description="Circle contact IDs to invite"
    )

    # Scheduling
    scheduled_for: Optional[datetime] = Field(
        default=None,
        description="Optional future time to schedule session"
    )


class KidComsSessionUpdate(BaseModel):
    """Schema for updating a KidComs session."""
    title: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = None
    status: Optional[str] = Field(
        default=None,
        pattern=r"^(scheduled|waiting|active|completed|cancelled)$"
    )


class KidComsSessionResponse(BaseModel):
    """Schema for KidComs session response."""
    id: str
    family_file_id: str
    child_id: str

    session_type: str
    title: Optional[str] = None
    status: str

    # Daily.co room info
    daily_room_name: str
    daily_room_url: str
    # Note: daily_room_token is NOT exposed in response for security

    # Initiation
    initiated_by_id: str
    initiated_by_type: str

    # Participants
    participants: List[SessionParticipant] = Field(default_factory=list)

    # Timing
    scheduled_for: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None

    # Features used
    features_used: List[str] = Field(default_factory=list)

    # ARIA stats
    total_messages: int = 0
    flagged_messages: int = 0

    notes: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KidComsSessionListResponse(BaseModel):
    """Schema for listing sessions."""
    items: List[KidComsSessionResponse]
    total: int


class KidComsJoinRequest(BaseModel):
    """Schema for joining an existing session."""
    session_id: str


class KidComsJoinResponse(BaseModel):
    """Response when joining a session (includes token)."""
    session_id: str
    daily_room_url: str
    daily_token: str  # Participant-specific token
    participant_name: str
    participant_type: str


class KidComsEndSessionRequest(BaseModel):
    """Schema for ending a session."""
    notes: Optional[str] = None


# ============================================================
# KidComs Message Schemas
# ============================================================

class KidComsMessageCreate(BaseModel):
    """Schema for sending a message in a session."""
    session_id: str
    content: str = Field(..., min_length=1, max_length=2000)


class KidComsMessageResponse(BaseModel):
    """Schema for KidComs message response."""
    id: str
    session_id: str

    sender_id: str
    sender_type: str
    sender_name: str

    content: str
    original_content: Optional[str] = None  # If modified by ARIA

    # ARIA analysis
    aria_analyzed: bool
    aria_flagged: bool
    aria_category: Optional[str] = None
    aria_reason: Optional[str] = None

    is_delivered: bool
    is_hidden: bool  # Hidden due to flag

    sent_at: datetime

    model_config = {"from_attributes": True}


class KidComsMessageListResponse(BaseModel):
    """Schema for listing messages in a session."""
    items: List[KidComsMessageResponse]
    total: int
    flagged_count: int = 0


# ============================================================
# KidComs Session Invite Schemas
# ============================================================

class KidComsSessionInviteCreate(BaseModel):
    """Schema for inviting someone to a session."""
    session_id: str
    circle_contact_id: str


class KidComsSessionInviteResponse(BaseModel):
    """Schema for session invite response."""
    id: str
    session_id: str
    circle_contact_id: Optional[str] = None

    invited_by_id: str
    invited_by_type: str
    invite_token: str
    invite_url: str

    status: str  # pending, accepted, declined, expired
    expires_at: datetime
    accepted_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KidComsInviteAcceptRequest(BaseModel):
    """Schema for accepting a session invite."""
    invite_token: str


# ============================================================
# Daily.co Integration Schemas
# ============================================================

class DailyRoomCreate(BaseModel):
    """Schema for creating a Daily.co room."""
    name: str = Field(..., min_length=3, max_length=100)
    privacy: str = Field(
        default="private",
        pattern=r"^(public|private)$"
    )
    properties: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional room properties (max participants, expiry, etc.)"
    )


class DailyRoomResponse(BaseModel):
    """Response from Daily.co room creation."""
    name: str
    url: str
    created_at: Optional[datetime] = None
    privacy: str


class DailyTokenCreate(BaseModel):
    """Schema for creating a Daily.co participant token."""
    room_name: str
    user_name: str
    user_id: str
    is_owner: bool = False
    start_video_off: bool = False
    start_audio_off: bool = False
    exp_minutes: int = Field(default=60, ge=5, le=480)


class DailyTokenResponse(BaseModel):
    """Response containing Daily.co participant token."""
    token: str
    room_url: str


# ============================================================
# ARIA Chat Analysis Schemas
# ============================================================

class ARIAChatAnalyzeRequest(BaseModel):
    """Schema for analyzing a chat message with ARIA."""
    content: str = Field(..., min_length=1, max_length=2000)
    sender_type: str = Field(
        ...,
        pattern=r"^(child|parent|circle_contact)$"
    )
    sender_name: str
    context: Optional[str] = Field(
        default=None,
        description="Additional context for analysis (e.g., recent conversation)"
    )


class ARIAChatAnalyzeResponse(BaseModel):
    """Response from ARIA chat analysis."""
    is_safe: bool
    should_flag: bool
    category: Optional[str] = Field(
        default=None,
        description="Category of concern if flagged"
    )
    reason: Optional[str] = None
    confidence_score: float = Field(..., ge=0.0, le=1.0)

    # For children's messages, provide gentle suggestions if needed
    suggested_rewrite: Optional[str] = None

    # Whether to hide from other participants
    should_hide: bool = False

    # Whether to notify parents
    should_notify_parents: bool = False


# ============================================================
# KidComs Dashboard/Summary Schemas
# ============================================================

class KidComsChildSummary(BaseModel):
    """Summary of KidComs activity for a child."""
    child_id: str
    child_name: str

    # Session stats
    total_sessions: int = 0
    sessions_this_week: int = 0
    total_duration_minutes: int = 0

    # Circle stats
    circle_contacts_count: int = 0
    favorite_contacts: List[str] = Field(default_factory=list)

    # Communication stats
    messages_sent: int = 0
    messages_flagged: int = 0

    # Last activity
    last_session_at: Optional[datetime] = None
    last_session_with: Optional[str] = None


class KidComsFamilySummary(BaseModel):
    """Summary of KidComs activity for a family."""
    family_file_id: str

    # Overall stats
    total_sessions: int = 0
    sessions_this_week: int = 0

    # Per-child summaries
    children: List[KidComsChildSummary] = Field(default_factory=list)

    # Feature usage
    feature_usage: Dict[str, int] = Field(
        default_factory=lambda: {
            "video_call": 0,
            "theater": 0,
            "arcade": 0,
            "whiteboard": 0,
            "chat": 0
        }
    )

    # Availability
    is_within_availability: bool = True
    next_available_window: Optional[str] = None


# ============================================================
# Feature Constants
# ============================================================

SESSION_TYPES = [
    {"value": "video_call", "label": "Video Call", "icon": "video"},
    {"value": "theater", "label": "Theater", "icon": "film"},
    {"value": "arcade", "label": "Arcade", "icon": "gamepad-2"},
    {"value": "whiteboard", "label": "Whiteboard", "icon": "pencil"},
    {"value": "mixed", "label": "Mixed Session", "icon": "layout-grid"},
]

ARIA_CATEGORIES = [
    "inappropriate_content",
    "bullying",
    "personal_info_sharing",
    "external_links",
    "profanity",
    "concerning_behavior",
    "conflict_escalation",
    "other",
]
