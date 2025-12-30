"""
Messaging endpoints with ARIA integration.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter()


@router.post("/{case_id}/messages")
async def send_message(
    case_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message (with ARIA analysis).

    Flow:
    1. Analyze message with ARIA
    2. Return intervention if needed
    3. User accepts/modifies/rejects
    4. Store final message
    """
    # TODO: Implement ARIA sentiment analysis
    # TODO: Create message record
    # TODO: Create flag record if applicable
    # TODO: Trigger real-time notification
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Send message not yet implemented"
    )


@router.get("/{case_id}/messages", response_model=List)
async def list_messages(
    case_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    List messages for a case.
    """
    # TODO: Validate access
    # TODO: Query messages
    # TODO: Mark as read
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="List messages not yet implemented"
    )
