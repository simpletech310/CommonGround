"""
SQLAlchemy Models for CommonGround MVP

This module contains all database models for the application.
"""

from app.models.base import Base
from app.models.user import User, UserProfile
from app.models.case import Case, CaseParticipant
from app.models.child import Child
from app.models.agreement import Agreement, AgreementVersion, AgreementSection
from app.models.message import Message, MessageFlag, MessageThread
from app.models.schedule import ScheduleEvent, ExchangeCheckIn
from app.models.my_time_collection import MyTimeCollection
from app.models.time_block import TimeBlock
from app.models.event_attendance import EventAttendance
from app.models.payment import Payment, ExpenseRequest, PaymentLedger
from app.models.legal import LegalAccess, CourtExport
from app.models.audit import AuditLog, EventLog
from app.models.custody_exchange import CustodyExchange, CustodyExchangeInstance
from app.models.court import (
    CourtProfessional,
    CourtAccessGrant,
    CourtAccessLog,
    CourtCaseSettings,
    CourtEvent,
    CourtMessage,
    InvestigationReport,
    CourtRole,
    AccessScope,
    GrantStatus,
    CourtEventType,
    CourtMessageType,
    ReportType,
    DEFAULT_ACCESS_DURATION,
)

__all__ = [
    "Base",
    "User",
    "UserProfile",
    "Case",
    "CaseParticipant",
    "Child",
    "Agreement",
    "AgreementVersion",
    "AgreementSection",
    "Message",
    "MessageFlag",
    "MessageThread",
    "ScheduleEvent",
    "ExchangeCheckIn",
    "MyTimeCollection",
    "TimeBlock",
    "EventAttendance",
    "Payment",
    "ExpenseRequest",
    "PaymentLedger",
    "LegalAccess",
    "CourtExport",
    "AuditLog",
    "EventLog",
    "CustodyExchange",
    "CustodyExchangeInstance",
    # Court Access Mode
    "CourtProfessional",
    "CourtAccessGrant",
    "CourtAccessLog",
    "CourtCaseSettings",
    "CourtEvent",
    "CourtMessage",
    "InvestigationReport",
    "CourtRole",
    "AccessScope",
    "GrantStatus",
    "CourtEventType",
    "CourtMessageType",
    "ReportType",
    "DEFAULT_ACCESS_DURATION",
]
