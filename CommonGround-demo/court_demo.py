#!/usr/bin/env python3
"""
CG Court Export Demo
Interactive demo for generating court-ready documentation packages.
"""

import os
import sys
from datetime import datetime, date, timedelta
from typing import List, Tuple
import random
import hashlib
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aria.court_export import (
    PackageType, ClaimType, EventType, CompletionStatus,
    HandoffEvent, SentimentRecord,
    format_package_header, format_toc_investigation, format_toc_court,
    format_disclaimer, format_handoff_compliance_report,
    format_communication_compliance, format_intervention_log_redacted,
    format_parent_impact_summary, format_chain_of_custody,
    generate_integrity_hash
)
from aria.sample_agreements import WILLIAMS_AGREEMENT


def clear_screen():
    """Clear the terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')


def print_header():
    """Print the Court Export header"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║       ██████╗ ██████╗ ██╗   ██╗██████╗ ████████╗                             ║
║      ██╔════╝██╔═══██╗██║   ██║██╔══██╗╚══██╔══╝                             ║
║      ██║     ██║   ██║██║   ██║██████╔╝   ██║                                ║
║      ██║     ██║   ██║██║   ██║██╔══██╗   ██║                                ║
║      ╚██████╗╚██████╔╝╚██████╔╝██║  ██║   ██║                                ║
║       ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝                                ║
║                                                                              ║
║              ███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗              ║
║              ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝              ║
║              █████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║                 ║
║              ██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║                 ║
║              ███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║                 ║
║              ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝                 ║
║                                                                              ║
║                      CG Court Export by CommonGround                         ║
║                                                                              ║
║            "CommonGround does not decide outcomes. We preserve reality."     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)


