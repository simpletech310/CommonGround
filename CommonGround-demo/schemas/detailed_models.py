"""
Enhanced Custody Agreement Data Models
Comprehensive schemas for detailed custody agreements with all sections.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from enum import Enum
from datetime import date, time


# ============================================================================
# ENUMS FOR STANDARDIZED VALUES
# ============================================================================

class CustodyType(str, Enum):
    JOINT_LEGAL_PHYSICAL = "joint_legal_and_physical"
    JOINT_LEGAL_SOLE_PHYSICAL = "joint_legal_sole_physical"
    SOLE_LEGAL_PHYSICAL = "sole_legal_and_physical"
    SPLIT_CUSTODY = "split_custody"  # Different children to different parents


class Parent(str, Enum):
    MOTHER = "mother"
    FATHER = "father"
    PETITIONER = "petitioner"
    RESPONDENT = "respondent"


class DecisionMaking(str, Enum):
    JOINT = "joint"
    MOTHER = "mother"
    FATHER = "father"
    TIEBREAKER_MOTHER = "joint_tiebreaker_mother"
    TIEBREAKER_FATHER = "joint_tiebreaker_father"


class Frequency(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    AS_NEEDED = "as_needed"


class CommunicationMethod(str, Enum):
    IN_PERSON = "in_person"
    PHONE = "phone"
    TEXT = "text"
    EMAIL = "email"
    COPARENTING_APP = "coparenting_app"
    VIDEO_CALL = "video_call"


# ============================================================================
# SECTION 1: BASIC INFORMATION
# ============================================================================

class ChildInfo(BaseModel):
    """Detailed information about a child"""
    full_name: str = Field(description="Child's full legal name")
    nickname: Optional[str] = Field(default=None)
    date_of_birth: Optional[str] = Field(default=None, description="YYYY-MM-DD format")
    age: Optional[int] = Field(default=None)
    gender: Optional[str] = Field(default=None)
    school_name: Optional[str] = Field(default=None)
    grade: Optional[str] = Field(default=None)
    special_needs: Optional[str] = Field(default=None, description="Any special needs or considerations")
    allergies: Optional[List[str]] = Field(default=None)
    medications: Optional[List[str]] = Field(default=None)


class ParentInfo(BaseModel):
    """Detailed information about a parent"""
    full_name: str
    role: Parent
    address: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None)
    state: Optional[str] = Field(default=None)
    zip_code: Optional[str] = Field(default=None)
    phone_primary: Optional[str] = Field(default=None)
    phone_secondary: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    employer: Optional[str] = Field(default=None)
    work_schedule: Optional[str] = Field(default=None, description="Typical work hours")
    
    
# ============================================================================
# SECTION 2: CUSTODY ARRANGEMENT
# ============================================================================

class LegalCustody(BaseModel):
    """Legal custody determines who makes major decisions"""
    custody_type: CustodyType
    
    # Decision-making for specific areas
    education_decisions: DecisionMaking = Field(default=DecisionMaking.JOINT)
    medical_decisions: DecisionMaking = Field(default=DecisionMaking.JOINT)
    religious_decisions: DecisionMaking = Field(default=DecisionMaking.JOINT)
    extracurricular_decisions: DecisionMaking = Field(default=DecisionMaking.JOINT)
    
    # Emergency decisions
    emergency_authority: str = Field(
        default="Either parent may make emergency decisions when the child is in their care",
        description="Who can make emergency decisions"
    )


class PhysicalCustody(BaseModel):
    """Physical custody determines where the child lives"""
    primary_residence_parent: Optional[Parent] = Field(default=None)
    mother_percentage: Optional[int] = Field(default=None, description="Percentage of time with mother")
    father_percentage: Optional[int] = Field(default=None, description="Percentage of time with father")
    
    # School year schedule
    school_year_arrangement: Optional[str] = Field(default=None)
    
    # Summer schedule (often different)
    summer_arrangement: Optional[str] = Field(default=None)


# ============================================================================
# SECTION 3: PARENTING TIME SCHEDULE
# ============================================================================

class WeeklySchedule(BaseModel):
    """Regular weekly parenting time schedule"""
    schedule_type: Literal["alternating_weeks", "alternating_weekends", "split_week", "custom"]
    
    # For split week
    mother_days: Optional[List[str]] = Field(default=None, description="Days child is with mother")
    father_days: Optional[List[str]] = Field(default=None, description="Days child is with father")
    
    # Description of arrangement
    description: str = Field(description="Detailed description of the weekly schedule")


class WeekendSchedule(BaseModel):
    """Weekend parenting time if applicable"""
    applies: bool = Field(default=False)
    which_parent: Optional[Parent] = Field(default=None)
    frequency: Frequency = Field(default=Frequency.BIWEEKLY)
    start_time: Optional[str] = Field(default=None, description="When weekend starts (e.g., Friday 6pm)")
    end_time: Optional[str] = Field(default=None, description="When weekend ends (e.g., Sunday 6pm)")


class MidweekVisitation(BaseModel):
    """Midweek visitation for non-custodial parent"""
    applies: bool = Field(default=False)
    day_of_week: Optional[str] = Field(default=None)
    start_time: Optional[str] = Field(default=None)
    end_time: Optional[str] = Field(default=None)
    includes_overnight: bool = Field(default=False)


class ParentingTimeSchedule(BaseModel):
    """Complete parenting time schedule"""
    weekly_schedule: WeeklySchedule
    weekend_schedule: Optional[WeekendSchedule] = None
    midweek_visitation: Optional[MidweekVisitation] = None
    
    # First, third, fifth weekend rules if applicable
    weekend_rotation_details: Optional[str] = Field(default=None)


# ============================================================================
# SECTION 4: HOLIDAY SCHEDULE
# ============================================================================

class HolidayAssignment(BaseModel):
    """Assignment for a specific holiday"""
    holiday_name: str
    even_years: Parent = Field(description="Which parent has child in even years")
    odd_years: Parent = Field(description="Which parent has child in odd years")
    start_time: Optional[str] = Field(default=None)
    end_time: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)


class HolidaySchedule(BaseModel):
    """Complete holiday schedule"""
    
    # Major holidays
    thanksgiving: Optional[HolidayAssignment] = None
    christmas_eve: Optional[HolidayAssignment] = None
    christmas_day: Optional[HolidayAssignment] = None
    new_years_eve: Optional[HolidayAssignment] = None
    new_years_day: Optional[HolidayAssignment] = None
    easter: Optional[HolidayAssignment] = None
    
    # Parent-specific holidays
    mothers_day: Parent = Field(default=Parent.MOTHER)
    fathers_day: Parent = Field(default=Parent.FATHER)
    
    # Child's birthday
    childs_birthday: Optional[str] = Field(
        default="shared or alternating",
        description="How child's birthday is handled"
    )
    
    # School breaks
    spring_break: Optional[str] = Field(default=None)
    winter_break: Optional[str] = Field(default=None)
    summer_vacation: Optional[str] = Field(default=None)
    
    # Other holidays
    other_holidays: Optional[List[HolidayAssignment]] = Field(default=None)
    
    # General rules
    holiday_takes_precedence: bool = Field(
        default=True,
        description="Whether holiday schedule overrides regular schedule"
    )


# ============================================================================
# SECTION 5: EXCHANGE/TRANSPORTATION
# ============================================================================

class ExchangeLocation(BaseModel):
    """Location for custody exchanges"""
    address: str
    location_type: Optional[str] = Field(default=None, description="e.g., police station, school, church")
    city: Optional[str] = Field(default=None)
    state: Optional[str] = Field(default=None)
    is_neutral: bool = Field(default=True)
    special_instructions: Optional[str] = Field(default=None)


class ExchangeSchedule(BaseModel):
    """Schedule and logistics for exchanges"""
    location: ExchangeLocation
    
    # Who transports
    pickup_responsibility: Parent = Field(description="Who picks up the child")
    dropoff_responsibility: Parent = Field(description="Who drops off the child")
    
    # Timing
    standard_exchange_day: Optional[str] = Field(default=None)
    standard_exchange_time: Optional[str] = Field(default=None)
    
    # Grace period
    grace_period_minutes: int = Field(default=15)
    late_notification_required: bool = Field(default=True)
    
    # Backup plans
    backup_contact: Optional[str] = Field(default=None, description="Who to contact if parent is unavailable")


class TransportationCosts(BaseModel):
    """How transportation costs are handled"""
    arrangement: Literal["each_own", "split_50_50", "one_pays", "proportional_income", "mileage_reimbursement"]
    paying_parent: Optional[Parent] = Field(default=None, description="If one pays, which parent")
    mileage_rate: Optional[float] = Field(default=None, description="If reimbursement, rate per mile")
    notes: Optional[str] = Field(default=None)


# ============================================================================
# SECTION 6: CHILD SUPPORT
# ============================================================================

class ChildSupportPayment(BaseModel):
    """Child support payment details"""
    paying_parent: Parent
    receiving_parent: Parent
    monthly_amount: float
    
    # Payment logistics
    due_day_of_month: int = Field(default=1)
    payment_method: str = Field(default="direct deposit")
    
    # Duration
    termination_conditions: Optional[str] = Field(
        default="Child reaches 18 or graduates high school, whichever is later"
    )


class AdditionalExpenses(BaseModel):
    """How additional child-related expenses are split"""
    # Medical
    uncovered_medical_split: str = Field(default="50/50", description="How uncovered medical costs are split")
    who_provides_insurance: Optional[Parent] = Field(default=None)
    
    # Education
    private_school_split: Optional[str] = Field(default=None)
    tutoring_split: Optional[str] = Field(default=None)
    college_savings: Optional[str] = Field(default=None)
    
    # Extracurricular
    extracurricular_split: str = Field(default="50/50")
    extracurricular_approval_required: bool = Field(default=True)
    
    # Childcare
    childcare_split: str = Field(default="50/50")


class ChildSupportSection(BaseModel):
    """Complete child support section"""
    has_child_support: bool
    payment: Optional[ChildSupportPayment] = None
    additional_expenses: Optional[AdditionalExpenses] = None
    
    # Tax implications
    who_claims_child_tax: Optional[str] = Field(default="alternating years")
    
    # Modification
    review_frequency: Optional[str] = Field(default="annually or upon significant change")


# ============================================================================
# SECTION 7: MEDICAL & HEALTH
# ============================================================================

class MedicalSection(BaseModel):
    """Medical and health care provisions"""
    # Insurance
    insurance_provider_parent: Parent
    insurance_company: Optional[str] = Field(default=None)
    policy_number: Optional[str] = Field(default=None)
    
    # Access to records
    both_parents_medical_access: bool = Field(default=True)
    
    # Decision making
    routine_medical_decisions: DecisionMaking = Field(default=DecisionMaking.JOINT)
    emergency_medical_authority: str = Field(
        default="Either parent may authorize emergency treatment"
    )
    
    # Specific conditions
    known_conditions: Optional[List[str]] = Field(default=None)
    current_medications: Optional[List[str]] = Field(default=None)
    allergies: Optional[List[str]] = Field(default=None)
    
    # Mental health
    therapy_consent: Optional[str] = Field(default="Both parents must consent")
    
    # Dental/Vision
    dental_provider: Optional[str] = Field(default=None)
    vision_provider: Optional[str] = Field(default=None)


# ============================================================================
# SECTION 8: EDUCATION
# ============================================================================

class EducationSection(BaseModel):
    """Education-related provisions"""
    current_school: Optional[str] = Field(default=None)
    school_district: Optional[str] = Field(default=None)
    
    # Access
    both_parents_school_access: bool = Field(default=True)
    both_receive_report_cards: bool = Field(default=True)
    both_attend_conferences: bool = Field(default=True)
    
    # Decisions
    school_choice_decision: DecisionMaking = Field(default=DecisionMaking.JOINT)
    
    # Homework
    homework_expectations: Optional[str] = Field(
        default="Both parents ensure homework is completed during their parenting time"
    )
    
    # Extracurricular at school
    school_activity_communication: Optional[str] = Field(default=None)


# ============================================================================
# SECTION 9: COMMUNICATION
# ============================================================================

class ParentCommunication(BaseModel):
    """How parents communicate with each other"""
    preferred_method: CommunicationMethod
    coparenting_app: Optional[str] = Field(default=None, description="e.g., OurFamilyWizard, TalkingParents")
    
    # Response expectations
    response_timeframe: str = Field(default="24 hours for non-urgent matters")
    emergency_contact_method: CommunicationMethod = Field(default=CommunicationMethod.PHONE)
    
    # Conflict resolution
    communication_tone: str = Field(default="Business-like and child-focused")
    no_negative_talk_about_other_parent: bool = Field(default=True)


class ChildCommunication(BaseModel):
    """Child's communication with non-custodial parent"""
    phone_calls_allowed: bool = Field(default=True)
    video_calls_allowed: bool = Field(default=True)
    
    # Schedule
    call_frequency: Optional[str] = Field(default="Daily if desired")
    preferred_call_times: Optional[str] = Field(default=None)
    
    # Privacy
    calls_are_private: bool = Field(default=True, description="Other parent doesn't listen in")
    
    # Technology
    child_has_phone: Optional[bool] = Field(default=None)
    social_media_rules: Optional[str] = Field(default=None)


