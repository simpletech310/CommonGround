"""Case schemas."""

from datetime import datetime
from pydantic import BaseModel


class CaseCreate(BaseModel):
    """Create case request."""

    case_name: str
    other_parent_email: str
    state: str
    county: str | None = None
    children: list[dict]  # List of child data


class CaseResponse(BaseModel):
    """Case response."""

    id: str
    case_name: str
    case_number: str | None
    state: str
    status: str
    created_at: datetime
    participants: list[dict]

    class Config:
        from_attributes = True


class CaseUpdate(BaseModel):
    """Update case request."""

    case_name: str | None = None
    county: str | None = None
    court: str | None = None
