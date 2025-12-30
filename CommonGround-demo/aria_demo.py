#!/usr/bin/env python3
"""
ARIA Demo - Agreement Resource & Information Assistant
Interactive demo for testing ARIA with sample custody agreements.
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aria.sample_agreements import get_agreement, list_agreements, WILLIAMS_AGREEMENT, JOHNSON_AGREEMENT
from aria.agent import ARIAAgent


def clear_screen():
    """Clear the terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')


def print_header():
    """Print the ARIA header"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     █████╗ ██████╗ ██╗ █████╗                                                ║
║    ██╔══██╗██╔══██╗██║██╔══██╗                                               ║
║    ███████║██████╔╝██║███████║                                               ║
║    ██╔══██║██╔══██╗██║██╔══██║                                               ║
║    ██║  ██║██║  ██║██║██║  ██║                                               ║
║    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝                                               ║
║                                                                              ║
║           Agreement Resource & Information Assistant                         ║
║                                                                              ║
║    "Helping parents understand their custody agreements"                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)


def select_agreement() -> dict:
    """Let user select which agreement to use"""
    print("\n📋 SELECT A CUSTODY AGREEMENT TO TEST\n")
    print("─" * 60)
    
    agreements = list_agreements()
    for i, ag in enumerate(agreements, 1):
        print(f"\n  {i}. {ag['title']}")
        print(f"     {ag['description']}")
        print(f"     Parties: {ag['parties']}")
    
    print("\n─" * 60)
    
    while True:
        try:
            choice = int(input("\nSelect agreement (1 or 2): "))
            if choice == 1:
                return WILLIAMS_AGREEMENT
            elif choice == 2:
                return JOHNSON_AGREEMENT
        except ValueError:
            pass
        print("Please enter 1 or 2")


def select_parent_role(agreement: dict) -> str:
    """Let user select which parent they are"""
    parties = agreement.get("parties", {})
    pet = parties.get("petitioner", {})
    res = parties.get("respondent", {})
    
    print("\n👤 WHO ARE YOU?\n")
    print("─" * 60)
    print(f"\n  1. {pet.get('name')} ({pet.get('role')})")
    print(f"  2. {res.get('name')} ({res.get('role')})")
    print("\n─" * 60)
    
    while True:
        try:
            choice = int(input("\nSelect your role (1 or 2): "))
            if choice == 1:
                return "petitioner"
            elif choice == 2:
                return "respondent"
        except ValueError:
            pass
        print("Please enter 1 or 2")


def setup_llm():
    """Set up the LLM if API key is available"""
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
        except ImportError:
            pass
    
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        try:
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(model="claude-3-5-sonnet-20241022", temperature=0.7)
        except ImportError:
            pass
    
    return None


def print_sample_questions(agreement: dict, role: str):
    """Print sample questions based on the agreement"""
    print("\n💡 SAMPLE QUESTIONS TO TRY:\n")
    
    if agreement.get("id") == "WILLIAMS-2024-001":
        questions = [
            "Where do I pick up the kids?",
            "The doctor copay was $89, how much does she owe me?",
            "I want to take Maya to Disney next week",
            "Whose week is it?",
            "What are the rules for Christmas?",
            "Eric needs tutoring - who pays for that?",
            "When can I call the kids during Jennifer's time?",
            "What if I need a babysitter for more than 4 hours?",
        ]
    else:
        questions = [
            "Where do I pick up Isaiah?",
            "The psychiatrist copay was $80, how much do I owe?",
            "I want to take Zay to visit my parents for Thanksgiving",
            "Is this my weekend?",
            "What's the medication routine for Isaiah?",
            "Can I take Isaiah on an international trip?",
            "What are the screen time rules?",
            "What if my fire shift conflicts with my visitation?",
        ]
    
    for q in questions:
        print(f"  • {q}")
    
    print()


def run_chat(aria: ARIAAgent):
    """Run the interactive chat loop"""
    print("\n" + "═" * 60)
    print("  CHAT WITH ARIA")
    print("  Type 'quit' to exit, 'help' for sample questions")
    print("═" * 60 + "\n")
    
    # Print agreement summary
    print(aria.get_agreement_summary())
    print("─" * 60)
    
    # Initial greeting
    greeting = aria.chat("Hello!")
    print(f"\n🤖 ARIA: {greeting}\n")
    
    while True:
        try:
            user_input = input(f"👤 You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nGoodbye! Take care of those kiddos! 👋")
            break
        
        if not user_input:
            continue
        
        if user_input.lower() == 'quit':
            print("\n\nGoodbye! Take care of those kiddos! 👋")
            break
        
        if user_input.lower() == 'help':
            print_sample_questions(aria.agreement, aria.user_role)
            continue
        
        if user_input.lower() == 'clear':
            clear_screen()
            print_header()
            print(aria.get_agreement_summary())
            print("─" * 60)
            continue
        
        # Get ARIA's response
        response = aria.chat(user_input)
        print(f"\n🤖 ARIA: {response}\n")


def main():
    """Main entry point"""
    clear_screen()
    print_header()
    
    # Check for LLM
    llm = setup_llm()
    if llm:
        print("  ✓ AI Mode: Active (using LLM)")
    else:
        print("  ⚠ Demo Mode: Using rule-based responses")
        print("    Set OPENAI_API_KEY or ANTHROPIC_API_KEY for full AI experience")
    
    # Select agreement
    agreement = select_agreement()
    
    # Select role
    role = select_parent_role(agreement)
    
    # Create ARIA agent
    aria = ARIAAgent(agreement, llm=llm, user_role=role)
    
    clear_screen()
    print_header()
    
    # Print sample questions
    print_sample_questions(agreement, role)
    
    # Run chat
    run_chat(aria)


if __name__ == "__main__":
    main()
