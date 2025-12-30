#!/usr/bin/env python3
"""
CommonGround Custody Agreement Generator - Full Demo with Database
This script demonstrates the complete flow with agreement tracking and versioning.
"""

import os
import sys
import json
from typing import List, Dict, Optional
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.models import (
    DatabaseManager, Agreement, AgreementVersion, AgreementStatus,
    ApprovalStatus, ActivationStatus, ApprovalHistory,
    format_agreement_display, format_version_display, format_approval_status, get_db
)
from agents.detailed_prompts import (
    DETAILED_SECTION_PROMPTS,
    get_detailed_sections,
    get_progress_bar,
    get_section_number
)
from agents.translator import TranslatorAgent, TranslatorRevisionAgent
from agents.extractor import ExtractorAgent
from agents.document_generator import LegalDocumentGenerator


# ============================================================================
# MAIN APPLICATION CLASS
# ============================================================================

class CustodyAgreementApp:
    """
    Main application class for the custody agreement generator.
    Handles the full flow including database, interviews, and document generation.
    """
    
    def __init__(self, db_path: str = "custody_agreements.db"):
        """Initialize the application"""
        self.db = DatabaseManager(db_path)
        self.doc_generator = LegalDocumentGenerator()
        
        # Current working agreement/version
        self.current_agreement: Optional[Agreement] = None
        self.current_version: Optional[AgreementVersion] = None
        
        # LLM setup
        self.llm = None
        self.use_real_llm = False
        self._setup_llm()
    
    def _setup_llm(self):
        """Set up the LLM if API keys are available"""
        api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")
        
        if api_key:
            self.use_real_llm = True
            if os.environ.get("OPENAI_API_KEY"):
                from langchain_openai import ChatOpenAI
                self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
            else:
                from langchain_anthropic import ChatAnthropic
                self.llm = ChatAnthropic(model="claude-3-5-sonnet-20241022", temperature=0)
            
            # Initialize agents
            self.translator = TranslatorAgent(self.llm)
            self.translator_revision = TranslatorRevisionAgent(self.llm)
            self.extractor = ExtractorAgent(self.llm)
    
    # ==================== UI HELPERS ====================
    
    def clear_screen(self):
        """Clear the terminal screen"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def print_header(self, title: str):
        """Print a styled header"""
        print("\n" + "═" * 70)
        print(f"  {title}")
        print("═" * 70 + "\n")
    
    def print_subheader(self, title: str):
        """Print a styled subheader"""
        print("\n" + "─" * 60)
        print(f"  {title}")
        print("─" * 60 + "\n")
    
    def wait_for_enter(self, message: str = "Press Enter to continue..."):
        """Wait for user to press Enter"""
        input(f"\n[{message}] ")
    
    def get_menu_choice(self, options: List[str], prompt: str = "Your choice: ") -> int:
        """Display menu and get user choice"""
        for i, option in enumerate(options, 1):
            print(f"  {i}. {option}")
        
        while True:
            try:
                choice = int(input(f"\n{prompt}"))
                if 1 <= choice <= len(options):
                    return choice
            except ValueError:
                pass
            print("Please enter a valid number.")
    
    # ==================== MAIN MENU ====================
    
    def show_main_menu(self):
        """Display the main menu"""
        self.clear_screen()
        
        # Check for expired versions
        expired = self.db.check_and_expire_versions()
        if expired:
            print(f"⚠️ {len(expired)} agreement(s) have expired and been marked inactive.\n")
        
        print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██████╗ ██████╗ ███╗   ███╗███╗   ███╗ ██████╗ ███╗   ██╗                  ║
║  ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔═══██╗████╗  ██║                  ║
║  ██║     ██║   ██║██╔████╔██║██╔████╔██║██║   ██║██╔██╗ ██║                  ║
║  ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██║   ██║██║╚██╗██║                  ║
║  ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║╚██████╔╝██║ ╚████║                  ║
║   ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝                  ║
║                                                                              ║
║   ██████╗ ██████╗  ██████╗ ██╗   ██╗███╗   ██╗██████╗                        ║
║  ██╔════╝ ██╔══██╗██╔═══██╗██║   ██║████╗  ██║██╔══██╗                       ║
║  ██║  ███╗██████╔╝██║   ██║██║   ██║██╔██╗ ██║██║  ██║                       ║
║  ██║   ██║██╔══██╗██║   ██║██║   ██║██║╚██╗██║██║  ██║                       ║
║  ╚██████╔╝██║  ██║╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝                       ║
║   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝                        ║
║                                                                              ║
║                    Custody Agreement Generator v2.0                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """)
        
        # Show statistics
        stats = self.db.get_statistics()
        print(f"  📊 {stats['total_agreements']} Agreements | {stats['total_versions']} Versions | 🟢 {stats['active_versions']} Active")
        
        if stats['pending_approvals'] > 0:
            print(f"  ⚠️  {stats['pending_approvals']} Pending Approval(s)")
        
        if self.use_real_llm:
            print("  ✓ AI Mode: Active")
        else:
            print("  ⚠ AI Mode: Demo (set OPENAI_API_KEY for full AI)")
        print()
        
        choice = self.get_menu_choice([
            "📝 Create New Agreement",
            "📂 View All Agreements",
            "🔍 Open Agreement by ID",
            "⏳ View Pending Approvals",
            "🟢 View Active Agreements",
            "📊 View Statistics",
            "🚪 Exit"
        ])
        
        return choice
    
    # ==================== AGREEMENT LIST ====================
    
    def show_all_agreements(self):
        """Display all agreements"""
        self.clear_screen()
        self.print_header("ALL CUSTODY AGREEMENTS")
        
        agreements = self.db.get_all_agreements()
        
        if not agreements:
            print("  No agreements found. Create your first one!\n")
            self.wait_for_enter()
            return
        
        for agreement in agreements:
            print(format_agreement_display(agreement))
        
        print("\n" + "─" * 60)
        choice = self.get_menu_choice([
            "Open an Agreement",
            "Back to Main Menu"
        ])
        
        if choice == 1:
            agreement_id = input("\nEnter Agreement ID: ")
            try:
                self.open_agreement(int(agreement_id))
            except ValueError:
                print("Invalid ID")
                self.wait_for_enter()
    
    # ==================== SINGLE AGREEMENT VIEW ====================
    
    def open_agreement(self, agreement_id: int):
        """Open and display a single agreement"""
        agreement = self.db.get_agreement(agreement_id)
        
        if not agreement:
            print(f"\nAgreement #{agreement_id} not found.")
            self.wait_for_enter()
            return
        
        self.current_agreement = agreement
        
        while True:
            self.clear_screen()
            self.print_header(f"AGREEMENT #{agreement.id}")
            
            print(format_agreement_display(agreement))
            
            # Show versions
            print("\n  📑 VERSIONS:")
            for version in sorted(agreement.versions, key=lambda v: v.version_number, reverse=True):
                print(format_version_display(version))
            
            print("\n" + "─" * 60)
            choice = self.get_menu_choice([
                "📝 Create New Version (from scratch)",
                "📋 Create New Version (based on existing)",
                "📄 View Version Details",
                "📜 Generate Document for Version",
                "📨 Submit Version for Approval",
                "✅ Record Parent Approval/Rejection",
                "🟢 Activate Approved Version",
                "🔴 Deactivate/Terminate Version",
                "📊 View Approval Status",
                "🗑️ Delete Agreement",
                "⬅️ Back to Main Menu"
            ])
            
            if choice == 1:
                self.create_new_version(agreement.id)
            elif choice == 2:
                version_num = input("Base on which version number? ")
                try:
                    base_version = next((v for v in agreement.versions if v.version_number == int(version_num)), None)
                    if base_version:
                        self.create_new_version(agreement.id, base_version.id)
                    else:
                        print("Version not found")
                        self.wait_for_enter()
                except ValueError:
                    print("Invalid version number")
                    self.wait_for_enter()
            elif choice == 3:
                version_num = input("View which version number? ")
                try:
                    version = next((v for v in agreement.versions if v.version_number == int(version_num)), None)
                    if version:
                        self.view_version(version)
                    else:
                        print("Version not found")
                        self.wait_for_enter()
                except ValueError:
                    print("Invalid version number")
                    self.wait_for_enter()
            elif choice == 4:
                version_num = input("Generate document for which version? ")
                try:
                    version = next((v for v in agreement.versions if v.version_number == int(version_num)), None)
                    if version:
                        self.generate_document(version)
                    else:
                        print("Version not found")
                        self.wait_for_enter()
                except ValueError:
                    print("Invalid version number")
                    self.wait_for_enter()
            elif choice == 5:
                # Submit for approval
                version_num = input("Submit which version for approval? ")
                try:
                    version = next((v for v in agreement.versions if v.version_number == int(version_num)), None)
                    if version:
                        self.submit_for_approval(version)
                    else:
                        print("Version not found")
                        self.wait_for_enter()
                except ValueError:
                    print("Invalid version number")
                    self.wait_for_enter()
            elif choice == 6:
                # Record approval
                version_num = input("Record approval for which version? ")
                try:
                    version = next((v for v in agreement.versions if v.version_number == int(version_num)), None)
                    if version:
                        self.record_approval(version)
                    else:
                        print("Version not found")
                        self.wait_for_enter()
                except ValueError:
                    print("Invalid version number")
                    self.wait_for_enter()
            elif choice == 7:
                # Activate version
                version_num = input("Activate which version? ")
                try:
                    version = next((v for v in agreement.versions if v.version_number == int(version_num)), None)
                    if version:
                        self.activate_version(version)
                    else:
                        print("Version not found")
                        self.wait_for_enter()
                except ValueError:
                    print("Invalid version number")
                    self.wait_for_enter()
            elif choice == 8:
                # Deactivate version
                version_num = input("Deactivate which version? ")
                try:
                    version = next((v for v in agreement.versions if v.version_number == int(version_num)), None)
                    if version:
                        self.deactivate_version(version)
                    else:
                        print("Version not found")
                        self.wait_for_enter()
                except ValueError:
                    print("Invalid version number")
                    self.wait_for_enter()
            elif choice == 9:
                # View approval status
                version_num = input("View approval status for which version? ")
                try:
                    version = next((v for v in agreement.versions if v.version_number == int(version_num)), None)
                    if version:
                        self.view_approval_status(version)
                    else:
                        print("Version not found")
                        self.wait_for_enter()
                except ValueError:
                    print("Invalid version number")
                    self.wait_for_enter()
            elif choice == 10:
                confirm = input("Are you sure you want to delete this agreement? (yes/no): ")
                if confirm.lower() == "yes":
                    self.db.delete_agreement(agreement.id)
                    print("Agreement deleted.")
                    self.wait_for_enter()
                    return
            elif choice == 11:
                return
            
            # Refresh agreement data
            agreement = self.db.get_agreement(agreement_id)
    
    # ==================== VERSION DETAIL ====================
    
    def view_version(self, version: AgreementVersion):
        """View details of a specific version"""
        self.clear_screen()
        self.print_header(f"VERSION {version.version_number} DETAILS")
        
        print(f"  Created: {version.created_at.strftime('%Y-%m-%d %H:%M')}")
        print(f"  By: {version.created_by or 'Unknown'}")
        print(f"  Status: {version.status}")
        print(f"  Change Summary: {version.change_summary}")
        
        if version.summary_text:
            print("\n" + "─" * 60)
            print("  HUMAN-READABLE SUMMARY:")
            print("─" * 60)
            print(version.summary_text[:2000])
            if len(version.summary_text) > 2000:
                print("... [truncated]")
        
        if version.extracted_data:
            print("\n" + "─" * 60)
            print("  EXTRACTED DATA:")
            print("─" * 60)
            print(json.dumps(version.extracted_data, indent=2)[:1500])
        
        self.wait_for_enter()
    
    # ==================== CREATE NEW AGREEMENT ====================
    
    def create_new_agreement(self):
        """Create a new agreement from scratch"""
        self.clear_screen()
        self.print_header("CREATE NEW AGREEMENT")
        
        print("Let's set up your new custody agreement.\n")
        
        # Get basic info
        petitioner_name = input("Your full name: ")
        petitioner_role = input("Are you mom or dad? (mother/father): ").lower()
        if petitioner_role not in ["mother", "father"]:
            petitioner_role = "father"  # default
        
        respondent_name = input("Other parent's name (or press Enter to skip): ") or None
        respondent_role = "mother" if petitioner_role == "father" else "father"
        
        # Get children
        children = []
        while True:
            child_name = input("Child's name (or press Enter if done): ")
            if not child_name:
                break
            child_age = input(f"  {child_name}'s age: ")
            children.append({"name": child_name, "age": child_age})
        
        # State/County
        state = input("State (e.g., California): ") or None
        county = input("County (e.g., Los Angeles): ") or None
        
        # Create the agreement
        agreement = self.db.create_agreement(
            petitioner_name=petitioner_name,
            petitioner_role=petitioner_role.upper(),
            respondent_name=respondent_name,
            respondent_role=respondent_role.upper(),
            children=children,
            state=state,
            county=county
        )
        
        print(f"\n✓ Agreement #{agreement.id} created!")
        self.current_agreement = agreement
        
        # Ask if they want to start the interview
        choice = self.get_menu_choice([
            "Start Detailed Interview Now",
            "Go to Agreement (add details later)"
        ])
        
        if choice == 1:
            self.run_detailed_interview(agreement.current_version)
        else:
            self.open_agreement(agreement.id)
    
    # ==================== CREATE NEW VERSION ====================
    
    def create_new_version(self, agreement_id: int, base_version_id: int = None):
        """Create a new version of an agreement"""
        change_summary = input("What's changing in this version? ")
        
        version = self.db.create_version(
            agreement_id=agreement_id,
            created_by=self.current_agreement.petitioner_name if self.current_agreement else "User",
            change_summary=change_summary,
            base_version_id=base_version_id
        )
        
        print(f"\n✓ Version {version.version_number} created!")
        
        choice = self.get_menu_choice([
            "Start Detailed Interview",
            "Return to Agreement"
        ])
        
        if choice == 1:
            self.run_detailed_interview(version)
    
    # ==================== DETAILED INTERVIEW ====================
    
    def run_detailed_interview(self, version: AgreementVersion):
        """Run the comprehensive detailed interview"""
        self.current_version = version
        gathered_data = version.conversation_data or {}
        
        sections = get_detailed_sections()
        
        for section in sections:
            self.clear_screen()
            
            # Show progress
            print(get_progress_bar(section))
            
            # Show section prompt
            prompt = DETAILED_SECTION_PROMPTS.get(section, "")
            print(prompt)
            
            if section == "INTRO":
                self.wait_for_enter("Press Enter when ready to continue...")
                continue
            
            if section == "REVIEW":
                # Move to summary phase
                break
            
            # Gather response
            print("\nYour response (press Enter twice when done):")
            lines = []
            while True:
                line = input()
                if line == "":
                    if lines:
                        break
                else:
                    lines.append(line)
            
            response = "\n".join(lines)
            gathered_data[section] = response
            
            # Save to database
            self.db.update_version(version.id, conversation_data=gathered_data)
            
            # Log conversation
            self.db.log_conversation(
                version_id=version.id,
                section=section,
                role="user",
                message=response
            )
            
            print("\n✓ Got it, saved!")
        
        # Generate summary
        self.generate_summary(version, gathered_data)
    
    # ==================== SUMMARY GENERATION ====================
    
    def generate_summary(self, version: AgreementVersion, gathered_data: Dict):
        """Generate and review the summary"""
        self.clear_screen()
        self.print_header("GENERATING YOUR SUMMARY")
        
        print("Creating a human-readable summary of your agreement...\n")
        
        if self.use_real_llm:
            summary = self.translator.translate_from_dict(gathered_data)
        else:
            summary = self._generate_demo_summary(gathered_data)
        
        # Save summary
        self.db.update_version(version.id, summary_text=summary)
        
        # Review loop
        while True:
            self.clear_screen()
            self.print_header("REVIEW YOUR SUMMARY")
            
            print(summary)
            
            print("\n" + "─" * 60)
            choice = self.get_menu_choice([
                "✓ Approve - Everything looks correct",
                "✎ Request Changes",
                "✗ Start Over"
            ])
            
            if choice == 1:
                # Approved
                self.db.update_version(
                    version.id,
                    summary_approved=True,
                    summary_approved_at=datetime.utcnow()
                )
                print("\n✓ Summary approved!")
                self.extract_and_generate(version, summary)
                return
            
            elif choice == 2:
                # Request changes
                changes = input("\nWhat changes would you like? ")
                
                if self.use_real_llm:
                    summary = self.translator_revision.revise(summary, changes)
                else:
                    summary += f"\n\n** REVISION: {changes} **"
                
                self.db.update_version(version.id, summary_text=summary)
            
            elif choice == 3:
                # Start over
                confirm = input("Start the interview over? (yes/no): ")
                if confirm.lower() == "yes":
                    self.db.update_version(version.id, conversation_data={})
                    self.run_detailed_interview(version)
                    return
    
    def _generate_demo_summary(self, gathered_data: Dict) -> str:
        """Generate a demo summary without LLM"""
        sections = []
        
        sections.append("=" * 70)
        sections.append("                    YOUR CUSTODY AGREEMENT SUMMARY")
        sections.append("=" * 70 + "\n")
        
        for section_name, data in gathered_data.items():
            if data:
                sections.append(f"\n**{section_name.replace('_', ' ').title()}**")
                sections.append(data[:500])
                if len(data) > 500:
                    sections.append("...")
        
        sections.append("\n" + "=" * 70)
        
        return "\n".join(sections)
    
    # ==================== EXTRACTION & DOCUMENT ====================
    
    def extract_and_generate(self, version: AgreementVersion, summary: str):
        """Extract structured data and generate document"""
        self.clear_screen()
        self.print_header("EXTRACTING STRUCTURED DATA")
        
        print("Converting your summary to structured data...\n")
        
        if self.use_real_llm:
            extracted_data = self.extractor.extract_to_legal_format(summary)
        else:
            extracted_data = self._generate_demo_extraction()
        
        # Save extracted data
        self.db.update_version(version.id, extracted_data=extracted_data)
        
        print("✓ Data extracted!\n")
        print(json.dumps(extracted_data, indent=2)[:1500])
        
        self.wait_for_enter()
        
        # Generate document
        self.generate_document(version)
    
    def _generate_demo_extraction(self) -> dict:
        """Generate demo extracted data"""
        if self.current_agreement:
            return {
                "petitioner": {
                    "name": self.current_agreement.petitioner_name,
                    "relationship": self.current_agreement.petitioner_role
                },
                "respondent": {
                    "name": self.current_agreement.respondent_name or "[Other Parent]",
                    "relationship": self.current_agreement.respondent_role or "MOTHER"
                },
                "minor_children": self.current_agreement.children or [{"name": "Child", "age": None}],
                "custody_arrangement": {
                    "type": "JOINT LEGAL AND PHYSICAL CUSTODY",
                    "time_share": {"mother_percentage": 50, "father_percentage": 50},
                    "schedule": "As agreed by the parties"
                },
                "exchange_provisions": {},
                "child_support": {"status": "TO BE DETERMINED"},
                "transportation": {"arrangement": "To be agreed upon"},
                "additional_provisions": None
            }
        return {}
    
    def generate_document(self, version: AgreementVersion):
        """Generate the legal document"""
        self.clear_screen()
        self.print_header("GENERATING LEGAL DOCUMENT")
        
        if not version.extracted_data:
            print("No extracted data available. Please complete the interview first.")
            self.wait_for_enter()
            return
        
        print("Generating formal legal document...\n")
        
        # Generate document
        document = self.doc_generator.generate(version.extracted_data)
        
        # Save to version
        self.db.update_version(
            version.id,
            document_text=document,
            document_generated_at=datetime.utcnow(),
            status=AgreementStatus.DRAFT.value
        )
        
        # Save to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"custody_agreement_{self.current_agreement.id}_v{version.version_number}_{timestamp}.txt"
        filepath = os.path.join(os.getcwd(), filename)
        
        with open(filepath, 'w') as f:
            f.write(document)
        
        print("✓ Document generated!\n")
        print(document[:2000])
        print("\n... [Document continues] ...\n")
        
        print(f"📄 Saved to: {filepath}")
        
        # Ask about submitting for approval
        print("\n" + "─" * 60)
        submit = input("\nSubmit this version for parent approval? (yes/no): ")
        if submit.lower() == "yes":
            self.submit_for_approval(version)
        else:
            self.wait_for_enter()
    
    # ==================== APPROVAL WORKFLOW ====================
    
    def submit_for_approval(self, version: AgreementVersion):
        """Submit a version for both parents to approve"""
        self.clear_screen()
        self.print_header("SUBMIT FOR APPROVAL")
        
        if not version.document_text:
            print("❌ Cannot submit for approval - no document generated yet.")
            print("   Please generate the document first.")
            self.wait_for_enter()
            return
        
        print(f"Submitting Version {version.version_number} for parent approval...\n")
        
        # Submit for approval
        self.db.submit_for_approval(version.id)
        
        print("✓ Version submitted for approval!\n")
        print("Both parents must now review and accept or reject this agreement.")
        print()
        print("  PETITIONER ({}) - ⏳ Pending".format(self.current_agreement.petitioner_name))
        print("  RESPONDENT ({}) - ⏳ Pending".format(self.current_agreement.respondent_name or "Other Parent"))
        print()
        print("Use 'Record Parent Approval/Rejection' to record each parent's decision.")
        
        self.wait_for_enter()
    
    def record_approval(self, version: AgreementVersion):
        """Record a parent's approval or rejection"""
        self.clear_screen()
        self.print_header("RECORD PARENT APPROVAL")
        
        if version.status != AgreementStatus.PENDING_APPROVAL.value:
            print("❌ This version is not pending approval.")
            print(f"   Current status: {version.status}")
            self.wait_for_enter()
            return
        
        # Show current approval status
        print(format_approval_status(version))
        
        print("\n" + "─" * 60)
        print("\nWhich parent is responding?")
        parent_choice = self.get_menu_choice([
            f"Petitioner ({self.current_agreement.petitioner_name})",
            f"Respondent ({self.current_agreement.respondent_name or 'Other Parent'})",
            "Cancel"
        ])
        
        if parent_choice == 3:
            return
        
        parent_role = "petitioner" if parent_choice == 1 else "respondent"
        parent_name = self.current_agreement.petitioner_name if parent_choice == 1 else self.current_agreement.respondent_name
        
        # Check if already responded
        current_status = version.petitioner_approval_status if parent_role == "petitioner" else version.respondent_approval_status
        if current_status != ApprovalStatus.PENDING.value:
            print(f"\n⚠️ {parent_role.title()} has already responded: {current_status.upper()}")
            override = input("Override previous response? (yes/no): ")
            if override.lower() != "yes":
                return
        
        print(f"\n{parent_role.title()}'s decision:")
        action_choice = self.get_menu_choice([
            "✅ ACCEPT - I approve this agreement",
            "❌ REJECT - I do not approve this agreement",
            "Cancel"
        ])
        
        if action_choice == 3:
            return
        
        action = ApprovalStatus.ACCEPTED.value if action_choice == 1 else ApprovalStatus.REJECTED.value
        reason = None
        
        if action == ApprovalStatus.REJECTED.value:
            print("\nPlease provide a reason for rejection:")
            print("(This helps the other parent understand what needs to change)")
            reason = input("\nReason: ")
        
        # Record the approval
        self.db.record_approval(
            version_id=version.id,
            parent_role=parent_role,
            action=action,
            reason=reason,
            parent_name=parent_name
        )
        
        # Refresh version data
        version = self.db.get_version(version.id)
        
        print("\n" + "=" * 60)
        if action == ApprovalStatus.ACCEPTED.value:
            print(f"✅ {parent_role.title()}'s ACCEPTANCE recorded!")
        else:
            print(f"❌ {parent_role.title()}'s REJECTION recorded!")
        
        # Check overall status
        print("\n" + format_approval_status(version))
        
        if version.is_fully_approved:
            print("\n" + "🎉" * 20)
            print("\n  BOTH PARENTS HAVE APPROVED!")
            print("  This agreement is ready to be ACTIVATED.")
            print("\n" + "🎉" * 20)
            
            activate = input("\nActivate this agreement now? (yes/no): ")
            if activate.lower() == "yes":
                self.activate_version(version)
                return
        
        elif version.has_rejection:
            print("\n⚠️ This version has been REJECTED.")
            print("   You can create a new version based on this one to address the concerns.")
            
            create_new = input("\nCreate new version based on this one? (yes/no): ")
            if create_new.lower() == "yes":
                self.create_new_version(self.current_agreement.id, version.id)
                return
        
        self.wait_for_enter()
    
    def view_approval_status(self, version: AgreementVersion):
        """View detailed approval status for a version"""
        self.clear_screen()
        self.print_header(f"APPROVAL STATUS - VERSION {version.version_number}")
        
        print(format_approval_status(version))
        
        # Show approval history
        history = self.db.get_approval_history(version.id)
        if history:
            print("\n" + "=" * 60)
            print("  APPROVAL HISTORY")
            print("=" * 60)
            for record in history:
                icon = "✅" if record.action == "accepted" else "❌"
                print(f"\n  {icon} {record.parent_role.upper()}: {record.action.upper()}")
                print(f"     By: {record.parent_name}")
                print(f"     At: {record.timestamp.strftime('%Y-%m-%d %H:%M')}")
                if record.reason:
                    print(f"     Reason: {record.reason}")
        
        # Show activation status if approved
        if version.is_fully_approved:
            print("\n" + "=" * 60)
            print("  ACTIVATION STATUS")
            print("=" * 60)
            if version.activation_status == ActivationStatus.ACTIVE.value:
                print(f"\n  🟢 ACTIVE")
                print(f"     Effective: {version.effective_date}")
                print(f"     Expires: {version.expiration_date}")
                if version.days_until_expiration is not None:
                    print(f"     Days remaining: {version.days_until_expiration}")
            elif version.activation_status == ActivationStatus.EXPIRED.value:
                print(f"\n  🔴 EXPIRED")
                print(f"     Expired on: {version.expiration_date}")
            elif version.activation_status == ActivationStatus.TERMINATED.value:
                print(f"\n  ⚫ TERMINATED")
                print(f"     Terminated: {version.terminated_at}")
                print(f"     By: {version.terminated_by}")
                if version.termination_reason:
                    print(f"     Reason: {version.termination_reason}")
            else:
                print(f"\n  ⚪ NOT ACTIVATED")
                print("     Ready to be activated.")
        
        self.wait_for_enter()
    
    # ==================== ACTIVATION WORKFLOW ====================
    
    def activate_version(self, version: AgreementVersion):
        """Activate an approved version"""
        self.clear_screen()
        self.print_header("ACTIVATE AGREEMENT")
        
        if not version.is_fully_approved:
            print("❌ Cannot activate - both parents must approve first.")
            print()
            print(format_approval_status(version))
            self.wait_for_enter()
            return
        
        if version.activation_status == ActivationStatus.ACTIVE.value:
            print("⚠️ This version is already active.")
            self.wait_for_enter()
            return
        
        print(f"Activating Version {version.version_number}...\n")
        print("This will make this version the OFFICIAL active agreement.\n")
        
        # Get validity period
        print("How long should this agreement be valid?")
        print()
        validity_choice = self.get_menu_choice([
            "1 year (365 days)",
            "2 years (730 days)",
            "6 months (180 days)",
            "Custom duration",
            "No expiration",
            "Cancel"
        ])
        
        if validity_choice == 6:
            return
        
        validity_days = {1: 365, 2: 730, 3: 180}.get(validity_choice)
        
        if validity_choice == 4:
            custom = input("Enter number of days: ")
            try:
                validity_days = int(custom)
            except ValueError:
                print("Invalid number, using 365 days")
                validity_days = 365
        elif validity_choice == 5:
            validity_days = 36500  # ~100 years
        
        # Get effective date
        print("\nWhen should this agreement become effective?")
        effective_choice = self.get_menu_choice([
            "Today (immediately)",
            "Custom date"
        ])
        
        if effective_choice == 1:
            effective_date = datetime.now().date()
        else:
            date_str = input("Enter date (YYYY-MM-DD): ")
            try:
                effective_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                print("Invalid date, using today")
                effective_date = datetime.now().date()
        
        # Calculate expiration
        from datetime import timedelta
        expiration_date = effective_date + timedelta(days=validity_days)
        
        # Confirm
        print("\n" + "=" * 60)
        print("  ACTIVATION SUMMARY")
        print("=" * 60)
        print(f"\n  Version: {version.version_number}")
        print(f"  Effective Date: {effective_date}")
        print(f"  Expiration Date: {expiration_date}")
        print(f"  Validity Period: {validity_days} days")
        
        if self.current_agreement.active_version:
            print(f"\n  ⚠️ This will REPLACE currently active Version {self.current_agreement.active_version.version_number}")
        
        confirm = input("\nConfirm activation? (yes/no): ")
        if confirm.lower() != "yes":
            print("Activation cancelled.")
            self.wait_for_enter()
            return
        
        # Activate
        self.db.activate_version(
            version_id=version.id,
            effective_date=effective_date,
            expiration_date=expiration_date,
            activated_by=self.current_agreement.petitioner_name
        )
        
        print("\n" + "🎉" * 20)
        print("\n  ✅ AGREEMENT ACTIVATED!")
        print(f"\n  Version {version.version_number} is now the official active agreement.")
        print(f"  Valid from {effective_date} to {expiration_date}")
        print("\n" + "🎉" * 20)
        
        self.wait_for_enter()
    
    def deactivate_version(self, version: AgreementVersion):
        """Deactivate/terminate an active version"""
        self.clear_screen()
        self.print_header("DEACTIVATE AGREEMENT")
        
        if version.activation_status != ActivationStatus.ACTIVE.value:
            print("❌ This version is not currently active.")
            print(f"   Current status: {version.activation_status}")
            self.wait_for_enter()
            return
        
        print(f"⚠️ WARNING: You are about to TERMINATE Version {version.version_number}\n")
        print("This will end the agreement immediately.")
        print()
        
        print("Reason for termination:")
        reason_choice = self.get_menu_choice([
            "Replaced by new agreement",
            "Mutual agreement to terminate",
            "Court ordered termination",
            "Other (specify)",
            "Cancel"
        ])
        
        if reason_choice == 5:
            return
        
        reasons = {
            1: "Replaced by new agreement",
            2: "Mutual agreement to terminate",
            3: "Court ordered termination"
        }
        
        reason = reasons.get(reason_choice)
        if reason_choice == 4:
            reason = input("Enter reason: ")
        
        confirm = input("\nConfirm termination? (yes/no): ")
        if confirm.lower() != "yes":
            print("Termination cancelled.")
            self.wait_for_enter()
            return
        
        # Deactivate
        self.db.deactivate_version(
            version_id=version.id,
            reason=reason,
            terminated_by=self.current_agreement.petitioner_name
        )
        
        print("\n✅ Agreement terminated.")
        print(f"   Reason: {reason}")
        
        self.wait_for_enter()
    
    # ==================== PENDING APPROVALS VIEW ====================
    
    def show_pending_approvals(self):
        """Show all versions pending approval"""
        self.clear_screen()
        self.print_header("PENDING APPROVALS")
        
        # Get all pending
        from sqlalchemy import and_
        pending = self.db.session.query(AgreementVersion)\
            .filter(AgreementVersion.status == AgreementStatus.PENDING_APPROVAL.value)\
            .all()
        
        if not pending:
            print("  ✅ No pending approvals!")
            self.wait_for_enter()
            return
        
        print(f"  Found {len(pending)} version(s) pending approval:\n")
        
        for version in pending:
            agreement = self.db.get_agreement(version.agreement_id)
            pet_status = "✓" if version.petitioner_approval_status == "accepted" else ("✗" if version.petitioner_approval_status == "rejected" else "⏳")
            res_status = "✓" if version.respondent_approval_status == "accepted" else ("✗" if version.respondent_approval_status == "rejected" else "⏳")
            
            print(f"  ─────────────────────────────────────────")
            print(f"  Agreement #{agreement.id}: {agreement.petitioner_name} v. {agreement.respondent_name}")
            print(f"  Version {version.version_number}")
            print(f"  Petitioner [{pet_status}]  Respondent [{res_status}]")
            print(f"  Submitted: {version.created_at.strftime('%Y-%m-%d')}")
        
        print("\n" + "─" * 60)
        open_id = input("\nEnter Agreement ID to open (or press Enter to go back): ")
        if open_id:
            try:
                self.open_agreement(int(open_id))
            except ValueError:
                pass
    
    # ==================== ACTIVE AGREEMENTS VIEW ====================
    
    def show_active_agreements(self):
        """Show all active agreements"""
        self.clear_screen()
        self.print_header("ACTIVE AGREEMENTS")
        
        # Get all agreements with active versions
        agreements = self.db.get_all_agreements()
        active_agreements = [a for a in agreements if a.active_version]
        
        if not active_agreements:
            print("  ⚪ No active agreements.")
            print("     Complete and approve an agreement to activate it.")
            self.wait_for_enter()
            return
        
        print(f"  Found {len(active_agreements)} active agreement(s):\n")
        
        for agreement in active_agreements:
            version = agreement.active_version
            days_left = version.days_until_expiration
            
            # Status indicator
            if days_left is not None:
                if days_left <= 30:
                    status_icon = "🟡"  # Warning - expiring soon
                    status_text = f"⚠️ EXPIRING SOON ({days_left} days)"
                elif days_left <= 0:
                    status_icon = "🔴"
                    status_text = "EXPIRED"
                else:
                    status_icon = "🟢"
                    status_text = f"Active ({days_left} days remaining)"
            else:
                status_icon = "🟢"
                status_text = "Active"
            
            print(f"  ─────────────────────────────────────────")
            print(f"  {status_icon} Agreement #{agreement.id}")
            print(f"     {agreement.petitioner_name} v. {agreement.respondent_name}")
            print(f"     Version {version.version_number}")
            print(f"     Status: {status_text}")
            print(f"     Effective: {version.effective_date} → {version.expiration_date}")
        
        print("\n" + "─" * 60)
        open_id = input("\nEnter Agreement ID to open (or press Enter to go back): ")
        if open_id:
            try:
                self.open_agreement(int(open_id))
            except ValueError:
                pass
    
    # ==================== STATISTICS ====================
    
    def show_statistics(self):
        """Show database statistics"""
        self.clear_screen()
        self.print_header("STATISTICS")
        
        stats = self.db.get_statistics()
        
        print(f"  Total Agreements: {stats['total_agreements']}")
        print(f"  Total Versions:   {stats['total_versions']}")
        print(f"  Active Versions:  {stats['active_versions']}")
        print(f"  Pending Approvals: {stats['pending_approvals']}")
        print()
        print("  By Status:")
        for status, count in stats['by_status'].items():
            print(f"    {status}: {count}")
        
        self.wait_for_enter()
    
    # ==================== MAIN RUN LOOP ====================
    
    def run(self):
        """Main application loop"""
        while True:
            choice = self.show_main_menu()
            
            if choice == 1:
                self.create_new_agreement()
            elif choice == 2:
                self.show_all_agreements()
            elif choice == 3:
                agreement_id = input("\nEnter Agreement ID: ")
                try:
                    self.open_agreement(int(agreement_id))
                except ValueError:
                    print("Invalid ID")
                    self.wait_for_enter()
            elif choice == 4:
                self.show_pending_approvals()
            elif choice == 5:
                self.show_active_agreements()
            elif choice == 6:
                self.show_statistics()
            elif choice == 7:
                print("\nGoodbye! 👋")
                self.db.close()
                break


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """Main entry point"""
    app = CustodyAgreementApp()
    app.run()


if __name__ == "__main__":
    main()
