"""
CustodyExchange model for dedicated pickup/dropoff scheduling.

This is a first-class entity separate from regular events,
designed specifically for custody exchanges with recurrence support.
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class CustodyExchange(Base):
    """
    Represents a scheduled custody exchange (pickup/dropoff).

    Can be one-time or recurring with flexible patterns.
    """
    __tablename__ = "custody_exchanges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    created_by: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False
    )

    # Exchange type
    exchange_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )  # "pickup", "dropoff", "both"

    # Title for display (auto-generated if not provided)
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Who is involved
    from_parent_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=True
    )
    to_parent_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=True
    )

    # Children involved (array of child IDs)
    child_ids: Mapped[List[str]] = mapped_column(JSON, default=list)

    # Location details
    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    location_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timing - for one-time or the "anchor" time for recurring
    scheduled_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)

    # Recurrence settings
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_pattern: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )  # "weekly", "biweekly", "monthly", "custom"
    recurrence_days: Mapped[Optional[List[int]]] = mapped_column(
        JSON,
        nullable=True
    )  # [0=Sun, 1=Mon, ..., 6=Sat]
    recurrence_end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    recurrence_exceptions: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        nullable=True
    )  # Dates to skip (ISO format strings)

    # Exchange details
    items_to_bring: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    special_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(20),
        default="active"
    )  # "active", "paused", "cancelled"

    # Visibility (always shared for exchanges, but can have notes visibility)
    notes_visible_to_coparent: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    case = relationship("Case", back_populates="custody_exchanges")
    creator = relationship("User", foreign_keys=[created_by])
    from_parent = relationship("User", foreign_keys=[from_parent_id])
    to_parent = relationship("User", foreign_keys=[to_parent_id])

    # Instances of this exchange (for tracking completed/missed)
    instances = relationship(
        "CustodyExchangeInstance",
        back_populates="exchange",
        cascade="all, delete-orphan"
    )


class CustodyExchangeInstance(Base):
    """
    Represents a specific occurrence of a custody exchange.

    For recurring exchanges, each occurrence gets an instance.
    For one-time exchanges, there's just one instance.
    """
    __tablename__ = "custody_exchange_instances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    exchange_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("custody_exchanges.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Scheduled time for this specific instance
    scheduled_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Status of this instance
    status: Mapped[str] = mapped_column(
        String(20),
        default="scheduled"
    )  # "scheduled", "completed", "missed", "cancelled", "rescheduled"

    # Check-in tracking
    from_parent_checked_in: Mapped[bool] = mapped_column(Boolean, default=False)
    from_parent_check_in_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    to_parent_checked_in: Mapped[bool] = mapped_column(Boolean, default=False)
    to_parent_check_in_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )

    # Actual completion time
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Notes for this specific instance
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Override details for this instance (if different from parent)
    override_location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    override_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    exchange = relationship("CustodyExchange", back_populates="instances")
