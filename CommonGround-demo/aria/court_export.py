"""
CG Court Export System
Generates court-ready documentation packages with full audit trails.
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any, Tuple
import uuid
import hashlib
import json


class PackageType(Enum):
    """Type of court package"""
    INVESTIGATION = "investigation"
    COURT = "court"


class ClaimType(Enum):
    """Types of investigation claims"""
    MISSED_HANDOFFS = "missed_handoffs"
    UNEVEN_TIME = "uneven_time"
    COMMUNICATION = "communication"
    FINANCIAL = "financial"
    GENERAL_COMPLIANCE = "general_compliance"


class EventType(Enum):
    """Types of tracked events"""
    HANDOFF = "handoff"
    PICKUP = "pickup"
    DROPOFF = "dropoff"
    PHONE_CALL = "phone_call"
    VIDEO_CALL = "video_call"


class CompletionStatus(Enum):
    """Event completion status"""
    SCHEDULED = "scheduled"
    COMPLETE = "complete"
    LATE = "late"
    INCOMPLETE = "incomplete"
    CANCELLED = "cancelled"


@dataclass
class HandoffEvent:
    """A scheduled handoff/exchange event"""
    id: str
    event_type: EventType
    scheduled_time: datetime
    location: str
    
    # Check-in times (None = no show)
    parent_a_checkin: Optional[datetime] = None
    parent_b_checkin: Optional[datetime] = None
    
    # Grace period
    grace_period_minutes: int = 15
    
    # Status
    status: CompletionStatus = CompletionStatus.SCHEDULED
    
    # Children present
    children: List[str] = field(default_factory=list)
    
    @property
    def parent_a_minutes_delta(self) -> Optional[int]:
        """Minutes early (negative) or late (positive)"""
        if not self.parent_a_checkin:
            return None
        delta = (self.parent_a_checkin - self.scheduled_time).total_seconds() / 60
        return int(delta)
    
    @property
    def parent_b_minutes_delta(self) -> Optional[int]:
        """Minutes early (negative) or late (positive)"""
        if not self.parent_b_checkin:
            return None
        delta = (self.parent_b_checkin - self.scheduled_time).total_seconds() / 60
        return int(delta)
    
    @property
    def parent_a_status(self) -> str:
        """Status string for parent A"""
        if not self.parent_a_checkin:
            return "NO SHOW"
        delta = self.parent_a_minutes_delta
        if delta <= 0:
            return f"On time ({abs(delta)} min early)"
        elif delta <= self.grace_period_minutes:
            return f"On time ({delta} min)"
        else:
            return f"LATE ({delta} min)"
    
    @property
    def parent_b_status(self) -> str:
        """Status string for parent B"""
        if not self.parent_b_checkin:
            return "NO SHOW"
        delta = self.parent_b_minutes_delta
        if delta <= 0:
            return f"On time ({abs(delta)} min early)"
        elif delta <= self.grace_period_minutes:
            return f"On time ({delta} min)"
        else:
            return f"LATE ({delta} min)"


@dataclass 
class SentimentRecord:
    """Record of a Sentiment Shield intervention"""
    id: str
    timestamp: datetime
    sender: str  # "parent_a" or "parent_b"
    sender_name: str
    
    # Toxicity analysis
    toxicity_level: str  # "LOW", "MEDIUM", "HIGH", "SEVERE"
    toxicity_score: float
    categories: List[str]
    
    # Content (redacted in reports)
    original_word_count: int
    suggestion_word_count: int
    
    # User action
    action: str  # "accepted", "modified", "rejected", "cancelled"
    
    # Optional fields (with defaults)
    final_word_count: Optional[int] = None
    final_score: Optional[float] = None


@dataclass
class CourtPackage:
    """A generated court documentation package"""
    id: str
    package_type: PackageType
    
    # Case info
    case_reference: str
    petitioner: str
    respondent: str
    children: List[str]
    
    # Agreement reference
    agreement_id: str
    agreement_effective_date: date
    
    # Generation info
    generated_at: datetime
    generated_by: str  # Who requested
    date_range_start: date
    date_range_end: date
    
    # Integrity
    integrity_hash: str
    
    # For investigation packages
    claim_type: Optional[ClaimType] = None
    
    # Sections included
    sections: List[str] = field(default_factory=list)


# =============================================================================
# REPORT FORMATTERS
# =============================================================================

def generate_integrity_hash(data: dict) -> str:
    """Generate SHA-256 hash for data integrity"""
    json_str = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(json_str.encode()).hexdigest()


def format_package_header(
    package_type: PackageType,
    package_id: str,
    petitioner: str,
    respondent: str,
    date_range: Tuple[date, date],
    claim_type: ClaimType = None,
    integrity_hash: str = None
) -> str:
    """Format the package header"""
    
    generated_at = datetime.now()
    
    if package_type == PackageType.INVESTIGATION:
        claim_display = {
            ClaimType.MISSED_HANDOFFS: "Missed or Late Handoffs",
            ClaimType.UNEVEN_TIME: "Uneven Parenting Time",
            ClaimType.COMMUNICATION: "Communication Non-Compliance",
            ClaimType.FINANCIAL: "Financial Non-Compliance",
            ClaimType.GENERAL_COMPLIANCE: "General Agreement Adherence"
        }.get(claim_type, "General Review")
        
        return f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                        INVESTIGATION PACKAGE                                 ║
║                                                                              ║
║  Claim: {claim_display:<50}      ║
║  Date Range: {date_range[0].strftime('%b %d, %Y')} - {date_range[1].strftime('%b %d, %Y'):<36}      ║
║                                                                              ║
║  Requested By: {petitioner:<52}  ║
║  Subject: {respondent:<57}       ║
║                                                                              ║
║  Generated: {generated_at.strftime('%B %d, %Y %I:%M:%S %p'):<50}      ║
║  Package ID: {package_id:<54}    ║
║  Integrity Hash: {(integrity_hash or 'pending')[:16]}...{' ' * 36}    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""
    else:
        return f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                      COURT DOCUMENTATION PACKAGE                             ║
║                                                                              ║
║  In the Matter of: {petitioner} v. {respondent:<30}       ║
║  Case Reference: [To be assigned by court]{' ' * 24}       ║
║                                                                              ║
║  Platform: CommonGround Co-Parenting{' ' * 30}       ║
║  Generated: {generated_at.strftime('%B %d, %Y'):<55}      ║
║  Package ID: {package_id:<54}    ║
║  Integrity Hash: SHA-256: {(integrity_hash or 'pending')[:12]}...{' ' * 26}    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""


def format_toc_investigation(claim_type: ClaimType) -> str:
    """Format table of contents for investigation package"""
    return """
TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════════════════════

  Section 1: Event Compliance Report ................................. Page 2
  Section 2: Attendance Pattern Summary .............................. Page 5
  Section 3: Agreement Rule Reference ................................ Page 7
  Section 4: Communication Compliance ................................ Page 8
  Section 5: Intervention Log (Redacted) ............................. Page 11
  Section 6: Chain of Custody Statement .............................. Page 14

═══════════════════════════════════════════════════════════════════════════════
"""


def format_toc_court() -> str:
    """Format table of contents for court package"""
    return """
TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════════════════════

  Section 1: Agreement Overview ...................................... Page 2
  Section 2: Compliance Summary ...................................... Page 4
  Section 3: Parenting Time Report ................................... Page 6
  Section 4: Financial Compliance (ClearFund) ........................ Page 9
  Section 5: Communication Compliance ................................ Page 12
  Section 6: Intervention Log (Redacted) ............................. Page 16
  Section 7: Parent Impact Summary ................................... Page 20
  Section 8: Chain of Custody & Integrity ............................ Page 22

═══════════════════════════════════════════════════════════════════════════════
"""


def format_disclaimer() -> str:
    """Format the important disclaimer"""
    return """
┌──────────────────────────────────────────────────────────────────────────────┐
│                            ⚠️  IMPORTANT NOTICE                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  This package compiles platform records related to the specified claim.      │
│                                                                              │
│  CommonGround does not:                                                      │
│    • Determine fault or assign blame                                         │
│    • Make custody recommendations                                            │
│    • Interpret the meaning of recorded events                                │
│    • Provide legal advice                                                    │
│                                                                              │
│  This document preserves reality — it does not decide outcomes.              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
"""


def format_handoff_compliance_report(
    events: List[HandoffEvent],
    parent_a_name: str,
    parent_b_name: str,
    date_range: Tuple[date, date]
) -> str:
    """Format the handoff compliance section"""
    
    total = len(events)
    if total == 0:
        return "\nNo handoff events in the specified period.\n"
    
    # Calculate stats
    complete = sum(1 for e in events if e.status == CompletionStatus.COMPLETE)
    late = sum(1 for e in events if e.status == CompletionStatus.LATE)
    incomplete = sum(1 for e in events if e.status == CompletionStatus.INCOMPLETE)
    
    # Per-parent stats
    a_on_time = sum(1 for e in events if e.parent_a_checkin and e.parent_a_minutes_delta <= e.grace_period_minutes)
    a_late = sum(1 for e in events if e.parent_a_checkin and e.parent_a_minutes_delta > e.grace_period_minutes)
    a_no_show = sum(1 for e in events if not e.parent_a_checkin)
    
    b_on_time = sum(1 for e in events if e.parent_b_checkin and e.parent_b_minutes_delta <= e.grace_period_minutes)
    b_late = sum(1 for e in events if e.parent_b_checkin and e.parent_b_minutes_delta > e.grace_period_minutes)
    b_no_show = sum(1 for e in events if not e.parent_b_checkin)
    
    # Incomplete events detail
    incomplete_events = [e for e in events if e.status == CompletionStatus.INCOMPLETE]
    
    lines = [
        "",
        "═" * 78,
        "SECTION 1: EVENT COMPLIANCE REPORT",
        f"Period: {date_range[0].strftime('%b %d, %Y')} - {date_range[1].strftime('%b %d, %Y')}",
        "═" * 78,
        "",
        "HANDOFF EVENTS SUMMARY",
        "─" * 78,
        f"  Total Scheduled Handoffs:        {total:>3}",
        f"  Completed On Time:               {complete:>3} ({complete/total*100:.1f}%)",
        f"  Completed Late (within grace):   {late:>3} ({late/total*100:.1f}%)",
        f"  Incomplete:                      {incomplete:>3} ({incomplete/total*100:.1f}%)",
        "",
        "BY PARENT:",
        f"                              {parent_a_name:<15} {parent_b_name:<15}",
        f"                              {'─'*15} {'─'*15}",
        f"  Check-ins on time:          {a_on_time:>3} ({a_on_time/total*100:.0f}%)         {b_on_time:>3} ({b_on_time/total*100:.0f}%)",
        f"  Check-ins late:             {a_late:>3} ({a_late/total*100:.0f}%)          {b_late:>3} ({b_late/total*100:.0f}%)",
        f"  No check-in:                {a_no_show:>3} ({a_no_show/total*100:.0f}%)          {b_no_show:>3} ({b_no_show/total*100:.0f}%)",
    ]
    
    if incomplete_events:
        lines.extend([
            "",
            "INCOMPLETE EVENTS DETAIL",
            "─" * 78,
            f"{'Date':<12} {'Scheduled':<12} {'Location':<25} {'Issue':<25}",
            f"{'─'*12} {'─'*12} {'─'*25} {'─'*25}",
        ])
        
        for event in incomplete_events[:10]:  # Show first 10
            issue = ""
            if not event.parent_a_checkin:
                issue = f"No check-in: {parent_a_name}"
            elif not event.parent_b_checkin:
                issue = f"No check-in: {parent_b_name}"
            elif event.parent_a_minutes_delta > event.grace_period_minutes:
                issue = f"Late ({event.parent_a_minutes_delta} min): {parent_a_name}"
            elif event.parent_b_minutes_delta > event.grace_period_minutes:
                issue = f"Late ({event.parent_b_minutes_delta} min): {parent_b_name}"
            
            lines.append(
                f"{event.scheduled_time.strftime('%b %d'):<12} "
                f"{event.scheduled_time.strftime('%I:%M %p'):<12} "
                f"{event.location[:25]:<25} "
                f"{issue:<25}"
            )
        
        if len(incomplete_events) > 10:
            lines.append(f"\n  ... and {len(incomplete_events) - 10} more incomplete events")
    
    lines.extend([
        "",
        f"Note: Grace period per agreement: 15 minutes",
        "",
        "─" * 78,
    ])
    
    return "\n".join(lines)


def format_communication_compliance(
    records: List[SentimentRecord],
    parent_a_name: str,
    parent_b_name: str,
    date_range: Tuple[date, date],
    total_messages_a: int = 347,
    total_messages_b: int = 289
) -> str:
    """Format the communication compliance section"""
    
    # Split by sender
    a_records = [r for r in records if r.sender == "parent_a"]
    b_records = [r for r in records if r.sender == "parent_b"]
    
    # Calculate stats
    a_accepted = sum(1 for r in a_records if r.action == "accepted")
    a_modified = sum(1 for r in a_records if r.action == "modified")
    a_rejected = sum(1 for r in a_records if r.action == "rejected")
    
    b_accepted = sum(1 for r in b_records if r.action == "accepted")
    b_modified = sum(1 for r in b_records if r.action == "modified")
    b_rejected = sum(1 for r in b_records if r.action == "rejected")
    
    # Toxicity levels
    a_low = sum(1 for r in a_records if r.toxicity_level == "LOW")
    a_med = sum(1 for r in a_records if r.toxicity_level == "MEDIUM")
    a_high = sum(1 for r in a_records if r.toxicity_level == "HIGH")
    a_severe = sum(1 for r in a_records if r.toxicity_level == "SEVERE")
    
    b_low = sum(1 for r in b_records if r.toxicity_level == "LOW")
    b_med = sum(1 for r in b_records if r.toxicity_level == "MEDIUM")
    b_high = sum(1 for r in b_records if r.toxicity_level == "HIGH")
    b_severe = sum(1 for r in b_records if r.toxicity_level == "SEVERE")
    
    # Acceptance rates
    a_total = len(a_records)
    b_total = len(b_records)
    a_accept_rate = (a_accepted / a_total * 100) if a_total > 0 else 0
    b_accept_rate = (b_accepted / b_total * 100) if b_total > 0 else 0
    
    lines = [
        "",
        "═" * 78,
        "SECTION 5: COMMUNICATION COMPLIANCE",
        f"Period: {date_range[0].strftime('%b %d, %Y')} - {date_range[1].strftime('%b %d, %Y')}",
        "═" * 78,
        "",
        "OVERVIEW",
        "─" * 78,
        f"  Total Messages Exchanged:           {total_messages_a + total_messages_b}",
        f"  Messages Flagged by System:         {len(records)} ({len(records)/(total_messages_a + total_messages_b)*100:.1f}%)",
        f"  ARIA Interventions Offered:         {len(records)}",
        "",
        f"                              {parent_a_name:<15} {parent_b_name:<15}",
        f"                              {'─'*15} {'─'*15}",
        f"  Messages Sent:              {total_messages_a:>6}          {total_messages_b:>6}",
        f"  Messages Flagged:           {a_total:>3} ({a_total/total_messages_a*100:.1f}%)       {b_total:>3} ({b_total/total_messages_b*100:.1f}%)",
        f"  Interventions Offered:      {a_total:>6}          {b_total:>6}",
    ]
    
    if a_total > 0 and b_total > 0:
        lines.extend([
            f"    - Accepted (suggestion):  {a_accepted:>3} ({a_accepted/a_total*100:.0f}%)        {b_accepted:>3} ({b_accepted/b_total*100:.0f}%)",
            f"    - Modified (edited):      {a_modified:>3} ({a_modified/a_total*100:.0f}%)        {b_modified:>3} ({b_modified/b_total*100:.0f}%)",
            f"    - Rejected (sent orig):   {a_rejected:>3} ({a_rejected/a_total*100:.0f}%)        {b_rejected:>3} ({b_rejected/b_total*100:.0f}%)",
        ])
    
    lines.extend([
        "",
        "TOXICITY LEVELS OF FLAGGED MESSAGES",
        "─" * 78,
        f"  Level                           {parent_a_name:<15} {parent_b_name:<15}",
        f"  {'─'*30} {'─'*15} {'─'*15}",
        f"  🟡 Low (gentle reminder):        {a_low:>6}          {b_low:>6}",
        f"  🟠 Medium (suggested rewrite):   {a_med:>6}          {b_med:>6}",
        f"  🔴 High (strong intervention):   {a_high:>6}          {b_high:>6}",
        f"  🛑 Severe (blocked for review):  {a_severe:>6}          {b_severe:>6}",
        "",
        "GOOD FAITH EFFORT INDICATOR",
        "─" * 78,
        "  This metric measures willingness to de-escalate when prompted.",
        "",
        f"                      Acceptance    Trend       Assessment",
        f"                      ──────────    ─────       ──────────",
    ])
    
    # Determine trends and assessments
    a_trend = "Stable" if a_accept_rate >= 60 else "Declining"
    b_trend = "Declining" if b_accept_rate < 40 else "Stable"
    
    a_assess = "Demonstrates effort" if a_accept_rate >= 60 else "Limited engagement"
    b_assess = "Demonstrates effort" if b_accept_rate >= 60 else "Limited engagement"
    
    lines.extend([
        f"  {parent_a_name + ':':<20} {a_accept_rate:>5.0f}%       {a_trend:<12} {a_assess}",
        f"  {parent_b_name + ':':<20} {b_accept_rate:>5.0f}%       {b_trend:<12} {b_assess}",
        "",
        "─" * 78,
    ])
    
    return "\n".join(lines)


def format_intervention_log_redacted(
    records: List[SentimentRecord],
    parent_a_name: str,
    parent_b_name: str
) -> str:
    """Format the redacted intervention log"""
    
    lines = [
        "",
        "═" * 78,
        "SECTION 6: COMMUNICATION INTERVENTION LOG",
        "Sample of Flagged Messages (Content Redacted)",
        "═" * 78,
        "",
        "┌────────────────────────────────────────────────────────────────────────────┐",
        "│  Note: Message content is redacted to protect privacy.                    │",
        "│  This log demonstrates system intervention patterns only.                 │",
        "│  Full content available under subpoena if legally required.               │",
        "└────────────────────────────────────────────────────────────────────────────┘",
        "",
    ]
    
    # Show up to 8 sample entries
    for i, record in enumerate(records[:8], 1):
        sender_name = parent_a_name if record.sender == "parent_a" else parent_b_name
        
        # Level indicator
        level_icon = {
            "LOW": "🟡",
            "MEDIUM": "🟠", 
            "HIGH": "🔴",
            "SEVERE": "🛑"
        }.get(record.toxicity_level, "⚪")
        
        # Action indicator
        action_icon = {
            "accepted": "✅ ACCEPTED",
            "modified": "✏️  MODIFIED",
            "rejected": "❌ REJECTED",
            "cancelled": "🚫 CANCELLED"
        }.get(record.action, record.action.upper())
        
        # Categories display
        categories_str = " ".join(f"[{c}]" for c in record.categories[:3])
        
        lines.extend([
            "─" * 78,
            f"Entry #{i}",
            "─" * 78,
            f"  Date/Time:      {record.timestamp.strftime('%b %d, %Y %I:%M %p')}",
            f"  Sender:         {sender_name}",
            f"  Toxicity Level: {level_icon} {record.toxicity_level} ({record.toxicity_score:.2f})",
            f"  Categories:     {categories_str}",
            "",
            f"  Original:       [REDACTED - {record.original_word_count} words]",
            f"  ARIA Suggestion: [REDACTED - {record.suggestion_word_count} words]",
            f"  User Action:    {action_icon} - {'Sent suggested version' if record.action == 'accepted' else 'Sent original message' if record.action == 'rejected' else 'Edited before sending' if record.action == 'modified' else 'Message cancelled'}",
        ])
        
        # Add context notes for severe or interesting cases
        if record.toxicity_level == "SEVERE":
            lines.extend([
                "",
                f"  ⚠️  Platform Note: Recipient was shown option to pause notifications.",
            ])
        
        if record.action == "modified" and record.final_score:
            lines.extend([
                "",
                f"  Final Sent:     [REDACTED - {record.final_word_count} words]",
                f"  Final Score:    {record.final_score:.2f} (improved from {record.toxicity_score:.2f})",
            ])
        
        lines.append("")
    
    if len(records) > 8:
        lines.extend([
            "─" * 78,
            f"  ... {len(records) - 8} additional intervention records not shown",
            f"  Full log available in complete package",
            "─" * 78,
        ])
    
    lines.extend([
        "",
        f"SUMMARY: {len(records)} interventions logged in period",
        "",
        "═" * 78,
    ])
    
    return "\n".join(lines)


def format_parent_impact_summary(
    parent_a_name: str,
    parent_b_name: str,
    handoff_events: List[HandoffEvent],
    sentiment_records: List[SentimentRecord],
    clearfund_stats: Dict[str, Any] = None
) -> str:
    """Format the parent impact summary section"""
    
    # Calculate handoff stats
    total_events = len(handoff_events)
    
    a_complete = sum(1 for e in handoff_events if e.parent_a_checkin)
    b_complete = sum(1 for e in handoff_events if e.parent_b_checkin)
    
    a_handoff_rate = (a_complete / total_events * 100) if total_events > 0 else 0
    b_handoff_rate = (b_complete / total_events * 100) if total_events > 0 else 0
    
    # Calculate sentiment stats
    a_records = [r for r in sentiment_records if r.sender == "parent_a"]
    b_records = [r for r in sentiment_records if r.sender == "parent_b"]
    
    a_accept = sum(1 for r in a_records if r.action == "accepted")
    b_accept = sum(1 for r in b_records if r.action == "accepted")
    
    a_accept_rate = (a_accept / len(a_records) * 100) if a_records else 0
    b_accept_rate = (b_accept / len(b_records) * 100) if b_records else 0
    
    # Determine trends
    a_trend = "Stable ━" if a_handoff_rate >= 90 and a_accept_rate >= 60 else "Declining ↘"
    b_trend = "Stable ━" if b_handoff_rate >= 90 and b_accept_rate >= 60 else "Declining ↘"
    
    lines = [
        "",
        "═" * 78,
        "SECTION 7: PARENT IMPACT SUMMARY",
        "Rolling 90-Day Analysis",
        "═" * 78,
        "",
        f"{parent_a_name.upper()} (Petitioner)",
        "─" * 78,
        f"  Parenting time compliance:     {a_handoff_rate:.0f}%",
        f"  Exchange attendance:           {a_complete}/{total_events} ({a_handoff_rate:.0f}%)",
    ]
    
    if clearfund_stats:
        lines.append(f"  ClearFund response rate:       {clearfund_stats.get('a_response_rate', 100):.0f}%")
        lines.append(f"  Avg payment time:              {clearfund_stats.get('a_avg_payment', 'Same day')}")
    
    lines.extend([
        f"  Communication tone:            {'Low' if len(a_records) < 10 else 'Moderate'} intervention rate",
        f"  Suggestion acceptance:         {a_accept_rate:.0f}%",
        f"  Trend:                         {a_trend}",
        "",
        f"{parent_b_name.upper()} (Respondent)",
        "─" * 78,
        f"  Parenting time compliance:     {b_handoff_rate:.0f}%",
        f"  Exchange attendance:           {b_complete}/{total_events} ({b_handoff_rate:.0f}%)",
    ])
    
    if clearfund_stats:
        lines.append(f"  ClearFund response rate:       {clearfund_stats.get('b_response_rate', 83):.0f}%")
        lines.append(f"  Avg payment time:              {clearfund_stats.get('b_avg_payment', '3.2 days')}")
    
    lines.extend([
        f"  Communication tone:            {'Moderate' if len(b_records) < 15 else 'High'} intervention rate",
        f"  Suggestion acceptance:         {b_accept_rate:.0f}%",
        f"  Trend:                         {b_trend}",
        "",
        "═" * 78,
    ])
    
    return "\n".join(lines)


def format_chain_of_custody(
    package_id: str,
    integrity_hash: str,
    date_range: Tuple[date, date],
    record_counts: Dict[str, int]
) -> str:
    """Format the chain of custody section"""
    
    generated_at = datetime.now()
    
    lines = [
        "",
        "═" * 78,
        "SECTION 8: CHAIN OF CUSTODY & DATA INTEGRITY",
        "═" * 78,
        "",
        "STATEMENT OF NEUTRALITY",
        "─" * 78,
        "  This document was generated automatically by the CommonGround platform.",
        "  CommonGround does not interpret data, assign fault, or make",
        "  recommendations. All information reflects verified platform activity only.",
        "",
        "DATA SOURCES",
        "─" * 78,
        f"  {'Source':<30} {'Records':<12} {'Period':<25}",
        f"  {'─'*30} {'─'*12} {'─'*25}",
    ]
    
    period_str = f"{date_range[0].strftime('%b %d')} - {date_range[1].strftime('%b %d, %Y')}"
    
    for source, count in record_counts.items():
        lines.append(f"  {source:<30} {count:<12} {period_str:<25}")
    
    lines.extend([
        "",
        "  Note: Message content is NOT included unless both parties",
        "        provide explicit written consent.",
        "",
        "VERIFICATION",
        "─" * 78,
        f"  Package ID:          {package_id}",
        f"  Generation Time:     {generated_at.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]}Z",
        f"  Integrity Hash:      SHA-256: {integrity_hash[:32]}...",
        f"  Verification URL:    https://verify.commonground.app/{package_id}",
        "",
        "DATA RETENTION",
        "─" * 78,
        "  All source data is retained for 7 years per platform policy",
        "  and may be subpoenaed directly if required.",
        "",
        "ABOUT SENTIMENT SHIELD DATA",
        "─" * 78,
        "  The Sentiment Shield system analyzes message tone before sending",
        "  and offers optional rewrites when hostility is detected.",
        "",
        "  Key points for interpretation:",
        "    • Intervention is OPTIONAL - users always choose",
        "    • Acceptance indicates willingness to de-escalate",
        "    • Rejection indicates message was sent as written",
        "    • The system does not block messages (except threats)",
        "    • All original and final versions are preserved",
        "",
        "  This data demonstrates EFFORT, not personality.",
        "  A high acceptance rate indicates good-faith attempts to maintain",
        "  constructive co-parenting communication, even when frustrated.",
        "",
        "CERTIFICATION",
        "─" * 78,
        "  This document is certified to accurately reflect platform records",
        "  as of the generation timestamp.",
        "",
        "  CommonGround, Inc.",
        "  Platform Integrity System (Automated)",
        "",
        "═" * 78,
    ])
    
    return "\n".join(lines)
