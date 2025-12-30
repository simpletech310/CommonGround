"""
Sample Custody Agreements
Two detailed, realistic custody agreements for ARIA demo.
"""

# ============================================================================
# AGREEMENT 1: WILLIAMS FAMILY
# Joint custody, alternating weeks, detailed medical/education provisions
# ============================================================================

WILLIAMS_AGREEMENT = {
    "id": "WILLIAMS-2024-001",
    "title": "Williams Family Custody Agreement",
    "effective_date": "2024-01-15",
    "expiration_date": "2026-01-15",
    
    "parties": {
        "petitioner": {
            "name": "Marcus Williams",
            "role": "FATHER",
            "address": "1542 Oak Street, Apt 4B, Vista, CA 92081",
            "phone": "(760) 555-1234",
            "email": "marcus.williams@email.com",
            "employer": "TechCorp Solutions",
            "work_schedule": "Monday-Friday, 8:00 AM - 5:00 PM"
        },
        "respondent": {
            "name": "Jennifer Williams",
            "role": "MOTHER",
            "address": "2890 Palm Avenue, Oceanside, CA 92054",
            "phone": "(760) 555-5678",
            "email": "jennifer.williams@email.com",
            "employer": "Oceanside Medical Center",
            "work_schedule": "Tuesday-Saturday, 7:00 AM - 3:00 PM"
        }
    },
    
    "children": [
        {
            "name": "Eric Marcus Williams",
            "nickname": "Eric",
            "date_of_birth": "2018-03-15",
            "age": 6,
            "school": "Enterprise Elementary School",
            "grade": "1st Grade",
            "allergies": ["peanuts", "tree nuts"],
            "medications": ["Zyrtec for seasonal allergies"],
            "pediatrician": "Dr. Sarah Chen, Vista Pediatrics",
            "special_needs": None
        },
        {
            "name": "Maya Rose Williams",
            "nickname": "Maya",
            "date_of_birth": "2020-08-22",
            "age": 4,
            "school": "Sunshine Preschool",
            "grade": "Pre-K",
            "allergies": None,
            "medications": None,
            "pediatrician": "Dr. Sarah Chen, Vista Pediatrics",
            "special_needs": None
        }
    ],
    
    "legal_custody": {
        "type": "JOINT LEGAL CUSTODY",
        "education_decisions": "Joint - both parents must agree on school choice, tutoring, special education",
        "medical_decisions": "Joint - both parents must agree on non-emergency medical decisions",
        "religious_decisions": "Joint - children will be exposed to both parents' beliefs",
        "extracurricular_decisions": "Joint - activities over $100/month require both parents' approval",
        "emergency_authority": "Either parent may make emergency medical decisions when child is in their care"
    },
    
    "physical_custody": {
        "type": "JOINT PHYSICAL CUSTODY",
        "arrangement": "Alternating weeks",
        "mother_percentage": 50,
        "father_percentage": 50,
        "primary_residence_for_school": "Mother's address for school enrollment purposes",
        "schedule_details": {
            "exchange_day": "Sunday",
            "exchange_time": "6:00 PM",
            "week_starts": "Father has children on odd-numbered weeks of the year",
            "summer_modification": "Same alternating week schedule continues during summer"
        }
    },
    
    "parenting_schedule": {
        "regular_schedule": {
            "type": "Alternating weeks",
            "father_weeks": "Odd-numbered weeks (Week 1, 3, 5, etc.)",
            "mother_weeks": "Even-numbered weeks (Week 2, 4, 6, etc.)",
            "exchange_day": "Sunday",
            "exchange_time": "6:00 PM"
        },
        "school_pickup": {
            "responsibility": "Parent whose week it is handles school pickup",
            "eric_pickup_location": "Enterprise Elementary School - Main entrance",
            "eric_pickup_time": "3:15 PM on school days, Tuesday pickup at 4:00 PM due to after-school tutoring",
            "maya_pickup_location": "Sunshine Preschool - Side gate on Maple Street",
            "maya_pickup_time": "4:30 PM"
        },
        "midweek_contact": {
            "allowed": True,
            "description": "Non-custodial parent may have dinner with children on Wednesday from 5:00 PM to 7:30 PM",
            "pickup_location": "Custodial parent's residence",
            "return_time": "7:30 PM to custodial parent's residence"
        }
    },
    
    "holidays": {
        "general_rule": "Holiday schedule takes precedence over regular schedule",
        "thanksgiving": {
            "even_years": "Mother - Wednesday 6:00 PM through Sunday 6:00 PM",
            "odd_years": "Father - Wednesday 6:00 PM through Sunday 6:00 PM"
        },
        "christmas_eve": {
            "even_years": "Father - December 24 at 10:00 AM through December 25 at 10:00 AM",
            "odd_years": "Mother - December 24 at 10:00 AM through December 25 at 10:00 AM"
        },
        "christmas_day": {
            "even_years": "Mother - December 25 at 10:00 AM through December 26 at 10:00 AM",
            "odd_years": "Father - December 25 at 10:00 AM through December 26 at 10:00 AM"
        },
        "new_years_eve": {
            "every_year": "Parent who has Christmas Day keeps children through January 1 at 6:00 PM"
        },
        "easter": {
            "even_years": "Mother - Friday 6:00 PM through Sunday 6:00 PM",
            "odd_years": "Father - Friday 6:00 PM through Sunday 6:00 PM"
        },
        "fourth_of_july": {
            "even_years": "Father - July 3 at 6:00 PM through July 5 at 6:00 PM",
            "odd_years": "Mother - July 3 at 6:00 PM through July 5 at 6:00 PM"
        },
        "halloween": {
            "every_year": "Children spend Halloween with custodial parent per regular schedule; non-custodial parent may participate in trick-or-treating"
        },
        "mothers_day": {
            "every_year": "Mother - Saturday 10:00 AM through Sunday 6:00 PM"
        },
        "fathers_day": {
            "every_year": "Father - Saturday 10:00 AM through Sunday 6:00 PM"
        },
        "childrens_birthdays": {
            "eric_birthday_march_15": "Alternates yearly - even years with Mother, odd years with Father. Non-custodial parent gets 2-hour dinner visit on birthday.",
            "maya_birthday_august_22": "Alternates yearly - odd years with Mother, even years with Father. Non-custodial parent gets 2-hour dinner visit on birthday."
        },
        "spring_break": {
            "split": "First half with Mother, second half with Father every year"
        },
        "winter_break": {
            "split": "Covered by Christmas/New Year's provisions above"
        },
        "summer_vacation": {
            "each_parent": "Each parent entitled to two non-consecutive weeks of vacation time",
            "notice_required": "30 days advance written notice required",
            "priority": "If both request same dates, parent who requested first has priority"
        }
    },
    
    "exchange": {
        "location": {
            "address": "Vista Sheriff's Station, 325 S. Melrose Dr, Vista, CA 92081",
            "type": "Neutral public location - Sheriff's station parking lot",
            "backup_location": "Enterprise Elementary School parking lot"
        },
        "logistics": {
            "pickup_responsibility": "Receiving parent picks up children",
            "dropoff_responsibility": "N/A - receiving parent travels to exchange location",
            "grace_period": "15 minutes",
            "late_notification": "Must call/text other parent if running more than 10 minutes late"
        },
        "behavior_expectations": [
            "Parents shall remain civil and courteous during exchanges",
            "No arguments or discussions of contentious issues in front of children",
            "Children's belongings shall be packed and ready at exchange time"
        ]
    },
    
    "transportation": {
        "arrangement": "Each parent responsible for transportation during their parenting time",
        "exchange_travel": "Receiving parent travels to exchange location",
        "school_transport": "Parent with custody that day handles school transportation",
        "cost_sharing": "Each parent bears their own transportation costs",
        "carpool_permission": "Both parents may arrange carpools with written notice to other parent"
    },
    
    "child_support": {
        "status": "PAYMENTS REQUIRED",
        "paying_parent": "Father",
        "receiving_parent": "Mother",
        "monthly_amount": 850.00,
        "due_date": "1st of each month",
        "payment_method": "Direct deposit to Mother's designated bank account",
        "account_info": "Joint Kids Account at Chase Bank ending in 4521",
        "termination": "Continues until each child reaches 18 or graduates high school, whichever is later"
    },
    
    "additional_expenses": {
        "medical_copays": {
            "split": "50/50",
            "threshold": "Copays over $50 must be split; under $50 covered by parent at appointment",
            "reimbursement_timeline": "Within 14 days of receiving receipt",
            "payment_method": "Venmo or transfer to Joint Kids Account at Chase"
        },
        "uncovered_medical": {
            "split": "50/50",
            "includes": "Dental work, orthodontics, vision, therapy, prescriptions not covered by insurance",
            "approval_required": "Non-emergency expenses over $200 require written approval from both parents",
            "reimbursement_timeline": "Within 30 days of receiving itemized bill"
        },
        "extracurricular": {
            "split": "50/50 for agreed-upon activities",
            "approval_required": "Activities over $100/month require both parents' written approval",
            "includes": "Sports fees, uniforms, equipment, music lessons, dance classes",
            "payment_timing": "Parent enrolling child pays upfront, other parent reimburses 50% within 14 days"
        },
        "school_expenses": {
            "split": "50/50",
            "includes": "School supplies, field trips, yearbooks, school photos, graduation fees",
            "excludes": "Basic clothing and backpacks (each parent provides at their home)"
        },
        "childcare": {
            "split": "50/50",
            "current_provider": "Sunshine Preschool for Maya - $1,200/month",
            "summer_camp": "50/50 split for agreed-upon camps",
            "babysitting": "Each parent responsible for babysitting during their time unless emergency"
        },
        "tax_benefits": {
            "claiming_children": "Alternating years - Father claims Eric, Mother claims Maya in even years; swap in odd years",
            "dependency_exemption": "Follows same alternating pattern"
        }
    },
    
    "health_insurance": {
        "provider_parent": "Mother",
        "insurance_company": "Blue Shield of California",
        "policy_details": "PPO Family Plan through Oceanside Medical Center",
        "dental_insurance": "Delta Dental - provided by Mother's employer",
        "vision_insurance": "VSP - provided by Mother's employer",
        "premium_responsibility": "Mother pays premiums; Father reimburses 40% ($180/month)",
        "premium_reimbursement_due": "By the 15th of each month"
    },
    
    "medical": {
        "both_parents_access": True,
        "pediatrician": "Dr. Sarah Chen, Vista Pediatrics, (760) 555-9000",
        "dentist": "Dr. Robert Kim, Smiles Family Dentistry, (760) 555-8500",
        "pharmacy": "CVS Pharmacy, 1200 S. Santa Fe Ave, Vista",
        "eric_allergies": "SEVERE: Peanuts and tree nuts - carries EpiPen at all times",
        "epipen_locations": "One at each parent's home, one at school, one in each car",
        "maya_conditions": None,
        "therapy": "Both parents must consent to mental health treatment; currently none prescribed",
        "emergency_protocol": "Either parent may authorize emergency treatment; must notify other parent within 2 hours"
    },
    
    "education": {
        "current_schools": {
            "eric": "Enterprise Elementary School, 123 Education Way, Vista, CA",
            "maya": "Sunshine Preschool, 456 Learning Lane, Vista, CA"
        },
        "both_parents_access": True,
        "report_cards": "Both parents receive copies",
        "conferences": "Both parents entitled to attend; schedule separate conferences if needed",
        "school_events": "Both parents may attend all school events",
        "homework": "Custodial parent ensures homework completion during their time",
        "tutoring": {
            "eric": "Tuesday after-school tutoring for reading, 3:15-4:00 PM at school",
            "cost": "$200/month - split 50/50",
            "transportation": "Parent with custody on Tuesday handles pickup at 4:00 PM"
        }
    },
    
    "communication": {
        "between_parents": {
            "primary_method": "OurFamilyWizard app",
            "backup_method": "Text message for urgent matters only",
            "response_time": "Within 24 hours for non-urgent; within 2 hours for urgent",
            "tone_requirement": "Business-like, child-focused, no personal attacks"
        },
        "children_with_other_parent": {
            "calls_allowed": True,
            "video_calls_allowed": True,
            "frequency": "Daily calls permitted between 7:00 PM - 7:30 PM",
            "privacy": "Calls shall be private - custodial parent shall not listen in",
            "devices": "Eric has iPad for video calls; Maya uses custodial parent's phone"
        },
        "social_media": {
            "posting_children": "Both parents may post photos; no location tagging while at other parent's home",
            "children_accounts": "No social media accounts for children until age 13 per both parents' agreement"
        }
    },
    
    "travel": {
        "domestic": {
            "notice_required": "7 days advance written notice via OurFamilyWizard",
            "itinerary_required": True,
            "includes": "Flight info, hotel address, contact phone numbers",
            "during_other_parents_time": "Not permitted without written consent"
        },
        "international": {
            "consent_required": True,
            "notice_required": "30 days advance written notice",
            "passport_holder": "Mother holds both children's passports; provides to Father upon reasonable request",
            "documentation": "Must provide full itinerary, copy of tickets, emergency contacts abroad"
        }
    },
    
    "relocation": {
        "notice_required": "60 days written notice for moves over 50 miles",
        "process": "Parents shall attempt to reach agreement through mediation before court involvement",
        "school_district_change": "Requires both parents' agreement or court order"
    },
    
    "dispute_resolution": {
        "step_1": "Direct communication via OurFamilyWizard",
        "step_2": "Mediation with agreed mediator - Vista Family Mediation Center",
        "step_3": "Court intervention if mediation fails",
        "mediation_cost": "Split 50/50",
        "emergency_exception": "Either parent may seek emergency court orders for safety issues without mediation"
    },
    
    "other_provisions": {
        "right_of_first_refusal": {
            "applies": True,
            "threshold_hours": 4,
            "description": "If parent needs childcare for more than 4 hours, must first offer time to other parent"
        },
        "new_partners": {
            "introduction": "Wait minimum 6 months of serious relationship before introducing to children",
            "overnight_stays": "No overnight stays with romantic partners until engagement or 1 year of dating"
        },
        "discipline": {
            "agreement": "Consistent discipline approach at both homes",
            "prohibited": "No corporal punishment (spanking, hitting)",
            "timeout_policy": "Age-appropriate timeouts permitted"
        },
        "clothing": "Each parent maintains appropriate clothing at their home; special occasion clothes travel with children",
        "toys_belongings": "Children may bring comfort items between homes; expensive electronics stay at home of origin",
        "pets": "Family dog (Max) stays at Mother's home; children may visit dog during Father's time with advance notice"
    }
}


