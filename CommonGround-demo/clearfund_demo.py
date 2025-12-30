#!/usr/bin/env python3
"""
CG ClearFund™ Demo
Interactive demo for structured expense requests between co-parents.
"""

import os
import sys
from datetime import datetime, date, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aria.clearfund import (
    ClearFundRequest, RequestStatus, ExpenseCategory,
    format_request_summary, format_request_detail, format_audit_trail,
    format_currency, CATEGORY_ICONS, STATUS_ICONS, STATUS_LABELS,
    calculate_split
)
from aria.clearfund_store import ClearFundStore, create_sample_requests
from aria.sample_agreements import WILLIAMS_AGREEMENT, JOHNSON_AGREEMENT


def clear_screen():
    """Clear the terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')


def print_header():
    """Print the ClearFund header"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║      ██████╗██╗     ███████╗ █████╗ ██████╗ ███████╗██╗   ██╗███╗   ██╗     ║
║     ██╔════╝██║     ██╔════╝██╔══██╗██╔══██╗██╔════╝██║   ██║████╗  ██║     ║
║     ██║     ██║     █████╗  ███████║██████╔╝█████╗  ██║   ██║██╔██╗ ██║     ║
║     ██║     ██║     ██╔══╝  ██╔══██║██╔══██╗██╔══╝  ██║   ██║██║╚██╗██║     ║
║     ╚██████╗███████╗███████╗██║  ██║██║  ██║██║     ╚██████╔╝██║ ╚████║     ║
║      ╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝     ║
║                                                                              ║
║                    CG ClearFund™ by CommonGround                             ║
║                                                                              ║
║              "Structured requests. Zero drama."                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)


