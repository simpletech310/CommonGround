#!/usr/bin/env python3
"""
CommonGround Custody Agreement Generator - Demo
This script demonstrates the full flow from conversation to legal document.
"""

import os
import sys
import json
from typing import List, Dict, Optional
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from schemas.custody_models import ConversationSection
from agents.interviewer import InterviewerAgent, InfoExtractor
from agents.translator import TranslatorAgent, TranslatorRevisionAgent
from agents.extractor import ExtractorAgent
from agents.document_generator import LegalDocumentGenerator


# ============================================================================
# DEMO CONFIGURATION
# ============================================================================

# For demo, we'll simulate the LLM responses if no API key is available
DEMO_MODE = True  # Set to False when you have API keys configured

# Section prompts for the demo
SECTION_PROMPTS = {
    "INTRO": """
╔══════════════════════════════════════════════════════════════════════════════╗
║                    COMMONGROUND CUSTODY AGREEMENT GENERATOR                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

Hi there! 👋

I'm here to help you create a custody agreement that works for your family.
This isn't going to feel like filling out forms - we're just going to have a 
conversation about your situation and what you'd like the arrangement to look like.

Everything you share stays between us, and at the end, I'll help you turn it 
into a clear, organized document that both parents can understand.

Ready to get started?
""",
    "PARENT_INFO": """
Great! Let's start with some basics about you.

What's your name, and are you mom or dad?
(Also, if you know the other parent's name, you can share that too)
""",
    "CHILD_INFO": """
Thanks for that! Now tell me about your little one(s).

What are their names and how old are they?
""",
    "CUSTODY_TYPE": """
Now let's talk about what you're hoping the custody arrangement will look like.

Are you thinking:
• 50/50 (equal time with both parents)?
• One parent has the child most of the time with visits?
• Something else?

Just tell me in your own words what you'd like.
""",
    "EXCHANGE_SCHEDULE": """
Let's figure out the logistics of exchanges - where you'll meet to pick up 
or drop off your child.

Where would you feel comfortable meeting for exchanges? 
(Some parents use a police station, school, church, or meet halfway)

What day and time works best?
""",
    "CHILD_SUPPORT": """
Some parents include child support in their agreement. 

Is child support going to be part of your arrangement?
If so, do you have a sense of the amount and who would be paying?
""",
    "TRANSPORTATION": """
Last thing about logistics - how are you thinking about handling transportation 
for the exchanges?

Will you:
• Each drive your own way?
• Meet halfway?
• One person does all the driving?
• Something else?
""",
    "REVIEW": """
Alright, I think I have everything I need! 

Let me put together a summary of what you've shared. You'll be able to review 
it and make any changes before we finalize anything.

One moment...
"""
}


# ============================================================================
# DEMO CLASS
# ============================================================================

