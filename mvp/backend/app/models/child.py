"""
Child model - represents children in custody agreements.
"""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Child(Base, UUIDMixin, TimestampMixin):
    """
    Child entity - the focus of the co-parenting arrangement.
    """

    __tablename__ = "children"

    # Case link
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id"), index=True)

    # Basic information
    first_name: Mapped[str] = mapped_column(String(100))
    middle_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100))
    preferred_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Birth information
    date_of_birth: Mapped[date] = mapped_column(Date)
    birth_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    birth_state: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)

    # Gender/pronouns
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    pronouns: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Photo
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Special needs (encrypted in production)
    has_special_needs: Mapped[bool] = mapped_column(Boolean, default=False)
    special_needs_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Medical information
    allergies: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    medications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    medical_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Healthcare providers
    pediatrician_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    pediatrician_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    insurance_provider: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    insurance_policy_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Education
    school_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    grade_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    teacher_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    has_iep: Mapped[bool] = mapped_column(Boolean, default=False)
    has_504: Mapped[bool] = mapped_column(Boolean, default=False)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="children")

    def __repr__(self) -> str:
        return f"<Child {self.first_name} {self.last_name}>"

    @property
    def full_name(self) -> str:
        """Get child's full name."""
        parts = [self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        parts.append(self.last_name)
        return " ".join(parts)

    @property
    def display_name(self) -> str:
        """Get display name (preferred or first name)."""
        return self.preferred_name or self.first_name

    @property
    def age(self) -> int:
        """Calculate current age."""
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