class ClearFundDemo:
    """Interactive demo for ClearFund"""
    
    def __init__(self):
        self.store = None
        self.agreement = None
        self.parent_a_name = None
        self.parent_b_name = None
        self.current_user = None
        self.current_user_role = None  # "parent_a" or "parent_b"
    
    def setup(self):
        """Set up the demo"""
        print("\n🏠 CLEARFUND SETUP\n")
        print("─" * 50)
        
        print("\nSelect a family agreement to use:\n")
        print("  [1] Williams Family - 50/50 custody, 2 kids")
        print("  [2] Johnson Family - Primary custody, 1 child with ADHD")
        print("  [3] Custom names (no agreement)")
        
        choice = input("\nChoice: ").strip()
        
        if choice == "1":
            self.agreement = WILLIAMS_AGREEMENT
            self.parent_a_name = "Marcus"
            self.parent_b_name = "Jennifer"
        elif choice == "2":
            self.agreement = JOHNSON_AGREEMENT
            self.parent_a_name = "David"
            self.parent_b_name = "Keisha"
        else:
            self.parent_a_name = input("Parent A's name: ").strip() or "Parent A"
            self.parent_b_name = input("Parent B's name: ").strip() or "Parent B"
            self.agreement = {}
        
        # Initialize store
        self.store = ClearFundStore(":memory:", self.agreement)
        
        # Create sample data
        print("\n⏳ Loading sample requests...")
        create_sample_requests(self.store, self.parent_a_name, self.parent_b_name)
        
        # Set current user
        self.current_user = self.parent_a_name
        self.current_user_role = "parent_a"
        
        print(f"\n✓ ClearFund ready for {self.parent_a_name} & {self.parent_b_name}")
        input("\nPress Enter to continue...")
    
    def get_other_parent(self):
        """Get the other parent's name and role"""
        if self.current_user_role == "parent_a":
            return self.parent_b_name, "parent_b"
        else:
            return self.parent_a_name, "parent_a"
    
    def dashboard(self):
        """Show the main dashboard"""
        requests = self.store.get_all_requests()
        pending_for_me = self.store.get_pending_for_user(self.current_user_role)
        my_requests = [r for r in requests if r.requester == self.current_user_role]
        
        # Calculate totals
        active_requests = [r for r in requests if r.status not in 
                         [RequestStatus.COMPLETED, RequestStatus.REJECTED, RequestStatus.CANCELLED, RequestStatus.EXPIRED]]
        pending_funding = sum(r.responder_share for r in requests 
                            if r.status == RequestStatus.APPROVED and r.responder == self.current_user_role)
        
        print(f"\n👤 Logged in as: {self.current_user}")
        print("\n" + "═" * 60)
        print("  CLEARFUND DASHBOARD")
        print("═" * 60)
        
        print(f"""
📊 Quick Stats:
   Active Requests: {len(active_requests)}
   Awaiting Your Response: {len(pending_for_me)}
   💰 Pending Funding (your share): {format_currency(pending_funding)}
""")
        
        # Recent activity
        print("─" * 60)
        print("📋 RECENT REQUESTS")
        print("─" * 60)
        
        for req in requests[:5]:
            icon = STATUS_ICONS.get(req.status, "?")
            cat_icon = CATEGORY_ICONS.get(req.category, "📦")
            status = STATUS_LABELS.get(req.status, req.status.value)
            
            # Show who needs to act
            action_note = ""
            if req.status == RequestStatus.PENDING:
                if req.responder == self.current_user_role:
                    action_note = " ← Needs your response"
                else:
                    action_note = f" ← Waiting on {req.responder_name}"
            elif req.status == RequestStatus.APPROVED:
                action_note = " ← Awaiting payment"
            elif req.status == RequestStatus.RECEIPT_PENDING:
                action_note = " ← Needs receipt"
            
            print(f"  {icon} {cat_icon} {req.purpose} ({format_currency(req.amount)})")
            print(f"      {status}{action_note}")
            print()
    
    def main_menu(self):
        """Show main menu options"""
        print("─" * 60)
        print("OPTIONS")
        print("─" * 60)
        print("  [1] ➕ Create New Request")
        print("  [2] 📋 View All Requests")
        print("  [3] ⏳ Pending My Approval")
        print("  [4] 💰 My Requests Needing Payment")
        print("  [5] 📊 View Analytics")
        print("  [6] 🔄 Switch User")
        print("  [7] 🚪 Exit")
        print()
    
    def create_request(self):
        """Create a new ClearFund request"""
        clear_screen()
        print("\n" + "═" * 60)
        print("  ➕ NEW CLEARFUND REQUEST")
        print("═" * 60)
        
        # Get purpose
        print("\nWhat is this expense for?")
        purpose = input("> ").strip()
        if not purpose:
            print("❌ Purpose is required.")
            input("\nPress Enter to continue...")
            return
        
        # Get category
        print("\nCategory:")
        categories = list(ExpenseCategory)
        for i, cat in enumerate(categories, 1):
            icon = CATEGORY_ICONS.get(cat, "📦")
            print(f"  [{i}] {icon} {cat.value.title()}")
        
        try:
            cat_choice = int(input("\n> ").strip()) - 1
            category = categories[cat_choice]
        except (ValueError, IndexError):
            category = ExpenseCategory.OTHER
        
        # Get amount
        print("\nTotal Amount:")
        try:
            amount = float(input("$ ").strip().replace(",", ""))
        except ValueError:
            print("❌ Invalid amount.")
            input("\nPress Enter to continue...")
            return
        
        # Get vendor
        print("\nVendor Name (optional):")
        vendor = input("> ").strip() or None
        
        # Get payment link
        print("\nPayment Link (optional):")
        payment_link = input("> ").strip() or None
        
        # Get due date
        print("\nDue Date (YYYY-MM-DD or days from now, optional):")
        due_input = input("> ").strip()
        due_date = None
        if due_input:
            try:
                if due_input.isdigit():
                    due_date = date.today() + timedelta(days=int(due_input))
                else:
                    due_date = date.fromisoformat(due_input)
            except ValueError:
                pass
        
        # Get notes
        print("\nNotes (optional):")
        notes = input("> ").strip() or None
        
        # Get attachment
        print("\nAttach invoice? (enter filename or leave blank):")
        invoice = input("> ").strip() or None
        
        # Calculate split
        other_name, other_role = self.get_other_parent()
        
        # Show split preview
        print("\n" + "─" * 60)
        print("📋 AGREEMENT CHECK:")
        
        if self.agreement:
            from aria.clearfund import get_split_rule_from_agreement
            split_rule = get_split_rule_from_agreement(self.agreement, category)
        else:
            split_rule = "50/50"
        
        split = calculate_split(amount, split_rule)
        
        print(f"   Your agreement splits {category.value} expenses {split_rule}")
        print(f"   Total: {format_currency(amount)}")
        print(f"   Your share: {format_currency(split['requester_share'])}")
        print(f"   {other_name}'s share: {format_currency(split['responder_share'])}")
        print("─" * 60)
        
        # Confirm
        print("\nSubmit request? (y/n)")
        if input("> ").strip().lower() != 'y':
            print("\n🚫 Request cancelled.")
            input("\nPress Enter to continue...")
            return
        
        # Create the request
        request = self.store.create_request(
            purpose=purpose,
            category=category,
            amount=amount,
            requester=self.current_user_role,
            requester_name=self.current_user,
            responder=other_role,
            responder_name=other_name,
            vendor_name=vendor,
            payment_link=payment_link,
            due_date=due_date,
            notes=notes,
            invoice_attachment=invoice
        )
        
        print(f"\n✓ Request {request.id} created!")
        print(f"  {other_name} has been notified.")
        
        input("\nPress Enter to continue...")
    
    def view_all_requests(self):
        """View all requests"""
        clear_screen()
        print("\n" + "═" * 60)
        print("  📋 ALL REQUESTS")
        print("═" * 60)
        
        requests = self.store.get_all_requests()
        
        if not requests:
            print("\n  No requests yet.")
            input("\nPress Enter to continue...")
            return
        
        for req in requests:
            print(format_request_summary(req))
        
        print("\nEnter request ID to view details (or Enter to go back):")
        req_id = input("> ").strip()
        
        if req_id:
            self.view_request_detail(req_id)
    
    def view_request_detail(self, request_id: str):
        """View detailed request"""
        request = self.store.get_request(request_id)
        if not request:
            print(f"\n❌ Request {request_id} not found.")
            input("\nPress Enter to continue...")
            return
        
        # Record view
        self.store.record_view(request_id, self.current_user_role, self.current_user)
        
        clear_screen()
        print(format_request_detail(request))
        
        # Show actions based on status and user
        print("\nActions:")
        actions = []
        
        if request.status == RequestStatus.PENDING:
            if request.responder == self.current_user_role:
                actions.extend([
                    "[1] ✅ Approve",
                    "[2] 🟡 Partial Approve",
                    "[3] ❌ Reject"
                ])
            else:
                actions.append("[1] 🚫 Cancel Request")
        
        elif request.status == RequestStatus.APPROVED:
            actions.append("[1] 💰 Record Payment")
        
        elif request.status == RequestStatus.RECEIPT_PENDING:
            if request.requester == self.current_user_role:
                actions.append("[1] 📎 Upload Receipt")
        
        actions.extend([
            "[A] 📜 View Audit Trail",
            "[X] Back"
        ])
        
        for action in actions:
            print(f"  {action}")
        
        choice = input("\nChoice: ").strip().upper()
        
        if request.status == RequestStatus.PENDING:
            if request.responder == self.current_user_role:
                if choice == "1":
                    self.approve_request(request)
                elif choice == "2":
                    self.partial_approve_request(request)
                elif choice == "3":
                    self.reject_request(request)
            else:
                if choice == "1":
                    self.cancel_request(request)
        
        elif request.status == RequestStatus.APPROVED and choice == "1":
            self.record_payment(request)
        
        elif request.status == RequestStatus.RECEIPT_PENDING and choice == "1":
            self.upload_receipt(request)
        
        if choice == "A":
            self.view_audit_trail(request)
    
    def approve_request(self, request: ClearFundRequest):
        """Approve a request"""
        print("\nAdd a note (optional):")
        note = input("> ").strip() or None
        
        self.store.approve_request(request.id, self.current_user_role, self.current_user, note)
        print(f"\n✅ Request approved!")
        print(f"   Your share: {format_currency(request.responder_share)}")
        
        # Offer to pay now
        print("\nWould you like to record your payment now? (y/n)")
        if input("> ").strip().lower() == 'y':
            request = self.store.get_request(request.id)
            self.record_payment(request)
        else:
            input("\nPress Enter to continue...")
    
    def partial_approve_request(self, request: ClearFundRequest):
        """Partially approve a request"""
        print(f"\nOriginal amount: {format_currency(request.amount)}")
        print("Enter amount you're willing to approve:")
        
        try:
            approved_amount = float(input("$ ").strip().replace(",", ""))
        except ValueError:
            print("❌ Invalid amount.")
            input("\nPress Enter to continue...")
            return
        
        print("\nReason for partial approval:")
        note = input("> ").strip()
        
        self.store.partial_approve(request.id, self.current_user_role, self.current_user, 
                                   approved_amount, note)
        
        split = calculate_split(approved_amount, request.split_rule)
        print(f"\n🟡 Partially approved for {format_currency(approved_amount)}")
        print(f"   Your share: {format_currency(split['responder_share'])}")
        
        input("\nPress Enter to continue...")
    
    def reject_request(self, request: ClearFundRequest):
        """Reject a request"""
        print("\nReason for rejection (required):")
        reason = input("> ").strip()
        
        if not reason:
            print("❌ Reason is required.")
            input("\nPress Enter to continue...")
            return
        
        self.store.reject_request(request.id, self.current_user_role, self.current_user, reason)
        print(f"\n❌ Request rejected.")
        
        input("\nPress Enter to continue...")
    
    def cancel_request(self, request: ClearFundRequest):
        """Cancel a request"""
        print("\nAre you sure you want to cancel this request? (y/n)")
        if input("> ").strip().lower() != 'y':
            return
        
        print("\nReason (optional):")
        reason = input("> ").strip() or None
        
        self.store.cancel_request(request.id, self.current_user_role, self.current_user, reason)
        print("\n🚫 Request cancelled.")
        
        input("\nPress Enter to continue...")
    
    def record_payment(self, request: ClearFundRequest):
        """Record a payment"""
        # Determine amount owed by current user
        if self.current_user_role == request.requester:
            my_share = request.requester_share
        else:
            my_share = request.responder_share
        
        # Calculate remaining
        already_paid = sum(p.amount for p in request.payments if p.payer == self.current_user_role)
        remaining = my_share - already_paid
        
        print(f"\nYour share: {format_currency(my_share)}")
        print(f"Already paid: {format_currency(already_paid)}")
        print(f"Remaining: {format_currency(remaining)}")
        
        print(f"\nAmount to pay (default: {format_currency(remaining)}):")
        amount_input = input("$ ").strip()
        
        try:
            amount = float(amount_input.replace(",", "")) if amount_input else remaining
        except ValueError:
            print("❌ Invalid amount.")
            input("\nPress Enter to continue...")
            return
        
        print("\nPayment method:")
        print("  [1] Stripe")
        print("  [2] Venmo")
        print("  [3] Zelle")
        print("  [4] Other")
        
        method_choice = input("> ").strip()
        methods = {"1": "stripe", "2": "venmo", "3": "zelle", "4": "other"}
        method = methods.get(method_choice, "stripe")
        
        # Simulate payment
        print(f"\n⏳ Processing {format_currency(amount)} via {method}...")
        
        import time
        time.sleep(1)
        
        self.store.record_payment(request.id, self.current_user_role, self.current_user, 
                                 amount, method)
        
        print(f"\n💰 Payment of {format_currency(amount)} recorded!")
        
        # Check if fully funded
        request = self.store.get_request(request.id)
        if request.is_fully_funded:
            print("   ✓ Request is now fully funded!")
            if request.requester == self.current_user_role:
                print("   📎 Don't forget to upload the receipt!")
        
        input("\nPress Enter to continue...")
    
    def upload_receipt(self, request: ClearFundRequest):
        """Upload a receipt"""
        print("\nEnter receipt filename:")
        filename = input("> ").strip()
        
        if not filename:
            print("❌ Filename is required.")
            input("\nPress Enter to continue...")
            return
        
        self.store.upload_receipt(request.id, self.current_user_role, self.current_user, filename)
        print(f"\n📎 Receipt uploaded!")
        print("   ✓ Request marked as COMPLETE")
        
        input("\nPress Enter to continue...")
    
    def view_audit_trail(self, request: ClearFundRequest):
        """View audit trail for a request"""
        clear_screen()
        print(format_audit_trail(request))
        input("\nPress Enter to continue...")
    
    def view_pending_approvals(self):
        """View requests pending my approval"""
        clear_screen()
        print("\n" + "═" * 60)
        print("  ⏳ PENDING YOUR APPROVAL")
        print("═" * 60)
        
        pending = self.store.get_pending_for_user(self.current_user_role)
        
        if not pending:
            print("\n  ✓ No requests pending your approval!")
            input("\nPress Enter to continue...")
            return
        
        for req in pending:
            print(format_request_summary(req))
        
        print("\nEnter request ID to respond (or Enter to go back):")
        req_id = input("> ").strip()
        
        if req_id:
            self.view_request_detail(req_id)
    
    def view_needing_payment(self):
        """View requests where I need to pay"""
        clear_screen()
        print("\n" + "═" * 60)
        print("  💰 AWAITING YOUR PAYMENT")
        print("═" * 60)
        
        approved = self.store.get_requests_by_status(RequestStatus.APPROVED)
        
        # Filter to ones where current user owes money
        needing_payment = []
        for req in approved:
            if self.current_user_role == req.requester:
                my_share = req.requester_share
            else:
                my_share = req.responder_share
            
            already_paid = sum(p.amount for p in req.payments if p.payer == self.current_user_role)
            if already_paid < my_share:
                needing_payment.append((req, my_share - already_paid))
        
        if not needing_payment:
            print("\n  ✓ No payments pending from you!")
            input("\nPress Enter to continue...")
            return
        
        for req, amount_owed in needing_payment:
            print(format_request_summary(req))
            print(f"      💳 You owe: {format_currency(amount_owed)}")
            print()
        
        print("\nEnter request ID to pay (or Enter to go back):")
        req_id = input("> ").strip()
        
        if req_id:
            self.view_request_detail(req_id)
    
    def view_analytics(self):
        """View analytics dashboard"""
        clear_screen()
        
        analytics = self.store.get_analytics()
        
        print("\n" + "═" * 60)
        print("  📊 CLEARFUND ANALYTICS")
        print("═" * 60)
        
        print(f"""
LIFETIME SUMMARY
  Total Requests: {analytics['total_requests']}
  Completed: {analytics['by_status'].get('completed', 0)} ({analytics['completion_rate']}%)
  Rejected: {analytics['by_status'].get('rejected', 0)} ({analytics['rejection_rate']}%)

TOTAL FUNDED: {format_currency(analytics['total_funded'])}
""")
        
        if analytics.get('avg_response_time_hours'):
            print(f"Avg Response Time: {analytics['avg_response_time_hours']} hours")
        
        print("\n" + "─" * 60)
        print("BY CATEGORY:")
        print("─" * 60)
        
        for cat, data in analytics.get('by_category', {}).items():
            icon = CATEGORY_ICONS.get(ExpenseCategory(cat), "📦")
            print(f"  {icon} {cat.title()}: {format_currency(data['amount'])} ({data['count']} requests)")
        
        print("\n" + "─" * 60)
        print("BY PARENT:")
        print("─" * 60)
        
        for name, stats in analytics.get('user_stats', {}).items():
            print(f"\n  👤 {name}")
            print(f"     Created: {stats['created']} requests")
            print(f"     Approved: {stats['approved']}")
            print(f"     Rejected: {stats['rejected']}")
            print(f"     Total Funded: {format_currency(stats['funded'])}")
        
        print("\n" + "═" * 60)
        
        input("\nPress Enter to continue...")
    
    def switch_user(self):
        """Switch which parent is using the system"""
        print(f"\n👤 Currently: {self.current_user}")
        print(f"\nSwitch to:")
        print(f"  [1] {self.parent_a_name}")
        print(f"  [2] {self.parent_b_name}")
        
        choice = input("\nChoice: ").strip()
        
        if choice == "1":
            self.current_user = self.parent_a_name
            self.current_user_role = "parent_a"
        elif choice == "2":
            self.current_user = self.parent_b_name
            self.current_user_role = "parent_b"
        
        print(f"\n✓ Now using ClearFund as {self.current_user}")
    
    def run(self):
        """Run the demo"""
        clear_screen()
        print_header()
        
        self.setup()
        
        while True:
            clear_screen()
            print_header()
            self.dashboard()
            self.main_menu()
            
            choice = input("Choice: ").strip()
            
            if choice == "1":
                self.create_request()
            elif choice == "2":
                self.view_all_requests()
            elif choice == "3":
                self.view_pending_approvals()
            elif choice == "4":
                self.view_needing_payment()
            elif choice == "5":
                self.view_analytics()
            elif choice == "6":
                self.switch_user()
            elif choice == "7":
                print("\n👋 Thanks for using ClearFund!")
                print("   Remember: Structure brings peace. 💙\n")
                if self.store:
                    self.store.close()
                break


def main():
    """Main entry point"""
    demo = ClearFundDemo()
    demo.run()


if __name__ == "__main__":
    main()