class CustodyAgreementDemo:
    """
    Main demo class that orchestrates the custody agreement generation flow.
    """
    
    def __init__(self, use_real_llm: bool = False, llm=None):
        """
        Initialize the demo.
        
        Args:
            use_real_llm: If True, use actual LLM. If False, use demo mode.
            llm: Optional LangChain LLM instance
        """
        self.use_real_llm = use_real_llm
        self.llm = llm
        
        # Initialize agents if using real LLM
        if use_real_llm and llm:
            self.interviewer = InterviewerAgent(llm)
            self.translator = TranslatorAgent(llm)
            self.translator_revision = TranslatorRevisionAgent(llm)
            self.extractor = ExtractorAgent(llm)
        
        # Always have document generator (no LLM needed)
        self.doc_generator = LegalDocumentGenerator()
        
        # State tracking
        self.current_section = "INTRO"
        self.gathered_data: Dict[str, str] = {}
        self.chat_history: List[tuple] = []
        self.summary: Optional[str] = None
        self.extracted_data: Optional[dict] = None
    
    def clear_screen(self):
        """Clear the terminal screen"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def print_section_header(self, section: str):
        """Print a header for the current section"""
        section_names = {
            "INTRO": "Welcome",
            "PARENT_INFO": "About You",
            "CHILD_INFO": "About Your Child(ren)",
            "CUSTODY_TYPE": "Custody Arrangement",
            "EXCHANGE_SCHEDULE": "Pick-Up & Drop-Off",
            "CHILD_SUPPORT": "Child Support",
            "TRANSPORTATION": "Transportation",
            "REVIEW": "Review Your Information"
        }
        
        name = section_names.get(section, section)
        print(f"\n{'─' * 60}")
        print(f"  📋 Section: {name}")
        print(f"{'─' * 60}\n")
    
    def get_section_prompt(self, section: str) -> str:
        """Get the prompt for a section"""
        return SECTION_PROMPTS.get(section, "")
    
    def run_interview(self):
        """Run the interview phase"""
        sections = ["INTRO", "PARENT_INFO", "CHILD_INFO", "CUSTODY_TYPE", 
                   "EXCHANGE_SCHEDULE", "CHILD_SUPPORT", "TRANSPORTATION"]
        
        for section in sections:
            self.current_section = section
            self.print_section_header(section)
            
            # Show the section prompt
            print(self.get_section_prompt(section))
            
            if section == "INTRO":
                input("\n[Press Enter when ready to continue...] ")
                continue
            
            # Gather response
            print("Your response (press Enter twice when done):")
            lines = []
            while True:
                line = input()
                if line == "":
                    if lines:
                        break
                else:
                    lines.append(line)
            
            response = " ".join(lines)
            self.gathered_data[section] = response
            self.chat_history.append((section, response))
            
            print("\n✓ Got it, thanks!")
            input("\n[Press Enter to continue...] ")
    
    def run_translation(self):
        """Run the translation phase - create human-readable summary"""
        self.print_section_header("REVIEW")
        print("Creating your summary...\n")
        
        if self.use_real_llm:
            self.summary = self.translator.translate_from_dict(self.gathered_data)
        else:
            # Demo mode - create a sample summary
            self.summary = self._generate_demo_summary()
        
        return self.summary
    
    def _generate_demo_summary(self) -> str:
        """Generate a demo summary from gathered data"""
        parent_info = self.gathered_data.get("PARENT_INFO", "")
        child_info = self.gathered_data.get("CHILD_INFO", "")
        custody_info = self.gathered_data.get("CUSTODY_TYPE", "")
        exchange_info = self.gathered_data.get("EXCHANGE_SCHEDULE", "")
        support_info = self.gathered_data.get("CHILD_SUPPORT", "")
        transport_info = self.gathered_data.get("TRANSPORTATION", "")
        
        summary = f"""
══════════════════════════════════════════════════════════════════════════════
                         YOUR CUSTODY AGREEMENT SUMMARY
══════════════════════════════════════════════════════════════════════════════

**Your Information**
Based on what you shared: {parent_info}

**Child(ren)**
You told us about: {child_info}

**Custody Arrangement**
Your preference: {custody_info}

**Pick-Up & Drop-Off**
Exchange details: {exchange_info}

**Child Support**
{support_info if support_info else "No child support arrangement specified."}

**Transportation**
{transport_info if transport_info else "Transportation arrangement to be determined."}

══════════════════════════════════════════════════════════════════════════════

⚠️ Items That May Need Clarification:
- Please verify all names are spelled correctly
- Confirm the exchange time works for both parties
- Review the custody percentage if applicable

