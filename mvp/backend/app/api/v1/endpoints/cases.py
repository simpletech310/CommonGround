"""
Case management endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.case import CaseCreate, CaseResponse, CaseUpdate

router = APIRouter()


@router.post("/", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    case_data: CaseCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new case.

    Initiates a co-parenting case between two parents.
    """
    # TODO: Validate user permissions
    # TODO: Create case
    # TODO: Add participants
    # TODO: Send invitation to other parent
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Create case not yet implemented"
    )


@router.get("/", response_model=List[CaseResponse])
async def list_cases(
    db: AsyncSession = Depends(get_db)
):
    """
    List all cases for current user.
    """
    # TODO: Get current user
    # TODO: Query cases where user is a participant
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="List cases not yet implemented"
    )


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get case details.
    """
    # TODO: Validate user has access to case
    # TODO: Load case with relationships
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Get case not yet implemented"
    )


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    update: CaseUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update case details.
    """
    # TODO: Validate user has permission to update
    # TODO: Update case
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Update case not yet implemented"
    )
