"""
Database Models for Custody Agreement Tracking
SQLite database with SQLAlchemy ORM for storing agreements and versions.
Includes two-parent approval workflow and activation status.
"""

import os
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from enum import Enum

Base = declarative_base()


# ============================================================================
# ENUMS FOR STATUS TRACKING
# ============================================================================

class AgreementStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"  # Waiting for both parents
    APPROVED = "approved"                   # Both parents approved
    REJECTED = "rejected"                   # One or both rejected
    SUPERSEDED = "superseded"               # Replaced by newer version


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class ActivationStatus(str, Enum):
    INACTIVE = "inactive"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"  # Manually ended early


# ============================================================================
# AGREEMENT MODEL
# ============================================================================

class Agreement(Base):
    """Main agreement record - represents a custody case"""
    __tablename__ = "agreements"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    case_number = Column(String(50), unique=True, nullable=True)
    
    # Parent info
    petitioner_name = Column(String(200))
    petitioner_role = Column(String(50))  # MOTHER/FATHER
    petitioner_email = Column(String(200), nullable=True)
    petitioner_phone = Column(String(50), nullable=True)
    
    respondent_name = Column(String(200), nullable=True)
    respondent_role = Column(String(50), nullable=True)
    respondent_email = Column(String(200), nullable=True)
    respondent_phone = Column(String(50), nullable=True)
    
    # Children (stored as JSON array)
    children = Column(JSON, default=list)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(50), default=AgreementStatus.DRAFT.value)
    
    # State/jurisdiction
    state = Column(String(50), nullable=True)
    county = Column(String(100), nullable=True)
    
    # Active version tracking
    active_version_id = Column(Integer, nullable=True)
    
    # Relationships
    versions = relationship("AgreementVersion", back_populates="agreement", order_by="AgreementVersion.version_number")
    
    @property
    def current_version(self):
        """Get the latest version"""
        if self.versions:
            return max(self.versions, key=lambda v: v.version_number)
        return None
    
    @property
    def active_version(self):
        """Get the currently active version"""
        if self.active_version_id:
            return next((v for v in self.versions if v.id == self.active_version_id), None)
        return None
    
    @property
    def version_count(self):
        return len(self.versions)
    
    def __repr__(self):
        return f"<Agreement {self.id}: {self.petitioner_name} v. {self.respondent_name}>"


# ============================================================================
# AGREEMENT VERSION MODEL
# ============================================================================