class CommunicationSection(BaseModel):
    """Complete communication section"""
    parent_communication: ParentCommunication
    child_communication: ChildCommunication
    
    # Notification requirements
    schedule_change_notice: str = Field(default="48 hours when possible")
    emergency_notification: str = Field(default="Immediately")
    
    # Information sharing
    share_school_info: bool = Field(default=True)
    share_medical_info: bool = Field(default=True)
    share_activity_schedules: bool = Field(default=True)


# ============================================================================
# SECTION 10: TRAVEL & RELOCATION
# ============================================================================

class TravelProvisions(BaseModel):
    """Travel with the child"""
    # Domestic travel
    domestic_travel_notice: str = Field(default="7 days advance notice")
    domestic_travel_itinerary_required: bool = Field(default=True)
    
    # International travel
    international_travel_consent_required: bool = Field(default=True)
    passport_holder: Optional[Parent] = Field(default=None)
    international_travel_notice: str = Field(default="30 days advance notice")
    
    # Emergency contact while traveling
    travel_contact_info_required: bool = Field(default=True)


class RelocationProvisions(BaseModel):
    """Relocation (moving) provisions"""
    notice_required_days: int = Field(default=60)
    distance_requiring_notice_miles: int = Field(default=50)
    
    # What happens if relocation
    relocation_process: str = Field(
        default="Must provide written notice and attempt to reach agreement; court decides if no agreement"
    )
    
    # Impact on custody
    custody_modification_on_relocation: Optional[str] = Field(default=None)


