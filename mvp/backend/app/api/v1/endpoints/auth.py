"""
Authentication endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserResponse

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.

    Creates a user account in Supabase Auth and syncs to local database.
    """
    # TODO: Implement Supabase user creation
    # TODO: Create User and UserProfile records
    # TODO: Send verification email
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Registration endpoint not yet implemented"
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login user and return access token.

    Authenticates with Supabase and returns JWT tokens.
    """
    # TODO: Implement Supabase authentication
    # TODO: Update last_login timestamp
    # TODO: Return access and refresh tokens
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Login endpoint not yet implemented"
    )


@router.post("/logout")
async def logout():
    """
    Logout user.

    Invalidates refresh token.
    """
    # TODO: Implement token invalidation
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token():
    """
    Refresh access token using refresh token.
    """
    # TODO: Implement token refresh
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token refresh not yet implemented"
    )
