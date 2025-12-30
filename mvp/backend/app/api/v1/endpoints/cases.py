"""
Case management endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, Body, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.case import CaseCreate, CaseResponse, CaseUpdate
from app.services.case import CaseService

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_case(
    case_data: CaseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new co-parenting case.

    Initiates a case with the current user as the first participant and
    sends an invitation to the other parent via email.

    Returns:
        Case details and invitation token
    """
    case_service = CaseService(db)
    case, invitation_token = await case_service.create_case(case_data, current_user)

    return {
        "id": case.id,
        "case_name": case.case_name,
        "case_number": case.case_number,
        "state": case.state,
        "status": case.status,
        "created_at": case.created_at,
        "invitation_token": invitation_token,
        "message": "Case created successfully. Invitation sent to other parent."
    }


@router.post("/{case_id}/accept")
async def accept_invitation(
    case_id: str,
    invitation_token: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept a case invitation.

    Joins the user to the case as the second parent.

    Args:
        case_id: ID of the case
        invitation_token: Invitation token received via email

    Returns:
        Updated case details
    """
    case_service = CaseService(db)
    case = await case_service.accept_invitation(case_id, current_user, invitation_token)

    return {
        "id": case.id,
        "case_name": case.case_name,
        "status": case.status,
        "message": "Successfully joined the case!"
    }


@router.get("/", response_model=List[CaseResponse])
async def list_cases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all cases for the current user.

    Returns all cases where the user is an active participant.

    Returns:
        List of cases
    """
    case_service = CaseService(db)
    cases = await case_service.get_user_cases(current_user)

    return [
        {
            "id": case.id,
            "case_name": case.case_name,
            "case_number": case.case_number,
            "state": case.state,
            "status": case.status,
            "created_at": case.created_at,
            "participants": [
                {
                    "id": p.id,
                    "role": p.role,
                    "parent_type": p.parent_type,
                    "user_id": p.user_id
                }
                for p in case.participants
            ]
        }
        for case in cases
    ]


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed case information.

    Returns case details including participants and children.

    Args:
        case_id: ID of the case

    Returns:
        Case details
    """
    case_service = CaseService(db)
    case = await case_service.get_case(case_id, current_user)

    return {
        "id": case.id,
        "case_name": case.case_name,
        "case_number": case.case_number,
        "state": case.state,
        "status": case.status,
        "created_at": case.created_at,
        "participants": [
            {
                "id": p.id,
                "role": p.role,
                "parent_type": p.parent_type,
                "user_id": p.user_id,
                "is_active": p.is_active
            }
            for p in case.participants
        ]
    }


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    update: CaseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update case details.

    Allows updating basic case information like name, county, and court.

    Args:
        case_id: ID of the case
        update: Fields to update

    Returns:
        Updated case details
    """
    case_service = CaseService(db)
    case = await case_service.update_case(case_id, update, current_user)

    return {
        "id": case.id,
        "case_name": case.case_name,
        "case_number": case.case_number,
        "state": case.state,
        "status": case.status,
        "created_at": case.created_at,
        "participants": [
            {
                "id": p.id,
                "role": p.role,
                "parent_type": p.parent_type,
                "user_id": p.user_id
            }
            for p in case.participants
        ]
    }


@router.post("/{case_id}/children")
async def add_child(
    case_id: str,
    child_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a child to a case.

    Args:
        case_id: ID of the case
        child_data: Child information

    Returns:
        Created child details
    """
    case_service = CaseService(db)
    child = await case_service.add_child(case_id, child_data, current_user)

    return {
        "id": child.id,
        "first_name": child.first_name,
        "last_name": child.last_name,
        "date_of_birth": child.date_of_birth,
        "case_id": child.case_id,
        "message": "Child added successfully"
    }


@router.put("/children/{child_id}")
async def update_child(
    child_id: str,
    child_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update child information.

    Args:
        child_id: ID of the child
        child_data: Updated child information

    Returns:
        Updated child details
    """
    case_service = CaseService(db)
    child = await case_service.update_child(child_id, child_data, current_user)

    return {
        "id": child.id,
        "first_name": child.first_name,
        "last_name": child.last_name,
        "date_of_birth": child.date_of_birth,
        "message": "Child updated successfully"
    }


@router.delete("/children/{child_id}")
async def delete_child(
    child_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a child from a case.

    Args:
        child_id: ID of the child

    Returns:
        Success message
    """
    case_service = CaseService(db)
    await case_service.delete_child(child_id, current_user)

    return {"message": "Child deleted successfully"}


# Agreement endpoints for cases
@router.post("/{case_id}/agreement", status_code=status.HTTP_201_CREATED)
async def create_case_agreement(
    case_id: str,
    title: str = Body("Parenting Agreement", embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new agreement for a case.

    Initializes agreement with 18 section templates.

    Args:
        case_id: ID of the case
        title: Agreement title

    Returns:
        Created agreement with sections
    """
    from app.services.agreement import AgreementService

    agreement_service = AgreementService(db)
    agreement = await agreement_service.create_agreement(case_id, current_user, title)

    # Get sections for response
    await db.refresh(agreement, ["sections"])

    return {
        "id": agreement.id,
        "case_id": agreement.case_id,
        "title": agreement.title,
        "version": agreement.version,
        "status": agreement.status,
        "sections_count": len(agreement.sections),
        "message": "Agreement created with 18 section templates"
    }


@router.get("/{case_id}/agreement")
async def get_case_agreement(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get active agreement for a case.

    Returns:
        Agreement with all sections
    """
    from app.services.agreement import AgreementService
    from app.schemas.agreement import AgreementResponse, AgreementSectionResponse
    from fastapi import Response

    agreement_service = AgreementService(db)
    agreement = await agreement_service.get_case_agreement(case_id, current_user)

    if not agreement:
        return Response(status_code=status.HTTP_404_NOT_FOUND)

    # Calculate completion percentage
    completion = await agreement_service.get_completion_percentage(agreement)

    return {
        "agreement": AgreementResponse(
            id=agreement.id,
            case_id=agreement.case_id,
            title=agreement.title,
            version=agreement.version,
            status=agreement.status,
            petitioner_approved=agreement.petitioner_approved,
            respondent_approved=agreement.respondent_approved,
            effective_date=agreement.effective_date,
            pdf_url=agreement.pdf_url,
            created_at=agreement.created_at,
            updated_at=agreement.updated_at
        ),
        "sections": [
            AgreementSectionResponse(
                id=s.id,
                agreement_id=s.agreement_id,
                section_number=s.section_number,
                section_title=s.section_title,
                section_type=s.section_type,
                content=s.content,
                structured_data=s.structured_data,
                display_order=s.display_order,
                is_required=s.is_required,
                is_completed=s.is_completed
            )
            for s in sorted(agreement.sections, key=lambda x: x.display_order)
        ],
        "completion_percentage": completion
    }
