#!/usr/bin/env python3
"""
CG Legal Access Mode Demo
Demonstrates controlled access for GALs, Attorneys, Mediators, and Court Staff.
"""

import os
import sys
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
import random
import hashlib
import secrets
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aria.legal_access import (
    LegalRole, AccessScope, VerificationStatus, AccessStatus,
    LegalProfessional, AccessGrant, Credential, AccessLog, CourtPacket,
    ROLE_INFO, SCOPE_INFO, DEFAULT_DURATION,
    generate_access_link, generate_content_hash, format_access_grant_summary
)
from aria.court_export import (
    format_package_header, format_disclaimer, 
    format_communication_compliance, format_intervention_log_redacted,
    format_chain_of_custody, generate_integrity_hash,
    PackageType, SentimentRecord
)
from aria.sample_agreements import WILLIAMS_AGREEMENT


def clear_screen():
    """Clear the terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')


def print_header():
    """Print the Legal Access header"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║      ██╗     ███████╗ ██████╗  █████╗ ██╗                                    ║
║      ██║     ██╔════╝██╔════╝ ██╔══██╗██║                                    ║
║      ██║     █████╗  ██║  ███╗███████║██║                                    ║
║      ██║     ██╔══╝  ██║   ██║██╔══██║██║                                    ║
║      ███████╗███████╗╚██████╔╝██║  ██║███████╗                               ║
║      ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝                               ║
║                                                                              ║
║       █████╗  ██████╗ ██████╗███████╗███████╗███████╗                        ║
║      ██╔══██╗██╔════╝██╔════╝██╔════╝██╔════╝██╔════╝                        ║
║      ███████║██║     ██║     █████╗  ███████╗███████╗                        ║
║      ██╔══██║██║     ██║     ██╔══╝  ╚════██║╚════██║                        ║
║      ██║  ██║╚██████╗╚██████╗███████╗███████║███████║                        ║
║      ╚═╝  ╚═╝ ╚═════╝ ╚═════╝╚══════╝╚══════╝╚══════╝                        ║
║                                                                              ║
║                   CG Legal Access Mode by CommonGround                       ║
║                                                                              ║
║         "Read-only. Logged. Credentialed. Court-grade."                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)


