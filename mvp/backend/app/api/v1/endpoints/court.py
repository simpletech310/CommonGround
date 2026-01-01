"""
Court Access Mode API endpoints.

Endpoints for court professional access, settings, events, and reports.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.case import CaseParticipant
from app.models.court import (
    CourtRole,
    AccessScope,
    CourtEventType,
    CourtMessageType,
    ReportType,
)
from app.schemas.court import (
    # Professional
    CourtProfessionalCreate,
    CourtProfessionalUpdate,
    CourtProfessionalResponse,
    CourtProfessionalVerify,
    # Access Grants
    AccessGrantRequest,
    AccessGrantResponse,
    AccessGrantApproval,
    AccessGrantRevoke,
    AccessLinkResponse,
    # Access Logs
    AccessLogEntry,
    AccessLogList,
    # Settings
    CourtSettingsCreate,
    CourtSettingsUpdate,
    CourtSettingsResponse,
    CourtSettingsPublic,
    # Events
    CourtEventCreate,
    CourtEventUpdate,
    CourtEventAttendance,
    CourtEventResponse,
    CourtEventPublic,
    # Messages
    CourtMessageCreate,
    CourtMessageResponse,
    CourtMessagePublic,
    # Reports
    ReportRequest,
    ReportResponse,
    ReportVerification,
    # ARIA
    ARIACourtQuery,
    ARIACourtResponse,
    ARIASuggestionList,
    # Auth
    CourtLoginRequest,
    CourtLoginResponse,
    # Summary
    CaseCourtSummary,
)
from app.services.court import (
    CourtProfessionalService,
    AccessGrantService,
    AccessLogService,
    CourtSettingsService,
    CourtEventService,
    CourtMessageService,
    ReportService,
    ARIACourtService,
)

router = APIRouter()


# =============================================================================
# MVP Court Login (Simulated for Demo)
# =============================================================================

@router.post(
    "/login",
    response_model=CourtLoginResponse,
    summary="Login as court professional (MVP - simulated)",
)
async def court_login(
    data: CourtLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    MVP court login with simulated verification.

    For demo purposes:
    - Code "123456" always works
    - Creates professional if not exists
    - Returns JWT token for court portal access
    """
    from app.core.security import create_access_token
    from datetime import timedelta

    # MVP: Accept code 123456 for demo
    if data.access_code != "123456":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code. Use 123456 for demo.",
        )

    service = CourtProfessionalService(db)
    professional = await service.get_professional_by_email(data.email)

    if not professional:
        # Auto-create for MVP demo
        from app.schemas.court import CourtProfessionalCreate
        create_data = CourtProfessionalCreate(
            email=data.email,
            full_name=data.email.split("@")[0].replace(".", " ").title(),
            organization="San Diego Family Court",
            role=CourtRole.GAL,
        )
        professional = await service.create_professional(create_data)
        # Auto-verify for MVP
        professional = await service.verify_professional(
            str(professional.id),
            verification_method="email",
            credentials={"email_verified": True},
        )

    # Create token
    expires_delta = timedelta(hours=8)
    token_data = {
        "sub": str(professional.id),
        "type": "court",
        "role": professional.role,
    }
    access_token = create_access_token(
        data=token_data,
        expires_delta=expires_delta,
    )

    # Extract bar_number and court_id from credentials JSON
    credentials = professional.credentials or {}

    # For MVP, return empty grants list (would be populated from DB in production)
    return CourtLoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_at=datetime.utcnow() + expires_delta,
        professional=CourtProfessionalResponse(
            id=professional.id,
            email=professional.email,
            full_name=professional.full_name,
            title=professional.title,
            organization=professional.organization,
            role=CourtRole(professional.role),
            bar_number=credentials.get("bar_number"),
            court_id=credentials.get("court_id"),
            is_verified=professional.is_verified,
            is_active=professional.is_active,
            mfa_enabled=professional.mfa_enabled,
            created_at=professional.created_at,
            updated_at=professional.updated_at,
        ),
        active_grants=[],  # MVP: Empty for now
    )