class AgreementVersion(Base):
    """A specific version of an agreement with approval tracking"""
    __tablename__ = "agreement_versions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    agreement_id = Column(Integer, ForeignKey("agreements.id"), nullable=False)
    version_number = Column(Integer, default=1)
    
    # Version metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(200), nullable=True)
    change_summary = Column(Text, nullable=True)
    
    # Raw conversation data (stored as JSON)
    conversation_data = Column(JSON, default=dict)
    
    # Human-readable summary (the translated version)
    summary_text = Column(Text, nullable=True)
    summary_approved = Column(Boolean, default=False)
    summary_approved_at = Column(DateTime, nullable=True)
    
    # Extracted structured data (stored as JSON)
    extracted_data = Column(JSON, default=dict)
    
    # Generated document
    document_text = Column(Text, nullable=True)
    document_generated_at = Column(DateTime, nullable=True)
    
    # ==================== APPROVAL TRACKING ====================
    
    # Petitioner approval
    petitioner_approval_status = Column(String(50), default=ApprovalStatus.PENDING.value)
    petitioner_approval_at = Column(DateTime, nullable=True)
    petitioner_rejection_reason = Column(Text, nullable=True)
    
    # Respondent approval
    respondent_approval_status = Column(String(50), default=ApprovalStatus.PENDING.value)
    respondent_approval_at = Column(DateTime, nullable=True)
    respondent_rejection_reason = Column(Text, nullable=True)
    
    # Overall approval
    both_approved = Column(Boolean, default=False)
    approval_completed_at = Column(DateTime, nullable=True)
    
    # ==================== ACTIVATION TRACKING ====================
    
    activation_status = Column(String(50), default=ActivationStatus.INACTIVE.value)
    activated_at = Column(DateTime, nullable=True)
    activated_by = Column(String(200), nullable=True)
    
    # Validity period
    effective_date = Column(Date, nullable=True)
    expiration_date = Column(Date, nullable=True)
    
    # Termination
    terminated_at = Column(DateTime, nullable=True)
    terminated_by = Column(String(200), nullable=True)
    termination_reason = Column(Text, nullable=True)
    
    # ==================== SECTION DATA ====================
    
    section_custody = Column(JSON, default=dict)
    section_parenting_time = Column(JSON, default=dict)
    section_exchange = Column(JSON, default=dict)
    section_child_support = Column(JSON, default=dict)
    section_medical = Column(JSON, default=dict)
    section_education = Column(JSON, default=dict)
    section_communication = Column(JSON, default=dict)
    section_holidays = Column(JSON, default=dict)
    section_travel = Column(JSON, default=dict)
    section_relocation = Column(JSON, default=dict)
    section_dispute_resolution = Column(JSON, default=dict)
    section_other = Column(JSON, default=dict)
    
    # Status
    status = Column(String(50), default=AgreementStatus.DRAFT.value)
    
    # Relationship
    agreement = relationship("Agreement", back_populates="versions")
    
    # ==================== COMPUTED PROPERTIES ====================
    
    @property
    def is_pending_petitioner(self) -> bool:
        return self.petitioner_approval_status == ApprovalStatus.PENDING.value
    
    @property
    def is_pending_respondent(self) -> bool:
        return self.respondent_approval_status == ApprovalStatus.PENDING.value
    
    @property
    def is_fully_approved(self) -> bool:
        return (self.petitioner_approval_status == ApprovalStatus.ACCEPTED.value and 
                self.respondent_approval_status == ApprovalStatus.ACCEPTED.value)
    
    @property
    def has_rejection(self) -> bool:
        return (self.petitioner_approval_status == ApprovalStatus.REJECTED.value or 
                self.respondent_approval_status == ApprovalStatus.REJECTED.value)
    
    @property
    def is_active(self) -> bool:
        return self.activation_status == ActivationStatus.ACTIVE.value
    
    @property
    def is_expired(self) -> bool:
        if self.expiration_date and self.activation_status == ActivationStatus.ACTIVE.value:
            return datetime.now().date() > self.expiration_date
        return False
    
    @property
    def days_until_expiration(self) -> Optional[int]:
        if self.expiration_date and self.is_active:
            delta = self.expiration_date - datetime.now().date()
            return delta.days
        return None
    
    def __repr__(self):
        return f"<AgreementVersion {self.agreement_id} v{self.version_number}>"


# ============================================================================
# APPROVAL HISTORY MODEL
# ============================================================================

class ApprovalHistory(Base):
    """Track all approval/rejection actions"""
    __tablename__ = "approval_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    version_id = Column(Integer, ForeignKey("agreement_versions.id"), nullable=False)
    
    # Who took action
    parent_role = Column(String(50))  # petitioner/respondent
    parent_name = Column(String(200))
    
    # Action details
    action = Column(String(50))  # accepted/rejected
    reason = Column(Text, nullable=True)  # For rejections
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # IP/device tracking (for audit)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)


# ============================================================================
# CONVERSATION LOG MODEL
# ============================================================================

class ConversationLog(Base):
    """Log of all conversations for an agreement version"""
    __tablename__ = "conversation_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    version_id = Column(Integer, ForeignKey("agreement_versions.id"), nullable=False)
    
    # Conversation details
    section = Column(String(100))
    role = Column(String(50))  # user/assistant
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Metadata
    extracted_info = Column(JSON, nullable=True)


# ============================================================================
# DATABASE MANAGER
# ============================================================================

