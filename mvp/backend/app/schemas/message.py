"""Message schemas for request/response validation."""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    """Create a new message."""

    case_id: str
    recipient_id: str
    content: str
    thread_id: Optional[str] = None
    message_type: str = "text"  # text, voice, request


class MessageUpdate(BaseModel):
    """Update message (for editing sent messages)."""

    content: str


class InterventionAction(BaseModel):
    """User's response to ARIA intervention."""

    action: str  # accepted, modified, rejected, cancelled
    final_message: Optional[str] = None  # If modified
    notes: Optional[str] = None


class ARIAAnalysisResponse(BaseModel):
    """ARIA sentiment analysis result."""

    toxicity_level: str
    toxicity_score: float
    categories: List[str]
    triggers: List[str]
    explanation: str
    suggestion: Optional[str]
    is_flagged: bool


class InterventionResponse(BaseModel):
    """ARIA intervention message."""

    level: str
    header: str
    explanation: str
    original_message: str
    suggestion: Optional[str]
    toxicity_score: float
    categories: List[str]
    child_reminder: str


class MessageFlagResponse(BaseModel):
    """Message flag details."""

    id: str
    message_id: str
    flagged_by: str
    flag_type: str
    toxicity_score: float
    toxicity_categories: List[str]
    suggested_rewrite: Optional[str]
    user_action: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Message response with all details."""

    id: str
    case_id: str
    thread_id: Optional[str]
    sender_id: str
    recipient_id: str
    content: str
    message_type: str
    sent_at: datetime
    delivered_at: Optional[datetime]
    read_at: Optional[datetime]
    was_flagged: bool
    original_content: Optional[str]  # If ARIA intervention occurred

    class Config:
        from_attributes = True


class MessageWithFlagResponse(BaseModel):
    """Message with flag details if applicable."""

    message: MessageResponse
    flag: Optional[MessageFlagResponse]


class ThreadCreate(BaseModel):
    """Create a new message thread."""

    case_id: str
    subject: str
    participants: List[str]  # List of user IDs


class ThreadResponse(BaseModel):
    """Message thread response."""

    id: str
    case_id: str
    subject: str
    participants: List[str]
    last_message_at: Optional[datetime]
    is_archived: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ThreadWithMessagesResponse(BaseModel):
    """Thread with recent messages."""

    thread: ThreadResponse
    messages: List[MessageResponse]
    message_count: int


class AnalyticsResponse(BaseModel):
    """Good faith communication metrics."""

    user_id: str
    case_id: str
    total_messages: int
    flagged_messages: int
    flag_rate: float
    suggestions_accepted: int
    suggestions_modified: int
    suggestions_rejected: int
    acceptance_rate: float
    average_toxicity: float
    trend: str  # improving, stable, worsening
    period_start: datetime
    period_end: datetime


class ConversationStatsResponse(BaseModel):
    """Overall conversation statistics."""

    case_id: str
    total_messages: int
    total_flagged: int
    parent_a_stats: Dict[str, Any]
    parent_b_stats: Dict[str, Any]
    overall_toxicity: float
    trend: str
    last_activity: datetime


class TrendDataPoint(BaseModel):
    """Single data point for trend analysis."""

    date: str
    message_count: int
    flagged_count: int
    average_toxicity: float
    accepted: int
    rejected: int


class TrendResponse(BaseModel):
    """Trend data over time."""

    case_id: str
    data_points: List[TrendDataPoint]
    overall_trend: str
