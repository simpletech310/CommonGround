"""
CG ClearFund™ - Structured Expense Request System
Purpose-locked, auditable, agreement-aware expense management.
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
import uuid


class RequestStatus(Enum):
    """Status of a ClearFund request"""
    PENDING = "pending"              # Waiting for other parent's response
    APPROVED = "approved"            # Approved, awaiting payment
    REJECTED = "rejected"            # Declined by other parent
    PARTIAL = "partial"              # Approved for different amount
    FUNDED = "funded"                # Payment received
    RECEIPT_PENDING = "receipt_pending"  # Paid, waiting for proof
    COMPLETED = "completed"          # Receipt uploaded, fully closed
    EXPIRED = "expired"              # Due date passed without action
    CANCELLED = "cancelled"          # Cancelled by requester


class ExpenseCategory(Enum):
    """Categories of expenses"""
    MEDICAL = "medical"
    EDUCATION = "education"
    SPORTS = "sports"
    DEVICE = "device"
    CAMP = "camp"
    CLOTHING = "clothing"
    TRANSPORTATION = "transportation"
    OTHER = "other"


class AuditAction(Enum):
    """Types of audit trail actions"""
    CREATED = "created"
    VIEWED = "viewed"
    APPROVED = "approved"
    REJECTED = "rejected"
    PARTIAL_APPROVED = "partial_approved"
    QUESTION_ASKED = "question_asked"
    QUESTION_ANSWERED = "question_answered"
    PAYMENT_INITIATED = "payment_initiated"
    PAYMENT_RECEIVED = "payment_received"
    RECEIPT_UPLOADED = "receipt_uploaded"
    COMPLETED = "completed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    REMINDER_SENT = "reminder_sent"


@dataclass
class AuditEntry:
    """Single entry in the audit trail"""
    id: str
    request_id: str
    action: AuditAction
    actor: str  # "parent_a", "parent_b", or "system"
    actor_name: str
    timestamp: datetime
    details: Optional[str] = None
    attachment: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class Payment:
    """Payment record"""
    id: str
    request_id: str
    payer: str  # "parent_a" or "parent_b"
    payer_name: str
    amount: float
    method: str  # "stripe", "venmo", "zelle", etc.
    transaction_id: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    status: str = "completed"  # "pending", "completed", "failed"


@dataclass
class ClearFundRequest:
    """A structured expense request"""
    id: str
    
    # Request details
    purpose: str
    category: ExpenseCategory
    amount: float
    vendor_name: Optional[str] = None
    payment_link: Optional[str] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    
    # Attachments
    invoice_attachment: Optional[str] = None
    receipt_attachment: Optional[str] = None
    
    # Parties
    requester: str = "parent_a"  # Who created the request
    requester_name: str = ""
    responder: str = "parent_b"  # Who needs to approve
    responder_name: str = ""
    
    # Agreement-based split
    split_rule: str = "50/50"
    requester_share: float = 0.0
    responder_share: float = 0.0
    
    # Status tracking
    status: RequestStatus = RequestStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    # Response details
    response_note: Optional[str] = None
    approved_amount: Optional[float] = None
    rejection_reason: Optional[str] = None
    responded_at: Optional[datetime] = None
    
    # Payment tracking
    amount_funded: float = 0.0
    payments: List[Payment] = field(default_factory=list)
    
    # Completion
    completed_at: Optional[datetime] = None
    
    # Audit trail
    audit_trail: List[AuditEntry] = field(default_factory=list)
    
    @property
    def is_overdue(self) -> bool:
        """Check if request is past due date"""
        if self.due_date and self.status in [RequestStatus.PENDING, RequestStatus.APPROVED]:
            return date.today() > self.due_date
        return False
    
    @property
    def days_until_due(self) -> Optional[int]:
        """Days until due date"""
        if self.due_date:
            delta = self.due_date - date.today()
            return delta.days
        return None
    
    @property
    def is_fully_funded(self) -> bool:
        """Check if request is fully funded"""
        target = self.approved_amount if self.approved_amount else self.amount
        return self.amount_funded >= target
    
    @property
    def funding_progress(self) -> float:
        """Percentage of funding complete"""
        target = self.approved_amount if self.approved_amount else self.amount
        if target == 0:
            return 0
        return min(100, (self.amount_funded / target) * 100)


# =============================================================================
# SPLIT CALCULATORS
# =============================================================================

def calculate_split(amount: float, split_rule: str, category: ExpenseCategory = None) -> Dict[str, float]:
    """
    Calculate expense split based on rule.
    
    Args:
        amount: Total amount
        split_rule: Rule like "50/50", "60/40", "70/30", or "100/0"
        category: Optional category for category-specific rules
    
    Returns:
        Dictionary with requester_share and responder_share
    """
    # Parse split rule
    if "/" in split_rule:
        parts = split_rule.split("/")
        try:
            requester_pct = float(parts[0]) / 100
            responder_pct = float(parts[1]) / 100
        except (ValueError, IndexError):
            requester_pct = responder_pct = 0.5
    else:
        requester_pct = responder_pct = 0.5
    
    requester_share = round(amount * requester_pct, 2)
    responder_share = round(amount * responder_pct, 2)
    
    # Handle rounding - give extra cent to responder
    if requester_share + responder_share != amount:
        responder_share = round(amount - requester_share, 2)
    
    return {
        "requester_share": requester_share,
        "responder_share": responder_share,
        "split_rule": split_rule
    }


def get_split_rule_from_agreement(agreement: dict, category: ExpenseCategory) -> str:
    """
    Get the split rule for a category from the custody agreement.
    
    Args:
        agreement: The custody agreement dictionary
        category: Expense category
    
    Returns:
        Split rule string like "50/50" or "60/40"
    """
    expenses = agreement.get("additional_expenses", {})
    
    # Map categories to agreement sections
    category_map = {
        ExpenseCategory.MEDICAL: ["medical_copays", "medical_general", "uncovered_medical"],
        ExpenseCategory.EDUCATION: ["school_expenses", "tutoring"],
        ExpenseCategory.SPORTS: ["extracurricular"],
        ExpenseCategory.CAMP: ["childcare", "summer_camp"],
        ExpenseCategory.DEVICE: ["school_expenses"],
        ExpenseCategory.CLOTHING: ["school_expenses"],
        ExpenseCategory.OTHER: ["extracurricular"],
    }
    
    # Check relevant sections for split info
    sections_to_check = category_map.get(category, [])
    
    for section in sections_to_check:
        section_data = expenses.get(section, {})
        if isinstance(section_data, dict):
            split = section_data.get("split", "")
            if split:
                # Normalize format
                if "50" in split and "50" in split:
                    return "50/50"
                elif "60" in split and "40" in split:
                    return "60/40"
                elif "70" in split and "30" in split:
                    return "70/30"
    
    # Default to 50/50
    return "50/50"


# =============================================================================
# DISPLAY HELPERS
# =============================================================================

CATEGORY_ICONS = {
    ExpenseCategory.MEDICAL: "🏥",
    ExpenseCategory.EDUCATION: "📚",
    ExpenseCategory.SPORTS: "⚽",
    ExpenseCategory.DEVICE: "💻",
    ExpenseCategory.CAMP: "🏕️",
    ExpenseCategory.CLOTHING: "👕",
    ExpenseCategory.TRANSPORTATION: "🚗",
    ExpenseCategory.OTHER: "📦",
}

STATUS_ICONS = {
    RequestStatus.PENDING: "📝",
    RequestStatus.APPROVED: "✅",
    RequestStatus.REJECTED: "❌",
    RequestStatus.PARTIAL: "🟡",
    RequestStatus.FUNDED: "💰",
    RequestStatus.RECEIPT_PENDING: "📎",
    RequestStatus.COMPLETED: "✓",
    RequestStatus.EXPIRED: "⏰",
    RequestStatus.CANCELLED: "🚫",
}

STATUS_LABELS = {
    RequestStatus.PENDING: "Pending Approval",
    RequestStatus.APPROVED: "Approved - Awaiting Payment",
    RequestStatus.REJECTED: "Rejected",
    RequestStatus.PARTIAL: "Partially Approved",
    RequestStatus.FUNDED: "Funded - Needs Receipt",
    RequestStatus.RECEIPT_PENDING: "Receipt Pending",
    RequestStatus.COMPLETED: "Completed",
    RequestStatus.EXPIRED: "Expired",
    RequestStatus.CANCELLED: "Cancelled",
}


def format_currency(amount: float) -> str:
    """Format amount as currency"""
    return f"${amount:,.2f}"


def format_request_summary(request: ClearFundRequest) -> str:
    """Format a request for display"""
    icon = CATEGORY_ICONS.get(request.category, "📦")
    status_icon = STATUS_ICONS.get(request.status, "?")
    status_label = STATUS_LABELS.get(request.status, request.status.value)
    
    lines = [
        f"{'─' * 60}",
        f"{icon} {request.purpose}",
        f"   ID: {request.id}",
        f"   Amount: {format_currency(request.amount)}",
        f"   Category: {request.category.value.title()}",
        f"   Status: {status_icon} {status_label}",
    ]
    
    if request.vendor_name:
        lines.append(f"   Vendor: {request.vendor_name}")
    
    if request.due_date:
        days = request.days_until_due
        if days is not None:
            if days < 0:
                lines.append(f"   Due: {request.due_date} (⚠️ {abs(days)} days overdue)")
            elif days == 0:
                lines.append(f"   Due: {request.due_date} (📅 Due today!)")
            elif days <= 7:
                lines.append(f"   Due: {request.due_date} (⏰ {days} days left)")
            else:
                lines.append(f"   Due: {request.due_date} ({days} days left)")
    
    if request.status == RequestStatus.FUNDED or request.amount_funded > 0:
        lines.append(f"   Funded: {format_currency(request.amount_funded)} ({request.funding_progress:.0f}%)")
    
    lines.append(f"{'─' * 60}")
    
    return "\n".join(lines)


def format_request_detail(request: ClearFundRequest) -> str:
    """Format detailed request view"""
    icon = CATEGORY_ICONS.get(request.category, "📦")
    status_icon = STATUS_ICONS.get(request.status, "?")
    status_label = STATUS_LABELS.get(request.status, request.status.value)
    
    lines = [
        "═" * 60,
        f"{icon} REQUEST: {request.purpose.upper()}",
        "═" * 60,
        "",
        f"ID: {request.id}",
        f"Status: {status_icon} {status_label}",
        "",
        "─" * 60,
        "DETAILS",
        "─" * 60,
        f"Category: {request.category.value.title()}",
        f"Amount: {format_currency(request.amount)}",
    ]
    
    if request.vendor_name:
        lines.append(f"Vendor: {request.vendor_name}")
    
    if request.payment_link:
        lines.append(f"Payment Link: {request.payment_link}")
    
    if request.due_date:
        lines.append(f"Due Date: {request.due_date}")
    
    if request.notes:
        lines.extend(["", f"Notes: {request.notes}"])
    
    if request.invoice_attachment:
        lines.append(f"📎 Invoice: {request.invoice_attachment}")
    
    if request.receipt_attachment:
        lines.append(f"📎 Receipt: {request.receipt_attachment}")
    
    # Split info
    lines.extend([
        "",
        "─" * 60,
        "COST SPLIT",
        "─" * 60,
        f"Split Rule: {request.split_rule}",
        f"{request.requester_name}'s share: {format_currency(request.requester_share)}",
        f"{request.responder_name}'s share: {format_currency(request.responder_share)}",
    ])
    
    # Funding status
    if request.amount_funded > 0 or request.status in [RequestStatus.FUNDED, RequestStatus.COMPLETED]:
        lines.extend([
            "",
            "─" * 60,
            "FUNDING STATUS",
            "─" * 60,
            f"Amount Funded: {format_currency(request.amount_funded)}",
            f"Progress: {request.funding_progress:.0f}%",
        ])
        
        if request.payments:
            lines.append("")
            for pmt in request.payments:
                lines.append(f"  💳 {pmt.payer_name}: {format_currency(pmt.amount)} via {pmt.method}")
    
    # Response info
    if request.response_note:
        lines.extend([
            "",
            "─" * 60,
            f"RESPONSE FROM {request.responder_name.upper()}",
            "─" * 60,
            f"\"{request.response_note}\"",
        ])
    
    if request.rejection_reason:
        lines.extend([
            "",
            "─" * 60,
            "REJECTION REASON",
            "─" * 60,
            f"\"{request.rejection_reason}\"",
        ])
    
    lines.extend(["", "═" * 60])
    
    return "\n".join(lines)


def format_audit_trail(request: ClearFundRequest) -> str:
    """Format the audit trail for a request"""
    lines = [
        "═" * 60,
        f"📋 AUDIT TRAIL: {request.id}",
        "═" * 60,
        ""
    ]
    
    if not request.audit_trail:
        lines.append("  No audit entries yet.")
    else:
        for entry in request.audit_trail:
            timestamp = entry.timestamp.strftime("%b %d, %I:%M %p")
            
            # Format action nicely
            action_display = {
                AuditAction.CREATED: "📝 Request created",
                AuditAction.VIEWED: "👀 Viewed",
                AuditAction.APPROVED: "✅ Approved",
                AuditAction.REJECTED: "❌ Rejected",
                AuditAction.PARTIAL_APPROVED: "🟡 Partially approved",
                AuditAction.QUESTION_ASKED: "❓ Question asked",
                AuditAction.QUESTION_ANSWERED: "💬 Question answered",
                AuditAction.PAYMENT_INITIATED: "💳 Payment initiated",
                AuditAction.PAYMENT_RECEIVED: "💰 Payment received",
                AuditAction.RECEIPT_UPLOADED: "📎 Receipt uploaded",
                AuditAction.COMPLETED: "✓ Marked complete",
                AuditAction.EXPIRED: "⏰ Expired",
                AuditAction.CANCELLED: "🚫 Cancelled",
                AuditAction.REMINDER_SENT: "🔔 Reminder sent",
            }.get(entry.action, entry.action.value)
            
            lines.append(f"  {timestamp} │ {action_display}")
            lines.append(f"               │   by {entry.actor_name}")
            
            if entry.details:
                # Wrap long details
                details = entry.details[:50] + "..." if len(entry.details) > 50 else entry.details
                lines.append(f"               │   \"{details}\"")
            
            if entry.attachment:
                lines.append(f"               │   📎 {entry.attachment}")
            
            lines.append("               │")
    
    lines.extend(["", "═" * 60])
    
    return "\n".join(lines)