class DatabaseManager:
    """Manager class for database operations"""
    
    def __init__(self, db_path: str = "custody_agreements.db"):
        """Initialize database connection"""
        self.db_path = db_path
        self.engine = create_engine(f"sqlite:///{db_path}", echo=False)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
    
    # ==================== AGREEMENT OPERATIONS ====================
    
    def create_agreement(
        self,
        petitioner_name: str,
        petitioner_role: str,
        respondent_name: str = None,
        respondent_role: str = None,
        children: list = None,
        state: str = None,
        county: str = None,
        petitioner_email: str = None,
        petitioner_phone: str = None,
        respondent_email: str = None,
        respondent_phone: str = None
    ) -> Agreement:
        """Create a new agreement"""
        agreement = Agreement(
            petitioner_name=petitioner_name,
            petitioner_role=petitioner_role,
            petitioner_email=petitioner_email,
            petitioner_phone=petitioner_phone,
            respondent_name=respondent_name,
            respondent_role=respondent_role,
            respondent_email=respondent_email,
            respondent_phone=respondent_phone,
            children=children or [],
            state=state,
            county=county
        )
        self.session.add(agreement)
        self.session.commit()
        
        # Create initial version
        self.create_version(agreement.id, created_by=petitioner_name)
        
        return agreement
    
    def get_agreement(self, agreement_id: int) -> Optional[Agreement]:
        """Get an agreement by ID"""
        return self.session.query(Agreement).filter(Agreement.id == agreement_id).first()
    
    def get_all_agreements(self) -> List[Agreement]:
        """Get all agreements"""
        return self.session.query(Agreement).order_by(Agreement.updated_at.desc()).all()
    
    def update_agreement(self, agreement_id: int, **kwargs) -> Optional[Agreement]:
        """Update an agreement"""
        agreement = self.get_agreement(agreement_id)
        if agreement:
            for key, value in kwargs.items():
                if hasattr(agreement, key):
                    setattr(agreement, key, value)
            self.session.commit()
        return agreement
    
    def delete_agreement(self, agreement_id: int) -> bool:
        """Delete an agreement and all its versions"""
        agreement = self.get_agreement(agreement_id)
        if agreement:
            self.session.delete(agreement)
            self.session.commit()
            return True
        return False
    
    # ==================== VERSION OPERATIONS ====================
    
    def create_version(
        self,
        agreement_id: int,
        created_by: str = None,
        change_summary: str = None,
        base_version_id: int = None
    ) -> Optional[AgreementVersion]:
        """Create a new version of an agreement"""
        agreement = self.get_agreement(agreement_id)
        if not agreement:
            return None
        
        # Determine version number
        if agreement.versions:
            next_version = max(v.version_number for v in agreement.versions) + 1
        else:
            next_version = 1
        
        # If basing on existing version, copy its data
        initial_data = {}
        if base_version_id:
            base_version = self.get_version(base_version_id)
            if base_version:
                initial_data = {
                    'conversation_data': base_version.conversation_data,
                    'extracted_data': base_version.extracted_data,
                    'summary_text': base_version.summary_text,
                    'section_custody': base_version.section_custody,
                    'section_parenting_time': base_version.section_parenting_time,
                    'section_exchange': base_version.section_exchange,
                    'section_child_support': base_version.section_child_support,
                    'section_medical': base_version.section_medical,
                    'section_education': base_version.section_education,
                    'section_communication': base_version.section_communication,
                    'section_holidays': base_version.section_holidays,
                    'section_travel': base_version.section_travel,
                    'section_relocation': base_version.section_relocation,
                    'section_dispute_resolution': base_version.section_dispute_resolution,
                    'section_other': base_version.section_other,
                }
        
        version = AgreementVersion(
            agreement_id=agreement_id,
            version_number=next_version,
            created_by=created_by,
            change_summary=change_summary or f"Version {next_version} created",
            **initial_data
        )
        
        # Mark previous versions as superseded
        if next_version > 1:
            for v in agreement.versions:
                if v.status not in [AgreementStatus.SUPERSEDED.value, AgreementStatus.APPROVED.value]:
                    v.status = AgreementStatus.SUPERSEDED.value
        
        self.session.add(version)
        self.session.commit()
        return version
    
    def get_version(self, version_id: int) -> Optional[AgreementVersion]:
        """Get a specific version by ID"""
        return self.session.query(AgreementVersion).filter(AgreementVersion.id == version_id).first()
    
    def get_versions(self, agreement_id: int) -> List[AgreementVersion]:
        """Get all versions for an agreement"""
        return self.session.query(AgreementVersion)\
            .filter(AgreementVersion.agreement_id == agreement_id)\
            .order_by(AgreementVersion.version_number.desc())\
            .all()
    
    def update_version(self, version_id: int, **kwargs) -> Optional[AgreementVersion]:
        """Update a version"""
        version = self.get_version(version_id)
        if version:
            for key, value in kwargs.items():
                if hasattr(version, key):
                    setattr(version, key, value)
            self.session.commit()
        return version
    
    # ==================== APPROVAL OPERATIONS ====================
    
    def submit_for_approval(self, version_id: int) -> Optional[AgreementVersion]:
        """Submit a version for parent approval"""
        version = self.get_version(version_id)
        if version and version.document_text:
            version.status = AgreementStatus.PENDING_APPROVAL.value
            version.petitioner_approval_status = ApprovalStatus.PENDING.value
            version.respondent_approval_status = ApprovalStatus.PENDING.value
            self.session.commit()
        return version
    
    def record_approval(
        self,
        version_id: int,
        parent_role: str,  # "petitioner" or "respondent"
        action: str,  # "accepted" or "rejected"
        reason: str = None,
        parent_name: str = None
    ) -> Optional[AgreementVersion]:
        """Record a parent's approval or rejection"""
        version = self.get_version(version_id)
        if not version:
            return None
        
        now = datetime.utcnow()
        
        # Update the appropriate fields
        if parent_role == "petitioner":
            version.petitioner_approval_status = action
            version.petitioner_approval_at = now
            if action == ApprovalStatus.REJECTED.value:
                version.petitioner_rejection_reason = reason
        elif parent_role == "respondent":
            version.respondent_approval_status = action
            version.respondent_approval_at = now
            if action == ApprovalStatus.REJECTED.value:
                version.respondent_rejection_reason = reason
        
        # Log the approval action
        history = ApprovalHistory(
            version_id=version_id,
            parent_role=parent_role,
            parent_name=parent_name or parent_role,
            action=action,
            reason=reason,
            timestamp=now
        )
        self.session.add(history)
        
        # Check if both have approved
        if version.is_fully_approved:
            version.both_approved = True
            version.approval_completed_at = now
            version.status = AgreementStatus.APPROVED.value
        elif version.has_rejection:
            version.status = AgreementStatus.REJECTED.value
        
        self.session.commit()
        return version
    
    def get_approval_history(self, version_id: int) -> List[ApprovalHistory]:
        """Get approval history for a version"""
        return self.session.query(ApprovalHistory)\
            .filter(ApprovalHistory.version_id == version_id)\
            .order_by(ApprovalHistory.timestamp.desc())\
            .all()
    
    # ==================== ACTIVATION OPERATIONS ====================
    
    def activate_version(
        self,
        version_id: int,
        effective_date: datetime = None,
        expiration_date: datetime = None,
        validity_days: int = 365,
        activated_by: str = None
    ) -> Optional[AgreementVersion]:
        """Activate an approved version"""
        version = self.get_version(version_id)
        if not version or not version.is_fully_approved:
            return None
        
        now = datetime.utcnow()
        
        # Set dates
        if effective_date is None:
            effective_date = now.date()
        
        if expiration_date is None:
            expiration_date = effective_date + timedelta(days=validity_days)
        
        # Deactivate any previously active version for this agreement
        agreement = self.get_agreement(version.agreement_id)
        if agreement.active_version_id:
            old_active = self.get_version(agreement.active_version_id)
            if old_active:
                old_active.activation_status = ActivationStatus.INACTIVE.value
        
        # Activate this version
        version.activation_status = ActivationStatus.ACTIVE.value
        version.activated_at = now
        version.activated_by = activated_by
        version.effective_date = effective_date
        version.expiration_date = expiration_date
        
        # Update agreement
        agreement.active_version_id = version.id
        agreement.status = AgreementStatus.APPROVED.value
        
        self.session.commit()
        return version
    
    def deactivate_version(
        self,
        version_id: int,
        reason: str = None,
        terminated_by: str = None
    ) -> Optional[AgreementVersion]:
        """Deactivate/terminate an active version"""
        version = self.get_version(version_id)
        if not version or not version.is_active:
            return None
        
        version.activation_status = ActivationStatus.TERMINATED.value
        version.terminated_at = datetime.utcnow()
        version.terminated_by = terminated_by
        version.termination_reason = reason
        
        # Update agreement
        agreement = self.get_agreement(version.agreement_id)
        if agreement.active_version_id == version.id:
            agreement.active_version_id = None
        
        self.session.commit()
        return version
    
    def check_and_expire_versions(self) -> List[AgreementVersion]:
        """Check for and mark expired versions"""
        today = datetime.now().date()
        expired = self.session.query(AgreementVersion)\
            .filter(AgreementVersion.activation_status == ActivationStatus.ACTIVE.value)\
            .filter(AgreementVersion.expiration_date < today)\
            .all()
        
        for version in expired:
            version.activation_status = ActivationStatus.EXPIRED.value
            # Update agreement
            agreement = self.get_agreement(version.agreement_id)
            if agreement.active_version_id == version.id:
                agreement.active_version_id = None
        
        if expired:
            self.session.commit()
        
        return expired
    
    # ==================== CONVERSATION LOG OPERATIONS ====================
    
    def log_conversation(
        self,
        version_id: int,
        section: str,
        role: str,
        message: str,
        extracted_info: dict = None
    ) -> ConversationLog:
        """Log a conversation message"""
        log = ConversationLog(
            version_id=version_id,
            section=section,
            role=role,
            message=message,
            extracted_info=extracted_info
        )
        self.session.add(log)
        self.session.commit()
        return log
    
    def get_conversation_history(self, version_id: int, section: str = None) -> List[ConversationLog]:
        """Get conversation history for a version"""
        query = self.session.query(ConversationLog)\
            .filter(ConversationLog.version_id == version_id)
        
        if section:
            query = query.filter(ConversationLog.section == section)
        
        return query.order_by(ConversationLog.timestamp).all()
    
    # ==================== UTILITY METHODS ====================
    
    def close(self):
        """Close the database session"""
        self.session.close()
    
    def get_statistics(self) -> dict:
        """Get database statistics"""
        total_agreements = self.session.query(Agreement).count()
        total_versions = self.session.query(AgreementVersion).count()
        
        # Agreements by status
        status_counts = {}
        for status in AgreementStatus:
            count = self.session.query(Agreement).filter(Agreement.status == status.value).count()
            status_counts[status.value] = count
        
        # Active versions
        active_versions = self.session.query(AgreementVersion)\
            .filter(AgreementVersion.activation_status == ActivationStatus.ACTIVE.value)\
            .count()
        
        # Pending approvals
        pending_approvals = self.session.query(AgreementVersion)\
            .filter(AgreementVersion.status == AgreementStatus.PENDING_APPROVAL.value)\
            .count()
        
        return {
            "total_agreements": total_agreements,
            "total_versions": total_versions,
            "active_versions": active_versions,
            "pending_approvals": pending_approvals,
            "by_status": status_counts
        }
    
    def get_pending_approvals_for_parent(self, parent_role: str) -> List[AgreementVersion]:
        """Get versions pending approval for a specific parent"""
        if parent_role == "petitioner":
            return self.session.query(AgreementVersion)\
                .filter(AgreementVersion.status == AgreementStatus.PENDING_APPROVAL.value)\
                .filter(AgreementVersion.petitioner_approval_status == ApprovalStatus.PENDING.value)\
                .all()
        else:
            return self.session.query(AgreementVersion)\
                .filter(AgreementVersion.status == AgreementStatus.PENDING_APPROVAL.value)\
                .filter(AgreementVersion.respondent_approval_status == ApprovalStatus.PENDING.value)\
                .all()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_db(db_path: str = "custody_agreements.db") -> DatabaseManager:
    """Get a database manager instance"""
    return DatabaseManager(db_path)