# ============================================================================
# SECTION 11: DISPUTE RESOLUTION
# ============================================================================

class DisputeResolution(BaseModel):
    """How disputes are resolved"""
    # Steps
    first_step: str = Field(default="Direct communication between parents")
    second_step: str = Field(default="Mediation")
    third_step: str = Field(default="Court intervention")
    
    # Mediation
    mediation_required_before_court: bool = Field(default=True)
    mediation_cost_split: str = Field(default="50/50")
    preferred_mediator: Optional[str] = Field(default=None)
    
    # Emergency exceptions
    emergency_court_access: str = Field(
        default="Either party may seek emergency court intervention for safety issues"
    )


# ============================================================================
# SECTION 12: OTHER PROVISIONS
# ============================================================================

class OtherProvisions(BaseModel):
    """Miscellaneous provisions"""
    # Right of first refusal
    right_of_first_refusal: bool = Field(default=True)
    first_refusal_hours: int = Field(default=4, description="Hours of childcare before offering to other parent")
    
    # New partners
    introduction_of_new_partners: Optional[str] = Field(
        default="Wait until relationship is serious before introducing to child"
    )
    overnight_guests_rule: Optional[str] = Field(default=None)
    
    # Discipline
    discipline_agreement: Optional[str] = Field(default="Consistent discipline approach at both homes")
    no_corporal_punishment: bool = Field(default=True)
    
    # Religion
    religious_upbringing: Optional[str] = Field(default=None)
    
    # Pets
    pet_arrangements: Optional[str] = Field(default=None)
    
    # Items traveling with child
    items_travel_with_child: Optional[str] = Field(
        default="Medications, glasses, necessary electronics"
    )
    
    # Clothing
    clothing_arrangements: Optional[str] = Field(default="Each parent provides clothing at their home")
    
    # Special provisions
    custom_provisions: Optional[List[str]] = Field(default=None)


