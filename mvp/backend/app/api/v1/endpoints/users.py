"""
User management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.user import UserProfileResponse, UserProfileUpdate

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user(
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's profile.
    """
    # TODO: Get user from auth token
    # TODO: Load user profile
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Get current user not yet implemented"
    )


@router.put("/me", response_model=UserProfileResponse)
async def update_current_user(
    update: UserProfileUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile.
    """
    # TODO: Get user from auth token
    # TODO: Update user profile
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Update user profile not yet implemented"
    )
