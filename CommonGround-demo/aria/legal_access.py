"""
CG Legal Access Mode
Controlled, time-limited access for GALs, Attorneys, Mediators, and Court Staff.
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
import uuid
import hashlib
import secrets


class LegalRole(Enum):
    """Types of legal professionals who can access a case"""
    GAL = "gal"                    # Guardian ad Litem
    ATTORNEY_PETITIONER = "attorney_petitioner"  # Mother/Father's counsel
    ATTORNEY_RESPONDENT = "attorney_respondent"
    MEDIATOR = "mediator"          # Mediator / Evaluator
    COURT_CLERK = "court_clerk"    # Court staff
    JUDGE = "judge"                # Judge (rare, but possible)


class AccessScope(Enum):
    """Modules that can be granted access to"""
    AGREEMENT = "agreement"
    SCHEDULE = "schedule"
    CHECKINS = "checkins"
    MESSAGES = "messages"
    CLEARFUND = "clearfund"
    COMPLIANCE = "compliance"
    INCIDENTS = "incidents"
    CHILD_PROFILE = "child_profile"


class VerificationStatus(Enum):
    """Status of credential verification"""
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"
    EXPIRED = "expired"


class AccessStatus(Enum):
    """Status of legal access grant"""
    PENDING_APPROVAL = "pending_approval"      # Waiting for second parent
    PENDING_VERIFICATION = "pending_verification"  # Waiting for credential check
    ACTIVE = "active"
    SUSPENDED = "suspended"
    EXPIRED = "expired"
    REVOKED = "revoked"


# Default access durations by role (in days)
DEFAULT_DURATION = {
    LegalRole.GAL: 120,
    LegalRole.ATTORNEY_PETITIONER: 90,
    LegalRole.ATTORNEY_RESPONDENT: 90,
    LegalRole.MEDIATOR: 60,
    LegalRole.COURT_CLERK: 30,
    LegalRole.JUDGE: 30,
}


# Role descriptions
ROLE_INFO = {
    LegalRole.GAL: {
        "title": "Guardian ad Litem",
        "description": "Independent reviewer focused on the child's best interest",
        "icon": "👤",
        "can_export": True,
        "can_add_notes": True,  # Legal-only notes
        "verification_required": ["government_id", "appointment_letter"],
    },
    LegalRole.ATTORNEY_PETITIONER: {
        "title": "Attorney (Petitioner)",
        "description": "Legal counsel for the petitioning parent",
        "icon": "⚖️",
        "can_export": True,
        "can_add_notes": False,
        "verification_required": ["government_id", "bar_number", "representation_letter"],
    },
    LegalRole.ATTORNEY_RESPONDENT: {
        "title": "Attorney (Respondent)",
        "description": "Legal counsel for the responding parent",
        "icon": "⚖️",
        "can_export": True,
        "can_add_notes": False,
        "verification_required": ["government_id", "bar_number", "representation_letter"],
    },
    LegalRole.MEDIATOR: {
        "title": "Mediator / Evaluator",
        "description": "Facilitates resolution and identifies friction patterns",
        "icon": "🤝",
        "can_export": True,
        "can_add_notes": True,
        "verification_required": ["government_id", "mediator_credentials"],
    },
    LegalRole.COURT_CLERK: {
        "title": "Court Clerk",
        "description": "Court staff for case review",
        "icon": "📋",
        "can_export": True,
        "can_add_notes": False,
        "verification_required": ["court_email", "clerk_id"],
    },
    LegalRole.JUDGE: {
        "title": "Judge",
        "description": "Judicial officer assigned to the case",
        "icon": "🏛️",
        "can_export": True,
        "can_add_notes": False,
        "verification_required": ["court_verification"],
    },
}


# Scope descriptions
SCOPE_INFO = {
    AccessScope.AGREEMENT: {
        "title": "Custody Agreement",
        "description": "Agreement versions, amendments, and terms",
        "icon": "📄",
    },
    AccessScope.SCHEDULE: {
        "title": "Parenting Schedule",
        "description": "Custody calendar and scheduled events",
        "icon": "📅",
    },
    AccessScope.CHECKINS: {
        "title": "Check-ins & Handoffs",
        "description": "Exchange verification logs with timestamps",
        "icon": "✓",
    },
    AccessScope.MESSAGES: {
        "title": "Communication Log",
        "description": "Parent-to-parent messaging (read-only)",
        "icon": "💬",
    },
    AccessScope.CLEARFUND: {
        "title": "Financial Records",
        "description": "Expense requests, payments, and receipts",
        "icon": "💰",
    },
    AccessScope.COMPLIANCE: {
        "title": "Compliance Summary",
        "description": "Trends, patterns, and ARIA coaching log",
        "icon": "📊",
    },
    AccessScope.INCIDENTS: {
        "title": "Incident Flags",
        "description": "Flagged events and platform notes",
        "icon": "⚠️",
    },
    AccessScope.CHILD_PROFILE: {
        "title": "Child Information",
        "description": "Approved child profile items",
        "icon": "👶",
    },
}


@dataclass
class Credential:
    """A verified credential for a legal professional"""
    type: str  # "bar_number", "appointment_letter", etc.
    value: str
    verified: bool = False
    verified_at: Optional[datetime] = None
    verification_method: Optional[str] = None
    expiration: Optional[date] = None


@dataclass
class LegalProfessional:
    """A legal professional with case access"""
    id: str
    role: LegalRole
    
    # Identity
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    
    # Organization
    organization: Optional[str] = None  # Law firm, court, agency
    title: Optional[str] = None
    
    # Credentials
    credentials: List[Credential] = field(default_factory=list)
    government_id_verified: bool = False
    mfa_enabled: bool = False
    
    # Verification
    verification_status: VerificationStatus = VerificationStatus.PENDING
    verified_at: Optional[datetime] = None
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_title(self) -> str:
        role_info = ROLE_INFO.get(self.role, {})
        return role_info.get("title", self.role.value)


@dataclass
class AccessGrant:
    """A grant of access to a legal professional for a specific case"""
    id: str
    case_id: str
    
    # Who
    professional_id: str
    professional: Optional[LegalProfessional] = None
    role: LegalRole = LegalRole.GAL
    
    # Authorization
    authorization_type: str = "parental_consent"  # or "court_order"
    authorized_by: List[str] = field(default_factory=list)  # Who approved
    court_order_reference: Optional[str] = None
    
    # Scope
    scopes: List[AccessScope] = field(default_factory=list)
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None
    sealed_items_access: bool = False
    
    # Status
    status: AccessStatus = AccessStatus.PENDING_APPROVAL
    
    # Timing
    created_at: datetime = field(default_factory=datetime.now)
    activated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    # Access tracking
    access_code: str = field(default_factory=lambda: secrets.token_urlsafe(16))
    last_accessed: Optional[datetime] = None
    access_count: int = 0
    
    @property
    def is_active(self) -> bool:
        if self.status != AccessStatus.ACTIVE:
            return False
        if self.expires_at and datetime.now() > self.expires_at:
            return False
        return True
    
    @property
    def days_remaining(self) -> Optional[int]:
        if not self.expires_at:
            return None
        delta = self.expires_at - datetime.now()
        return max(0, delta.days)


@dataclass
class AccessLog:
    """Log of access activity"""
    id: str
    grant_id: str
    professional_id: str
    
    # Action
    action: str  # "login", "view", "export", "download"
    resource: str  # What was accessed
    
    # Context
    timestamp: datetime = field(default_factory=datetime.now)
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    
    # Details
    details: Optional[Dict[str, Any]] = None


@dataclass
class CourtPacket:
    """An exported court packet"""
    id: str
    grant_id: str
    generated_by: str
    
    # Content
    packet_type: str  # "full", "redacted", "summary"
    date_range_start: date
    date_range_end: date
    sections_included: List[str] = field(default_factory=list)
    
    # Files
    pdf_filename: Optional[str] = None
    evidence_index_filename: Optional[str] = None
    
    # Integrity
    content_hash: str = ""
    chain_of_custody_hash: str = ""
    
    # Metadata
    generated_at: datetime = field(default_factory=datetime.now)
    page_count: int = 0
    artifact_count: int = 0


def generate_access_link(grant: AccessGrant, base_url: str = "https://app.commonground.family") -> str:
    """Generate a secure access link for a legal professional"""
    return f"{base_url}/legal-access/{grant.id}?code={grant.access_code}"


def generate_content_hash(data: dict) -> str:
    """Generate SHA-256 hash for content integrity"""
    import json
    content = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(content.encode()).hexdigest()


def format_access_grant_summary(grant: AccessGrant) -> str:
    """Format an access grant for display"""
    role_info = ROLE_INFO.get(grant.role, {})
    icon = role_info.get("icon", "👤")
    title = role_info.get("title", grant.role.value)
    
    status_icons = {
        AccessStatus.PENDING_APPROVAL: "⏳",
        AccessStatus.PENDING_VERIFICATION: "🔍",
        AccessStatus.ACTIVE: "✅",
        AccessStatus.SUSPENDED: "⚠️",
        AccessStatus.EXPIRED: "⏰",
        AccessStatus.REVOKED: "❌",
    }
    
    status_icon = status_icons.get(grant.status, "?")
    
    lines = [
        f"{icon} {title}",
        f"   Status: {status_icon} {grant.status.value.replace('_', ' ').title()}",
    ]
    
    if grant.professional:
        lines.append(f"   Name: {grant.professional.full_name}")
        if grant.professional.organization:
            lines.append(f"   Organization: {grant.professional.organization}")
    
    if grant.expires_at:
        days = grant.days_remaining
        if days is not None:
            lines.append(f"   Expires: {grant.expires_at.strftime('%b %d, %Y')} ({days} days)")
    
    scope_names = [SCOPE_INFO.get(s, {}).get("title", s.value) for s in grant.scopes]
    if scope_names:
        lines.append(f"   Access: {', '.join(scope_names[:3])}" + 
                    (f" +{len(scope_names)-3} more" if len(scope_names) > 3 else ""))
    
    return "\n".join(lines)
