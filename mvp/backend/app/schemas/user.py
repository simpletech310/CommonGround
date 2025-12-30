"""User schemas."""

from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserProfileResponse(BaseModel):
    """User profile response."""

    id: str
    user_id: str
    first_name: str
    last_name: str
    preferred_name: str | None
    email: str
    phone: str | None
    avatar_url: str | None
    timezone: str
    subscription_tier: str
    subscription_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """User profile update request."""

    first_name: str | None = None
    last_name: str | None = None
    preferred_name: str | None = None
    phone: str | None = None
    timezone: str | None = None
    address_line1: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
