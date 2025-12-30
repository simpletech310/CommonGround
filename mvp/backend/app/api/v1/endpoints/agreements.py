"""
Agreement endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter()


@router.get("/{case_id}/agreement")
async def get_case_agreement(
    case_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get active agreement for a case.
    """
    # TODO: Validate access
    # TODO: Return active agreement
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Get agreement not yet implemented"
    )


@router.post("/{case_id}/agreement")
async def create_agreement(
    case_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Create/update agreement for a case.
    """
    # TODO: Create agreement from interview data
    # TODO: Generate PDF
    # TODO: Compile rules
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Create agreement not yet implemented"
    )