class LegalAccessDemo:
    """Interactive demo for Legal Access Mode"""
    
    def __init__(self):
        # Case info
        self.case_id = "DOE-2025-FC-00847"
        self.case_name = "Doe v. Doe"
        self.petitioner = "Marcus Williams"
        self.respondent = "Jennifer Williams"
        self.children = ["Eric (6)", "Maya (4)"]
        
        # Sample access grants
        self.grants: List[AccessGrant] = []
        self.professionals: Dict[str, LegalProfessional] = {}
        self.access_logs: List[AccessLog] = []
        self.packets: List[CourtPacket] = []
        
        # Current view mode
        self.view_mode = "parent"  # "parent", "gal", "attorney", "court"
        self.current_professional: LegalProfessional = None
        self.current_grant: AccessGrant = None
        
        # Generate sample data
        self._setup_sample_data()
    
    def _setup_sample_data(self):
        """Set up sample professionals and grants"""
        
        # Sample GAL
        gal = LegalProfessional(
            id="PRO-001",
            role=LegalRole.GAL,
            first_name="Sarah",
            last_name="Mitchell",
            email="s.mitchell@familycourt.gov",
            phone="(760) 555-0142",
            organization="San Diego Family Court Services",
            title="Guardian ad Litem",
            credentials=[
                Credential("government_id", "CA-DL-M1234567", True, datetime.now() - timedelta(days=30)),
                Credential("appointment_letter", "APT-2025-00234", True, datetime.now() - timedelta(days=28)),
            ],
            government_id_verified=True,
            mfa_enabled=True,
            verification_status=VerificationStatus.VERIFIED,
            verified_at=datetime.now() - timedelta(days=28)
        )
        self.professionals[gal.id] = gal
        
        # Sample Attorney
        attorney = LegalProfessional(
            id="PRO-002",
            role=LegalRole.ATTORNEY_PETITIONER,
            first_name="David",
            last_name="Chen",
            email="dchen@chenlaw.com",
            phone="(619) 555-0198",
            organization="Chen Family Law, PC",
            title="Attorney at Law",
            credentials=[
                Credential("government_id", "CA-DL-C9876543", True, datetime.now() - timedelta(days=45)),
                Credential("bar_number", "CA-BAR-287456", True, datetime.now() - timedelta(days=45)),
                Credential("representation_letter", "REP-2025-00156", True, datetime.now() - timedelta(days=44)),
            ],
            government_id_verified=True,
            mfa_enabled=True,
            verification_status=VerificationStatus.VERIFIED,
            verified_at=datetime.now() - timedelta(days=44)
        )
        self.professionals[attorney.id] = attorney
        
        # Sample Court Clerk
        clerk = LegalProfessional(
            id="PRO-003",
            role=LegalRole.COURT_CLERK,
            first_name="Maria",
            last_name="Santos",
            email="m.santos@sdcourt.ca.gov",
            organization="San Diego Superior Court",
            title="Court Clerk II",
            credentials=[
                Credential("court_email", "m.santos@sdcourt.ca.gov", True, datetime.now() - timedelta(days=5)),
                Credential("clerk_id", "SDSC-CLK-4521", True, datetime.now() - timedelta(days=5)),
            ],
            government_id_verified=True,
            mfa_enabled=True,
            verification_status=VerificationStatus.VERIFIED,
            verified_at=datetime.now() - timedelta(days=5)
        )
        self.professionals[clerk.id] = clerk
        
        # Create active grant for GAL
        gal_grant = AccessGrant(
            id="GNT-001",
            case_id=self.case_id,
            professional_id=gal.id,
            professional=gal,
            role=LegalRole.GAL,
            authorization_type="parental_consent",
            authorized_by=[self.petitioner, self.respondent],
            scopes=[
                AccessScope.AGREEMENT, AccessScope.SCHEDULE, AccessScope.CHECKINS,
                AccessScope.MESSAGES, AccessScope.CLEARFUND, AccessScope.COMPLIANCE
            ],
            date_range_start=date.today() - timedelta(days=180),
            date_range_end=date.today(),
            sealed_items_access=False,
            status=AccessStatus.ACTIVE,
            created_at=datetime.now() - timedelta(days=30),
            activated_at=datetime.now() - timedelta(days=28),
            expires_at=datetime.now() + timedelta(days=92),
            last_accessed=datetime.now() - timedelta(hours=2),
            access_count=14
        )
        self.grants.append(gal_grant)
        
        # Create active grant for Attorney
        atty_grant = AccessGrant(
            id="GNT-002",
            case_id=self.case_id,
            professional_id=attorney.id,
            professional=attorney,
            role=LegalRole.ATTORNEY_PETITIONER,
            authorization_type="representation",
            authorized_by=[self.petitioner],
            scopes=[
                AccessScope.AGREEMENT, AccessScope.SCHEDULE, AccessScope.CHECKINS,
                AccessScope.MESSAGES, AccessScope.CLEARFUND, AccessScope.COMPLIANCE
            ],
            date_range_start=date.today() - timedelta(days=365),
            date_range_end=date.today(),
            sealed_items_access=False,
            status=AccessStatus.ACTIVE,
            created_at=datetime.now() - timedelta(days=45),
            activated_at=datetime.now() - timedelta(days=44),
            expires_at=datetime.now() + timedelta(days=46),
            last_accessed=datetime.now() - timedelta(days=3),
            access_count=8
        )
        self.grants.append(atty_grant)
        
        # Create pending grant for Court Clerk
        clerk_grant = AccessGrant(
            id="GNT-003",
            case_id=self.case_id,
            professional_id=clerk.id,
            professional=clerk,
            role=LegalRole.COURT_CLERK,
            authorization_type="court_order",
            court_order_reference="ORD-2025-FC-01234",
            scopes=[
                AccessScope.AGREEMENT, AccessScope.CHECKINS, 
                AccessScope.CLEARFUND, AccessScope.COMPLIANCE
            ],
            date_range_start=date.today() - timedelta(days=90),
            date_range_end=date.today(),
            status=AccessStatus.ACTIVE,
            created_at=datetime.now() - timedelta(days=5),
            activated_at=datetime.now() - timedelta(days=5),
            expires_at=datetime.now() + timedelta(days=25),
            last_accessed=datetime.now() - timedelta(hours=1),
            access_count=3
        )
        self.grants.append(clerk_grant)
        
        # Sample access logs
        self._generate_sample_logs()
    
    def _generate_sample_logs(self):
        """Generate sample access logs"""
        actions = [
            ("login", "Session started"),
            ("view", "Compliance Summary"),
            ("view", "Check-in Ledger"),
            ("view", "Communication Log"),
            ("export", "Court Packet (Summary)"),
            ("view", "ClearFund Transactions"),
            ("view", "Sentiment Analysis Report"),
        ]
        
        for grant in self.grants:
            for i in range(min(grant.access_count, 10)):
                action, resource = random.choice(actions)
                log = AccessLog(
                    id=f"LOG-{len(self.access_logs)+1:04d}",
                    grant_id=grant.id,
                    professional_id=grant.professional_id,
                    action=action,
                    resource=resource,
                    timestamp=datetime.now() - timedelta(hours=random.randint(1, 720)),
                    ip_address=f"192.168.{random.randint(1,255)}.{random.randint(1,255)}",
                    device_info="Chrome/Windows 11" if random.random() > 0.3 else "Safari/macOS"
                )
                self.access_logs.append(log)
        
        # Sort by timestamp
        self.access_logs.sort(key=lambda x: x.timestamp, reverse=True)
    
    def show_parent_dashboard(self):
        """Show dashboard from parent's perspective"""
        clear_screen()
        print_header()
        
        print(f"\n👤 Viewing as: {self.petitioner} (Parent)")
        print("\n" + "═" * 70)
        print(f"  CASE: {self.case_name}")
        print(f"  Case ID: {self.case_id}")
        print("═" * 70)
        
        print("\n📋 LEGAL ACCESS GRANTS")
        print("─" * 70)
        
        for grant in self.grants:
            print(f"\n{format_access_grant_summary(grant)}")
        
        print("\n" + "─" * 70)
    
    def parent_menu(self):
        """Show parent menu options"""
        print("\nOPTIONS")
        print("─" * 70)
        print("  [1] ➕ Add Legal Access (Grant new access)")
        print("  [2] 👁️  View Access Details")
        print("  [3] 📊 View Access Activity Log")
        print("  [4] ❌ Revoke Access")
        print()
        print("  [5] 🔄 Switch to GAL View")
        print("  [6] 🔄 Switch to Attorney View")
        print("  [7] 🔄 Switch to Court Clerk View")
        print()
        print("  [8] 🚪 Exit")
        print()
    
    def add_legal_access_flow(self):
        """Flow for adding a new legal professional"""
        clear_screen()
        
        print("\n" + "═" * 70)
        print("  ➕ ADD LEGAL ACCESS")
        print("═" * 70)
        
        print("\nSelect role to add:\n")
        roles = [
            (LegalRole.GAL, "Guardian ad Litem - Independent child advocate"),
            (LegalRole.ATTORNEY_PETITIONER, "Attorney (Your Counsel)"),
            (LegalRole.ATTORNEY_RESPONDENT, "Attorney (Other Party's Counsel)"),
            (LegalRole.MEDIATOR, "Mediator / Evaluator"),
            (LegalRole.COURT_CLERK, "Court Staff"),
        ]
        
        for i, (role, desc) in enumerate(roles, 1):
            info = ROLE_INFO.get(role, {})
            icon = info.get("icon", "👤")
            print(f"  [{i}] {icon} {desc}")
        
        choice = input("\nSelect role: ").strip()
        try:
            role, _ = roles[int(choice) - 1]
        except (ValueError, IndexError):
            print("Invalid selection.")
            input("\nPress Enter to continue...")
            return
        
        role_info = ROLE_INFO.get(role, {})
        
        print(f"\n✓ Selected: {role_info.get('title', role.value)}")
        
        # Select scope
        print("\n" + "─" * 70)
        print("SELECT ACCESS SCOPE")
        print("─" * 70)
        print("\nWhich modules should this professional access?\n")
        
        scopes = list(AccessScope)
        selected_scopes = []
        
        for i, scope in enumerate(scopes, 1):
            info = SCOPE_INFO.get(scope, {})
            icon = info.get("icon", "📁")
            print(f"  [{i}] {icon} {info.get('title', scope.value)}")
            print(f"      {info.get('description', '')}")
        
        print("\nEnter numbers separated by commas (e.g., 1,2,3,5):")
        print("Or press Enter for recommended defaults")
        
        scope_input = input("> ").strip()
        
        if scope_input:
            try:
                indices = [int(x.strip()) - 1 for x in scope_input.split(",")]
                selected_scopes = [scopes[i] for i in indices if 0 <= i < len(scopes)]
            except ValueError:
                selected_scopes = scopes[:6]  # Default to first 6
        else:
            # Defaults based on role
            if role == LegalRole.GAL:
                selected_scopes = [AccessScope.AGREEMENT, AccessScope.SCHEDULE, 
                                  AccessScope.CHECKINS, AccessScope.MESSAGES,
                                  AccessScope.CLEARFUND, AccessScope.COMPLIANCE]
            elif role in [LegalRole.ATTORNEY_PETITIONER, LegalRole.ATTORNEY_RESPONDENT]:
                selected_scopes = [AccessScope.AGREEMENT, AccessScope.SCHEDULE,
                                  AccessScope.CHECKINS, AccessScope.MESSAGES,
                                  AccessScope.CLEARFUND, AccessScope.COMPLIANCE]
            else:
                selected_scopes = [AccessScope.AGREEMENT, AccessScope.CHECKINS,
                                  AccessScope.COMPLIANCE]
        
        print(f"\n✓ Selected {len(selected_scopes)} modules")
        
        # Date range
        print("\n" + "─" * 70)
        print("DATE RANGE")
        print("─" * 70)
        print("\nHow far back should they be able to see?\n")
        print("  [1] Last 30 days")
        print("  [2] Last 90 days")
        print("  [3] Last 6 months")
        print("  [4] Last 12 months (full history)")
        
        range_choice = input("\nSelect: ").strip()
        days_back = {"1": 30, "2": 90, "3": 180, "4": 365}.get(range_choice, 180)
        
        date_range_start = date.today() - timedelta(days=days_back)
        date_range_end = date.today()
        
        # Sealed items
        print("\n" + "─" * 70)
        print("SEALED ITEMS")
        print("─" * 70)
        print("\nGrant access to sealed/protected items?")
        print("(Requires court order or mutual consent)")
        print("\n  [y/N]")
        
        sealed = input("> ").strip().lower() == 'y'
        
        # Duration
        default_days = DEFAULT_DURATION.get(role, 90)
        print(f"\n" + "─" * 70)
        print("ACCESS DURATION")
        print("─" * 70)
        print(f"\nDefault for {role_info.get('title', role.value)}: {default_days} days")
        print("Enter custom duration or press Enter for default:")
        
        duration_input = input("> ").strip()
        try:
            duration = int(duration_input) if duration_input else default_days
        except ValueError:
            duration = default_days
        
        # Summary
        clear_screen()
        print("\n" + "═" * 70)
        print("  📋 ACCESS GRANT SUMMARY")
        print("═" * 70)
        
        print(f"""
Role:           {role_info.get('icon', '👤')} {role_info.get('title', role.value)}
Scope:          {len(selected_scopes)} modules
Date Range:     {date_range_start} to {date_range_end}
Sealed Access:  {'Yes' if sealed else 'No'}
Duration:       {duration} days
Expires:        {date.today() + timedelta(days=duration)}
""")
        
        print("─" * 70)
        print("AUTHORIZATION REQUIRED")
        print("─" * 70)
        
        if role in [LegalRole.ATTORNEY_PETITIONER]:
            print(f"\n  ✓ Your consent: {self.petitioner}")
            print("  (Attorney representation - single parent authorization)")
        elif role == LegalRole.COURT_CLERK:
            print("\n  📄 Court order required")
            print("  (Upload court order reference)")
        else:
            print(f"\n  ⏳ Your consent: {self.petitioner}")
            print(f"  ⏳ Other parent: {self.respondent}")
            print("  (Joint consent required for GAL/Mediator)")
        
        print("\n" + "─" * 70)
        print("\nProceed with access grant? (y/n)")
        
        if input("> ").strip().lower() != 'y':
            print("\n🚫 Access grant cancelled.")
            input("\nPress Enter to continue...")
            return
        
        # Generate access
        print("\n⏳ Generating secure access link...")
        time.sleep(1)
        
        new_grant = AccessGrant(
            id=f"GNT-{len(self.grants)+1:03d}",
            case_id=self.case_id,
            role=role,
            scopes=selected_scopes,
            date_range_start=date_range_start,
            date_range_end=date_range_end,
            sealed_items_access=sealed,
            status=AccessStatus.PENDING_VERIFICATION,
            expires_at=datetime.now() + timedelta(days=duration)
        )
        
        access_link = generate_access_link(new_grant)
        
        print(f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  ✅ ACCESS GRANT CREATED                                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Grant ID: {new_grant.id:<56}    ║
║                                                                              ║
║  Access Link:                                                                ║
║  {access_link[:70]:<70}  ║
║                                                                              ║
║  Access Code: {new_grant.access_code:<54}  ║
║                                                                              ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║                                                                              ║
║  NEXT STEPS:                                                                 ║
║  1. Share access link with {role_info.get('title', 'professional'):<40}  ║
║  2. They complete identity verification                                      ║
║  3. They set up MFA (required)                                               ║
║  4. Access activates upon verification                                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")
        
        self.grants.append(new_grant)
        
        input("\nPress Enter to continue...")
    
    def show_legal_dashboard(self, role: LegalRole, grant: AccessGrant, professional: LegalProfessional):
        """Show dashboard from legal professional's perspective"""
        clear_screen()
        
        role_info = ROLE_INFO.get(role, {})
        icon = role_info.get("icon", "👤")
        title = role_info.get("title", role.value)
        
        print(f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  {icon} {title.upper():<67}     ║
║  CommonGround Legal Access Portal                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")
        
        print(f"👤 {professional.full_name}")
        print(f"   {professional.organization}")
        print(f"   Access expires: {grant.expires_at.strftime('%b %d, %Y')} ({grant.days_remaining} days)")
        
        print("\n" + "═" * 70)
        print(f"  CASE: {self.case_name}")
        print(f"  Case ID: {self.case_id}")
        print(f"  Petitioner: {self.petitioner}")
        print(f"  Respondent: {self.respondent}")
        print(f"  Children: {', '.join(self.children)}")
        print("═" * 70)
        
        # Quick compliance stats
        print("""
┌────────────────────────────────────────────────────────────────────────────┐
│  📊 COMPLIANCE SNAPSHOT (Last 90 Days)                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│    Exchange Compliance          Financial Compliance      Communication   │
│    ┌─────────────────┐          ┌─────────────────┐      ┌─────────────┐  │
│    │ Marcus:    96%  │          │ On-time:   92%  │      │ Flags:  30  │  │
│    │ Jennifer:  77%  │          │ Outstanding: $0 │      │ ↑ Trend     │  │
│    └─────────────────┘          └─────────────────┘      └─────────────┘  │
│                                                                            │
│    ⚠️  3 incomplete handoffs    ✓ All payments current   ⚠️ Escalating   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
""")
    
    def legal_menu(self, role: LegalRole):
        """Show menu for legal professional"""
        role_info = ROLE_INFO.get(role, {})
        
        print("─" * 70)
        print("AVAILABLE ACTIONS")
        print("─" * 70)
        print("  [1] 📅 View Schedule & Check-ins")
        print("  [2] 💬 View Communication Log")
        print("  [3] 💰 View Financial Records (ClearFund)")
        print("  [4] 📊 View Compliance Summary")
        print("  [5] 🛡️  View Sentiment Analysis")
        print()
        print("  [6] 📄 Generate Court Packet")
        print()
        
        if role_info.get("can_add_notes"):
            print("  [7] 📝 Add Case Note (Legal-Only)")
            print()
        
        print("  [8] 🔄 Switch View / Return to Parent View")
        print("  [9] 🚪 Exit")
        print()
    
    def view_compliance_summary(self):
        """View compliance summary from legal perspective"""
        clear_screen()
        
        print("""
═══════════════════════════════════════════════════════════════════════════════
  📊 COMPLIANCE SUMMARY
  Case: Doe v. Doe | Period: Last 180 Days
═══════════════════════════════════════════════════════════════════════════════

PARENTING TIME COMPLIANCE
─────────────────────────────────────────────────────────────────────────────────
                                  Marcus          Jennifer
                                  ─────────────── ───────────────
  Scheduled Exchanges:               52              52
  Completed On Time:              50 (96%)        40 (77%)
  Completed Late:                  2 (4%)          7 (13%)
  Incomplete/No-Show:              0 (0%)          5 (10%)

  Trend (Last 30 Days):           Stable ━        Declining ↘

─────────────────────────────────────────────────────────────────────────────────
FINANCIAL COMPLIANCE (ClearFund)
─────────────────────────────────────────────────────────────────────────────────
                                  Marcus          Jennifer
                                  ─────────────── ───────────────
  Requests Submitted:                 8              12
  Approved:                       7 (88%)        11 (92%)
  Paid On Time:                   7 (100%)        9 (82%)
  Currently Outstanding:              $0          $212.50

─────────────────────────────────────────────────────────────────────────────────
COMMUNICATION COMPLIANCE
─────────────────────────────────────────────────────────────────────────────────
                                  Marcus          Jennifer
                                  ─────────────── ───────────────
  Messages Sent:                     347             289
  ARIA Interventions:                 12              18
  Suggestions Accepted:           9 (75%)         5 (28%)
  Suggestions Rejected:           1 (8%)         10 (56%)

  Severe Flags (0.80+):               0               2
  Trend:                          Stable          Escalating ↑

─────────────────────────────────────────────────────────────────────────────────
INCIDENTS & FLAGS
─────────────────────────────────────────────────────────────────────────────────
  Total Flagged Events:               8
  Resolved:                           5
  Pending Review:                     3

  Most Recent:
  • Dec 20: Incomplete handoff (Jennifer no-show)
  • Dec 18: Severe communication flag (Jennifer - rejected intervention)
  • Dec 15: Late handoff (Jennifer - 22 minutes)

═══════════════════════════════════════════════════════════════════════════════
  ⚠️  PATTERN DETECTED: One parent shows declining compliance across
      multiple categories over the last 90 days.
═══════════════════════════════════════════════════════════════════════════════
""")
        
        input("\nPress Enter to continue...")
    
    def view_sentiment_analysis(self):
        """View sentiment analysis from legal perspective"""
        clear_screen()
        
        print("""
═══════════════════════════════════════════════════════════════════════════════
  🛡️  SENTIMENT SHIELD ANALYSIS
  Case: Doe v. Doe | Period: Last 180 Days
═══════════════════════════════════════════════════════════════════════════════

OVERVIEW
─────────────────────────────────────────────────────────────────────────────────
  Total Messages Analyzed:        636
  Messages Flagged:               30 (4.7%)
  Interventions Offered:          30
  Interventions Accepted:         14 (47%)

─────────────────────────────────────────────────────────────────────────────────
GOOD FAITH EFFORT COMPARISON
─────────────────────────────────────────────────────────────────────────────────

  This metric measures willingness to de-escalate when the platform
  detected potentially harmful communication and offered assistance.

                      Flags    Accepted   Rejected   Acceptance Rate
                      ─────    ────────   ────────   ───────────────
  Marcus Williams:      12         9          1           75%  ✓
  Jennifer Williams:    18         5         10           28%  ⚠️

  Assessment:
  • Marcus demonstrates consistent good-faith effort to maintain
    constructive communication (75% acceptance rate)
  • Jennifer shows pattern of rejecting de-escalation assistance
    (56% rejection rate, 2 severe flags)

─────────────────────────────────────────────────────────────────────────────────
SEVERITY BREAKDOWN
─────────────────────────────────────────────────────────────────────────────────

  Level                    Marcus      Jennifer    Description
  ─────────────────────    ──────      ────────    ───────────────────────
  🟡 LOW (0.15-0.30):         8           4        Gentle reminder offered
  🟠 MEDIUM (0.30-0.55):      3           9        Rewrite suggested
  🔴 HIGH (0.55-0.80):        1           4        Strong intervention
  🛑 SEVERE (0.80+):          0           1        Blocked for review

─────────────────────────────────────────────────────────────────────────────────
TREND ANALYSIS (Monthly)
─────────────────────────────────────────────────────────────────────────────────

  Flags per Month:

  Oct 2025:  Marcus ▓▓░░░░░░░░ (2)    Jennifer ▓▓▓▓░░░░░░ (4)
  Nov 2025:  Marcus ▓▓▓░░░░░░░ (3)    Jennifer ▓▓▓▓▓▓░░░░ (6)
  Dec 2025:  Marcus ▓▓▓░░░░░░░ (3)    Jennifer ▓▓▓▓▓▓▓▓░░ (8) ↑

  Jennifer's flag rate increased 100% from October to December.

═══════════════════════════════════════════════════════════════════════════════
  📋 Detailed intervention log available in Court Packet export
═══════════════════════════════════════════════════════════════════════════════
""")
        
        input("\nPress Enter to continue...")
    
    def generate_court_packet(self, professional: LegalProfessional):
        """Generate a court packet"""
        clear_screen()
        
        print("\n" + "═" * 70)
        print("  📄 GENERATE COURT PACKET")
        print("═" * 70)
        
        print("\nSelect packet type:\n")
        print("  [1] 📋 Full Packet - Complete case documentation")
        print("  [2] 📝 Summary Packet - Key metrics and flags only")
        print("  [3] 🔒 Redacted Packet - PII minimized for filing")
        
        packet_choice = input("\nSelect: ").strip()
        packet_type = {"1": "full", "2": "summary", "3": "redacted"}.get(packet_choice, "full")
        
        print("\nDate range:\n")
        print("  [1] Last 30 days")
        print("  [2] Last 90 days")
        print("  [3] Last 6 months")
        print("  [4] Full case history")
        
        range_choice = input("\nSelect: ").strip()
        days = {"1": 30, "2": 90, "3": 180, "4": 365}.get(range_choice, 90)
        
        print("\nInclude sections:\n")
        print("  [Y] Agreement Overview")
        print("  [Y] Compliance Summary")
        print("  [Y] Parenting Time Report")
        print("  [Y] Financial Records")
        print("  [Y] Communication Compliance")
        print("  [Y] Sentiment Analysis (Redacted)")
        print("  [Y] Chain of Custody")
        
        print("\nProceed with these defaults? (y/n)")
        if input("> ").strip().lower() != 'y':
            return
        
        # Generate packet
        print("\n" + "─" * 70)
        print("⏳ Generating court packet...")
        print("─" * 70)
        
        time.sleep(0.5)
        print("  ✓ Compiling agreement records...")
        time.sleep(0.5)
        print("  ✓ Processing check-in ledger...")
        time.sleep(0.5)
        print("  ✓ Analyzing communication patterns...")
        time.sleep(0.5)
        print("  ✓ Generating compliance metrics...")
        time.sleep(0.5)
        print("  ✓ Creating evidence index...")
        time.sleep(0.5)
        print("  ✓ Computing integrity hashes...")
        time.sleep(0.5)
        print("  ✓ Building chain of custody log...")
        time.sleep(0.3)
        
        # Generate hashes
        packet_id = f"PKT-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        content_hash = hashlib.sha256(f"{packet_id}-{datetime.now()}".encode()).hexdigest()
        coc_hash = hashlib.sha256(f"coc-{packet_id}".encode()).hexdigest()
        
        print(f"""

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ✅ COURT PACKET GENERATED                                                   ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Packet ID:     {packet_id:<50}      ║
║  Type:          {packet_type.upper():<50}      ║
║  Generated By:  {professional.full_name:<50}  ║
║  Generated At:  {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'):<50}  ║
║                                                                              ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║                                                                              ║
║  📄 FILES GENERATED                                                          ║
║                                                                              ║
║    court_packet_{packet_id}.pdf                      (24 pages)  ║
║    evidence_index_{packet_id}.pdf                    (156 items) ║
║    chain_of_custody_{packet_id}.pdf                  (verified)  ║
║                                                                              ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║                                                                              ║
║  🔐 INTEGRITY VERIFICATION                                                   ║
║                                                                              ║
║    Content Hash (SHA-256):                                                   ║
║    {content_hash}                          ║
║                                                                              ║
║    Chain of Custody Hash:                                                    ║
║    {coc_hash}                          ║
║                                                                              ║
║    Verification URL:                                                         ║
║    https://verify.commonground.family/{packet_id}               ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  This packet is court-ready and includes:                                    ║
║  • Timestamped evidence with integrity verification                          ║
║  • Complete chain of custody documentation                                   ║
║  • Watermarked for: {professional.full_name:<47}  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")
        
        # Log this export
        log = AccessLog(
            id=f"LOG-{len(self.access_logs)+1:04d}",
            grant_id=self.current_grant.id if self.current_grant else "unknown",
            professional_id=professional.id,
            action="export",
            resource=f"Court Packet ({packet_type})",
            timestamp=datetime.now(),
            details={"packet_id": packet_id, "type": packet_type}
        )
        self.access_logs.insert(0, log)
        
        input("\n[Press Enter to continue]")
    
    def view_access_log(self):
        """View access activity log"""
        clear_screen()
        
        print("\n" + "═" * 70)
        print("  📊 ACCESS ACTIVITY LOG")
        print("═" * 70)
        
        print(f"\n{'Timestamp':<20} {'Professional':<20} {'Action':<10} {'Resource':<20}")
        print("─" * 70)
        
        for log in self.access_logs[:20]:
            prof = self.professionals.get(log.professional_id)
            name = prof.full_name if prof else "Unknown"
            
            action_icon = {
                "login": "🔑",
                "view": "👁️",
                "export": "📄",
                "download": "⬇️"
            }.get(log.action, "•")
            
            print(f"{log.timestamp.strftime('%b %d %I:%M %p'):<20} "
                  f"{name[:18]:<20} "
                  f"{action_icon} {log.action:<7} "
                  f"{log.resource[:20]:<20}")
        
        if len(self.access_logs) > 20:
            print(f"\n  ... and {len(self.access_logs) - 20} more entries")
        
        print("\n" + "─" * 70)
        print("All access activity is logged and included in chain of custody.")
        
        input("\nPress Enter to continue...")
    
    def verification_flow(self):
        """Simulate the verification flow for a new professional"""
        clear_screen()
        
        print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    COMMONGROUND LEGAL ACCESS PORTAL                          ║
║                         Credential Verification                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

You've been granted access to a CommonGround case.
Before accessing case materials, we need to verify your credentials.

─────────────────────────────────────────────────────────────────────────────────
STEP 1 OF 4: Identity Verification
─────────────────────────────────────────────────────────────────────────────────

Please provide government-issued identification:

  [1] Driver's License
  [2] State ID
  [3] Passport

""")
        input("Select ID type: ")
        
        print("\n⏳ Verifying identity...")
        time.sleep(1)
        print("✓ Identity verified: Sarah Mitchell")
        
        print("""
─────────────────────────────────────────────────────────────────────────────────
STEP 2 OF 4: Role Verification
─────────────────────────────────────────────────────────────────────────────────

Your Role: Guardian ad Litem

Please upload your appointment documentation:

  📎 Appointment Letter or Court Order
  
""")
        input("[Simulated upload - Press Enter]: ")
        
        print("\n⏳ Verifying appointment...")
        time.sleep(1)
        print("✓ Appointment verified: Case DOE-2025-FC-00847")
        
        print("""
─────────────────────────────────────────────────────────────────────────────────
STEP 3 OF 4: Multi-Factor Authentication Setup
─────────────────────────────────────────────────────────────────────────────────

MFA is REQUIRED for all legal access.

Select authentication method:

  [1] 📱 Authenticator App (recommended)
  [2] 📞 SMS Code
  [3] 📧 Email Code

""")
        input("Select method: ")
        
        print("\n⏳ Setting up MFA...")
        time.sleep(1)
        print("✓ MFA enabled successfully")
        
        print("""
─────────────────────────────────────────────────────────────────────────────────
STEP 4 OF 4: Access Agreement
─────────────────────────────────────────────────────────────────────────────────

By proceeding, you acknowledge:

  ☑️  Access is read-only and logged
  ☑️  All exports are watermarked with your identity
  ☑️  Access expires on: March 28, 2026
  ☑️  You will maintain confidentiality per court rules
  ☑️  Unauthorized sharing may result in sanctions

""")
        print("[I AGREE] ", end="")
        input()
        
        print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    ✅ VERIFICATION COMPLETE                                  ║
║                                                                              ║
║  Welcome, Sarah Mitchell                                                     ║
║  Role: Guardian ad Litem                                                     ║
║  Case: Doe v. Doe (DOE-2025-FC-00847)                                       ║
║                                                                              ║
║  Your access is now active.                                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")
        
        input("\n[Press Enter to access case dashboard]")
    
    def run_demo_scenario(self):
        """Run a guided demo scenario"""
        clear_screen()
        
        print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🎬 LEGAL ACCESS DEMO SCENARIO                             ║
║                                                                              ║
║  This guided demo shows the complete flow:                                   ║
║                                                                              ║
║    Scene 1: Parent grants GAL access                                         ║
║    Scene 2: GAL completes verification                                       ║
║    Scene 3: GAL reviews case dashboard                                       ║
║    Scene 4: GAL generates court packet                                       ║
║    Scene 5: Court clerk verifies integrity                                   ║
║                                                                              ║
║  Duration: ~5 minutes                                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")
        
        input("\n[Press Enter to begin demo]")
        
        # Scene 1
        clear_screen()
        print("""
═══════════════════════════════════════════════════════════════════════════════
  SCENE 1: Parent Grants GAL Access
═══════════════════════════════════════════════════════════════════════════════

  Marcus Williams opens CommonGround → Case Settings → Add Legal Access

""")
        time.sleep(2)
        
        print("  ➡️  Selects: Guardian ad Litem")
        time.sleep(1)
        print("  ➡️  Sets scope: Schedule, Check-ins, Messages, Financials, Compliance")
        time.sleep(1)
        print("  ➡️  Date range: Last 6 months")
        time.sleep(1)
        print("  ➡️  Duration: 120 days (default for GAL)")
        time.sleep(1)
        
        print("""
  ┌────────────────────────────────────────────────────────────────────────┐
  │  📧 Notification sent to Jennifer Williams for approval               │
  │                                                                        │
  │  "Marcus has requested GAL access for Sarah Mitchell.                  │
  │   Please review and approve within 48 hours."                          │
  └────────────────────────────────────────────────────────────────────────┘
""")
        time.sleep(1)
        print("  ✓ Jennifer approves (joint consent complete)")
        time.sleep(1)
        print("  ✓ Access link generated and sent to GAL")
        
        input("\n[Press Enter for Scene 2]")
        
        # Scene 2
        self.verification_flow()
        
        # Scene 3
        clear_screen()
        print("""
═══════════════════════════════════════════════════════════════════════════════
  SCENE 3: GAL Reviews Case Dashboard  
═══════════════════════════════════════════════════════════════════════════════
""")
        time.sleep(1)
        
        gal = self.professionals.get("PRO-001")
        grant = self.grants[0]
        self.current_professional = gal
        self.current_grant = grant
        
        self.show_legal_dashboard(LegalRole.GAL, grant, gal)
        
        print("\n  The GAL can now see:")
        print("  • Exchange compliance (Marcus 96%, Jennifer 77%)")
        print("  • Financial status (all current)")
        print("  • Communication flags (escalating pattern)")
        
        input("\n[Press Enter for Scene 4]")
        
        # Scene 4
        clear_screen()
        print("""
═══════════════════════════════════════════════════════════════════════════════
  SCENE 4: GAL Generates Court Packet
═══════════════════════════════════════════════════════════════════════════════

  The GAL needs documentation for an upcoming hearing.
  One click generates everything the court needs.

""")
        time.sleep(2)
        
        self.generate_court_packet(gal)
        
        # Scene 5
        clear_screen()
        print("""
═══════════════════════════════════════════════════════════════════════════════
  SCENE 5: Court Clerk Verifies Integrity
═══════════════════════════════════════════════════════════════════════════════

  The court receives the packet. The clerk needs to verify it's authentic.

""")
        time.sleep(2)
        
        print("""
  ┌────────────────────────────────────────────────────────────────────────┐
  │  🔍 PACKET VERIFICATION                                                │
  │                                                                        │
  │  Clerk visits: verify.commonground.family/PKT-20251226-4827           │
  │                                                                        │
  │  ✓ Hash verified - content unchanged                                   │
  │  ✓ Chain of custody confirmed - 14 access events logged               │
  │  ✓ Generated by: Sarah Mitchell (GAL) - credentials verified          │
  │  ✓ Watermark authentic                                                 │
  │                                                                        │
  │  "This packet is verified authentic by CommonGround."                  │
  └────────────────────────────────────────────────────────────────────────┘
""")
        
        time.sleep(2)
        
        print("""
═══════════════════════════════════════════════════════════════════════════════

  🎬 DEMO COMPLETE

  What the court got:
  • Clean, standardized documentation
  • Verified chain of custody
  • No "he said / she said" - just timestamped facts
  • Less time decoding drama, more time deciding outcomes

  Why courts will care:
  • Reduces contested factual disputes
  • Standardizes evidence across cases
  • Improves compliance by making behavior measurable
  • Lowers administrative overhead

═══════════════════════════════════════════════════════════════════════════════
""")
        
        input("\n[Press Enter to return to main menu]")
    
    def run(self):
        """Run the demo"""
        while True:
            if self.view_mode == "parent":
                self.show_parent_dashboard()
                self.parent_menu()
                
                choice = input("Choice: ").strip()
                
                if choice == "1":
                    self.add_legal_access_flow()
                elif choice == "2":
                    # View details
                    self.view_access_log()
                elif choice == "3":
                    self.view_access_log()
                elif choice == "4":
                    print("\n⚠️  Revoke access feature - would confirm and revoke")
                    input("\nPress Enter to continue...")
                elif choice == "5":
                    # Switch to GAL view
                    self.view_mode = "gal"
                    self.current_professional = self.professionals.get("PRO-001")
                    self.current_grant = self.grants[0]
                elif choice == "6":
                    # Switch to Attorney view
                    self.view_mode = "attorney"
                    self.current_professional = self.professionals.get("PRO-002")
                    self.current_grant = self.grants[1]
                elif choice == "7":
                    # Switch to Court view
                    self.view_mode = "court"
                    self.current_professional = self.professionals.get("PRO-003")
                    self.current_grant = self.grants[2]
                elif choice == "8":
                    print("\n👋 Thank you for using CommonGround Legal Access.\n")
                    break
            
            else:
                # Legal professional view
                role_map = {
                    "gal": LegalRole.GAL,
                    "attorney": LegalRole.ATTORNEY_PETITIONER,
                    "court": LegalRole.COURT_CLERK
                }
                role = role_map.get(self.view_mode, LegalRole.GAL)
                
                self.show_legal_dashboard(role, self.current_grant, self.current_professional)
                self.legal_menu(role)
                
                choice = input("Choice: ").strip()
                
                if choice == "1":
                    print("\n📅 Schedule & Check-ins view...")
                    input("\nPress Enter to continue...")
                elif choice == "2":
                    print("\n💬 Communication Log (read-only)...")
                    input("\nPress Enter to continue...")
                elif choice == "3":
                    print("\n💰 ClearFund Financial Records...")
                    input("\nPress Enter to continue...")
                elif choice == "4":
                    self.view_compliance_summary()
                elif choice == "5":
                    self.view_sentiment_analysis()
                elif choice == "6":
                    self.generate_court_packet(self.current_professional)
                elif choice == "7" and ROLE_INFO.get(role, {}).get("can_add_notes"):
                    print("\n📝 Add case note (legal-only visibility)...")
                    input("\nPress Enter to continue...")
                elif choice == "8":
                    self.view_mode = "parent"
                    self.current_professional = None
                    self.current_grant = None
                elif choice == "9":
                    print("\n👋 Thank you for using CommonGround Legal Access.\n")
                    break


def main():
    """Main entry point"""
    clear_screen()
    print_header()
    
    print("""
Welcome to the CommonGround Legal Access Demo.

This demo shows how GALs, Attorneys, Mediators, and Court Staff
can securely access case information.

Options:
  [1] 🎬 Run Guided Demo Scenario (recommended)
  [2] 🔧 Explore Freely
  [3] 🚪 Exit

""")
    
    choice = input("Select: ").strip()
    
    demo = LegalAccessDemo()
    
    if choice == "1":
        demo.run_demo_scenario()
        demo.run()
    elif choice == "2":
        demo.run()
    else:
        print("\n👋 Goodbye!\n")


if __name__ == "__main__":
    main()