# ============================================================================
# COMPLETE AGREEMENT MODEL
# ============================================================================

class ComprehensiveCustodyAgreement(BaseModel):
    """Complete comprehensive custody agreement with all sections"""
    
    # Basic Information
    petitioner: ParentInfo
    respondent: ParentInfo
    children: List[ChildInfo]
    
    # Jurisdiction
    state: Optional[str] = Field(default=None)
    county: Optional[str] = Field(default=None)
    
    # Core Custody
    legal_custody: LegalCustody
    physical_custody: PhysicalCustody
    
    # Schedules
    parenting_time: ParentingTimeSchedule
    holiday_schedule: HolidaySchedule
    
    # Exchange & Transportation
    exchange: ExchangeSchedule
    transportation: TransportationCosts
    
    # Financial
    child_support: ChildSupportSection
    
    # Care & Development
    medical: MedicalSection
    education: EducationSection
    
    # Communication
    communication: CommunicationSection
    
    # Travel & Moving
    travel: TravelProvisions
    relocation: RelocationProvisions
    
    # Conflict Resolution
    dispute_resolution: DisputeResolution
    
    # Other
    other_provisions: OtherProvisions
    
    # Metadata
    effective_date: Optional[str] = Field(default=None)
    expiration_date: Optional[str] = Field(default=None)


