"""
Agreement endpoints for custody agreement management.
"""

from typing import List
from fastapi import APIRouter, Depends, Body, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.agreement import (
    AgreementCreate,
    AgreementResponse,
    AgreementSectionResponse,
    AgreementSectionUpdate,
    AgreementWithSections,
    ApprovalRequest
)
from app.services.agreement import AgreementService

router = APIRouter()

# Note: Case-specific agreement endpoints (create, get by case_id) are in cases.py router


@router.get("/{agreement_id}", response_model=AgreementWithSections)
async def get_agreement(
    agreement_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific agreement by ID.

    Args:
        agreement_id: ID of the agreement

    Returns:
        Agreement with all sections
    """
    agreement_service = AgreementService(db)
    agreement = await agreement_service.get_agreement(agreement_id, current_user)

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


@router.put("/sections/{section_id}", response_model=AgreementSectionResponse)
async def update_section(
    section_id: str,
    update_data: AgreementSectionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an agreement section.

    Args:
        section_id: ID of the section
        update_data: Section update data

    Returns:
        Updated section
    """
    agreement_service = AgreementService(db)
    section = await agreement_service.update_section(section_id, update_data, current_user)

    return AgreementSectionResponse(
        id=section.id,
        agreement_id=section.agreement_id,
        section_number=section.section_number,
        section_title=section.section_title,
        section_type=section.section_type,
        content=section.content,
        structured_data=section.structured_data,
        display_order=section.display_order,
        is_required=section.is_required,
        is_completed=section.is_completed
    )


@router.post("/{agreement_id}/submit")
async def submit_for_approval(
    agreement_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit agreement for dual approval.

    Compiles rules and generates PDF.

    Args:
        agreement_id: ID of the agreement

    Returns:
        Updated agreement status
    """
    agreement_service = AgreementService(db)
    agreement = await agreement_service.submit_for_approval(agreement_id, current_user)

    return {
        "id": agreement.id,
        "status": agreement.status,
        "pdf_url": agreement.pdf_url,
        "message": "Agreement submitted for approval. Both parents must approve."
    }


@router.post("/{agreement_id}/approve")
async def approve_agreement(
    agreement_id: str,
    approval_data: ApprovalRequest = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve an agreement.

    Requires both parents to approve before becoming active.

    Args:
        agreement_id: ID of the agreement
        approval_data: Optional approval notes

    Returns:
        Updated agreement status
    """
    agreement_service = AgreementService(db)
    agreement = await agreement_service.approve_agreement(
        agreement_id,
        current_user,
        approval_data.notes
    )

    return {
        "id": agreement.id,
        "status": agreement.status,
        "petitioner_approved": agreement.petitioner_approved,
        "respondent_approved": agreement.respondent_approved,
        "effective_date": agreement.effective_date,
        "message": "Agreement approved!" if agreement.status == "active" else "Approval recorded. Waiting for other parent."
    }


@router.get("/{agreement_id}/pdf")
async def download_agreement_pdf(
    agreement_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Download agreement as PDF.

    Args:
        agreement_id: ID of the agreement

    Returns:
        PDF file
    """
    agreement_service = AgreementService(db)
    agreement = await agreement_service.get_agreement(agreement_id, current_user)

    # Generate PDF
    pdf_bytes = await agreement_service.generate_pdf(agreement)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="agreement_{agreement_id}.pdf"'
        }
    )