@router.get(
    "/me",
    response_model=CourtProfessionalResponse,
    summary="Get current court professional",
)
async def get_current_professional(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current court professional from token."""
    # For MVP, try to get professional by user's email
    service = CourtProfessionalService(db)
    professional = await service.get_professional_by_email(current_user.email)

    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court professional not found",
        )

    credentials = professional.credentials or {}

    return CourtProfessionalResponse(
        id=professional.id,
        email=professional.email,
        full_name=professional.full_name,
        title=professional.title,
        organization=professional.organization,
        role=CourtRole(professional.role),
        bar_number=credentials.get("bar_number"),
        court_id=credentials.get("court_id"),
        is_verified=professional.is_verified,
        is_active=professional.is_active,
        mfa_enabled=professional.mfa_enabled,
        created_at=professional.created_at,
        updated_at=professional.updated_at,
    )


@router.get(
    "/cases",
    summary="List cases for court professional (MVP)",
)
async def list_professional_cases(
    db: AsyncSession = Depends(get_db),
):
    """
    List all cases for a court professional.

    For MVP, returns all cases in the system.
    In production, would filter by grants.
    """
    from sqlalchemy import select
    from app.models.case import Case

    result = await db.execute(select(Case).where(Case.status == "active"))
    cases = result.scalars().all()

    return [
        {
            "id": str(c.id),
            "case_name": c.case_name,
            "case_number": c.case_number,
            "state": c.state,
            "county": c.county,
            "status": c.status,
        }
        for c in cases
    ]


# =============================================================================
# Parent-Facing Court Endpoints
# =============================================================================

@router.get(
    "/events/parent/{case_id}",
    response_model=list[CourtEventPublic],
    summary="Get court events for parent calendar",
)
async def get_court_events_for_parent(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get court events visible to parents.

    These appear on the parent's calendar and cannot be modified.
    """
    await get_user_case_role(db, current_user.id, case_id)

    service = CourtEventService(db)
    events = await service.get_events_for_case(case_id, include_past=False)

    return [
        CourtEventPublic(
            id=e.id,
            event_type=CourtEventType(e.event_type),
            title=e.title,
            description=e.description,
            event_date=e.event_date,
            start_time=str(e.start_time) if e.start_time else None,
            end_time=str(e.end_time) if e.end_time else None,
            location=e.location,
            virtual_link=e.virtual_link,
            is_mandatory=e.is_mandatory,
            shared_notes=e.shared_notes,
        )
        for e in events
    ]


@router.get(
    "/messages/parent/{case_id}",
    response_model=list[CourtMessagePublic],
    summary="Get court messages for parent",
)
async def get_court_messages_for_parent(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get court messages visible to a parent."""
    user_role = await get_user_case_role(db, current_user.id, case_id)

    service = CourtMessageService(db)
    messages = await service.get_messages_for_case(case_id)

    return [
        CourtMessagePublic(
            id=m.id,
            message_type=CourtMessageType(m.message_type),
            subject=m.subject,
            content=m.content,
            sent_at=m.sent_at,
            is_urgent=m.is_urgent,
            requires_acknowledgment=m.requires_acknowledgment,
            is_read=m.petitioner_read_at is not None if user_role == "petitioner" else m.respondent_read_at is not None,
        )
        for m in messages
    ]


# =============================================================================
# Helper Functions
# =============================================================================

async def get_professional_from_grant(
    db: AsyncSession, grant_id: str, professional_id: str
):
    """Verify a professional has an active grant."""
    grant_service = AccessGrantService(db)
    grant = await grant_service.get_grant(grant_id)
    if not grant or grant.professional_id != professional_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or unauthorized access grant",
        )
    if not grant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access grant is not active or has expired",
        )
    return grant


async def log_court_action(
    db: AsyncSession,
    request: Request,
    grant_id: str,
    professional_id: str,
    case_id: str,
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
):
    """Log a court access action."""
    log_service = AccessLogService(db)
    await log_service.log_action(
        grant_id=grant_id,
        professional_id=professional_id,
        case_id=case_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


async def get_user_case_role(db: AsyncSession, user_id: str, case_id: str) -> str:
    """Get a user's role in a case (petitioner or respondent)."""
    from sqlalchemy import select

    result = await db.execute(
        select(CaseParticipant).where(
            CaseParticipant.user_id == user_id,
            CaseParticipant.case_id == case_id,
        )
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this case",
        )
    return participant.role


# =============================================================================
# Court Professional Endpoints
# =============================================================================

@router.post(
    "/professionals",
    response_model=CourtProfessionalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a court professional",
)
async def create_professional(
    data: CourtProfessionalCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new court professional.

    This creates an unverified professional account.
    Verification is required before accessing cases.
    """
    service = CourtProfessionalService(db)

    # Check if email already exists
    existing = await service.get_professional_by_email(data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    professional = await service.create_professional(data)
    return professional


@router.get(
    "/professionals/{professional_id}",
    response_model=CourtProfessionalResponse,
    summary="Get a court professional",
)
async def get_professional(
    professional_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get details of a court professional."""
    service = CourtProfessionalService(db)
    professional = await service.get_professional(professional_id)
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found",
        )
    return professional


@router.put(
    "/professionals/{professional_id}",
    response_model=CourtProfessionalResponse,
    summary="Update a court professional",
)
async def update_professional(
    professional_id: str,
    data: CourtProfessionalUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a court professional's information."""
    service = CourtProfessionalService(db)
    professional = await service.update_professional(professional_id, data)
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found",
        )
    return professional


@router.post(
    "/professionals/{professional_id}/verify",
    response_model=CourtProfessionalResponse,
    summary="Verify a court professional",
)
async def verify_professional(
    professional_id: str,
    data: CourtProfessionalVerify,
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a court professional as verified.

    In production, this would involve bar verification, court email confirmation, etc.
    For MVP, this is simulated.
    """
    service = CourtProfessionalService(db)
    professional = await service.verify_professional(
        professional_id,
        verification_method=data.verification_method,
        credentials=data.credentials,
    )
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found",
        )
    return professional


@router.post(
    "/professionals/{professional_id}/mfa",
    response_model=CourtProfessionalResponse,
    summary="Enable MFA for a professional (simulated)",
)
async def enable_mfa(
    professional_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Enable MFA for a court professional.

    For MVP, this generates a simulated MFA secret.
    In production, this would use TOTP or SMS.
    """
    import secrets

    service = CourtProfessionalService(db)
    mfa_secret = secrets.token_hex(16)  # Simulated
    professional = await service.enable_mfa(professional_id, mfa_secret)
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found",
        )
    return professional


# =============================================================================
# Access Grant Endpoints
# =============================================================================

@router.post(
    "/access/request",
    response_model=AccessGrantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request access to a case",
)
async def request_access(
    data: AccessGrantRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Request court access to a case (initiated by a parent).

    The parent specifies:
    - Who gets access (professional must be registered)
    - What they can see (access scope)
    - How long (duration)
    - Authorization type (consent, court order, etc.)

    For roles requiring joint consent (GAL, Mediator),
    both parents must approve before access is activated.
    """
    # Verify user is a case participant
    await get_user_case_role(db, current_user.id, data.case_id)

    # For MVP, create a professional if email doesn't exist
    prof_service = CourtProfessionalService(db)
    professional = await prof_service.get_professional_by_email(
        data.authorization_reference or f"temp-{data.case_id}@court.local"
    )

    if not professional:
        # In production, require professional to be pre-registered
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Professional must be registered first. Use POST /court/professionals",
        )

    grant_service = AccessGrantService(db)
    grant = await grant_service.create_grant(data, professional.id)
    return grant


@router.get(
    "/access/grants",
    response_model=list[AccessGrantResponse],
    summary="List access grants for a case",
)
async def list_grants(
    case_id: str,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all access grants for a case (for parents to manage)."""
    await get_user_case_role(db, current_user.id, case_id)

    grant_service = AccessGrantService(db)
    grants = await grant_service.get_grants_for_case(case_id, active_only)
    return grants


@router.get(
    "/access/grants/{grant_id}",
    response_model=AccessGrantResponse,
    summary="Get an access grant",
)
async def get_grant(
    grant_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get details of an access grant."""
    grant_service = AccessGrantService(db)
    grant = await grant_service.get_grant(grant_id)
    if not grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grant not found",
        )

    # Verify user is a participant
    await get_user_case_role(db, current_user.id, grant.case_id)
    return grant


@router.post(
    "/access/grants/{grant_id}/approve",
    response_model=AccessGrantResponse,
    summary="Approve an access grant",
)
async def approve_grant(
    grant_id: str,
    data: AccessGrantApproval,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approve or reject an access grant.

    For GAL and Mediator roles, both parents must approve.
    For Attorney roles, only the represented parent approves.
    """
    grant_service = AccessGrantService(db)
    grant = await grant_service.get_grant(grant_id)
    if not grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grant not found",
        )

    user_role = await get_user_case_role(db, current_user.id, grant.case_id)

    updated_grant = await grant_service.approve_grant(
        grant_id, user_role, data.approved, data.notes
    )
    return updated_grant


@router.post(
    "/access/grants/{grant_id}/revoke",
    response_model=AccessGrantResponse,
    summary="Revoke an access grant",
)
async def revoke_grant(
    grant_id: str,
    data: AccessGrantRevoke,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke an access grant."""
    grant_service = AccessGrantService(db)
    grant = await grant_service.get_grant(grant_id)
    if not grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grant not found",
        )

    await get_user_case_role(db, current_user.id, grant.case_id)

    updated_grant = await grant_service.revoke_grant(
        grant_id, current_user.id, data.reason
    )
    return updated_grant


@router.get(
    "/access/grants/{grant_id}/audit",
    response_model=AccessLogList,
    summary="Get access audit log",
)
async def get_audit_log(
    grant_id: str,
    page: int = 1,
    per_page: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the audit log for an access grant."""
    grant_service = AccessGrantService(db)
    grant = await grant_service.get_grant(grant_id)
    if not grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grant not found",
        )

    await get_user_case_role(db, current_user.id, grant.case_id)

    log_service = AccessLogService(db)
    logs, total = await log_service.get_logs_for_grant(
        grant_id, limit=per_page, offset=(page - 1) * per_page
    )

    return AccessLogList(logs=logs, total=total, page=page, per_page=per_page)


# =============================================================================
# Court Settings Endpoints
# =============================================================================

@router.get(
    "/settings/case/{case_id}",
    response_model=CourtSettingsResponse,
    summary="Get court settings for a case",
)
async def get_court_settings(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get court-controlled settings for a case."""
    service = CourtSettingsService(db)
    settings = await service.get_or_create_settings(case_id)

    # Add computed field
    response = CourtSettingsResponse(
        id=settings.id,
        case_id=settings.case_id,
        gps_checkins_required=settings.gps_checkins_required,
        supervised_exchange_required=settings.supervised_exchange_required,
        aria_enforcement_locked=settings.aria_enforcement_locked,
        in_app_communication_only=settings.in_app_communication_only,
        agreement_edits_locked=settings.agreement_edits_locked,
        investigation_mode=settings.investigation_mode,
        child_safety_tracking=settings.child_safety_tracking,
        financial_verification_required=settings.financial_verification_required,
        set_by_professional_id=settings.set_by_professional_id,
        set_at=settings.set_at,
        court_order_reference=settings.court_order_reference,
        notes=settings.notes,
        active_controls=settings.get_active_controls(),
        settings_history=settings.settings_history,
        created_at=settings.created_at,
        updated_at=settings.updated_at,
    )
    return response


@router.put(
    "/settings/case/{case_id}",
    response_model=CourtSettingsResponse,
    summary="Update court settings (court staff only)",
)
async def update_court_settings(
    case_id: str,
    data: CourtSettingsUpdate,
    request: Request,
    professional_id: str,  # In production, from court auth token
    grant_id: str,  # In production, from court auth token
    db: AsyncSession = Depends(get_db),
):
    """
    Update court-controlled settings for a case.

    Only court clerks with active grants can update settings.
    All changes are logged immutably.
    """
    # Verify professional has clerk role and active grant
    grant = await get_professional_from_grant(db, grant_id, professional_id)

    if grant.role != CourtRole.COURT_CLERK.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only court clerks can modify settings",
        )

    service = CourtSettingsService(db)
    settings = await service.update_settings(case_id, data, professional_id)

    if not settings:
        # Create if doesn't exist
        create_data = CourtSettingsCreate(
            case_id=case_id,
            **data.model_dump(exclude_unset=True),
        )
        settings = await service.create_settings(create_data, professional_id)

    # Log the action
    await log_court_action(
        db, request, grant_id, professional_id, case_id,
        action="update_settings",
        resource_type="court_case_settings",
        details=data.model_dump(exclude_unset=True),
    )

    response = CourtSettingsResponse(
        id=settings.id,
        case_id=settings.case_id,
        gps_checkins_required=settings.gps_checkins_required,
        supervised_exchange_required=settings.supervised_exchange_required,
        aria_enforcement_locked=settings.aria_enforcement_locked,
        in_app_communication_only=settings.in_app_communication_only,
        agreement_edits_locked=settings.agreement_edits_locked,
        investigation_mode=settings.investigation_mode,
        child_safety_tracking=settings.child_safety_tracking,
        financial_verification_required=settings.financial_verification_required,
        set_by_professional_id=settings.set_by_professional_id,
        set_at=settings.set_at,
        court_order_reference=settings.court_order_reference,
        notes=settings.notes,
        active_controls=settings.get_active_controls(),
        settings_history=settings.settings_history,
        created_at=settings.created_at,
        updated_at=settings.updated_at,
    )
    return response


@router.get(
    "/settings/case/{case_id}/public",
    response_model=CourtSettingsPublic,
    summary="Get public court settings (for parents)",
)
async def get_public_settings(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get court settings visible to parents.

    Parents can see what's controlled but not internal notes.
    """
    await get_user_case_role(db, current_user.id, case_id)

    service = CourtSettingsService(db)
    settings = await service.get_or_create_settings(case_id)

    return CourtSettingsPublic(
        gps_checkins_required=settings.gps_checkins_required,
        supervised_exchange_required=settings.supervised_exchange_required,
        aria_enforcement_locked=settings.aria_enforcement_locked,
        in_app_communication_only=settings.in_app_communication_only,
        agreement_edits_locked=settings.agreement_edits_locked,
        active_controls=settings.get_active_controls(),
    )


# =============================================================================
# Court Event Endpoints
# =============================================================================

@router.post(
    "/events",
    response_model=CourtEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a court event",
)
async def create_court_event(
    data: CourtEventCreate,
    request: Request,
    professional_id: str,
    grant_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a court event (hearing, mediation, deadline, etc.).

    Court events appear on both parents' calendars and cannot be modified by them.
    """
    grant = await get_professional_from_grant(db, grant_id, professional_id)

    service = CourtEventService(db)
    event = await service.create_event(data, professional_id)

    await log_court_action(
        db, request, grant_id, professional_id, data.case_id,
        action="create_event",
        resource_type="court_event",
        resource_id=event.id,
        details={"title": data.title, "date": str(data.event_date)},
    )

    return CourtEventResponse(
        id=event.id,
        case_id=event.case_id,
        created_by=event.created_by,
        event_type=CourtEventType(event.event_type),
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        start_time=str(event.start_time) if event.start_time else None,
        end_time=str(event.end_time) if event.end_time else None,
        location=event.location,
        virtual_link=event.virtual_link,
        petitioner_required=event.petitioner_required,
        respondent_required=event.respondent_required,
        is_mandatory=event.is_mandatory,
        status=event.status,
        internal_notes=event.internal_notes,
        shared_notes=event.shared_notes,
        petitioner_attended=event.petitioner_attended,
        respondent_attended=event.respondent_attended,
        attendance_summary=event.attendance_summary,
        is_past=event.is_past,
        reminder_sent=event.reminder_sent,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.get(
    "/events/case/{case_id}",
    response_model=list[CourtEventResponse],
    summary="List court events for a case",
)
async def list_court_events(
    case_id: str,
    include_past: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """List court events for a case."""
    service = CourtEventService(db)
    events = await service.get_events_for_case(case_id, include_past)

    return [
        CourtEventResponse(
            id=e.id,
            case_id=e.case_id,
            created_by=e.created_by,
            event_type=CourtEventType(e.event_type),
            title=e.title,
            description=e.description,
            event_date=e.event_date,
            start_time=str(e.start_time) if e.start_time else None,
            end_time=str(e.end_time) if e.end_time else None,
            location=e.location,
            virtual_link=e.virtual_link,
            petitioner_required=e.petitioner_required,
            respondent_required=e.respondent_required,
            is_mandatory=e.is_mandatory,
            status=e.status,
            internal_notes=e.internal_notes,
            shared_notes=e.shared_notes,
            petitioner_attended=e.petitioner_attended,
            respondent_attended=e.respondent_attended,
            attendance_summary=e.attendance_summary,
            is_past=e.is_past,
            reminder_sent=e.reminder_sent,
            created_at=e.created_at,
            updated_at=e.updated_at,
        )
        for e in events
    ]


@router.put(
    "/events/{event_id}",
    response_model=CourtEventResponse,
    summary="Update a court event",
)
async def update_court_event(
    event_id: str,
    data: CourtEventUpdate,
    request: Request,
    professional_id: str,
    grant_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Update a court event."""
    service = CourtEventService(db)
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    await get_professional_from_grant(db, grant_id, professional_id)

    updated = await service.update_event(event_id, data)

    await log_court_action(
        db, request, grant_id, professional_id, event.case_id,
        action="update_event",
        resource_type="court_event",
        resource_id=event_id,
    )

    return CourtEventResponse(
        id=updated.id,
        case_id=updated.case_id,
        created_by=updated.created_by,
        event_type=CourtEventType(updated.event_type),
        title=updated.title,
        description=updated.description,
        event_date=updated.event_date,
        start_time=str(updated.start_time) if updated.start_time else None,
        end_time=str(updated.end_time) if updated.end_time else None,
        location=updated.location,
        virtual_link=updated.virtual_link,
        petitioner_required=updated.petitioner_required,
        respondent_required=updated.respondent_required,
        is_mandatory=updated.is_mandatory,
        status=updated.status,
        internal_notes=updated.internal_notes,
        shared_notes=updated.shared_notes,
        petitioner_attended=updated.petitioner_attended,
        respondent_attended=updated.respondent_attended,
        attendance_summary=updated.attendance_summary,
        is_past=updated.is_past,
        reminder_sent=updated.reminder_sent,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )


@router.post(
    "/events/{event_id}/attendance",
    response_model=CourtEventResponse,
    summary="Record attendance for a court event",
)
async def record_attendance(
    event_id: str,
    data: CourtEventAttendance,
    request: Request,
    professional_id: str,
    grant_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Record attendance for a court event."""
    service = CourtEventService(db)
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    await get_professional_from_grant(db, grant_id, professional_id)

    updated = await service.record_attendance(event_id, data)

    await log_court_action(
        db, request, grant_id, professional_id, event.case_id,
        action="record_attendance",
        resource_type="court_event",
        resource_id=event_id,
        details=data.model_dump(),
    )

    return CourtEventResponse(
        id=updated.id,
        case_id=updated.case_id,
        created_by=updated.created_by,
        event_type=CourtEventType(updated.event_type),
        title=updated.title,
        description=updated.description,
        event_date=updated.event_date,
        start_time=str(updated.start_time) if updated.start_time else None,
        end_time=str(updated.end_time) if updated.end_time else None,
        location=updated.location,
        virtual_link=updated.virtual_link,
        petitioner_required=updated.petitioner_required,
        respondent_required=updated.respondent_required,
        is_mandatory=updated.is_mandatory,
        status=updated.status,
        internal_notes=updated.internal_notes,
        shared_notes=updated.shared_notes,
        petitioner_attended=updated.petitioner_attended,
        respondent_attended=updated.respondent_attended,
        attendance_summary=updated.attendance_summary,
        is_past=updated.is_past,
        reminder_sent=updated.reminder_sent,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )


# =============================================================================
# Court Message Endpoints
# =============================================================================

@router.post(
    "/messages",
    response_model=CourtMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send a court message",
)
async def send_court_message(
    data: CourtMessageCreate,
    request: Request,
    professional_id: str,
    grant_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message from the court to parents.

    Court messages are:
    - Clearly marked as court communications
    - Cannot be edited or deleted by parents
    - Timestamped and immutable
    """
    await get_professional_from_grant(db, grant_id, professional_id)

    service = CourtMessageService(db)
    message = await service.send_message(data, professional_id)

    await log_court_action(
        db, request, grant_id, professional_id, data.case_id,
        action="send_message",
        resource_type="court_message",
        resource_id=message.id,
        details={"type": data.message_type.value, "urgent": data.is_urgent},
    )

    return message


@router.get(
    "/messages/case/{case_id}",
    response_model=list[CourtMessageResponse],
    summary="List court messages for a case",
)
async def list_court_messages(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """List court messages for a case."""
    service = CourtMessageService(db)
    messages = await service.get_messages_for_case(case_id)
    return messages


@router.post(
    "/messages/{message_id}/read",
    response_model=CourtMessageResponse,
    summary="Mark a court message as read",
)
async def mark_message_read(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a court message as read (for parents)."""
    service = CourtMessageService(db)
    message = await service.get_message(message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    user_role = await get_user_case_role(db, current_user.id, message.case_id)
    updated = await service.mark_read(message_id, user_role)
    return updated


# =============================================================================
# Investigation Report Endpoints
# =============================================================================

@router.post(
    "/reports/generate",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate an investigation report",
)
async def generate_report(
    data: ReportRequest,
    request: Request,
    professional_id: str,
    grant_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an investigation report.

    Reports include:
    - Date-range scoped evidence
    - Hash verification for integrity
    - Watermark with generator identity
    """
    grant = await get_professional_from_grant(db, grant_id, professional_id)

    # Get professional name for watermark
    prof_service = CourtProfessionalService(db)
    professional = await prof_service.get_professional(professional_id)

    service = ReportService(db)
    report = await service.generate_report(
        data, professional_id, professional.full_name
    )

    await log_court_action(
        db, request, grant_id, professional_id, data.case_id,
        action="generate_report",
        resource_type="investigation_report",
        resource_id=report.id,
        details={"type": data.report_type.value, "number": report.report_number},
    )

    # Update grant access count
    grant_service = AccessGrantService(db)
    await grant_service.record_access(grant_id)

    return report


@router.get(
    "/reports/case/{case_id}",
    response_model=list[ReportResponse],
    summary="List reports for a case",
)
async def list_reports(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """List investigation reports for a case."""
    service = ReportService(db)
    reports = await service.get_reports_for_case(case_id)
    return reports


@router.get(
    "/reports/{report_id}",
    response_model=ReportResponse,
    summary="Get a report",
)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get details of an investigation report."""
    service = ReportService(db)
    report = await service.get_report(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return report


@router.post(
    "/reports/{report_id}/download",
    response_model=ReportResponse,
    summary="Record report download",
)
async def download_report(
    report_id: str,
    request: Request,
    professional_id: str,
    grant_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Record a report download.

    In production, this would also return the actual file.
    """
    await get_professional_from_grant(db, grant_id, professional_id)

    service = ReportService(db)
    report = await service.record_download(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    await log_court_action(
        db, request, grant_id, professional_id, report.case_id,
        action="download_report",
        resource_type="investigation_report",
        resource_id=report_id,
    )

    return report


@router.get(
    "/reports/verify/{report_number}",
    response_model=ReportVerification,
    summary="Verify report authenticity",
)
async def verify_report(
    report_number: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify the authenticity of a report.

    This is a public endpoint for courts to verify report integrity.
    """
    service = ReportService(db)
    verification = await service.verify_report(report_number)
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return verification


# =============================================================================
# ARIA Court Query Endpoints
# =============================================================================

@router.post(
    "/aria/query",
    response_model=ARIACourtResponse,
    summary="Query ARIA about a case (facts only)",
)
async def query_aria(
    data: ARIACourtQuery,
    request: Request,
    professional_id: str,
    grant_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Query ARIA about case facts.

    ARIA provides factual information only:
    - Schedule and exchange data
    - Compliance statistics
    - Communication patterns
    - Court settings

    ARIA does NOT:
    - Recommend custody changes
    - Label or characterize parents
    - Suggest sanctions
    - Make predictions
    """
    await get_professional_from_grant(db, grant_id, professional_id)

    service = ARIACourtService(db)
    response = await service.query(data.case_id, data.query)

    await log_court_action(
        db, request, grant_id, professional_id, data.case_id,
        action="aria_query",
        resource_type="aria",
        details={"query": data.query},
    )

    return ARIACourtResponse(**response)


@router.get(
    "/aria/suggestions",
    response_model=ARIASuggestionList,
    summary="Get suggested ARIA queries",
)
async def get_aria_suggestions(
    db: AsyncSession = Depends(get_db),
):
    """Get a list of suggested queries for court staff."""
    service = ARIACourtService(db)
    suggestions = await service.get_suggested_queries()
    return ARIASuggestionList(suggestions=suggestions)


# =============================================================================
# Summary Endpoints
# =============================================================================

@router.get(
    "/summary/case/{case_id}",
    response_model=CaseCourtSummary,
    summary="Get court summary for a case",
)
async def get_case_summary(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a summary of court-related activity for a case."""
    await get_user_case_role(db, current_user.id, case_id)

    # Get settings
    settings_service = CourtSettingsService(db)
    settings = await settings_service.get_or_create_settings(case_id)

    # Count grants
    grant_service = AccessGrantService(db)
    grants = await grant_service.get_grants_for_case(case_id, active_only=True)

    # Count upcoming events
    event_service = CourtEventService(db)
    events = await event_service.get_events_for_case(case_id)

    # Count unread messages
    message_service = CourtMessageService(db)
    user_role = await get_user_case_role(db, current_user.id, case_id)
    unread = await message_service.get_unread_count(case_id, user_role)

    return CaseCourtSummary(
        case_id=case_id,
        has_court_settings=settings.set_at is not None,
        active_controls=settings.get_active_controls(),
        active_grants_count=len(grants),
        upcoming_court_events=len(events),
        unread_court_messages=unread,
        investigation_mode=settings.investigation_mode,
    )


# =============================================================================
# ClearFund Financial Endpoints (Court Read-Only Access)
# =============================================================================

@router.get(
    "/clearfund/obligations/{case_id}",
    summary="Get obligations for case (court view)",
)
async def get_case_obligations(
    case_id: str,
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all financial obligations for a case.

    Court professionals can view all obligations for compliance monitoring.
    """
    from app.services.clearfund import ClearFundService
    from app.schemas.clearfund import ObligationFilters

    service = ClearFundService(db)
    filters = ObligationFilters()
    result = await service.list_obligations(case_id, filters, page, page_size)

    return {
        "items": [
            {
                "id": str(ob.id),
                "title": ob.title,
                "purpose_category": ob.purpose_category,
                "total_amount": str(ob.total_amount),
                "petitioner_share": str(ob.petitioner_share),
                "respondent_share": str(ob.respondent_share),
                "status": ob.status,
                "amount_funded": str(ob.amount_funded),
                "amount_verified": str(ob.amount_verified),
                "due_date": ob.due_date.isoformat() if ob.due_date else None,
                "is_overdue": ob.is_overdue,
                "verification_required": ob.verification_required,
                "receipt_required": ob.receipt_required,
                "created_by": str(ob.created_by),
                "created_at": ob.created_at.isoformat(),
            }
            for ob in result["items"]
        ],
        "total": result["total"],
        "page": page,
        "page_size": page_size,
        "has_more": result["has_more"],
    }


@router.get(
    "/clearfund/balance/{case_id}",
    summary="Get balance summary for case (court view)",
)
async def get_case_balance(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get financial balance summary between parents.

    Shows who owes whom and overall financial standing.
    """
    from app.services.clearfund import ClearFundService

    service = ClearFundService(db)
    balance = await service.get_balance_summary(case_id)

    return {
        "case_id": balance.case_id,
        "petitioner_id": balance.petitioner_id,
        "respondent_id": balance.respondent_id,
        "petitioner_balance": str(balance.petitioner_balance),
        "respondent_balance": str(balance.respondent_balance),
        "petitioner_owes_respondent": str(balance.petitioner_owes_respondent),
        "respondent_owes_petitioner": str(balance.respondent_owes_petitioner),
        "net_balance": str(balance.net_balance),
        "total_obligations_open": balance.total_obligations_open,
        "total_obligations_funded": balance.total_obligations_funded,
        "total_obligations_completed": balance.total_obligations_completed,
        "total_this_month": str(balance.total_this_month),
        "total_overdue": str(balance.total_overdue),
    }


@router.get(
    "/clearfund/metrics/{case_id}",
    summary="Get obligation metrics for case (court view)",
)
async def get_case_metrics(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get obligation metrics for compliance reporting.

    Summary counts by status for court oversight.
    """
    from app.services.clearfund import ClearFundService

    service = ClearFundService(db)
    metrics = await service.get_obligation_metrics(case_id)

    return {
        "total_open": metrics.total_open,
        "total_pending_funding": metrics.total_pending_funding,
        "total_funded": metrics.total_funded,
        "total_verified": metrics.total_verified,
        "total_completed": metrics.total_completed,
        "total_overdue": metrics.total_overdue,
        "total_cancelled": metrics.total_cancelled,
    }


@router.get(
    "/clearfund/ledger/{case_id}",
    summary="Get transaction ledger for case (court view)",
)
async def get_case_ledger(
    case_id: str,
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """
    Get immutable transaction ledger for court records.

    All financial transactions with running balances for evidence.
    """
    from app.services.clearfund import LedgerService
    from app.schemas.clearfund import LedgerFilters

    service = LedgerService(db)
    filters = LedgerFilters()
    result = await service.get_ledger_history(case_id, filters, page, page_size)

    return {
        "items": [
            {
                "id": str(entry.id),
                "entry_type": entry.entry_type,
                "obligor_id": str(entry.obligor_id),
                "obligee_id": str(entry.obligee_id),
                "amount": str(entry.amount),
                "running_balance": str(entry.running_balance),
                "obligation_id": str(entry.obligation_id) if entry.obligation_id else None,
                "description": entry.description,
                "effective_date": entry.effective_date.isoformat(),
                "is_reconciled": entry.is_reconciled,
                "created_at": entry.created_at.isoformat(),
            }
            for entry in result["items"]
        ],
        "total": result["total"],
        "page": page,
        "page_size": page_size,
        "has_more": result["has_more"],
    }