══════════════════════════════════════════════════════════════════════════════
"""
        return summary
    
    def review_and_approve(self) -> bool:
        """Let user review and approve the summary"""
        while True:
            self.clear_screen()
            print(self.summary)
            
            print("\n" + "─" * 60)
            print("Please review the summary above.")
            print("─" * 60)
            print("\nOptions:")
            print("  1. ✓ Approve - Everything looks correct")
            print("  2. ✎ Edit - I need to make changes")
            print("  3. ✗ Start Over - Let's try again")
            
            choice = input("\nYour choice (1/2/3): ").strip()
            
            if choice == "1":
                print("\n✓ Summary approved!")
                return True
            elif choice == "2":
                print("\nWhat changes would you like to make?")
                changes = input("Describe the changes: ")
                
                if self.use_real_llm:
                    self.summary = self.translator_revision.revise(self.summary, changes)
                else:
                    print("\n[Demo mode: In full version, AI would update the summary]")
                    self.summary += f"\n\n** REVISION NOTE: {changes} **\n"
                
                input("\n[Press Enter to review updated summary...] ")
            elif choice == "3":
                return False
            else:
                print("Please enter 1, 2, or 3")
        
        return False
    
    def run_extraction(self):
        """Run the extraction phase - convert to structured data"""
        print("\n📊 Extracting structured data...")
        
        if self.use_real_llm:
            self.extracted_data = self.extractor.extract_to_legal_format(self.summary)
        else:
            # Demo mode - create sample extracted data
            self.extracted_data = self._generate_demo_extraction()
        
        return self.extracted_data
    
    def _generate_demo_extraction(self) -> dict:
        """Generate demo extracted data"""
        # Parse what we can from gathered data
        parent_info = self.gathered_data.get("PARENT_INFO", "Parent A")
        child_info = self.gathered_data.get("CHILD_INFO", "Child, age unknown")
        
        return {
            "petitioner": {
                "name": parent_info.split()[0] if parent_info else "Parent A",
                "relationship": "FATHER"  # Default for demo
            },
            "respondent": {
                "name": "Parent B",
                "relationship": "MOTHER"
            },
            "minor_children": [
                {"name": child_info.split()[0] if child_info else "Child", "age": None}
            ],
            "custody_arrangement": {
                "type": "JOINT LEGAL AND PHYSICAL CUSTODY",
                "time_share": {"mother_percentage": 50, "father_percentage": 50},
                "schedule": "Alternating weeks"
            },
            "exchange_provisions": {
                "pickup": {
                    "location": self.gathered_data.get("EXCHANGE_SCHEDULE", "To be determined"),
                    "time": "As agreed",
                    "frequency": "WEEKLY"
                }
            },
            "child_support": {"status": "WAIVED BY MUTUAL AGREEMENT"},
            "transportation": {
                "arrangement": "Each party shall be responsible for their own transportation costs"
            },
            "additional_provisions": None
        }
    
    def show_extracted_data(self):
        """Display the extracted structured data"""
        self.clear_screen()
        print("\n" + "═" * 60)
        print("  📊 EXTRACTED STRUCTURED DATA")
        print("═" * 60 + "\n")
        
        print("This is the structured data extracted from your conversation.\n")
        print("This data will be used to generate your legal document.\n")
        print("-" * 60)
        print(json.dumps(self.extracted_data, indent=2))
        print("-" * 60)
        
        input("\n[Press Enter to generate the legal document...] ")
    
    def generate_document(self, output_path: str = None) -> str:
        """Generate the final legal document"""
        print("\n📄 Generating legal document...")
        
        document = self.doc_generator.generate(self.extracted_data)
        
        if output_path:
            self.doc_generator.generate_to_file(self.extracted_data, output_path)
            print(f"\n✓ Document saved to: {output_path}")
        
        return document
    
    def run(self):
        """Run the complete demo flow"""
        self.clear_screen()
        
        # Phase 1: Interview
        print("=" * 60)
        print("  PHASE 1: INTERVIEW")
        print("=" * 60)
        self.run_interview()
        
        # Phase 2: Translation
        self.clear_screen()
        print("=" * 60)
        print("  PHASE 2: SUMMARY CREATION")
        print("=" * 60)
        self.run_translation()
        
        # Phase 3: Review & Approval Loop
        approved = self.review_and_approve()
        
        if not approved:
            print("\nStarting over...")
            self.gathered_data = {}
            self.chat_history = []
            self.run()
            return
        
        # Phase 4: Extraction
        self.clear_screen()
        print("=" * 60)
        print("  PHASE 3: DATA EXTRACTION")
        print("=" * 60)
        self.run_extraction()
        self.show_extracted_data()
        
        # Phase 5: Document Generation
        self.clear_screen()
        print("=" * 60)
        print("  PHASE 4: LEGAL DOCUMENT GENERATION")
        print("=" * 60)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"custody_agreement_{timestamp}.txt"
        document = self.generate_document(output_path)
        
        # Show final document
        print("\n" + "═" * 60)
        print("  YOUR CUSTODY AGREEMENT")
        print("═" * 60)
        print(document[:2000] + "\n... [Document continues] ...")
        
        print("\n" + "═" * 60)
        print("  ✓ COMPLETE!")
        print("═" * 60)
        print(f"\nYour custody agreement has been saved to: {output_path}")
        print("\nIMPORTANT: This document is for informational purposes only.")
        print("Please consult with a family law attorney before filing.")


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main entry point"""
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
║                    Custody Agreement Generator Demo                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")
    
    # Check for API key
    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")
    
    if api_key:
        print("✓ API key detected - Running with real AI")
        use_real_llm = True
        
        # Initialize LLM based on available key
        if os.environ.get("OPENAI_API_KEY"):
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        else:
            from langchain_anthropic import ChatAnthropic
            llm = ChatAnthropic(model="claude-3-5-sonnet-20241022", temperature=0)
    else:
        print("⚠ No API key detected - Running in DEMO MODE")
        print("  (Set OPENAI_API_KEY or ANTHROPIC_API_KEY to use real AI)")
        use_real_llm = False
        llm = None
    
    input("\n[Press Enter to begin...] ")
    
    # Run the demo
    demo = CustodyAgreementDemo(use_real_llm=use_real_llm, llm=llm)
    demo.run()


if __name__ == "__main__":
    main()
