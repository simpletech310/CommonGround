"""
Custody Agreement Data Models
These define the structured output we want to extract from parent conversations
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from enum import Enum


# ============================================================================
# ENUMS FOR STANDARDIZED VALUES
# ============================================================================

class CustodyType(str, Enum):
    JOINT = "joint"
    SOLE = "sole"
    PRIMARY_WITH_VISITATION = "primary_with_visitation"


class Parent(str, Enum):
    MOTHER = "mother"
    FATHER = "father"
    PETITIONER = "petitioner"  # Legal term
    RESPONDENT = "respondent"  # Legal term


class DayOfWeek(str, Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"


class Frequency(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    AS_NEEDED = "as_needed"


# ============================================================================
# SECTION MODELS - These get extracted from conversation
# ============================================================================

class CustodyArrangement(BaseModel):
    """Core custody arrangement details"""
    custody_type: CustodyType = Field(description="Type of custody arrangement")
    primary_parent: Optional[Parent] = Field(
        default=None,
        description="If primary_with_visitation, who is the primary custodial parent"
    )
    custody_percentage_mother: Optional[int] = Field(
        default=None,
        description="Percentage of time with mother (e.g., 50 for 50/50)"
    )
    custody_percentage_father: Optional[int] = Field(
        default=None,
        description="Percentage of time with father"
    )
    schedule_description: Optional[str] = Field(
        default=None,
        description="Description of the custody schedule (e.g., alternating weeks)"
    )


class ExchangeLocation(BaseModel):
    """Details for pickup/dropoff location"""
    address: str = Field(description="Street address of exchange location")
    location_type: Optional[str] = Field(
        default=None,
        description="Type of location (e.g., police station, school, church, neutral location)"
    )
    city: Optional[str] = Field(default=None)
    state: Optional[str] = Field(default=None)
    special_instructions: Optional[str] = Field(
        default=None,
        description="Any special instructions for this location"
    )


class ExchangeSchedule(BaseModel):
    """Pickup or dropoff schedule details"""
    location: ExchangeLocation
    day_of_week: Optional[DayOfWeek] = Field(default=None)
    time: str = Field(description="Time in 12-hour format (e.g., 4:00 PM)")
    frequency: Frequency = Field(default=Frequency.WEEKLY)
    responsible_parent: Parent = Field(
        description="Which parent is responsible for transport to this exchange"
    )
    grace_period_minutes: Optional[int] = Field(
        default=15,
        description="Number of minutes grace period before considered late"
    )


class ChildSupport(BaseModel):
    """Child support payment details"""
    paying_parent: Parent = Field(description="Which parent pays child support")
    receiving_parent: Parent = Field(description="Which parent receives child support")
    monthly_amount: float = Field(description="Monthly child support amount in dollars")
    payment_method: Optional[str] = Field(
        default=None,
        description="How payment is made (e.g., direct deposit, check, wage garnishment)"
    )
    due_day_of_month: Optional[int] = Field(
        default=1,
        description="Day of month payment is due"
    )
    includes_medical: bool = Field(
        default=False,
        description="Whether child support includes medical expenses"
    )
    includes_childcare: bool = Field(
        default=False,
        description="Whether child support includes childcare expenses"
    )


class TransportationCosts(BaseModel):
    """Who pays for transportation during exchanges"""
    arrangement: Literal["each_pays_own", "split_equally", "one_parent_pays", "meets_halfway"]
    paying_parent: Optional[Parent] = Field(
        default=None,
        description="If one_parent_pays, which parent"
    )
    mileage_reimbursement: bool = Field(default=False)
    mileage_rate: Optional[float] = Field(
        default=None,
        description="If reimbursement, rate per mile"
    )


class ChildInfo(BaseModel):
    """Information about the child(ren)"""
    name: str = Field(description="Child's full name")
    date_of_birth: Optional[str] = Field(default=None, description="Child's date of birth")
    age: Optional[int] = Field(default=None)


class ParentInfo(BaseModel):
    """Information about a parent"""
    full_name: str
    role: Parent  # mother/father or petitioner/respondent
    address: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)


# ============================================================================
# COMPLETE AGREEMENT MODEL
# ============================================================================

class CustodyAgreementData(BaseModel):
    """Complete structured custody agreement data"""
    
    # Parent information
    parent_completing_form: ParentInfo = Field(
        description="Information about the parent filling out this agreement"
    )
    other_parent: Optional[ParentInfo] = Field(
        default=None,
        description="Information about the other parent"
    )
    
    # Child information
    children: List[ChildInfo] = Field(
        default_factory=list,
        description="List of children covered by this agreement"
    )
    
    # Core custody arrangement
    custody: CustodyArrangement = Field(
        description="The custody arrangement details"
    )
    
    # Exchange details
    pickup: Optional[ExchangeSchedule] = Field(
        default=None,
        description="Pickup schedule and location"
    )
    dropoff: Optional[ExchangeSchedule] = Field(
        default=None,
        description="Dropoff schedule and location"
    )
    
    # Financial arrangements
    child_support: Optional[ChildSupport] = Field(
        default=None,
        description="Child support arrangement if applicable"
    )
    transportation_costs: Optional[TransportationCosts] = Field(
        default=None,
        description="How transportation costs are handled"
    )
    
    # Additional notes
    special_provisions: Optional[str] = Field(
        default=None,
        description="Any special provisions or notes"
    )


# ============================================================================
# CONVERSATION STATE MODEL (for tracking interview progress)
# ============================================================================

class ConversationSection(str, Enum):
    INTRO = "intro"
    PARENT_INFO = "parent_info"
    CHILD_INFO = "child_info"
    CUSTODY_TYPE = "custody_type"
    EXCHANGE_SCHEDULE = "exchange_schedule"
    CHILD_SUPPORT = "child_support"
    TRANSPORTATION = "transportation"
    REVIEW = "review"
    COMPLETE = "complete"


class ConversationState(BaseModel):
    """Tracks the state of the interview conversation"""
    current_section: ConversationSection = Field(default=ConversationSection.INTRO)
    sections_completed: List[ConversationSection] = Field(default_factory=list)
    raw_responses: dict = Field(
        default_factory=dict,
        description="Raw text responses from parent, keyed by section"
    )
    clarifications_needed: List[str] = Field(default_factory=list)
    human_readable_summary: Optional[str] = Field(default=None)
    summary_approved: bool = Field(default=False)
    extracted_data: Optional[CustodyAgreementData] = Field(default=None)


# ============================================================================
# SECTION EXTRACTION MODELS (for partial extractions)
# ============================================================================

class ExtractedCustodySection(BaseModel):
    """Extracted custody information from conversation"""
    custody_type: Optional[CustodyType] = None
    primary_parent: Optional[str] = None
    percentage_split: Optional[str] = None
    schedule: Optional[str] = None
    confidence: float = Field(default=0.0, description="How confident in extraction 0-1")


class ExtractedExchangeSection(BaseModel):
    """Extracted exchange/pickup/dropoff info"""
    pickup_location: Optional[str] = None
    pickup_location_type: Optional[str] = None
    pickup_time: Optional[str] = None
    pickup_day: Optional[str] = None
    dropoff_location: Optional[str] = None
    dropoff_location_type: Optional[str] = None
    dropoff_time: Optional[str] = None
    dropoff_day: Optional[str] = None
    frequency: Optional[str] = None
    confidence: float = Field(default=0.0)


class ExtractedChildSupportSection(BaseModel):
    """Extracted child support information"""
    has_child_support: bool = False
    paying_parent: Optional[str] = None
    amount: Optional[float] = None
    frequency: Optional[str] = None
    confidence: float = Field(default=0.0)


class ExtractedTransportationSection(BaseModel):
    """Extracted transportation cost information"""
    arrangement: Optional[str] = None
    paying_parent: Optional[str] = None
    willing_to_meet_halfway: bool = False
    confidence: float = Field(default=0.0)
