"""
KidComs models for child communication sessions.

KidComs enables children to have video calls, chat, watch movies together,
play games, and use collaborative whiteboards with their approved circle.
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Integer, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.circle import ApprovalMode


class SessionType(str, Enum):
    """Types of KidComs sessions."""
    VIDEO_CALL = "video_call"
    THEATER = "theater"
    ARCADE = "arcade"
    WHITEBOARD = "whiteboard"
    MIXED = "mixed"  # Multiple features active


class SessionStatus(str, Enum):
    """Status of a KidComs session."""
    SCHEDULED = "scheduled"
    WAITING = "waiting"  # Room created, waiting for participants
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ParticipantType(str, Enum):
    """Types of participants in a session."""
    CHILD = "child"
    PARENT = "parent"
    CIRCLE_CONTACT = "circle_contact"


class KidComsSettings(Base, UUIDMixin, TimestampMixin):
    """
    KidComsSettings - Per-family configuration for KidComs features.

    Controls approval modes, availability schedules, feature access,
    and session limits for children's communication.
    """

    __tablename__ = "kidcoms_settings"

    # Foreign key
    family_file_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("family_files.id", ondelete="CASCADE"), unique=True, index=True
    )

    # Circle approval settings
    circle_approval_mode: Mapped[str] = mapped_column(
        String(20), default=ApprovalMode.BOTH_PARENTS.value
    )

    # Availability schedule (JSON)
    # Format: {"monday": {"start": "09:00", "end": "20:00"}, ...}
    availability_schedule: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    enforce_availability: Mapped[bool] = mapped_column(Boolean, default=True)

    # Notifications
    require_parent_notification: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_on_session_start: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_on_session_end: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_on_aria_flag: Mapped[bool] = mapped_column(Boolean, default=True)

    # Feature toggles (JSON)
    # Format: {"video": true, "chat": true, "theater": true, "arcade": true, "whiteboard": true}
    allowed_features: Mapped[dict] = mapped_column(
        JSON, default=lambda: {
            "video": True,
            "chat": True,
            "theater": True,
            "arcade": True,
            "whiteboard": True
        }
    )

    # Session limits
    max_session_duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    max_daily_sessions: Mapped[int] = mapped_column(Integer, default=5)
    max_participants_per_session: Mapped[int] = mapped_column(Integer, default=4)

    # Parental controls
    require_parent_in_call: Mapped[bool] = mapped_column(Boolean, default=False)
    allow_child_to_initiate: Mapped[bool] = mapped_column(Boolean, default=True)
    record_sessions: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    family_file = relationship("FamilyFile", back_populates="kidcoms_settings")

    def __repr__(self) -> str:
        return f"<KidComsSettings for family {self.family_file_id}>"

    def is_feature_allowed(self, feature: str) -> bool:
        """Check if a specific feature is allowed."""
        return self.allowed_features.get(feature, False)

    def is_within_availability(self, check_time: Optional[datetime] = None) -> bool:
        """
        Check if the current time is within availability schedule.

        Args:
            check_time: Time to check (defaults to now)

        Returns:
            True if within schedule or schedule not enforced
        """
        if not self.enforce_availability or not self.availability_schedule:
            return True

        check_time = check_time or datetime.utcnow()
        day_name = check_time.strftime("%A").lower()
        current_time = check_time.strftime("%H:%M")

        day_schedule = self.availability_schedule.get(day_name)
        if not day_schedule:
            return False

        start = day_schedule.get("start", "00:00")
        end = day_schedule.get("end", "23:59")

        return start <= current_time <= end


class KidComsSession(Base, UUIDMixin, TimestampMixin):
    """
    KidComsSession - A video/communication session in KidComs.

    Tracks session metadata, participants, Daily.co room info,
    and session history for parental visibility.
    """

    __tablename__ = "kidcoms_sessions"

    # Foreign keys
    family_file_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("family_files.id", ondelete="CASCADE"), index=True
    )
    child_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("children.id", ondelete="CASCADE"), index=True
    )

    # Session info
    session_type: Mapped[str] = mapped_column(String(20), default=SessionType.VIDEO_CALL.value)
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=SessionStatus.WAITING.value, index=True)

    # Daily.co room info
    daily_room_name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    daily_room_url: Mapped[str] = mapped_column(String(500))
    daily_room_token: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Owner token

    # Initiation
    initiated_by_id: Mapped[str] = mapped_column(String(36))  # User or contact ID
    initiated_by_type: Mapped[str] = mapped_column(String(20))  # child, parent, circle_contact

    # Participants (JSON array)
    # Format: [{"id": "uuid", "type": "child|parent|circle_contact", "name": "...", "joined_at": "..."}]
    participants: Mapped[List[dict]] = mapped_column(JSON, default=list)

    # Timing
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Features used during session (JSON)
    features_used: Mapped[List[str]] = mapped_column(JSON, default=list)

    # ARIA stats
    total_messages: Mapped[int] = mapped_column(Integer, default=0)
    flagged_messages: Mapped[int] = mapped_column(Integer, default=0)

    # Notes (for parent review)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    family_file = relationship("FamilyFile", back_populates="kidcoms_sessions")
    child = relationship("Child", back_populates="kidcoms_sessions")
    messages = relationship("KidComsMessage", back_populates="session", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_kidcoms_sessions_family_status", "family_file_id", "status"),
        Index("ix_kidcoms_sessions_child_date", "child_id", "started_at"),
    )

    def __repr__(self) -> str:
        return f"<KidComsSession {self.id} ({self.session_type}) - {self.status}>"

    def start(self) -> None:
        """Mark session as started."""
        self.status = SessionStatus.ACTIVE.value
        self.started_at = datetime.utcnow()

    def end(self) -> None:
        """Mark session as ended and calculate duration."""
        self.status = SessionStatus.COMPLETED.value
        self.ended_at = datetime.utcnow()
        if self.started_at:
            self.duration_seconds = int((self.ended_at - self.started_at).total_seconds())

    def add_participant(self, participant_id: str, participant_type: str, name: str) -> None:
        """Add a participant to the session."""
        participant = {
            "id": participant_id,
            "type": participant_type,
            "name": name,
            "joined_at": datetime.utcnow().isoformat()
        }
        if self.participants is None:
            self.participants = []
        self.participants.append(participant)

    def add_feature_used(self, feature: str) -> None:
        """Track that a feature was used during the session."""
        if self.features_used is None:
            self.features_used = []
        if feature not in self.features_used:
            self.features_used.append(feature)


class KidComsMessage(Base, UUIDMixin):
    """
    KidComsMessage - Chat messages within a KidComs session.

    All messages are analyzed by ARIA for safety before display.
    Flagged messages are stored for parent review.
    """

    __tablename__ = "kidcoms_messages"

    # Foreign key
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("kidcoms_sessions.id", ondelete="CASCADE"), index=True
    )

    # Sender info
    sender_id: Mapped[str] = mapped_column(String(36), index=True)
    sender_type: Mapped[str] = mapped_column(String(20))  # child, parent, circle_contact
    sender_name: Mapped[str] = mapped_column(String(100))

    # Message content
    content: Mapped[str] = mapped_column(Text)
    original_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # If modified

    # ARIA analysis
    aria_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)
    aria_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    aria_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    aria_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    aria_score: Mapped[Optional[float]] = mapped_column(nullable=True)

    # Status
    is_delivered: Mapped[bool] = mapped_column(Boolean, default=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)  # Hidden due to flag

    # Timestamp
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("KidComsSession", back_populates="messages")

    # Indexes
    __table_args__ = (
        Index("ix_kidcoms_messages_session_time", "session_id", "sent_at"),
        Index("ix_kidcoms_messages_flagged", "session_id", "aria_flagged"),
    )

    def __repr__(self) -> str:
        flag_status = " [FLAGGED]" if self.aria_flagged else ""
        return f"<KidComsMessage from {self.sender_name}{flag_status}>"


class KidComsSessionInvite(Base, UUIDMixin, TimestampMixin):
    """
    KidComsSessionInvite - Invitation to join a KidComs session.

    Used when a child or parent invites a circle contact to join a session.
    """

    __tablename__ = "kidcoms_session_invites"

    # Foreign keys
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("kidcoms_sessions.id", ondelete="CASCADE"), index=True
    )
    circle_contact_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("circle_contacts.id", ondelete="CASCADE"), nullable=True
    )

    # Invite info
    invited_by_id: Mapped[str] = mapped_column(String(36))
    invited_by_type: Mapped[str] = mapped_column(String(20))
    invite_token: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    invite_url: Mapped[str] = mapped_column(String(500))

    # Status
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, accepted, declined, expired
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    session = relationship("KidComsSession")
    circle_contact = relationship("CircleContact")

    def __repr__(self) -> str:
        return f"<KidComsSessionInvite for session {self.session_id} - {self.status}>"

    @property
    def is_expired(self) -> bool:
        """Check if invite has expired."""
        return datetime.utcnow() > self.expires_at

    def accept(self) -> None:
        """Mark invite as accepted."""
        self.status = "accepted"
        self.accepted_at = datetime.utcnow()