def format_agreement_display(agreement: Agreement) -> str:
    """Format an agreement for display"""
    children_str = ", ".join([c.get("name", "Unknown") for c in (agreement.children or [])]) or "No children listed"
    
    # Get active version info
    active_info = ""
    if agreement.active_version:
        v = agreement.active_version
        exp_str = v.expiration_date.strftime('%Y-%m-%d') if v.expiration_date else "N/A"
        days_left = v.days_until_expiration
        if days_left is not None:
            active_info = f"\n│ 🟢 Active: Version {v.version_number} (expires {exp_str}, {days_left} days left)"
        else:
            active_info = f"\n│ 🟢 Active: Version {v.version_number}"
    
    return f"""
┌─────────────────────────────────────────────────────────────────
│ Agreement #{agreement.id}
├─────────────────────────────────────────────────────────────────
│ Petitioner: {agreement.petitioner_name} ({agreement.petitioner_role})
│ Respondent: {agreement.respondent_name or 'Not specified'} ({agreement.respondent_role or ''})
│ Children:   {children_str}
│ Status:     {agreement.status.upper()}
│ Versions:   {agreement.version_count}{active_info}
│ Created:    {agreement.created_at.strftime('%Y-%m-%d %H:%M')}
│ Updated:    {agreement.updated_at.strftime('%Y-%m-%d %H:%M')}
└─────────────────────────────────────────────────────────────────"""


