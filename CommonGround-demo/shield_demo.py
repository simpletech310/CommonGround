#!/usr/bin/env python3
"""
ARIA Sentiment Shield Demo
Interactive demo for parent-to-parent messaging with sentiment monitoring.
"""

import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aria.sentiment_shield import SentimentShield, ToxicityLevel, ConversationContext
from aria.message_store import (
    MessageStore, UserAction,
    format_user_stats, format_conversation_stats, format_flagged_log
)


def clear_screen():
    """Clear the terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')


def print_header():
    """Print the ARIA Sentiment Shield header"""
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
║               🛡️ SENTIMENT SHIELD                                            ║
║                                                                              ║
║    "Helping parents communicate with kindness"                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)


class SentimentShieldDemo:
    """Interactive demo for ARIA Sentiment Shield"""
    
    def __init__(self):
        self.shield = SentimentShield()
        self.store = MessageStore("shield_demo.db")
        self.conversation_id = None
        self.parent_a_name = None
        self.parent_b_name = None
        self.current_user = None
        self.context = ConversationContext()
        self.messages = []
    
    def setup_conversation(self):
        """Set up a new or existing conversation"""
        print("\n🏠 CONVERSATION SETUP\n")
        print("─" * 50)
        
        print("\nLet's set up the co-parenting chat.\n")
        
        self.parent_a_name = input("Parent A's name (e.g., Marcus): ").strip() or "Marcus"
        self.parent_b_name = input("Parent B's name (e.g., Jennifer): ").strip() or "Jennifer"
        
        self.conversation_id = f"{self.parent_a_name}_{self.parent_b_name}_{datetime.now().strftime('%Y%m%d')}"
        self.store.create_conversation(self.conversation_id, self.parent_a_name, self.parent_b_name)
        
        print(f"\n✓ Conversation created between {self.parent_a_name} and {self.parent_b_name}")
        
        # Load any existing messages
        self.messages = self.store.get_messages(self.conversation_id)
        
        input("\nPress Enter to continue...")
    
    def display_chat(self):
        """Display the current chat messages"""
        print("\n" + "═" * 60)
        print(f"  💬 Chat: {self.parent_a_name} & {self.parent_b_name}")
        print("═" * 60 + "\n")
        
        if not self.messages:
            print("  (No messages yet - start the conversation!)\n")
        else:
            for msg in self.messages[-10:]:  # Show last 10 messages
                sender = self.parent_a_name if msg["sender"] == "parent_a" else self.parent_b_name
                timestamp = msg["timestamp"]
                if isinstance(timestamp, str):
                    timestamp = timestamp[11:16]  # Just time
                else:
                    timestamp = timestamp.strftime("%H:%M")
                
                # Show message with any flags
                text = msg["final_message"]
                
                if msg["sender"] == "parent_a":
                    print(f"  [{timestamp}] {sender}: {text}")
                else:
                    print(f"  [{timestamp}]          {sender}: {text}")
                
                # Show if ARIA intervened
                if msg["was_flagged"]:
                    action = msg.get("user_action", "")
                    if action == "accepted":
                        print(f"           └─ 🤖 ARIA helped with this message ✓")
                    elif action == "rejected":
                        print(f"           └─ ⚠️ ARIA suggestion was declined")
            
            print()
        
        print("─" * 60)
    
    def send_message(self):
        """Handle sending a message with ARIA monitoring"""
        # Determine sender and recipient
        sender = "parent_a" if self.current_user == self.parent_a_name else "parent_b"
        recipient = "parent_b" if sender == "parent_a" else "parent_a"
        recipient_name = self.parent_b_name if sender == "parent_a" else self.parent_a_name
        
        print(f"\n✉️ New message to {recipient_name}:")
        original_message = input(f"{self.current_user}: ").strip()
        
        if not original_message:
            return
        
        # Analyze the message
        analysis = self.shield.analyze(original_message, self.context.get_recent_messages())
        
        # If flagged, show ARIA's intervention
        if analysis.is_flagged:
            return self._handle_flagged_message(
                original_message, analysis, sender, recipient
            )
        else:
            # Message is fine, send directly
            print("\n✓ Message sent!")
            self._save_message(
                sender=sender,
                recipient=recipient,
                original=original_message,
                final=original_message,
                was_flagged=False,
                analysis=analysis,
                user_action=None
            )
    
    def _handle_flagged_message(self, original_message, analysis, sender, recipient):
        """Handle a flagged message with ARIA's intervention"""
        clear_screen()
        print("\n" + "═" * 60)
        
        # Show toxicity level icon
        level_display = {
            ToxicityLevel.LOW: "💭 ARIA here with a thought...",
            ToxicityLevel.MEDIUM: "🤝 Hey, quick check-in...",
            ToxicityLevel.HIGH: "⚠️ Hold on a moment...",
            ToxicityLevel.SEVERE: "🛑 Let's pause here...",
        }
        
        print(f"\n{level_display.get(analysis.toxicity_level, '💭 A gentle note...')}\n")
        print("─" * 60)
        
        print(f"\n{analysis.explanation}\n")
        print("Remember, your little one(s) are counting on both of")
        print("you to communicate kindly. They feel the energy! 💙\n")
        
        print("─" * 60)
        print("\n📝 Your original message:")
        print(f"   \"{original_message}\"\n")
        
        if analysis.suggestion:
            print("💡 A gentler way to say this:")
            print(f"   \"{analysis.suggestion}\"\n")
        
        print("─" * 60)
        print("\nWhat would you like to do?\n")
        print("  [1] ✅ Use ARIA's suggestion")
        print("  [2] ✏️  Edit my message")
        print("  [3] 📤 Send original anyway")
        print("  [4] 🗑️  Cancel message")
        print()
        
        choice = input("Your choice (1-4): ").strip()
        
        if choice == "1":
            # Accept ARIA's suggestion
            final_message = analysis.suggestion
            user_action = UserAction.ACCEPTED.value
            print(f"\n✓ Sending: \"{final_message}\"")
            
        elif choice == "2":
            # Edit message
            print("\nEdit your message:")
            final_message = input(f"{self.current_user}: ").strip() or original_message
            user_action = UserAction.MODIFIED.value
            print(f"\n✓ Sending: \"{final_message}\"")
            
        elif choice == "3":
            # Send original anyway
            final_message = original_message
            user_action = UserAction.REJECTED.value
            print("\n📤 Sending original message...")
            print("   (ARIA respects your choice, but wanted to help! 💙)")
            
        elif choice == "4":
            # Cancel
            user_action = UserAction.CANCELLED.value
            print("\n🗑️ Message cancelled.")
            self._save_message(
                sender=sender,
                recipient=recipient,
                original=original_message,
                final="[CANCELLED]",
                was_flagged=True,
                analysis=analysis,
                user_action=user_action
            )
            input("\nPress Enter to continue...")
            return
        else:
            # Default to edit
            final_message = original_message
            user_action = UserAction.REJECTED.value
        
        # Save and send
        self._save_message(
            sender=sender,
            recipient=recipient,
            original=original_message,
            final=final_message,
            was_flagged=True,
            analysis=analysis,
            user_action=user_action
        )
        
        input("\nPress Enter to continue...")
    
    def _save_message(self, sender, recipient, original, final, was_flagged, analysis, user_action):
        """Save a message to the store"""
        self.store.save_message(
            conversation_id=self.conversation_id,
            sender=sender,
            recipient=recipient,
            original_message=original,
            final_message=final,
            was_flagged=was_flagged,
            toxicity_level=analysis.toxicity_level.value,
            toxicity_score=analysis.toxicity_score,
            categories=[c.value for c in analysis.categories],
            aria_suggestion=analysis.suggestion,
            user_action=user_action,
            explanation=analysis.explanation
        )
        
        # Update context
        self.context.add_message(sender, final, was_flagged)
        
        # Reload messages
        self.messages = self.store.get_messages(self.conversation_id)
    
    def view_analytics(self):
        """View conversation analytics and trends"""
        clear_screen()
        print_header()
        
        stats = self.store.get_conversation_stats(self.conversation_id)
        print(format_conversation_stats(stats))
        
        print("\n\nOptions:")
        print("  [1] View Parent A detailed stats")
        print("  [2] View Parent B detailed stats")
        print("  [3] View ARIA intervention log")
        print("  [4] View trend data")
        print("  [5] Back to chat")
        
        choice = input("\nChoice: ").strip()
        
        if choice == "1":
            pa_stats = self.store.get_user_stats(self.conversation_id, "parent_a")
            print("\n" + format_user_stats(pa_stats))
            input("\nPress Enter to continue...")
            
        elif choice == "2":
            pb_stats = self.store.get_user_stats(self.conversation_id, "parent_b")
            print("\n" + format_user_stats(pb_stats))
            input("\nPress Enter to continue...")
            
        elif choice == "3":
            log = self.store.get_flagged_messages_log(self.conversation_id)
            print("\n" + format_flagged_log(log))
            input("\nPress Enter to continue...")
            
        elif choice == "4":
            self._show_trend_chart()
            input("\nPress Enter to continue...")
    
    def _show_trend_chart(self):
        """Show a simple text-based trend chart"""
        print("\n" + "═" * 60)
        print("📊 COMMUNICATION TREND")
        print("═" * 60 + "\n")
        
        trend_data = self.store.get_trend_data(self.conversation_id)
        
        if not trend_data:
            print("Not enough data yet. Keep chatting!\n")
            return
        
        print("Daily Toxicity Level (lower is better):\n")
        
        max_toxicity = max(d["average_toxicity"] for d in trend_data) or 1
        bar_width = 30
        
        for day in trend_data:
            bar_length = int((day["average_toxicity"] / max_toxicity) * bar_width) if max_toxicity > 0 else 0
            bar = "█" * bar_length + "░" * (bar_width - bar_length)
            
            # Color coding
            if day["average_toxicity"] < 0.1:
                indicator = "🟢"
            elif day["average_toxicity"] < 0.3:
                indicator = "🟡"
            else:
                indicator = "🔴"
            
            print(f"  {day['date']}: {bar} {indicator} {day['average_toxicity']:.2f}")
        
        print("\n  Legend: 🟢 Good  🟡 Moderate  🔴 Needs work")
        
        # Show acceptance trend
        total_accepted = sum(d["accepted"] for d in trend_data)
        total_rejected = sum(d["rejected"] for d in trend_data)
        total_flagged = sum(d["flagged"] for d in trend_data)
        
        if total_flagged > 0:
            print(f"\n  ARIA Intervention Summary:")
            print(f"    Total flagged: {total_flagged}")
            print(f"    Accepted suggestions: {total_accepted}")
            print(f"    Rejected suggestions: {total_rejected}")
            print(f"    Acceptance rate: {(total_accepted/total_flagged*100):.1f}%")
    
    def switch_user(self):
        """Switch which parent is typing"""
        print(f"\n👤 Currently: {self.current_user}")
        print(f"\nSwitch to:")
        print(f"  [1] {self.parent_a_name}")
        print(f"  [2] {self.parent_b_name}")
        
        choice = input("\nChoice: ").strip()
        
        if choice == "1":
            self.current_user = self.parent_a_name
        elif choice == "2":
            self.current_user = self.parent_b_name
        
        print(f"\n✓ Now chatting as {self.current_user}")
    
    def run_demo_scenario(self):
        """Run a pre-built demo scenario to show ARIA in action"""
        clear_screen()
        print_header()
        
        print("\n🎬 DEMO SCENARIO: A typical co-parenting exchange\n")
        print("─" * 50)
        print("Watch how ARIA helps navigate a potentially tense conversation.\n")
        
        input("Press Enter to start the demo...")
        
        # Demo messages
        demo_script = [
            ("parent_a", "parent_b", "Hey, I need to pick up the kids early on Friday"),
            ("parent_b", "parent_a", "That's fine, what time?"),
            ("parent_a", "parent_b", "Around 3pm, I have a doctor's appointment at 4"),
            ("parent_b", "parent_a", "Ok, I'll have them ready"),
            ("parent_a", "parent_b", "Also can you make sure they have their homework done before I pick them up?"),
            ("parent_b", "parent_a", "What type of stupid shit is that? You made the fucking schedule, go look at it yourself"),
            ("parent_a", "parent_b", "Wow really? You're always so hostile about everything. This is why we can't communicate."),
        ]
        
        for sender, recipient, message in demo_script:
            sender_name = self.parent_a_name if sender == "parent_a" else self.parent_b_name
            
            clear_screen()
            self.display_chat()
            
            print(f"\n📝 {sender_name} is typing: \"{message}\"")
            input("\n[Press Enter to send]")
            
            # Analyze
            analysis = self.shield.analyze(message)
            
            if analysis.is_flagged:
                clear_screen()
                
                level_display = {
                    ToxicityLevel.LOW: "💭 ARIA here with a thought...",
                    ToxicityLevel.MEDIUM: "🤝 Hey, quick check-in...",
                    ToxicityLevel.HIGH: "⚠️ Hold on a moment...",
                    ToxicityLevel.SEVERE: "🛑 Let's pause here...",
                }
                
                print("\n" + "═" * 60)
                print(f"\n{level_display.get(analysis.toxicity_level, '💭')}")
                print("\n" + "─" * 60)
                print(f"\n{analysis.explanation}\n")
                print("Your little one(s) feel the energy between you two. 💙\n")
                print("─" * 60)
                print(f"\n📝 Original: \"{message}\"")
                if analysis.suggestion:
                    print(f"💡 Suggestion: \"{analysis.suggestion}\"")
                
                print("\n[In the real app, the user would choose to accept/edit/reject]")
                
                # For demo, alternate between accepting and rejecting
                if "stupid" in message.lower():
                    user_action = UserAction.ACCEPTED.value
                    final_message = analysis.suggestion
                    print(f"\n✅ User ACCEPTED suggestion")
                else:
                    user_action = UserAction.REJECTED.value
                    final_message = message
                    print(f"\n❌ User REJECTED suggestion")
                
                input("\n[Press Enter to continue]")
            else:
                user_action = None
                final_message = message
            
            # Save message
            self.store.save_message(
                conversation_id=self.conversation_id,
                sender=sender,
                recipient=recipient,
                original_message=message,
                final_message=final_message,
                was_flagged=analysis.is_flagged,
                toxicity_level=analysis.toxicity_level.value,
                toxicity_score=analysis.toxicity_score,
                categories=[c.value for c in analysis.categories],
                aria_suggestion=analysis.suggestion,
                user_action=user_action,
                explanation=analysis.explanation
            )
            
            self.messages = self.store.get_messages(self.conversation_id)
        
        # Show final stats
        clear_screen()
        print("\n🎬 DEMO COMPLETE\n")
        print("Here's how the conversation went:\n")
        
        stats = self.store.get_conversation_stats(self.conversation_id)
        print(format_conversation_stats(stats))
        
        input("\nPress Enter to return to main menu...")
    
    def main_menu(self):
        """Main chat menu"""
        while True:
            clear_screen()
            print_header()
            
            self.display_chat()
            
            print(f"\n👤 Chatting as: {self.current_user}")
            print("\nOptions:")
            print("  [1] 💬 Send a message")
            print("  [2] 🔄 Switch user")
            print("  [3] 📊 View analytics")
            print("  [4] 🎬 Run demo scenario")
            print("  [5] 🚪 Exit")
            
            choice = input("\nChoice: ").strip()
            
            if choice == "1":
                self.send_message()
            elif choice == "2":
                self.switch_user()
            elif choice == "3":
                self.view_analytics()
            elif choice == "4":
                self.run_demo_scenario()
            elif choice == "5":
                print("\n👋 Take care! Remember, kindness benefits everyone, especially the kids. 💙\n")
                self.store.close()
                break
    
    def run(self):
        """Run the demo"""
        clear_screen()
        print_header()
        
        self.setup_conversation()
        
        # Start as parent A
        self.current_user = self.parent_a_name
        
        self.main_menu()


def main():
    """Main entry point"""
    demo = SentimentShieldDemo()
    demo.run()


if __name__ == "__main__":
    main()