# ============================================================================
# SECTION NAMES FOR INTERVIEW FLOW
# ============================================================================

DETAILED_SECTIONS = [
    "INTRO",
    "PARENT_INFO",
    "OTHER_PARENT_INFO",
    "CHILDREN_INFO",
    "LEGAL_CUSTODY",
    "PHYSICAL_CUSTODY",
    "PARENTING_SCHEDULE",
    "HOLIDAY_SCHEDULE",
    "EXCHANGE_LOGISTICS",
    "TRANSPORTATION",
    "CHILD_SUPPORT",
    "MEDICAL_HEALTHCARE",
    "EDUCATION",
    "PARENT_COMMUNICATION",
    "CHILD_COMMUNICATION",
    "TRAVEL",
    "RELOCATION",
    "DISPUTE_RESOLUTION",
    "OTHER_PROVISIONS",
    "REVIEW"
]


SECTION_DESCRIPTIONS = {
    "INTRO": "Welcome and introduction",
    "PARENT_INFO": "Your information",
    "OTHER_PARENT_INFO": "Other parent's information",
    "CHILDREN_INFO": "Information about your children",
    "LEGAL_CUSTODY": "Who makes major decisions (education, medical, religious)",
    "PHYSICAL_CUSTODY": "Where the children live primarily",
    "PARENTING_SCHEDULE": "Regular weekly/monthly schedule",
    "HOLIDAY_SCHEDULE": "Holidays, birthdays, school breaks",
    "EXCHANGE_LOGISTICS": "Where and when exchanges happen",
    "TRANSPORTATION": "Who drives and who pays",
    "CHILD_SUPPORT": "Financial support payments",
    "MEDICAL_HEALTHCARE": "Health insurance and medical decisions",
    "EDUCATION": "School and educational decisions",
    "PARENT_COMMUNICATION": "How you'll communicate with each other",
    "CHILD_COMMUNICATION": "Child's contact with other parent",
    "TRAVEL": "Vacations and trips with the child",
    "RELOCATION": "What happens if someone moves",
    "DISPUTE_RESOLUTION": "How disagreements are handled",
    "OTHER_PROVISIONS": "Additional terms and special situations",
    "REVIEW": "Review and finalize"
}