class CourtExportDemo:
    """Interactive demo for court export functionality"""
    
    def __init__(self):
        self.parent_a_name = "Marcus"
        self.parent_b_name = "Jennifer"
        self.children = ["Eric", "Maya"]
        self.agreement = WILLIAMS_AGREEMENT
        
        # Generate sample data
        self.handoff_events: List[HandoffEvent] = []
        self.sentiment_records: List[SentimentRecord] = []
        
        self._generate_sample_handoffs()
        self._generate_sample_sentiment_records()
    
    def _generate_sample_handoffs(self):
        """Generate sample handoff events for demo"""
        
        # Generate 26 handoffs over ~90 days (every Friday)
        base_date = datetime.now() - timedelta(days=90)
        location = "Vista Sheriff's Station"
        
        event_id = 1
        
        for week in range(26):
            scheduled = base_date + timedelta(days=(week * 7))
            scheduled = scheduled.replace(hour=18, minute=0, second=0, microsecond=0)
            
            # Parent A is always on time or early
            a_delta = random.choice([-8, -6, -5, -4, -2, 0, 2])
            a_checkin = scheduled + timedelta(minutes=a_delta)
            
            # Parent B has some issues - pattern worsens over time
            if week < 10:
                # First third: mostly on time
                b_delta = random.choice([-5, -2, 0, 3, 5, 8])
                b_checkin = scheduled + timedelta(minutes=b_delta)
                b_no_show = False
            elif week < 18:
                # Second third: some lateness
                if random.random() < 0.2:  # 20% chance of issue
                    if random.random() < 0.5:
                        b_no_show = True
                        b_checkin = None
                    else:
                        b_delta = random.randint(18, 25)
                        b_checkin = scheduled + timedelta(minutes=b_delta)
                        b_no_show = False
                else:
                    b_delta = random.choice([-3, 0, 5, 10, 12])
                    b_checkin = scheduled + timedelta(minutes=b_delta)
                    b_no_show = False
            else:
                # Last third: more issues
                if random.random() < 0.35:  # 35% chance of issue
                    if random.random() < 0.6:
                        b_no_show = True
                        b_checkin = None
                    else:
                        b_delta = random.randint(20, 30)
                        b_checkin = scheduled + timedelta(minutes=b_delta)
                        b_no_show = False
                else:
                    b_delta = random.choice([0, 5, 10, 14])
                    b_checkin = scheduled + timedelta(minutes=b_delta)
                    b_no_show = False
            
            # Determine status
            if b_no_show or (b_checkin and (b_checkin - scheduled).total_seconds() / 60 > 15):
                status = CompletionStatus.INCOMPLETE
            elif b_checkin and (b_checkin - scheduled).total_seconds() / 60 > 10:
                status = CompletionStatus.LATE
            else:
                status = CompletionStatus.COMPLETE
            
            event = HandoffEvent(
                id=f"HO-2025-{event_id:04d}",
                event_type=EventType.HANDOFF,
                scheduled_time=scheduled,
                location=location,
                parent_a_checkin=a_checkin,
                parent_b_checkin=b_checkin,
                grace_period_minutes=15,
                status=status,
                children=self.children
            )
            
            self.handoff_events.append(event)
            event_id += 1
    
    def _generate_sample_sentiment_records(self):
        """Generate sample Sentiment Shield records for demo"""
        
        base_date = datetime.now() - timedelta(days=90)
        record_id = 1
        
        # Parent A: 12 flags, 75% acceptance
        for i in range(12):
            days_offset = random.randint(0, 89)
            timestamp = base_date + timedelta(days=days_offset, hours=random.randint(8, 21))
            
            # Mostly low/medium, rarely high
            if random.random() < 0.7:
                level = "LOW"
                score = round(random.uniform(0.15, 0.25), 2)
                categories = random.sample(["DEFENSIVE", "FRUSTRATION", "DISMISSIVE"], 1)
            elif random.random() < 0.9:
                level = "MEDIUM"
                score = round(random.uniform(0.30, 0.45), 2)
                categories = random.sample(["BLAME", "PASSIVE-AGGRESSIVE", "FRUSTRATION"], 2)
            else:
                level = "HIGH"
                score = round(random.uniform(0.55, 0.70), 2)
                categories = random.sample(["HOSTILITY", "BLAME", "ALL CAPS"], 2)
            
            # 75% acceptance
            if random.random() < 0.75:
                action = "accepted"
            elif random.random() < 0.7:
                action = "modified"
            else:
                action = "rejected"
            
            record = SentimentRecord(
                id=f"SS-{record_id:04d}",
                timestamp=timestamp,
                sender="parent_a",
                sender_name=self.parent_a_name,
                toxicity_level=level,
                toxicity_score=score,
                categories=categories,
                original_word_count=random.randint(12, 35),
                suggestion_word_count=random.randint(10, 25),
                action=action,
                final_word_count=random.randint(12, 30) if action == "modified" else None,
                final_score=round(score * 0.4, 2) if action == "modified" else None
            )
            
            self.sentiment_records.append(record)
            record_id += 1
        
        # Parent B: 18 flags, 28% acceptance, escalating pattern
        for i in range(18):
            # Cluster more toward recent dates
            if i < 6:
                days_offset = random.randint(60, 89)  # Earlier
            elif i < 12:
                days_offset = random.randint(30, 59)  # Middle
            else:
                days_offset = random.randint(0, 29)   # Recent (more flags)
            
            timestamp = base_date + timedelta(days=days_offset, hours=random.randint(8, 21))
            
            # More severe distribution
            rand = random.random()
            if rand < 0.25:
                level = "LOW"
                score = round(random.uniform(0.15, 0.25), 2)
                categories = random.sample(["DISMISSIVE", "PASSIVE-AGGRESSIVE"], 1)
            elif rand < 0.65:
                level = "MEDIUM"
                score = round(random.uniform(0.35, 0.50), 2)
                categories = random.sample(["HOSTILITY", "BLAME", "PASSIVE-AGGRESSIVE", "DISMISSIVE"], 2)
            elif rand < 0.90:
                level = "HIGH"
                score = round(random.uniform(0.55, 0.75), 2)
                categories = random.sample(["HOSTILITY", "PROFANITY", "INSULTS", "ALL CAPS"], 2)
            else:
                level = "SEVERE"
                score = round(random.uniform(0.80, 0.92), 2)
                categories = random.sample(["PROFANITY", "INSULTS", "HOSTILITY", "THREATENING"], 3)
            
            # Only 28% acceptance
            rand = random.random()
            if rand < 0.28:
                action = "accepted"
            elif rand < 0.45:
                action = "modified"
            else:
                action = "rejected"
            
            record = SentimentRecord(
                id=f"SS-{record_id:04d}",
                timestamp=timestamp,
                sender="parent_b",
                sender_name=self.parent_b_name,
                toxicity_level=level,
                toxicity_score=score,
                categories=categories,
                original_word_count=random.randint(15, 45),
                suggestion_word_count=random.randint(12, 30),
                action=action,
                final_word_count=random.randint(14, 35) if action == "modified" else None,
                final_score=round(score * 0.5, 2) if action == "modified" else None
            )
            
            self.sentiment_records.append(record)
            record_id += 1
        
        # Sort by timestamp
        self.sentiment_records.sort(key=lambda x: x.timestamp)
    
    def show_dashboard(self):
        """Show the main dashboard"""
        
        # Calculate quick stats
        total_handoffs = len(self.handoff_events)
        incomplete = sum(1 for e in self.handoff_events if e.status == CompletionStatus.INCOMPLETE)
        
        total_interventions = len(self.sentiment_records)
        b_records = [r for r in self.sentiment_records if r.sender == "parent_b"]
        b_rejected = sum(1 for r in b_records if r.action == "rejected")
        
        print(f"\n👤 Viewing as: {self.parent_a_name} (Petitioner)")
        print("\n" + "═" * 70)
        print("  COURT EXPORT DASHBOARD")
        print("═" * 70)
        
        print(f"""
📊 Agreement Status: Williams Family Custody Agreement
   Effective since: January 1, 2025
   Days on platform: 354

⚠️  Potential Issues Detected:
   • {incomplete} incomplete handoff events in last 90 days
   • {b_rejected} rejected de-escalation suggestions ({self.parent_b_name})
   • Communication intervention rate increasing

📋 Available Reports:
""")
    
    def main_menu(self):
        """Show main menu"""
        print("─" * 70)
        print("OPTIONS")
        print("─" * 70)
        print("  [1] 🔍 Request Investigation Package")
        print("  [2] 📋 Request Full Court Package")
        print("  [3] 📊 View Raw Event Data")
        print("  [4] 💬 View Sentiment Shield Summary")
        print("  [5] 🚪 Exit")
        print()
    
    def request_investigation_package(self):
        """Flow for requesting an investigation package"""
        clear_screen()
        
        print("\n" + "═" * 70)
        print("  🔍 REQUEST INVESTIGATION PACKAGE")
        print("═" * 70)
        
        print("\nWhat is your concern?\n")
        print("  [1] 📍 Missed or late handoffs")
        print("  [2] ⏰ Uneven parenting time")
        print("  [3] 💬 Communication non-compliance")
        print("  [4] 💰 Financial non-compliance")
        print("  [5] 📋 General agreement adherence")
        
        choice = input("\nSelect concern: ").strip()
        
        claim_type = {
            "1": ClaimType.MISSED_HANDOFFS,
            "2": ClaimType.UNEVEN_TIME,
            "3": ClaimType.COMMUNICATION,
            "4": ClaimType.FINANCIAL,
            "5": ClaimType.GENERAL_COMPLIANCE
        }.get(choice, ClaimType.GENERAL_COMPLIANCE)
        
        print("\nDate range:")
        print("  [1] Last 30 days")
        print("  [2] Last 60 days")
        print("  [3] Last 90 days (recommended)")
        
        range_choice = input("\nSelect: ").strip()
        days = {"1": 30, "2": 60, "3": 90}.get(range_choice, 90)
        
        date_range = (date.today() - timedelta(days=days), date.today())
        
        # Show disclaimer
        print(format_disclaimer())
        
        print("\nGenerate investigation package? (y/n)")
        if input("> ").strip().lower() != 'y':
            return
        
        self.generate_investigation_package(claim_type, date_range)
    
    def generate_investigation_package(self, claim_type: ClaimType, date_range: Tuple[date, date]):
        """Generate and display an investigation package"""
        
        clear_screen()
        
        # Generate package ID and hash
        package_id = f"INV-2025-{random.randint(10000, 99999)}"
        
        # Create data for hash
        hash_data = {
            "package_id": package_id,
            "claim_type": claim_type.value,
            "date_range": [str(date_range[0]), str(date_range[1])],
            "events": len(self.handoff_events),
            "sentiment_records": len(self.sentiment_records),
            "generated_at": datetime.now().isoformat()
        }
        integrity_hash = generate_integrity_hash(hash_data)
        
        # Print header
        print(format_package_header(
            PackageType.INVESTIGATION,
            package_id,
            self.parent_a_name,
            self.parent_b_name,
            date_range,
            claim_type,
            integrity_hash
        ))
        
        input("\n[Press Enter to view Table of Contents]")
        
        print(format_toc_investigation(claim_type))
        
        input("\n[Press Enter to view Section 1: Event Compliance]")
        clear_screen()
        
        # Section 1: Handoff Compliance
        print(format_handoff_compliance_report(
            self.handoff_events,
            self.parent_a_name,
            self.parent_b_name,
            date_range
        ))
        
        input("\n[Press Enter to view Section 5: Communication Compliance]")
        clear_screen()
        
        # Section 5: Communication Compliance
        print(format_communication_compliance(
            self.sentiment_records,
            self.parent_a_name,
            self.parent_b_name,
            date_range
        ))
        
        input("\n[Press Enter to view Section 6: Intervention Log (Redacted)]")
        clear_screen()
        
        # Section 6: Redacted Intervention Log
        print(format_intervention_log_redacted(
            self.sentiment_records,
            self.parent_a_name,
            self.parent_b_name
        ))
        
        input("\n[Press Enter to view Chain of Custody]")
        clear_screen()
        
        # Chain of Custody
        record_counts = {
            "Event Ledger": len(self.handoff_events),
            "Sentiment Analysis": len(self.sentiment_records),
            "Message Metadata": 636,
            "ClearFund Transactions": 20
        }
        
        print(format_chain_of_custody(
            package_id,
            integrity_hash,
            date_range,
            record_counts
        ))
        
        print("\n" + "─" * 70)
        print("📄 Investigation package complete.")
        print(f"   Package ID: {package_id}")
        print(f"   Ready for download or submission.")
        print("─" * 70)
        
        input("\n[Press Enter to return to menu]")
    
    def request_court_package(self):
        """Flow for requesting a full court package"""
        clear_screen()
        
        print("\n" + "═" * 70)
        print("  📋 REQUEST COURT DOCUMENTATION PACKAGE")
        print("═" * 70)
        
        print("""
This will generate a comprehensive, court-ready summary of all platform
activity under your agreement.

Purpose options:
  [1] 📝 Modification request
  [2] ⚖️  Enforcement action  
  [3] 📊 Custody evaluation support
  [4] 📁 General documentation
""")
        
        purpose = input("Select purpose: ").strip()
        
        print("\nInclude optional sections?")
        print("  [Y/n] Communication compliance (Sentiment Shield stats)")
        include_comm = input("  > ").strip().lower() != 'n'
        
        print("  [Y/n] Financial compliance (ClearFund summary)")
        include_fin = input("  > ").strip().lower() != 'n'
        
        print("  [y/N] Full message logs (requires both parties' consent)")
        include_messages = input("  > ").strip().lower() == 'y'
        
        if include_messages:
            print("\n  ⚠️  Full message logs require written consent from both parties.")
            print("     This demo will show redacted logs only.")
        
        date_range = (date.today() - timedelta(days=365), date.today())
        
        print(format_disclaimer())
        
        print("\nGenerate court package? (y/n)")
        if input("> ").strip().lower() != 'y':
            return
        
        self.generate_court_package(date_range, include_comm, include_fin)
    
    def generate_court_package(self, date_range: Tuple[date, date], 
                               include_comm: bool, include_fin: bool):
        """Generate and display a full court package"""
        
        clear_screen()
        
        # Generate package ID and hash
        package_id = f"CRT-2025-{random.randint(10000, 99999)}"
        
        hash_data = {
            "package_id": package_id,
            "package_type": "court",
            "date_range": [str(date_range[0]), str(date_range[1])],
            "events": len(self.handoff_events),
            "sentiment_records": len(self.sentiment_records),
            "generated_at": datetime.now().isoformat()
        }
        integrity_hash = generate_integrity_hash(hash_data)
        
        # Print header
        print(format_package_header(
            PackageType.COURT,
            package_id,
            self.parent_a_name,
            self.parent_b_name,
            date_range,
            integrity_hash=integrity_hash
        ))
        
        input("\n[Press Enter to view Table of Contents]")
        
        print(format_toc_court())
        
        input("\n[Press Enter to view Section 2: Compliance Summary]")
        clear_screen()
        
        # Section 2: Compliance Summary (the power page)
        print(self._format_compliance_summary(date_range))
        
        if include_comm:
            input("\n[Press Enter to view Section 5: Communication Compliance]")
            clear_screen()
            
            print(format_communication_compliance(
                self.sentiment_records,
                self.parent_a_name,
                self.parent_b_name,
                date_range
            ))
            
            input("\n[Press Enter to view Section 6: Intervention Log (Redacted)]")
            clear_screen()
            
            print(format_intervention_log_redacted(
                self.sentiment_records,
                self.parent_a_name,
                self.parent_b_name
            ))
        
        input("\n[Press Enter to view Section 7: Parent Impact Summary]")
        clear_screen()
        
        # Section 7: Parent Impact Summary
        clearfund_stats = {
            "a_response_rate": 100,
            "a_avg_payment": "Same day",
            "b_response_rate": 83,
            "b_avg_payment": "3.2 days"
        }
        
        print(format_parent_impact_summary(
            self.parent_a_name,
            self.parent_b_name,
            self.handoff_events,
            self.sentiment_records,
            clearfund_stats
        ))
        
        input("\n[Press Enter to view Section 8: Chain of Custody]")
        clear_screen()
        
        # Section 8: Chain of Custody
        record_counts = {
            "Event Ledger": len(self.handoff_events) * 4,  # Full year
            "ClearFund Transactions": 48,
            "Message Metadata": 636,
            "Sentiment Analysis": len(self.sentiment_records) * 4
        }
        
        print(format_chain_of_custody(
            package_id,
            integrity_hash,
            date_range,
            record_counts
        ))
        
        print("\n" + "═" * 70)
        print("📄 COURT PACKAGE COMPLETE")
        print("═" * 70)
        print(f"   Package ID: {package_id}")
        print(f"   Integrity Hash: {integrity_hash[:32]}...")
        print(f"   Sections: 8")
        print(f"   Pages: ~24")
        print()
        print("   This package is ready for:")
        print("   • Attorney review")
        print("   • Court filing")
        print("   • Mediation support")
        print("═" * 70)
        
        input("\n[Press Enter to return to menu]")
    
    def _format_compliance_summary(self, date_range: Tuple[date, date]) -> str:
        """Format the compliance summary (power page)"""
        
        # Calculate stats
        total_events = len(self.handoff_events)
        
        a_on_time = sum(1 for e in self.handoff_events 
                       if e.parent_a_checkin and e.parent_a_minutes_delta <= 15)
        a_late = sum(1 for e in self.handoff_events 
                    if e.parent_a_checkin and e.parent_a_minutes_delta > 15)
        a_no_show = sum(1 for e in self.handoff_events if not e.parent_a_checkin)
        
        b_on_time = sum(1 for e in self.handoff_events 
                       if e.parent_b_checkin and e.parent_b_minutes_delta <= 15)
        b_late = sum(1 for e in self.handoff_events 
                    if e.parent_b_checkin and e.parent_b_minutes_delta > 15)
        b_no_show = sum(1 for e in self.handoff_events if not e.parent_b_checkin)
        
        # Sentiment stats
        a_records = [r for r in self.sentiment_records if r.sender == "parent_a"]
        b_records = [r for r in self.sentiment_records if r.sender == "parent_b"]
        
        a_accepted = sum(1 for r in a_records if r.action == "accepted")
        b_accepted = sum(1 for r in b_records if r.action == "accepted")
        
        lines = [
            "",
            "═" * 78,
            "SECTION 2: COMPLIANCE SUMMARY",
            f"Period: {date_range[0].strftime('%B %d, %Y')} - {date_range[1].strftime('%B %d, %Y')}",
            "═" * 78,
            "",
            f"                                  {self.parent_a_name:<15} {self.parent_b_name:<15}",
            f"                                  {'─'*15} {'─'*15}",
            "",
            "PARENTING TIME",
            f"  Scheduled exchanges:            {total_events:>6}          {total_events:>6}",
            f"  Completed on time:              {a_on_time:>3} ({a_on_time/total_events*100:.0f}%)        {b_on_time:>3} ({b_on_time/total_events*100:.0f}%)",
            f"  Completed late:                 {a_late:>3} ({a_late/total_events*100:.0f}%)         {b_late:>3} ({b_late/total_events*100:.0f}%)",
            f"  Incomplete:                     {a_no_show:>3} ({a_no_show/total_events*100:.0f}%)         {b_no_show:>3} ({b_no_show/total_events*100:.0f}%)",
            "",
            "FINANCIAL (CLEARFUND)",
            f"  Requests received:              {8:>6}          {12:>6}",
            f"  Approved:                       {7:>3} ({88:.0f}%)        {11:>3} ({92:.0f}%)",
            f"  Paid on time:                   {7:>3} ({100:.0f}%)        {9:>3} ({82:.0f}%)",
            f"  Currently outstanding:          {'$0':>6}          {'$212.50':>6}",
            "",
            "COMMUNICATION",
            f"  Messages sent:                  {347:>6}          {289:>6}",
            f"  ARIA interventions:             {len(a_records):>6}          {len(b_records):>6}",
        ]
        
        if len(a_records) > 0 and len(b_records) > 0:
            a_pct = a_accepted / len(a_records) * 100
            b_pct = b_accepted / len(b_records) * 100
            lines.extend([
                f"  Suggestions accepted:           {a_accepted:>3} ({a_pct:.0f}%)        {b_accepted:>3} ({b_pct:.0f}%)",
                f"  Avg response time:              {'2.1 hrs':>6}          {'4.8 hrs':>6}",
            ])
        
        # Calculate overall compliance
        a_compliance = (a_on_time / total_events * 0.5 + 
                       (a_accepted / len(a_records) if a_records else 1) * 0.3 +
                       0.2) * 100  # Base for financial
        
        b_compliance = (b_on_time / total_events * 0.5 + 
                       (b_accepted / len(b_records) if b_records else 1) * 0.3 +
                       0.15) * 100
        
        lines.extend([
            "",
            "─" * 78,
            "OVERALL COMPLIANCE SCORE*",
            "─" * 78,
            f"  {self.parent_a_name + ':':<30} {a_compliance:>5.0f}%",
            f"  {self.parent_b_name + ':':<30} {b_compliance:>5.0f}%",
            "",
            "  *Weighted composite: 50% parenting time, 30% communication, 20% financial",
            "",
            "═" * 78,
        ])
        
        return "\n".join(lines)
    
    def view_raw_events(self):
        """View raw event data"""
        clear_screen()
        
        print("\n" + "═" * 70)
        print("  📊 RAW EVENT DATA")
        print("═" * 70)
        
        print(f"\nHandoff Events: {len(self.handoff_events)}")
        print("─" * 70)
        print(f"{'Date':<12} {'Time':<10} {self.parent_a_name:<15} {self.parent_b_name:<15} {'Status':<12}")
        print("─" * 70)
        
        for event in self.handoff_events[-15:]:  # Show last 15
            a_status = event.parent_a_status[:15] if event.parent_a_checkin else "NO SHOW"
            b_status = event.parent_b_status[:15] if event.parent_b_checkin else "NO SHOW"
            
            status_icon = {
                CompletionStatus.COMPLETE: "✓",
                CompletionStatus.LATE: "⚠️",
                CompletionStatus.INCOMPLETE: "❌"
            }.get(event.status, "?")
            
            print(f"{event.scheduled_time.strftime('%b %d'):<12} "
                  f"{event.scheduled_time.strftime('%I:%M %p'):<10} "
                  f"{a_status:<15} "
                  f"{b_status:<15} "
                  f"{status_icon}")
        
        if len(self.handoff_events) > 15:
            print(f"\n  ... showing last 15 of {len(self.handoff_events)} events")
        
        input("\n[Press Enter to return to menu]")
    
    def view_sentiment_summary(self):
        """View Sentiment Shield summary"""
        clear_screen()
        
        print("\n" + "═" * 70)
        print("  💬 SENTIMENT SHIELD SUMMARY")
        print("═" * 70)
        
        a_records = [r for r in self.sentiment_records if r.sender == "parent_a"]
        b_records = [r for r in self.sentiment_records if r.sender == "parent_b"]
        
        print(f"\n{self.parent_a_name}: {len(a_records)} interventions")
        print("─" * 40)
        a_accepted = sum(1 for r in a_records if r.action == "accepted")
        a_modified = sum(1 for r in a_records if r.action == "modified")
        a_rejected = sum(1 for r in a_records if r.action == "rejected")
        
        if len(a_records) > 0:
            print(f"  ✅ Accepted: {a_accepted} ({a_accepted/len(a_records)*100:.0f}%)")
            print(f"  ✏️  Modified: {a_modified} ({a_modified/len(a_records)*100:.0f}%)")
            print(f"  ❌ Rejected: {a_rejected} ({a_rejected/len(a_records)*100:.0f}%)")
        
        print(f"\n{self.parent_b_name}: {len(b_records)} interventions")
        print("─" * 40)
        b_accepted = sum(1 for r in b_records if r.action == "accepted")
        b_modified = sum(1 for r in b_records if r.action == "modified")
        b_rejected = sum(1 for r in b_records if r.action == "rejected")
        
        if len(b_records) > 0:
            print(f"  ✅ Accepted: {b_accepted} ({b_accepted/len(b_records)*100:.0f}%)")
            print(f"  ✏️  Modified: {b_modified} ({b_modified/len(b_records)*100:.0f}%)")
            print(f"  ❌ Rejected: {b_rejected} ({b_rejected/len(b_records)*100:.0f}%)")
        
        print("\n" + "─" * 70)
        print("SEVERITY BREAKDOWN")
        print("─" * 70)
        
        for level in ["LOW", "MEDIUM", "HIGH", "SEVERE"]:
            a_count = sum(1 for r in a_records if r.toxicity_level == level)
            b_count = sum(1 for r in b_records if r.toxicity_level == level)
            
            icon = {"LOW": "🟡", "MEDIUM": "🟠", "HIGH": "🔴", "SEVERE": "🛑"}[level]
            print(f"  {icon} {level:<8}  {self.parent_a_name}: {a_count:<3}  {self.parent_b_name}: {b_count:<3}")
        
        print("\n" + "─" * 70)
        print("WHAT THIS MEANS FOR COURT:")
        print("─" * 70)
        print(f"""
  • Acceptance rate shows willingness to de-escalate
  • {self.parent_a_name}'s {a_accepted/len(a_records)*100:.0f}% acceptance demonstrates good faith effort
  • {self.parent_b_name}'s {b_rejected/len(b_records)*100:.0f}% rejection rate shows pattern of hostility
  • Severity levels indicate intensity of concerning language
  • All data is preserved and timestamped for verification
""")
        
        input("\n[Press Enter to return to menu]")
    
    def run(self):
        """Run the demo"""
        while True:
            clear_screen()
            print_header()
            self.show_dashboard()
            self.main_menu()
            
            choice = input("Choice: ").strip()
            
            if choice == "1":
                self.request_investigation_package()
            elif choice == "2":
                self.request_court_package()
            elif choice == "3":
                self.view_raw_events()
            elif choice == "4":
                self.view_sentiment_summary()
            elif choice == "5":
                print("\n" + "═" * 70)
                print("  CommonGround does not decide outcomes. We preserve reality.")
                print("═" * 70)
                print("\n👋 Thank you for using Court Export.\n")
                break


def main():
    """Main entry point"""
    demo = CourtExportDemo()
    demo.run()


if __name__ == "__main__":
    main()