# ============================================================================
# AGREEMENT 2: JOHNSON FAMILY  
# Primary custody with mother, visitation for father, different financial structure
# ============================================================================

JOHNSON_AGREEMENT = {
    "id": "JOHNSON-2024-002",
    "title": "Johnson Family Custody Agreement",
    "effective_date": "2024-06-01",
    "expiration_date": "2026-06-01",
    
    "parties": {
        "petitioner": {
            "name": "David Anthony Johnson",
            "role": "FATHER",
            "address": "789 Harbor View Dr, Apt 12, San Diego, CA 92101",
            "phone": "(619) 555-4321",
            "email": "david.johnson@email.com",
            "employer": "San Diego Fire Department",
            "work_schedule": "24-hour shifts: works 48 hours on, 96 hours off (rotating schedule)"
        },
        "respondent": {
            "name": "Keisha Marie Johnson",
            "role": "MOTHER",
            "address": "4521 College Grove Dr, San Diego, CA 92115",
            "phone": "(619) 555-8765",
            "email": "keisha.johnson@email.com",
            "employer": "San Diego Unified School District",
            "work_schedule": "Monday-Friday, 7:30 AM - 4:00 PM (school year); flexible summer"
        }
    },
    
    "children": [
        {
            "name": "Isaiah David Johnson",
            "nickname": "Zay",
            "date_of_birth": "2014-11-08",
            "age": 10,
            "school": "Chollas-Mead Elementary",
            "grade": "5th Grade",
            "allergies": None,
            "medications": ["Adderall XR 15mg - ADHD, take each morning with breakfast"],
            "pediatrician": "Dr. Marcus Thompson, College Area Pediatrics",
            "special_needs": "ADHD - IEP in place at school; requires structured routine"
        }
    ],
    
    "legal_custody": {
        "type": "JOINT LEGAL CUSTODY",
        "education_decisions": "Joint - IEP meetings require both parents' attendance when possible",
        "medical_decisions": "Joint - ADHD medication changes require both parents' consent",
        "religious_decisions": "Mother has final say - child attends church with Mother",
        "extracurricular_decisions": "Joint - Father has final say on sports-related activities",
        "emergency_authority": "Either parent may make emergency decisions; must notify other parent within 1 hour"
    },
    
    "physical_custody": {
        "type": "PRIMARY PHYSICAL CUSTODY WITH MOTHER",
        "arrangement": "Father has visitation per schedule below",
        "mother_percentage": 70,
        "father_percentage": 30,
        "primary_residence": "Mother's address",
        "schedule_details": {
            "regular_visitation": "Every other weekend plus one weeknight",
            "weekend_schedule": "Friday 5:00 PM through Sunday 5:00 PM",
            "weeknight": "Wednesday 4:00 PM to 8:00 PM (dinner visit, no overnight)"
        }
    },
    
    "parenting_schedule": {
        "regular_schedule": {
            "type": "Primary with Mother, visitation with Father",
            "father_weekends": "1st, 3rd, and 5th weekends of each month",
            "weekend_start": "Friday at 5:00 PM",
            "weekend_end": "Sunday at 5:00 PM",
            "wednesday_visit": "Every Wednesday 4:00 PM to 8:00 PM (includes dinner)",
            "note": "Father's fire department schedule may require flexibility - 72 hours notice for schedule conflicts"
        },
        "school_pickup": {
            "regular_days": "Mother handles all regular school day pickups",
            "friday_visitation_weekends": "Father picks up Isaiah from school at 2:45 PM on his visitation Fridays",
            "pickup_location": "Chollas-Mead Elementary - Front office",
            "wednesday_pickup": "Father picks up from school at 2:45 PM, returns to Mother's home by 8:00 PM",
            "emergency_contacts": "Both parents listed as emergency contacts at school"
        },
        "summer_schedule": {
            "modification": "Father's time increases to alternating weeks during summer break",
            "exchange_day": "Sunday at 5:00 PM",
            "note": "Must coordinate around Father's 48/96 work schedule"
        },
        "fire_department_schedule_conflicts": {
            "process": "Father provides monthly work schedule by the 20th of prior month",
            "makeup_time": "Missed visitation made up within 2 weeks when possible",
            "communication": "Schedule conflicts communicated via text at least 72 hours in advance"
        }
    },
    
    "holidays": {
        "general_rule": "Holiday schedule takes precedence over regular schedule",
        "thanksgiving": {
            "every_year": "Mother has Thanksgiving Day; Father has Friday after Thanksgiving through Sunday 5:00 PM"
        },
        "christmas": {
            "even_years": "Father - December 24 at noon through December 26 at noon",
            "odd_years": "Mother - December 24 at noon through December 26 at noon",
            "non_custodial_time": "Other parent gets December 26 at noon through December 28 at noon"
        },
        "new_years": {
            "even_years": "Mother - December 31 at noon through January 2 at noon",
            "odd_years": "Father - December 31 at noon through January 2 at noon"
        },
        "easter": {
            "every_year": "Mother - Easter falls during school year and aligns with Mother's primary custody"
        },
        "fourth_of_july": {
            "even_years": "Father",
            "odd_years": "Mother",
            "time": "July 3 at 5:00 PM through July 5 at 5:00 PM"
        },
        "halloween": {
            "every_year": "Mother - school night; Father may join for trick-or-treating from 5:30-7:30 PM"
        },
        "mothers_day": {
            "every_year": "Mother - Friday 5:00 PM through Sunday 8:00 PM"
        },
        "fathers_day": {
            "every_year": "Father - Friday 5:00 PM through Sunday 8:00 PM"
        },
        "isaiahs_birthday_november_8": {
            "every_year": "Shared - birthday party planned jointly; child spends actual birthday with custodial parent per regular schedule; other parent gets 3-hour visit (5-8 PM)"
        },
        "spring_break": {
            "split": "Father gets first half; Mother gets second half"
        },
        "summer_vacation": {
            "each_parent": "Father entitled to two consecutive weeks; Mother entitled to two consecutive weeks",
            "notice_required": "21 days advance written notice",
            "father_priority": "Father's vacation weeks work around his fire department schedule",
            "travel": "Vacation travel permitted per travel provisions"
        }
    },
    
    "exchange": {
        "location": {
            "primary": "Mother's residence - 4521 College Grove Dr, San Diego",
            "alternative": "Father picks up/drops off curbside; no need to enter home",
            "neutral_option": "McDonald's at 5102 College Ave for exchanges if tensions high"
        },
        "logistics": {
            "pickup_responsibility": "Father picks up at start of his time",
            "dropoff_responsibility": "Father returns child at end of his time",
            "grace_period": "20 minutes",
            "late_notification": "Text message if running late"
        },
        "medication_transfer": {
            "requirement": "Adderall medication travels with Isaiah at all times",
            "pill_count": "Both parents confirm pill count at each exchange",
            "prescription_refills": "Mother handles; Father reimburses 50% of copay"
        }
    },
    
    "transportation": {
        "arrangement": "Father handles all transportation for his visitation",
        "school_transport": "Father transports to/from school during his Wednesday visits and visitation Fridays",
        "cost_sharing": "Father bears all transportation costs for visitation",
        "car_seat": "Isaiah no longer requires car seat (over 8 and 4'9\")",
        "emergency_transport": "Either parent may transport for medical emergencies"
    },
    
    "child_support": {
        "status": "PAYMENTS REQUIRED",
        "paying_parent": "Father",
        "receiving_parent": "Mother",
        "monthly_amount": 1200.00,
        "due_date": "15th of each month",
        "payment_method": "Wage garnishment through San Diego County DCSS",
        "case_number": "DCSS Case #SD-2024-78432",
        "termination": "Until Isaiah reaches 18 or graduates high school, whichever is later"
    },
    
    "additional_expenses": {
        "adhd_treatment": {
            "split": "Father 60% / Mother 40%",
            "includes": "Psychiatrist visits, therapy, medication copays",
            "current_monthly_cost": "Approximately $150/month (psychiatrist $80, Adderall copay $45, therapy $25 copay)",
            "reimbursement": "Mother pays upfront; Father reimburses his 60% by end of month",
            "payment_method": "Zelle to Mother's phone number"
        },
        "medical_general": {
            "split": "60/40 (Father/Mother)",
            "includes": "All non-ADHD medical, dental, vision expenses",
            "threshold": "Expenses over $100 discussed before incurring when possible",
            "reimbursement_timeline": "Within 30 days of receiving receipt"
        },
        "extracurricular": {
            "split": "50/50",
            "current_activities": "Basketball league ($400/season), art class ($150/month)",
            "approval": "New activities require text agreement from both parents",
            "uniforms_equipment": "Split 50/50; Father handles sports equipment as he has expertise"
        },
        "school_expenses": {
            "split": "50/50",
            "includes": "Supplies, field trips, activity fees, testing fees",
            "school_lunch": "Mother handles daily; Father provides lunch money for his days"
        },
        "childcare": {
            "responsibility": "Mother's responsibility during her time; Father's during his",
            "after_school_program": "Mother enrolled Isaiah in after-school program $300/month - Mother pays 100%",
            "summer_camp": "50/50 split on agreed camps"
        },
        "tax_benefits": {
            "claiming_child": "Mother claims Isaiah every year (primary custody)",
            "father_benefit": "Father may claim head of household status per IRS rules"
        }
    },
    
    "health_insurance": {
        "provider_parent": "Father",
        "insurance_company": "City of San Diego Health Plan (through Fire Department)",
        "policy_details": "Kaiser HMO - no premium cost to Father (city benefit)",
        "dental_insurance": "MetLife through Father's employment",
        "vision_insurance": "EyeMed through Father's employment",
        "premium_responsibility": "Father - no cost (employer provided)",
        "insurance_cards": "Both parents have copies of all insurance cards"
    },
    
    "medical": {
        "both_parents_access": True,
        "pediatrician": "Dr. Marcus Thompson, College Area Pediatrics, (619) 555-7000",
        "psychiatrist": "Dr. Linda Park, Child & Adolescent Psychiatry, (619) 555-7500",
        "therapist": "Ms. Crystal Davis, LMFT, Family Counseling Center, (619) 555-7800",
        "dentist": "Dr. James Wong, Smile Kids Dental, (619) 555-6000",
        "pharmacy": "Kaiser Pharmacy - prescription auto-refills",
        "adhd_management": {
            "medication": "Adderall XR 15mg - one capsule each morning with breakfast by 8:00 AM",
            "refills": "Monthly - Mother picks up; 7-day supply travels with Isaiah",
            "medication_log": "Both parents initial medication log in Isaiah's backpack daily",
            "school_nurse": "Has emergency supply of 3 doses at school",
            "dosage_changes": "Requires both parents' written consent; psychiatrist provides to both"
        },
        "therapy": {
            "current": "Weekly sessions Thursdays at 4:30 PM with Ms. Davis",
            "transport": "Mother transports (her custodial time)",
            "both_parents_involved": "Quarterly family sessions include both parents"
        },
        "iep_meetings": {
            "frequency": "Annually, plus as needed",
            "attendance": "Both parents should attend; can participate virtually if work conflict",
            "documentation": "Both parents receive copies of all IEP documents"
        }
    },
    
    "education": {
        "current_school": "Chollas-Mead Elementary, 5765 Lea St, San Diego, CA 92115",
        "grade": "5th Grade",
        "iep_status": "Active IEP for ADHD accommodations",
        "accommodations": [
            "Extended time on tests",
            "Preferential seating",
            "Movement breaks",
            "Reduced homework load",
            "Check-in with counselor weekly"
        ],
        "both_parents_access": True,
        "portal_access": "Both parents have ParentVUE login credentials",
        "report_cards": "Emailed to both parents",
        "conferences": "Both parents attend together when possible; separate if needed",
        "homework": {
            "responsibility": "Custodial parent ensures completion",
            "fathers_time": "Father ensures Wednesday homework done before return; weekend homework Father's responsibility",
            "communication": "Unfinished homework noted in Isaiah's planner for other parent"
        }
    },
    
    "communication": {
        "between_parents": {
            "primary_method": "Text message",
            "backup_method": "Phone call for emergencies only",
            "email": "For documentation of important decisions",
            "response_time": "Within 4 hours for non-urgent; immediately for emergencies",
            "blocked_topics": "No discussion of child support, new relationships, or past issues via text"
        },
        "children_with_other_parent": {
            "calls_allowed": True,
            "video_calls_allowed": True,
            "frequency": "Isaiah may call other parent anytime; encouraged before bedtime",
            "isaiahs_phone": "Has own phone (basic smartphone) - takes between homes",
            "rules": "Phone used for parent contact, educational apps, limited games; no social media"
        },
        "school_communication": {
            "method": "Both parents on teacher email list",
            "updates": "Weekly teacher email summarizes Isaiah's progress",
            "concerns": "Either parent may contact teacher; major concerns discussed jointly"
        },
        "medical_updates": {
            "requirement": "Parent at appointment texts other parent summary within 2 hours",
            "documentation": "Share photos of any prescriptions or doctor's notes"
        }
    },
    
    "travel": {
        "domestic": {
            "notice_required": "14 days written notice (text acceptable)",
            "itinerary_required": True,
            "includes": "Destination, dates, flight info, hotel, contact number",
            "medication_note": "Must have adequate Adderall supply plus 3-day emergency buffer"
        },
        "international": {
            "consent_required": True,
            "consent_form": "Both parents sign notarized consent for international travel",
            "notice_required": "45 days advance written notice",
            "passport": "Father holds passport (obtained jointly); provides to Mother 14 days before her international travel",
            "documentation": "Full itinerary, copies of tickets, embassy contact for destination country"
        },
        "medication_for_travel": {
            "requirement": "Adderall is controlled substance - must follow TSA and destination regulations",
            "carry_on": "Always carry medication in carry-on with prescription label",
            "letter": "Carry physician letter for controlled substance"
        }
    },
    
    "relocation": {
        "notice_required": "90 days written notice for any move",
        "distance_threshold": "Any move that would affect current school or visitation schedule",
        "process": "Must attempt mediation before filing court motion",
        "isaiahs_preference": "Given his age (10), court may consider his preference"
    },
    
    "dispute_resolution": {
        "step_1": "Direct text/phone discussion between parents",
        "step_2": "Involve Isaiah's therapist as neutral party for child-related disputes",
        "step_3": "Formal mediation through SD Family Court Services",
        "step_4": "Court hearing if mediation fails",
        "mediation_cost": "Split 50/50 unless one party unreasonably refuses resolution",
        "emergency": "Either parent may seek emergency orders for safety without prior mediation"
    },
    
    "other_provisions": {
        "right_of_first_refusal": {
            "applies": True,
            "threshold_hours": 6,
            "description": "If parent needs childcare for more than 6 hours during their time, must first offer to other parent",
            "exception": "Does not apply to regular after-school program or Father's work shifts"
        },
        "new_partners": {
            "introduction": "Wait 4 months of committed relationship before introducing to Isaiah",
            "overnight_stays": "No overnight stays with romantic partners during Isaiah's time until 1 year of dating or engagement"
        },
        "discipline": {
            "agreement": "Consistent expectations between homes for Isaiah's ADHD management",
            "prohibited": "No corporal punishment",
            "positive_reinforcement": "Both homes use same reward system for behavior",
            "screen_time": "Limited to 2 hours on school nights, 4 hours weekends (per therapist recommendation)"
        },
        "fathers_work_considerations": {
            "schedule_sharing": "Father provides 6-week work schedule to Mother",
            "shift_trades": "Father may trade shifts to maximize Isaiah time",
            "makeup_time": "Missed visitation due to work made up within 30 days"
        },
        "adhd_routine": {
            "importance": "Both parents agree consistent routine critical for Isaiah",
            "bedtime": "9:00 PM school nights, 10:00 PM weekends",
            "morning_routine": "Wake by 7:00 AM, medication with breakfast, ready for school by 8:00 AM",
            "homework_time": "4:30-6:00 PM with breaks every 20 minutes"
        },
        "therapy_participation": {
            "individual": "Weekly sessions - Mother transports",
            "family": "Quarterly sessions - both parents attend",
            "communication": "Therapist may share general progress with both parents; confidential specifics require Isaiah's permission"
        }
    }
}


# ============================================================================
# AGREEMENT REGISTRY
# ============================================================================

SAMPLE_AGREEMENTS = {
    "williams": WILLIAMS_AGREEMENT,
    "johnson": JOHNSON_AGREEMENT
}


def get_agreement(name: str) -> dict:
    """Get a sample agreement by name"""
    return SAMPLE_AGREEMENTS.get(name.lower())


def list_agreements() -> list:
    """List available sample agreements"""
    return [
        {
            "key": "williams",
            "title": "Williams Family",
            "description": "Joint 50/50 custody, two children (Eric 6, Maya 4), alternating weeks",
            "parties": "Marcus (Father) & Jennifer (Mother)"
        },
        {
            "key": "johnson",
            "title": "Johnson Family", 
            "description": "Primary custody with Mother, one child (Isaiah 10) with ADHD, Father is firefighter",
            "parties": "David (Father) & Keisha (Mother)"
        }
    ]