def format_version_display(version: AgreementVersion) -> str:
    """Format a version for display"""
    # Approval status
    pet_status = "✓" if version.petitioner_approval_status == "accepted" else ("✗" if version.petitioner_approval_status == "rejected" else "⏳")
    res_status = "✓" if version.respondent_approval_status == "accepted" else ("✗" if version.respondent_approval_status == "rejected" else "⏳")
    
    # Activation status
    activation = ""
    if version.activation_status == ActivationStatus.ACTIVE.value:
        exp_str = version.expiration_date.strftime('%Y-%m-%d') if version.expiration_date else "N/A"
        activation = f"\n  │   🟢 ACTIVE until {exp_str}"
    elif version.activation_status == ActivationStatus.EXPIRED.value:
        activation = "\n  │   🔴 EXPIRED"
    elif version.activation_status == ActivationStatus.TERMINATED.value:
        activation = "\n  │   ⚫ TERMINATED"
    
    return f"""
  ├── Version {version.version_number}
  │   Status: {version.status}
  │   Approvals: Petitioner [{pet_status}]  Respondent [{res_status}]
  │   Created: {version.created_at.strftime('%Y-%m-%d %H:%M')}
  │   By: {version.created_by or 'Unknown'}
  │   Document: {'Yes' if version.document_text else 'No'}{activation}
  │   Changes: {version.change_summary or 'Initial version'}"""


