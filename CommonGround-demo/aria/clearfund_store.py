"""
ClearFund Store
Database storage for ClearFund requests, payments, and audit trails.
"""

import os
import json
import uuid
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict

from .clearfund import (
    ClearFundRequest, RequestStatus, ExpenseCategory, AuditAction,
    AuditEntry, Payment, calculate_split, get_split_rule_from_agreement,
    format_currency, CATEGORY_ICONS, STATUS_ICONS
)

# Try SQLite, fallback to JSON
try:
    from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, Boolean, Date, JSON
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import sessionmaker
    USE_SQLITE = True
    Base = declarative_base()
except ImportError:
    USE_SQLITE = False


# =============================================================================
# SQLITE MODELS
# =============================================================================

if USE_SQLITE:
    class RequestModel(Base):
        """SQLite model for ClearFund requests"""
        __tablename__ = "clearfund_requests"
        
        id = Column(String(50), primary_key=True)
        purpose = Column(String(500))
        category = Column(String(50))
        amount = Column(Float)
        vendor_name = Column(String(200), nullable=True)
        payment_link = Column(String(500), nullable=True)
        due_date = Column(Date, nullable=True)
        notes = Column(Text, nullable=True)
        invoice_attachment = Column(String(200), nullable=True)
        receipt_attachment = Column(String(200), nullable=True)
        
        requester = Column(String(50))
        requester_name = Column(String(200))
        responder = Column(String(50))
        responder_name = Column(String(200))
        
        split_rule = Column(String(20))
        requester_share = Column(Float)
        responder_share = Column(Float)
        
        status = Column(String(50))
        created_at = Column(DateTime, default=datetime.utcnow)
        updated_at = Column(DateTime, default=datetime.utcnow)
        
        response_note = Column(Text, nullable=True)
        approved_amount = Column(Float, nullable=True)
        rejection_reason = Column(Text, nullable=True)
        responded_at = Column(DateTime, nullable=True)
        
        amount_funded = Column(Float, default=0.0)
        completed_at = Column(DateTime, nullable=True)
        
        # Store payments and audit as JSON
        payments_json = Column(JSON, default=list)
        audit_json = Column(JSON, default=list)
    
    class ConversationModel(Base):
        """Track which conversation/agreement this is for"""
        __tablename__ = "clearfund_conversations"
        
        id = Column(String(100), primary_key=True)
        parent_a_name = Column(String(200))
        parent_b_name = Column(String(200))
        agreement_id = Column(String(100), nullable=True)
        created_at = Column(DateTime, default=datetime.utcnow)


# =============================================================================
# CLEARFUND STORE
# =============================================================================

