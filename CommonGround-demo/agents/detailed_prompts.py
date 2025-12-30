"""
Detailed Interview Prompts
Comprehensive fact-finding questions for each section of the custody agreement.
"""

# ============================================================================
# DETAILED SECTION PROMPTS
# ============================================================================

DETAILED_SECTION_PROMPTS = {
    "INTRO": """
╔══════════════════════════════════════════════════════════════════════════════╗
║                    COMMONGROUND CUSTODY AGREEMENT GENERATOR                   ║
║                         COMPREHENSIVE AGREEMENT BUILDER                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Welcome! 👋

I'm going to help you create a detailed, comprehensive custody agreement. This 
will cover everything from daily schedules to holidays, medical decisions, and 
more.

This is a thorough process - we'll go through about 18 different topics to make 
sure your agreement is complete and covers all the situations that might come up.

Take your time with each section. The more detail you provide now, the fewer 
disagreements you'll have later.

Ready to begin?
""",

    "PARENT_INFO": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 SECTION 1: YOUR INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's start with your information. Please tell me:

1. Your full legal name
2. Are you mom or dad?
3. Your current address (street, city, state, zip)
4. Your phone number(s)
5. Your email address
6. Where do you work? (optional but helpful)
7. What are your typical work hours?

You can answer in any format - just include the details you're comfortable sharing.
""",

    "OTHER_PARENT_INFO": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 SECTION 2: OTHER PARENT'S INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now tell me about the other parent:

1. Their full legal name
2. Their current address (if known)
3. Their phone number(s)
4. Their email address
5. Their typical work schedule (if you know it)

Share what you know - we can mark anything uncertain as "to be confirmed."
""",

    "CHILDREN_INFO": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  👶 SECTION 3: CHILDREN INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tell me about each child covered by this agreement:

For each child, please share:
1. Full legal name
2. Nickname (if any)
3. Date of birth (or age)
4. Current school and grade
5. Any special needs or considerations
6. Any allergies
7. Any current medications

If you have multiple children, describe each one.
""",

    "LEGAL_CUSTODY": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚖️ SECTION 4: LEGAL CUSTODY (Decision-Making)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Legal custody determines who makes major decisions for your child. Let's go 
through each type:

1. EDUCATION DECISIONS (school choice, tutoring, special ed)
   - Joint (both agree), Mom decides, Dad decides, or one has tiebreaker?

2. MEDICAL DECISIONS (doctors, treatments, therapy)
   - Joint, Mom decides, Dad decides, or one has tiebreaker?

3. RELIGIOUS DECISIONS (church, religious education)
   - Joint, Mom decides, Dad decides, or one has tiebreaker?

4. EXTRACURRICULAR ACTIVITIES (sports, music, camps)
   - Joint, Mom decides, Dad decides, or one has tiebreaker?

5. EMERGENCY DECISIONS
   - Can either parent make emergency decisions when child is with them?

Tell me how you'd like each of these handled.
""",

    "PHYSICAL_CUSTODY": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🏠 SECTION 5: PHYSICAL CUSTODY (Where Child Lives)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Physical custody determines where your child lives. Tell me:

1. What type of arrangement do you want?
   - 50/50 (equal time)
   - Primary with one parent, visitation with other
   - Other arrangement

2. If not 50/50, what percentage split?
   (e.g., 70/30, 60/40)

3. Who should be the "primary residential parent" for school enrollment purposes?
   (This matters for school district)

4. Will the arrangement be different during summer vs school year?
""",

    "PARENTING_SCHEDULE": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📅 SECTION 6: REGULAR PARENTING SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's map out the regular weekly schedule. Tell me:

1. WEEKLY PATTERN - Which works best?
   - Alternating weeks (week on/week off)
   - 2-2-3 rotation (2 days, 2 days, 3 days)
   - 2-2-5-5 rotation
   - Alternating weekends with midweek visits
   - Something else?

2. SPECIFIC DAYS
   - Which days would the child be with Mom?
   - Which days would the child be with Dad?

3. SCHOOL YEAR SCHEDULE
   - Any special considerations during school year?
   - Who handles school mornings? After school?

4. MIDWEEK VISITS (if applicable)
   - Does the non-custodial parent get a midweek visit?
   - What day and time?
   - Does it include overnight?
""",

    "HOLIDAY_SCHEDULE": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎄 SECTION 7: HOLIDAY SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Holidays are important! For each, tell me who gets the child in EVEN years 
vs ODD years (or if you want to split the day):

1. THANKSGIVING
2. CHRISTMAS EVE
3. CHRISTMAS DAY
4. NEW YEAR'S EVE
5. NEW YEAR'S DAY
6. EASTER / SPRING HOLIDAY
7. FOURTH OF JULY
8. HALLOWEEN
9. LABOR DAY / MEMORIAL DAY WEEKENDS

SPECIAL DAYS:
10. MOTHER'S DAY - (usually with Mom)
11. FATHER'S DAY - (usually with Dad)
12. CHILD'S BIRTHDAY - Split? Alternate? Party together?

SCHOOL BREAKS:
13. SPRING BREAK - How divided?
14. WINTER BREAK - How divided?
15. SUMMER VACATION - How divided?

Tell me your preferences for each.
""",

    "EXCHANGE_LOGISTICS": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚗 SECTION 8: EXCHANGE LOGISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's figure out the handoff logistics:

1. EXCHANGE LOCATION
   - Where will you meet? (address)
   - What type of place? (police station, school, church, mall, etc.)
   - Is this a neutral, public location?

2. TIMING
   - What day of the week?
   - What time?

3. WHO IS RESPONSIBLE?
   - Who brings the child to exchanges?
   - Who picks up?

4. BACKUP PLANS
   - What if someone is running late? (grace period?)
   - Who should be called in an emergency?

5. BEHAVIOR DURING EXCHANGES
   - Any rules about how parents should interact at exchanges?
""",

    "TRANSPORTATION": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  💰 SECTION 9: TRANSPORTATION COSTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How will transportation costs be handled?

1. ARRANGEMENT TYPE:
   - Each parent pays their own gas/travel?
   - Split costs 50/50?
   - One parent pays all transportation?
   - Meet halfway?
   - Based on income percentages?

2. If one parent pays - which one?

3. MILEAGE REIMBURSEMENT
   - Will there be any reimbursement?
   - If so, what rate per mile?

4. LONG DISTANCE (if applicable)
   - If parents live far apart, how are flights/long trips handled?
""",

    "CHILD_SUPPORT": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  💵 SECTION 10: CHILD SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's talk about financial support:

1. BASIC CHILD SUPPORT
   - Will there be child support payments?
   - If yes: Who pays whom?
   - How much per month?
   - What day of month is it due?
   - How is payment made? (direct deposit, check, wage garnishment)

2. ADDITIONAL EXPENSES - How will these be split?
   - Uncovered medical expenses
   - Dental/vision not covered by insurance
   - Childcare/daycare costs
   - School supplies and fees
   - Extracurricular activities (sports, music, etc.)
   - Private school tuition (if applicable)

3. TAX BENEFITS
   - Who claims the child on taxes?
   - Alternate years? Or always one parent?

4. HEALTH INSURANCE
   - Who provides health insurance for the child?
""",

    "MEDICAL_HEALTHCARE": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🏥 SECTION 11: MEDICAL & HEALTHCARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's cover healthcare:

1. INSURANCE
   - Which parent provides health insurance?
   - Insurance company name (if known)?

2. MEDICAL RECORDS
   - Should both parents have full access to medical records?

3. MEDICAL DECISIONS
   - Routine appointments (checkups, vaccines) - who decides?
   - Major medical decisions - joint or one parent?
   - Emergency treatment - can either parent authorize?

4. MENTAL HEALTH
   - If therapy is needed, do both parents need to consent?

5. CURRENT HEALTH INFO
   - Any known medical conditions?
   - Current medications?
   - Allergies?

6. PROVIDERS
   - Current pediatrician?
   - Dentist?
""",

    "EDUCATION": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎓 SECTION 12: EDUCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's cover education:

1. CURRENT SCHOOL
   - School name?
   - School district?

2. ACCESS
   - Should both parents have access to school records?
   - Should both receive report cards?
   - Can both attend parent-teacher conferences?
   - Can both attend school events?

3. SCHOOL DECISIONS
   - Who decides which school the child attends?
   - Joint decision or one parent?

4. HOMEWORK
   - How should homework be handled during each parent's time?

5. SCHOOL COMMUNICATIONS
   - How will school info be shared between parents?
""",

    "PARENT_COMMUNICATION": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  💬 SECTION 13: PARENT-TO-PARENT COMMUNICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How will you two communicate?

1. PRIMARY METHOD
   - Text? Email? Phone? Co-parenting app?
   - If app, which one? (OurFamilyWizard, TalkingParents, etc.)

2. RESPONSE TIME
   - How quickly should non-urgent messages be answered?
   - What about urgent messages?

3. COMMUNICATION TONE
   - Any agreements about keeping it business-like?
   - Agreement not to speak negatively about each other to the child?

4. SCHEDULE CHANGES
   - How much notice for schedule change requests?

5. INFORMATION SHARING
   - Will you share school information?
   - Medical information?
   - Activity schedules?
""",

    "CHILD_COMMUNICATION": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📱 SECTION 14: CHILD COMMUNICATION WITH OTHER PARENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When the child is with one parent, how can they contact the other?

1. PHONE/VIDEO CALLS
   - Can the child call the other parent?
   - Video calls allowed?
   - How often?
   - Preferred times?

2. PRIVACY
   - Should calls be private (other parent not listening)?

3. CHILD'S PHONE
   - Does the child have their own phone?
   - Any rules about the phone going between homes?

4. SOCIAL MEDIA
   - Any agreements about social media use?
   - Privacy settings?
""",

    "TRAVEL": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✈️ SECTION 15: TRAVEL WITH CHILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What about trips and vacations?

1. DOMESTIC TRAVEL (within the country)
   - How much advance notice to the other parent?
   - Is a travel itinerary required?
   - Contact info while traveling?

2. INTERNATIONAL TRAVEL (outside the country)
   - Does the other parent need to consent?
   - Who holds the passport?
   - How much advance notice required?

3. VACATION TIME
   - How much vacation time does each parent get?
   - Does it need to be requested in advance?
   - Any blackout dates?
""",

    "RELOCATION": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📦 SECTION 16: RELOCATION (Moving)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What if one parent wants to move?

1. NOTICE REQUIRED
   - How many days notice before moving?
   - What distance triggers the notice requirement? (e.g., 50+ miles)

2. PROCESS
   - What happens if one parent wants to move?
   - Try to reach agreement first?
   - Court decides if no agreement?

3. IMPACT ON CUSTODY
   - Would a move require custody modification?
""",

    "DISPUTE_RESOLUTION": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤝 SECTION 17: DISPUTE RESOLUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When disagreements happen, how will they be resolved?

1. FIRST STEP
   - Try to work it out directly between yourselves?

2. SECOND STEP
   - Mediation before going to court?
   - How are mediation costs split?
   - Do you have a preferred mediator?

3. THIRD STEP
   - Court intervention if mediation fails?

4. EMERGENCIES
   - Can either parent go to court immediately for safety issues?
""",

    "OTHER_PROVISIONS": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📝 SECTION 18: OTHER PROVISIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's cover some additional important topics:

1. RIGHT OF FIRST REFUSAL
   - If a parent can't watch the child for more than X hours, should they 
     offer the other parent the time first (before using a babysitter)?
   - How many hours triggers this?

2. NEW PARTNERS
   - Any rules about introducing new partners to the child?
   - Overnight guests rules?

3. DISCIPLINE
   - Agreement on consistent discipline approach?
   - No corporal punishment (spanking)?

4. RELIGIOUS UPBRINGING
   - Any agreements about religion?

5. PETS
   - Any pets that travel with the child?

6. ITEMS TRAVELING WITH CHILD
   - What items should always travel with the child?
   - (medications, glasses, school materials, etc.)

7. CLOTHING
   - Each home provides clothing, or clothes travel?

8. ANYTHING ELSE
   - Any other special provisions or situations to address?
""",

    "REVIEW": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ SECTION 19: REVIEW & FINALIZE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Excellent work! You've completed all sections. 

I'm now going to compile everything into a clear summary for your review.
You'll be able to:
- See everything organized by section
- Identify anything that needs clarification
- Request changes before we generate the legal document

One moment while I prepare your summary...
"""
}


# ============================================================================
# SECTION REQUIREMENTS
# ============================================================================

DETAILED_SECTION_REQUIREMENTS = {
    "INTRO": ["ready_to_begin"],
    
    "PARENT_INFO": [
        "full_name", "role", "address", "phone", "email"
    ],
    
    "OTHER_PARENT_INFO": [
        "full_name", "role"
    ],
    
    "CHILDREN_INFO": [
        "child_names", "ages_or_dob"
    ],
    
    "LEGAL_CUSTODY": [
        "custody_type", "education_decisions", "medical_decisions"
    ],
    
    "PHYSICAL_CUSTODY": [
        "arrangement_type", "percentage_split"
    ],
    
    "PARENTING_SCHEDULE": [
        "schedule_type", "specific_days"
    ],
    
    "HOLIDAY_SCHEDULE": [
        "thanksgiving", "christmas", "birthday"
    ],
    
    "EXCHANGE_LOGISTICS": [
        "location", "time", "day"
    ],
    
    "TRANSPORTATION": [
        "cost_arrangement"
    ],
    
    "CHILD_SUPPORT": [
        "has_support", "amount_or_waived"
    ],
    
    "MEDICAL_HEALTHCARE": [
        "insurance_provider", "medical_access"
    ],
    
    "EDUCATION": [
        "school_access"
    ],
    
    "PARENT_COMMUNICATION": [
        "preferred_method"
    ],
    
    "CHILD_COMMUNICATION": [
        "calls_allowed"
    ],
    
    "TRAVEL": [
        "domestic_notice", "international_consent"
    ],
    
    "RELOCATION": [
        "notice_days", "distance_trigger"
    ],
    
    "DISPUTE_RESOLUTION": [
        "mediation_required"
    ],
    
    "OTHER_PROVISIONS": [
        "first_refusal"
    ],
    
    "REVIEW": ["confirmed_accurate"]
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_detailed_section_prompt(section: str) -> str:
    """Get the prompt for a detailed section"""
    return DETAILED_SECTION_PROMPTS.get(section, "")


def get_detailed_section_requirements(section: str) -> list:
    """Get required fields for a section"""
    return DETAILED_SECTION_REQUIREMENTS.get(section, [])


def get_detailed_sections() -> list:
    """Get ordered list of detailed sections"""
    return [
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


def get_section_number(section: str) -> int:
    """Get the section number (1-indexed)"""
    sections = get_detailed_sections()
    if section in sections:
        return sections.index(section)  # 0 for intro
    return 0


def get_progress_bar(section: str) -> str:
    """Generate a progress bar for the current section"""
    sections = get_detailed_sections()
    current_idx = sections.index(section) if section in sections else 0
    total = len(sections)
    
    filled = int((current_idx / total) * 30)
    empty = 30 - filled
    
    bar = "█" * filled + "░" * empty
    percentage = int((current_idx / total) * 100)
    
    return f"Progress: [{bar}] {percentage}% ({current_idx}/{total} sections)"