def format_approval_status(version: AgreementVersion) -> str:
    """Format detailed approval status for a version"""
    lines = []
    lines.append("=" * 60)
    lines.append("  APPROVAL STATUS")
    lines.append("=" * 60)
    
    # Petitioner
    pet_icon = "✅" if version.petitioner_approval_status == "accepted" else ("❌" if version.petitioner_approval_status == "rejected" else "⏳")
    lines.append(f"\n  PETITIONER: {pet_icon} {version.petitioner_approval_status.upper()}")
    if version.petitioner_approval_at:
        lines.append(f"    Responded: {version.petitioner_approval_at.strftime('%Y-%m-%d %H:%M')}")
    if version.petitioner_rejection_reason:
        lines.append(f"    Reason: {version.petitioner_rejection_reason}")
    
    # Respondent
    res_icon = "✅" if version.respondent_approval_status == "accepted" else ("❌" if version.respondent_approval_status == "rejected" else "⏳")
    lines.append(f"\n  RESPONDENT: {res_icon} {version.respondent_approval_status.upper()}")
    if version.respondent_approval_at:
        lines.append(f"    Responded: {version.respondent_approval_at.strftime('%Y-%m-%d %H:%M')}")
    if version.respondent_rejection_reason:
        lines.append(f"    Reason: {version.respondent_rejection_reason}")
    
    # Overall status
    lines.append("\n" + "-" * 60)
    if version.is_fully_approved:
        lines.append("  ✅ BOTH PARENTS APPROVED - Ready for activation")
    elif version.has_rejection:
        lines.append("  ❌ REJECTED - Create a new version to address concerns")
    else:
        lines.append("  ⏳ PENDING - Waiting for both parents to respond")
    
    return "\n".join(lines)