class ClearFundStore:
    """
    Storage and management for ClearFund requests.
    """
    
    def __init__(self, db_path: str = "clearfund.db", agreement: dict = None):
        """
        Initialize the store.
        
        Args:
            db_path: Path to SQLite database
            agreement: Optional custody agreement for split rules
        """
        self.db_path = db_path
        self.agreement = agreement or {}
        
        if USE_SQLITE:
            self.engine = create_engine(f"sqlite:///{db_path}", echo=False)
            Base.metadata.create_all(self.engine)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
        else:
            self.json_path = db_path.replace('.db', '.json')
            self._load_json()
        
        # Cache for quick lookups
        self._requests_cache: Dict[str, ClearFundRequest] = {}
    
    def _load_json(self):
        """Load data from JSON file"""
        if os.path.exists(self.json_path):
            with open(self.json_path, 'r') as f:
                self.data = json.load(f)
        else:
            self.data = {
                "requests": [],
                "conversations": {}
            }
    
    def _save_json(self):
        """Save data to JSON file"""
        def json_serializer(obj):
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            raise TypeError(f"Type {type(obj)} not serializable")
        
        with open(self.json_path, 'w') as f:
            json.dump(self.data, f, indent=2, default=json_serializer)
    
    def _generate_id(self) -> str:
        """Generate a unique request ID"""
        year = datetime.now().year
        # Count existing requests this year
        count = len([r for r in self.get_all_requests() 
                    if r.id.startswith(f"CF-{year}")])
        return f"CF-{year}-{count + 1:03d}"
    
    # ==================== REQUEST OPERATIONS ====================
    
    def create_request(
        self,
        purpose: str,
        category: ExpenseCategory,
        amount: float,
        requester: str,
        requester_name: str,
        responder: str,
        responder_name: str,
        vendor_name: str = None,
        payment_link: str = None,
        due_date: date = None,
        notes: str = None,
        invoice_attachment: str = None
    ) -> ClearFundRequest:
        """Create a new ClearFund request"""
        
        # Get split rule from agreement
        split_rule = get_split_rule_from_agreement(self.agreement, category)
        split = calculate_split(amount, split_rule, category)
        
        request_id = self._generate_id()
        
        request = ClearFundRequest(
            id=request_id,
            purpose=purpose,
            category=category,
            amount=amount,
            vendor_name=vendor_name,
            payment_link=payment_link,
            due_date=due_date,
            notes=notes,
            invoice_attachment=invoice_attachment,
            requester=requester,
            requester_name=requester_name,
            responder=responder,
            responder_name=responder_name,
            split_rule=split_rule,
            requester_share=split["requester_share"],
            responder_share=split["responder_share"],
            status=RequestStatus.PENDING,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Add creation audit entry
        request.audit_trail.append(AuditEntry(
            id=str(uuid.uuid4()),
            request_id=request_id,
            action=AuditAction.CREATED,
            actor=requester,
            actor_name=requester_name,
            timestamp=datetime.now(),
            details=f"Request for {format_currency(amount)} - {purpose}",
            attachment=invoice_attachment
        ))
        
        # Save to database
        self._save_request(request)
        
        return request
    
    def _save_request(self, request: ClearFundRequest):
        """Save a request to the database"""
        if USE_SQLITE:
            existing = self.session.query(RequestModel).filter_by(id=request.id).first()
            
            data = self._request_to_model_dict(request)
            
            if existing:
                # Update existing
                for key, value in data.items():
                    setattr(existing, key, value)
            else:
                # Create new
                model = RequestModel(**data)
                self.session.add(model)
            
            self.session.commit()
        else:
            # JSON storage - need to serialize dates
            data = self._request_to_json_dict(request)
            
            # Find and update or append
            found = False
            for i, r in enumerate(self.data["requests"]):
                if r["id"] == request.id:
                    self.data["requests"][i] = data
                    found = True
                    break
            
            if not found:
                self.data["requests"].append(data)
            
            self._save_json()
        
        # Update cache
        self._requests_cache[request.id] = request
    
    def _request_to_model_dict(self, request: ClearFundRequest) -> dict:
        """Convert request to dictionary for SQLite model storage"""
        return {
            "id": request.id,
            "purpose": request.purpose,
            "category": request.category.value,
            "amount": request.amount,
            "vendor_name": request.vendor_name,
            "payment_link": request.payment_link,
            "due_date": request.due_date,  # Keep as date object for SQLite
            "notes": request.notes,
            "invoice_attachment": request.invoice_attachment,
            "receipt_attachment": request.receipt_attachment,
            "requester": request.requester,
            "requester_name": request.requester_name,
            "responder": request.responder,
            "responder_name": request.responder_name,
            "split_rule": request.split_rule,
            "requester_share": request.requester_share,
            "responder_share": request.responder_share,
            "status": request.status.value,
            "created_at": request.created_at,
            "updated_at": request.updated_at,
            "response_note": request.response_note,
            "approved_amount": request.approved_amount,
            "rejection_reason": request.rejection_reason,
            "responded_at": request.responded_at,
            "amount_funded": request.amount_funded,
            "completed_at": request.completed_at,
            "payments_json": [self._payment_to_dict(p) for p in request.payments],
            "audit_json": [self._audit_to_dict(a) for a in request.audit_trail]
        }
    
    def _request_to_json_dict(self, request: ClearFundRequest) -> dict:
        """Convert request to dictionary for JSON storage (with serialized dates)"""
        return {
            "id": request.id,
            "purpose": request.purpose,
            "category": request.category.value,
            "amount": request.amount,
            "vendor_name": request.vendor_name,
            "payment_link": request.payment_link,
            "due_date": request.due_date.isoformat() if request.due_date else None,
            "notes": request.notes,
            "invoice_attachment": request.invoice_attachment,
            "receipt_attachment": request.receipt_attachment,
            "requester": request.requester,
            "requester_name": request.requester_name,
            "responder": request.responder,
            "responder_name": request.responder_name,
            "split_rule": request.split_rule,
            "requester_share": request.requester_share,
            "responder_share": request.responder_share,
            "status": request.status.value,
            "created_at": request.created_at.isoformat() if request.created_at else None,
            "updated_at": request.updated_at.isoformat() if request.updated_at else None,
            "response_note": request.response_note,
            "approved_amount": request.approved_amount,
            "rejection_reason": request.rejection_reason,
            "responded_at": request.responded_at.isoformat() if request.responded_at else None,
            "amount_funded": request.amount_funded,
            "completed_at": request.completed_at.isoformat() if request.completed_at else None,
            "payments_json": [self._payment_to_dict(p) for p in request.payments],
            "audit_json": [self._audit_to_dict(a) for a in request.audit_trail]
        }
    
    def _payment_to_dict(self, payment: Payment) -> dict:
        """Convert payment to dictionary"""
        return {
            "id": payment.id,
            "request_id": payment.request_id,
            "payer": payment.payer,
            "payer_name": payment.payer_name,
            "amount": payment.amount,
            "method": payment.method,
            "transaction_id": payment.transaction_id,
            "timestamp": payment.timestamp.isoformat() if payment.timestamp else None,
            "status": payment.status
        }
    
    def _audit_to_dict(self, audit: AuditEntry) -> dict:
        """Convert audit entry to dictionary"""
        return {
            "id": audit.id,
            "request_id": audit.request_id,
            "action": audit.action.value,
            "actor": audit.actor,
            "actor_name": audit.actor_name,
            "timestamp": audit.timestamp.isoformat() if audit.timestamp else None,
            "details": audit.details,
            "attachment": audit.attachment,
            "metadata": audit.metadata
        }
    
    def _dict_to_request(self, data: dict) -> ClearFundRequest:
        """Convert dictionary to ClearFundRequest"""
        # Handle due_date - could be date object (SQLite) or string (JSON)
        due_date_raw = data.get("due_date")
        if due_date_raw:
            if isinstance(due_date_raw, date):
                due_date = due_date_raw
            elif isinstance(due_date_raw, str):
                due_date = date.fromisoformat(due_date_raw)
            else:
                due_date = None
        else:
            due_date = None
        
        request = ClearFundRequest(
            id=data["id"],
            purpose=data["purpose"],
            category=ExpenseCategory(data["category"]),
            amount=data["amount"],
            vendor_name=data.get("vendor_name"),
            payment_link=data.get("payment_link"),
            due_date=due_date,
            notes=data.get("notes"),
            invoice_attachment=data.get("invoice_attachment"),
            receipt_attachment=data.get("receipt_attachment"),
            requester=data["requester"],
            requester_name=data["requester_name"],
            responder=data["responder"],
            responder_name=data["responder_name"],
            split_rule=data["split_rule"],
            requester_share=data["requester_share"],
            responder_share=data["responder_share"],
            status=RequestStatus(data["status"]),
            response_note=data.get("response_note"),
            approved_amount=data.get("approved_amount"),
            rejection_reason=data.get("rejection_reason"),
            amount_funded=data.get("amount_funded", 0.0)
        )
        
        # Parse dates - handle both datetime objects and strings
        created_at = data.get("created_at")
        if created_at:
            if isinstance(created_at, datetime):
                request.created_at = created_at
            elif isinstance(created_at, str):
                request.created_at = datetime.fromisoformat(created_at)
        
        updated_at = data.get("updated_at")
        if updated_at:
            if isinstance(updated_at, datetime):
                request.updated_at = updated_at
            elif isinstance(updated_at, str):
                request.updated_at = datetime.fromisoformat(updated_at)
        
        responded_at = data.get("responded_at")
        if responded_at:
            if isinstance(responded_at, datetime):
                request.responded_at = responded_at
            elif isinstance(responded_at, str):
                request.responded_at = datetime.fromisoformat(responded_at)
        
        completed_at = data.get("completed_at")
        if completed_at:
            if isinstance(completed_at, datetime):
                request.completed_at = completed_at
            elif isinstance(completed_at, str):
                request.completed_at = datetime.fromisoformat(completed_at)
        
        # Parse payments
        for p_data in data.get("payments_json", []):
            payment = Payment(
                id=p_data["id"],
                request_id=p_data["request_id"],
                payer=p_data["payer"],
                payer_name=p_data["payer_name"],
                amount=p_data["amount"],
                method=p_data["method"],
                transaction_id=p_data.get("transaction_id"),
                status=p_data.get("status", "completed")
            )
            timestamp = p_data.get("timestamp")
            if timestamp:
                if isinstance(timestamp, datetime):
                    payment.timestamp = timestamp
                elif isinstance(timestamp, str):
                    payment.timestamp = datetime.fromisoformat(timestamp)
            request.payments.append(payment)
        
        # Parse audit trail
        for a_data in data.get("audit_json", []):
            timestamp = a_data.get("timestamp")
            if timestamp:
                if isinstance(timestamp, datetime):
                    audit_timestamp = timestamp
                elif isinstance(timestamp, str):
                    audit_timestamp = datetime.fromisoformat(timestamp)
                else:
                    audit_timestamp = datetime.now()
            else:
                audit_timestamp = datetime.now()
            
            audit = AuditEntry(
                id=a_data["id"],
                request_id=a_data["request_id"],
                action=AuditAction(a_data["action"]),
                actor=a_data["actor"],
                actor_name=a_data["actor_name"],
                timestamp=audit_timestamp,
                details=a_data.get("details"),
                attachment=a_data.get("attachment"),
                metadata=a_data.get("metadata")
            )
            request.audit_trail.append(audit)
        
        return request
    
    def get_request(self, request_id: str) -> Optional[ClearFundRequest]:
        """Get a request by ID"""
        # Check cache first
        if request_id in self._requests_cache:
            return self._requests_cache[request_id]
        
        if USE_SQLITE:
            model = self.session.query(RequestModel).filter_by(id=request_id).first()
            if model:
                data = {c.name: getattr(model, c.name) for c in model.__table__.columns}
                request = self._dict_to_request(data)
                self._requests_cache[request_id] = request
                return request
        else:
            for r in self.data["requests"]:
                if r["id"] == request_id:
                    request = self._dict_to_request(r)
                    self._requests_cache[request_id] = request
                    return request
        
        return None
    
    def get_all_requests(self) -> List[ClearFundRequest]:
        """Get all requests"""
        if USE_SQLITE:
            models = self.session.query(RequestModel).order_by(RequestModel.created_at.desc()).all()
            requests = []
            for model in models:
                data = {c.name: getattr(model, c.name) for c in model.__table__.columns}
                requests.append(self._dict_to_request(data))
            return requests
        else:
            return [self._dict_to_request(r) for r in self.data["requests"]]
    
    def get_pending_for_user(self, user: str) -> List[ClearFundRequest]:
        """Get requests pending this user's approval"""
        all_requests = self.get_all_requests()
        return [r for r in all_requests 
                if r.status == RequestStatus.PENDING and r.responder == user]
    
    def get_requests_by_user(self, user: str) -> List[ClearFundRequest]:
        """Get requests created by this user"""
        all_requests = self.get_all_requests()
        return [r for r in all_requests if r.requester == user]
    
    def get_requests_by_status(self, status: RequestStatus) -> List[ClearFundRequest]:
        """Get requests by status"""
        all_requests = self.get_all_requests()
        return [r for r in all_requests if r.status == status]
    
    # ==================== REQUEST ACTIONS ====================
    
    def record_view(self, request_id: str, viewer: str, viewer_name: str):
        """Record that someone viewed the request"""
        request = self.get_request(request_id)
        if not request:
            return
        
        request.audit_trail.append(AuditEntry(
            id=str(uuid.uuid4()),
            request_id=request_id,
            action=AuditAction.VIEWED,
            actor=viewer,
            actor_name=viewer_name,
            timestamp=datetime.now()
        ))
        request.updated_at = datetime.now()
        self._save_request(request)
    
    def approve_request(self, request_id: str, approver: str, approver_name: str, 
                        note: str = None) -> ClearFundRequest:
        """Approve a request"""
        request = self.get_request(request_id)
        if not request:
            raise ValueError(f"Request {request_id} not found")
        
        request.status = RequestStatus.APPROVED
        request.responded_at = datetime.now()
        request.response_note = note
        request.updated_at = datetime.now()
        
        request.audit_trail.append(AuditEntry(
            id=str(uuid.uuid4()),
            request_id=request_id,
            action=AuditAction.APPROVED,
            actor=approver,
            actor_name=approver_name,
            timestamp=datetime.now(),
            details=note
        ))
        
        self._save_request(request)
        return request
    
    def reject_request(self, request_id: str, rejecter: str, rejecter_name: str,
                       reason: str) -> ClearFundRequest:
        """Reject a request"""
        request = self.get_request(request_id)
        if not request:
            raise ValueError(f"Request {request_id} not found")
        
        request.status = RequestStatus.REJECTED
        request.responded_at = datetime.now()
        request.rejection_reason = reason
        request.updated_at = datetime.now()
        
        request.audit_trail.append(AuditEntry(
            id=str(uuid.uuid4()),
            request_id=request_id,
            action=AuditAction.REJECTED,
            actor=rejecter,
            actor_name=rejecter_name,
            timestamp=datetime.now(),
            details=reason
        ))
        
        self._save_request(request)
        return request
    
    def partial_approve(self, request_id: str, approver: str, approver_name: str,
                        approved_amount: float, note: str = None) -> ClearFundRequest:
        """Partially approve a request for a different amount"""
        request = self.get_request(request_id)
        if not request:
            raise ValueError(f"Request {request_id} not found")
        
        request.status = RequestStatus.PARTIAL
        request.responded_at = datetime.now()
        request.approved_amount = approved_amount
        request.response_note = note
        request.updated_at = datetime.now()
        
        # Recalculate shares based on approved amount
        split = calculate_split(approved_amount, request.split_rule)
        request.requester_share = split["requester_share"]
        request.responder_share = split["responder_share"]
        
        request.audit_trail.append(AuditEntry(
            id=str(uuid.uuid4()),
            request_id=request_id,
            action=AuditAction.PARTIAL_APPROVED,
            actor=approver,
            actor_name=approver_name,
            timestamp=datetime.now(),
            details=f"Approved {format_currency(approved_amount)} of {format_currency(request.amount)}. {note or ''}"
        ))
        
        self._save_request(request)
        return request
    
    def record_payment(self, request_id: str, payer: str, payer_name: str,
                       amount: float, method: str = "stripe",
                       transaction_id: str = None) -> ClearFundRequest:
        """Record a payment on a request"""
        request = self.get_request(request_id)
        if not request:
            raise ValueError(f"Request {request_id} not found")
        
        payment = Payment(
            id=str(uuid.uuid4()),
            request_id=request_id,
            payer=payer,
            payer_name=payer_name,
            amount=amount,
            method=method,
            transaction_id=transaction_id or f"sim_{uuid.uuid4().hex[:8]}",
            timestamp=datetime.now()
        )
        
        request.payments.append(payment)
        request.amount_funded += amount
        request.updated_at = datetime.now()
        
        # Update status based on funding
        target = request.approved_amount if request.approved_amount else request.amount
        if request.amount_funded >= target:
            request.status = RequestStatus.RECEIPT_PENDING
        else:
            request.status = RequestStatus.FUNDED
        
        request.audit_trail.append(AuditEntry(
            id=str(uuid.uuid4()),
            request_id=request_id,
            action=AuditAction.PAYMENT_RECEIVED,
            actor=payer,
            actor_name=payer_name,
            timestamp=datetime.now(),
            details=f"{format_currency(amount)} via {method}",
            metadata={"transaction_id": payment.transaction_id}
        ))
        
        self._save_request(request)
        return request
    
    def upload_receipt(self, request_id: str, uploader: str, uploader_name: str,
                       receipt_filename: str) -> ClearFundRequest:
        """Upload a receipt and complete the request"""
        request = self.get_request(request_id)
        if not request:
            raise ValueError(f"Request {request_id} not found")
        
        request.receipt_attachment = receipt_filename
        request.status = RequestStatus.COMPLETED
        request.completed_at = datetime.now()
        request.updated_at = datetime.now()
        
        request.audit_trail.append(AuditEntry(
            id=str(uuid.uuid4()),
            request_id=request_id,
            action=AuditAction.RECEIPT_UPLOADED,
            actor=uploader,
            actor_name=uploader_name,
            timestamp=datetime.now(),
            attachment=receipt_filename
        ))
        
        request.audit_trail.append(AuditEntry(
            id=str(uuid.uuid4()),
            request_id=request_id,
            action=AuditAction.COMPLETED,
            actor="system",
            actor_name="System",
            timestamp=datetime.now(),
            details="Request completed"
        ))
        
        self._save_request(request)
        return request
    
    def cancel_request(self, request_id: str, canceller: str, canceller_name: str,
                       reason: str = None) -> ClearFundRequest:
        """Cancel a request"""
        request = self.get_request(request_id)
        if not request:
            raise ValueError(f"Request {request_id} not found")
        
        request.status = RequestStatus.CANCELLED
        request.updated_at = datetime.now()
        
        request.audit_trail.append(AuditEntry(
            id=str(uuid.uuid4()),
            request_id=request_id,
            action=AuditAction.CANCELLED,
            actor=canceller,
            actor_name=canceller_name,
            timestamp=datetime.now(),
            details=reason
        ))
        
        self._save_request(request)
        return request
    
    # ==================== ANALYTICS ====================
    
    def get_analytics(self) -> Dict[str, Any]:
        """Get overall analytics"""
        requests = self.get_all_requests()
        
        if not requests:
            return {
                "total_requests": 0,
                "by_status": {},
                "by_category": {},
                "total_funded": 0,
                "avg_response_time": None
            }
        
        # Count by status
        by_status = defaultdict(int)
        for r in requests:
            by_status[r.status.value] += 1
        
        # Count by category
        by_category = defaultdict(lambda: {"count": 0, "amount": 0})
        for r in requests:
            by_category[r.category.value]["count"] += 1
            by_category[r.category.value]["amount"] += r.amount
        
        # Total funded
        total_funded = sum(r.amount_funded for r in requests)
        
        # Average response time
        response_times = []
        for r in requests:
            if r.responded_at and r.created_at:
                delta = r.responded_at - r.created_at
                response_times.append(delta.total_seconds() / 3600)  # Hours
        
        avg_response_time = sum(response_times) / len(response_times) if response_times else None
        
        # Per-user stats
        user_stats = defaultdict(lambda: {"created": 0, "approved": 0, "rejected": 0, "funded": 0})
        for r in requests:
            user_stats[r.requester_name]["created"] += 1
            if r.status == RequestStatus.APPROVED or r.status in [RequestStatus.FUNDED, RequestStatus.COMPLETED]:
                user_stats[r.responder_name]["approved"] += 1
            elif r.status == RequestStatus.REJECTED:
                user_stats[r.responder_name]["rejected"] += 1
            
            for p in r.payments:
                user_stats[p.payer_name]["funded"] += p.amount
        
        return {
            "total_requests": len(requests),
            "by_status": dict(by_status),
            "by_category": dict(by_category),
            "total_funded": total_funded,
            "avg_response_time_hours": round(avg_response_time, 1) if avg_response_time else None,
            "user_stats": dict(user_stats),
            "completion_rate": round(by_status.get("completed", 0) / len(requests) * 100, 1) if requests else 0,
            "rejection_rate": round(by_status.get("rejected", 0) / len(requests) * 100, 1) if requests else 0
        }
    
    def close(self):
        """Close database connection"""
        if USE_SQLITE:
            self.session.close()


# =============================================================================
# SAMPLE DATA GENERATOR
# =============================================================================

def create_sample_requests(store: ClearFundStore, parent_a_name: str, parent_b_name: str):
    """Create sample requests for demo purposes"""
    
    # Completed request
    req1 = store.create_request(
        purpose="School Chromebook",
        category=ExpenseCategory.DEVICE,
        amount=350.00,
        requester="parent_a",
        requester_name=parent_a_name,
        responder="parent_b",
        responder_name=parent_b_name,
        vendor_name="Best Buy",
        payment_link="https://bestbuy.com/order/12345",
        due_date=date.today() - timedelta(days=10),
        notes="Required for 5th grade curriculum",
        invoice_attachment="chromebook_quote.pdf"
    )
    store.approve_request(req1.id, "parent_b", parent_b_name, "Looks good!")
    store.record_payment(req1.id, "parent_b", parent_b_name, 175.00, "stripe")
    store.record_payment(req1.id, "parent_a", parent_a_name, 175.00, "stripe")
    store.upload_receipt(req1.id, "parent_a", parent_a_name, "chromebook_receipt.pdf")
    
    # Funded, needs receipt
    req2 = store.create_request(
        purpose="Orthodontist Consultation",
        category=ExpenseCategory.MEDICAL,
        amount=250.00,
        requester="parent_b",
        requester_name=parent_b_name,
        responder="parent_a",
        responder_name=parent_a_name,
        vendor_name="Smile Dental Group",
        due_date=date.today() - timedelta(days=3),
        notes="Initial braces consultation"
    )
    store.approve_request(req2.id, "parent_a", parent_a_name)
    store.record_payment(req2.id, "parent_a", parent_a_name, 125.00, "venmo")
    store.record_payment(req2.id, "parent_b", parent_b_name, 125.00, "venmo")
    
    # Pending approval
    req3 = store.create_request(
        purpose="Fall Soccer Registration",
        category=ExpenseCategory.SPORTS,
        amount=425.00,
        requester="parent_a",
        requester_name=parent_a_name,
        responder="parent_b",
        responder_name=parent_b_name,
        vendor_name="Vista Youth Soccer League",
        payment_link="https://vistasoccer.org/register/2025",
        due_date=date.today() + timedelta(days=14),
        notes="Registration deadline is Jan 15, includes uniform",
        invoice_attachment="soccer_invoice.pdf"
    )
    
    # Rejected request (for demo)
    req4 = store.create_request(
        purpose="Gaming Console",
        category=ExpenseCategory.DEVICE,
        amount=499.00,
        requester="parent_a",
        requester_name=parent_a_name,
        responder="parent_b",
        responder_name=parent_b_name,
        vendor_name="GameStop",
        notes="For the kids' birthday"
    )
    store.reject_request(req4.id, "parent_b", parent_b_name, 
                         "This isn't a necessary expense. Let's discuss before purchasing.")
    
    return [req1, req2, req3, req4]
