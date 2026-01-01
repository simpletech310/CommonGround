# ARIA Agreement Data Extraction Schema

## Overview

This document describes the complete JSON extraction schema used by ARIA to extract structured custody agreement data from natural language conversations with parents.

## Schema Location

**File:** `/Users/tj/Desktop/CommonGround/mvp/backend/app/services/aria_extraction_schema.py`

## Complete Schema Structure

The schema covers all 18 sections of the custody agreement builder:

### Section 1: Parent Information
- `full_name` - Full legal name
- `role` - mother|father|parent
- `address` - Street address
- `city` - City
- `state` - State (2-letter code)
- `zip` - ZIP code
- `phone` - Phone number
- `email` - Email address
- `employer` - Employer name (optional)
- `work_hours` - Typical work hours (optional)

### Section 2: Other Parent Information
- `full_name` - Full legal name of other parent
- `address` - Current address
- `city` - City
- `state` - State
- `zip` - ZIP code
- `phone` - Phone number
- `email` - Email address
- `work_schedule` - Typical work schedule (optional)

### Section 3: Children Information
- `children` - Array of child objects:
  - `full_name` - Full legal name
  - `nickname` - Preferred nickname (optional)
  - `date_of_birth` - Date of birth (YYYY-MM-DD)
  - `school` - School name (optional)
  - `grade` - Current grade (optional)
  - `special_needs` - Special needs/IEP (optional)
  - `allergies` - Allergies (optional)
  - `medications` - Current medications (optional)

### Section 4: Legal Custody (Decision-Making)
- `education_decisions` - Who decides on education
- `medical_decisions` - Who decides on medical care
- `religious_decisions` - Who decides on religion
- `extracurricular_decisions` - Who decides on activities
- `emergency_decisions` - Emergency decision policy

**Values:** `Joint Decision|Mother Decides|Father Decides|Joint with Mother Tiebreaker|Joint with Father Tiebreaker`

### Section 5: Physical Custody
- `arrangement_type` - Type of custody arrangement
- `percentage_split` - Percentage split if not 50/50
- `primary_residential_parent` - Primary parent for school
- `summer_vs_school_year` - Different summer arrangement

**Arrangement Types:** `50/50 (Equal Time)|Primary with One Parent|70/30 Split|60/40 Split|Other`

### Section 6: Parenting Schedule
- `weekly_pattern` - Weekly custody pattern
- `mother_days` - Days with mother
- `father_days` - Days with father
- `school_considerations` - School year arrangements
- `midweek_visits` - Midweek visit details

**Weekly Patterns:** `Alternating Weeks|2-2-3 Rotation|2-2-5-5 Rotation|Alternating Weekends with Midweek|Other`

### Section 7: Holiday Schedule
- `thanksgiving` - Thanksgiving arrangement
- `christmas_eve` - Christmas Eve arrangement
- `christmas_day` - Christmas Day arrangement
- `new_years` - New Year's arrangement
- `easter` - Easter/Spring holiday
- `july_4` - Fourth of July
- `halloween` - Halloween arrangement
- `mothers_day` - Mother's Day
- `fathers_day` - Father's Day
- `child_birthday` - Child's birthday
- `spring_break` - Spring break division
- `winter_break` - Winter break division
- `summer_vacation` - Summer vacation division

### Section 8: Exchange Logistics
- `exchange_location` - Where exchanges happen
- `exchange_day` - Day of week
- `exchange_time` - Time (HH:MM format)
- `who_transports` - Who brings/picks up child
- `grace_period` - Lateness grace period
- `emergency_contact` - Emergency contact if late
- `behavior_rules` - Exchange behavior rules

### Section 9: Transportation Costs
- `cost_arrangement` - How costs are handled
- `who_pays` - If one parent pays, which one
- `mileage_reimbursement` - Mileage reimbursement
- `long_distance` - Long distance travel

**Cost Arrangements:** `Each Pays Own|Split 50/50|One Parent Pays All|Meet Halfway|Based on Income Percentages`

### Section 10: Child Support
- `has_support` - Yes|No
- `payer` - Who pays whom
- `amount` - Amount per month
- `due_date` - Due date (day of month)
- `payment_method` - Payment method
- `medical_expenses` - Uncovered medical expense split
- `childcare_costs` - Childcare cost split
- `school_expenses` - School expense split
- `extracurricular_costs` - Activity cost split
- `tax_benefits` - Who claims child on taxes
- `health_insurance` - Who provides insurance

### Section 11: Medical & Healthcare
- `insurance_provider` - Who provides health insurance
- `insurance_company` - Insurance company name
- `medical_records_access` - Yes|No
- `routine_appointments` - Routine appointment policy
- `major_medical` - Major medical decision policy
- `emergency_treatment` - Emergency treatment authorization
- `mental_health` - Mental health/therapy consent
- `current_conditions` - Current medical conditions
- `current_pediatrician` - Current pediatrician
- `current_dentist` - Current dentist

### Section 12: Education
- `current_school` - Current school name
- `school_district` - School district
- `school_records_access` - Yes|No
- `report_cards` - Yes|No - Both receive report cards
- `conferences` - Yes|No - Both attend conferences
- `school_events` - Yes|No - Both attend events
- `school_choice` - Who decides school
- `homework` - Homework responsibility
- `school_communications` - How school info is shared

**School Choice:** `Joint Decision|Mother Decides|Father Decides`

### Section 13: Parent-to-Parent Communication
- `primary_method` - Primary communication method
- `response_time_non_urgent` - Non-urgent response time
- `response_time_urgent` - Urgent response time
- `communication_tone` - Communication tone agreement
- `schedule_change_notice` - Advance notice for changes
- `information_sharing` - What info is shared

**Methods:** `Text|Email|Phone|Co-parenting App|Our Family Wizard|Talking Parents`

### Section 14: Child Communication with Other Parent
- `phone_calls_allowed` - Yes|No|Limited
- `video_calls_allowed` - Yes|No
- `call_frequency` - How often
- `preferred_times` - Preferred call times
- `call_privacy` - Privacy level
- `child_phone` - Yes|No - Child has own phone
- `phone_travel_rules` - Phone travel rules
- `social_media` - Social media agreements

**Privacy Levels:** `Yes, completely private|Parent can be present but not listening|No privacy requirement`

### Section 15: Travel with Child
- `domestic_notice` - Domestic travel notice requirement
- `travel_itinerary` - Yes|No - Itinerary required
- `contact_while_traveling` - Contact info requirement
- `international_consent` - Yes|No - Other parent consent needed
- `passport_holder` - Who holds passport
- `international_notice` - International travel notice
- `vacation_time_amount` - Vacation time per year
- `vacation_advance_request` - Advance request time
- `blackout_dates` - Vacation blackout dates

### Section 16: Relocation (Moving)
- `notice_days` - Days notice required
- `distance_trigger` - Distance triggering notice
- `process` - Relocation process
- `custody_impact` - Impact on custody

### Section 17: Dispute Resolution
- `first_step` - First step in dispute
- `mediation_required` - Yes|No - Mediation required
- `mediation_costs` - How mediation costs split
- `preferred_mediator` - Preferred mediator
- `court_option` - Court intervention policy
- `emergency_court` - Emergency court access

### Section 18: Other Provisions
- `right_of_first_refusal` - Right of first refusal policy
- `new_partners` - New partner/overnight guest rules
- `discipline` - Discipline agreement
- `religious_upbringing` - Religious upbringing
- `pets` - Pets traveling with child
- `items_traveling` - Items always traveling
- `clothing` - Clothing arrangement
- `other_special` - Other special provisions

**Clothing:** `Each home provides clothing|Clothes travel with child`

## Usage

### 1. Import the Schema

```python
from app.services.aria_extraction_schema import (
    EXTRACTION_SCHEMA,
    EXTRACTION_PROMPT_TEMPLATE,
    get_extraction_prompt
)
```

### 2. Generate Extraction Prompt

```python
# Prepare conversation history
conversation_history = """
ARIA: What's your full legal name?
Parent: Sarah Johnson
ARIA: And your role?
Parent: I'm the mother
...
"""

# Generate complete extraction prompt
prompt = get_extraction_prompt(conversation_history)
```

### 3. Send to LLM (Claude or OpenAI)

```python
import anthropic

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4000,
    messages=[{
        "role": "user",
        "content": prompt
    }]
)

# Parse JSON response
import json
extracted_data = json.loads(response.content[0].text)
```

### 4. Save to Database

```python
from app.services.agreement import AgreementService

# Save each section
for section_key, section_data in extracted_data.items():
    section_number = int(section_key.split('_')[1])

    await AgreementService.update_section(
        agreement_id=agreement_id,
        section_number=section_number,
        data=section_data,
        db=db
    )
```

## Extraction Rules

1. **Extract ONLY explicitly stated information** - Don't assume or infer
2. **Use null for missing data** - Don't fill in defaults
3. **Match select field values exactly** - Use the predefined options
4. **Preserve parent's wording** - For text fields, keep their exact phrases
5. **Convert dates to YYYY-MM-DD** - Standardize date format
6. **Handle multiple children** - Add all to the children array
7. **Field names must match exactly** - Case-sensitive

## Example Output

```json
{
  "section_1_parent_info": {
    "full_name": "Sarah Michelle Johnson",
    "role": "mother",
    "address": "123 Oak Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90210",
    "phone": "555-123-4567",
    "email": "sarah@example.com",
    "employer": "ABC Company",
    "work_hours": "Monday-Friday, 9am-5pm"
  },
  "section_2_other_parent_info": {
    "full_name": "John Robert Johnson",
    "address": "456 Pine Avenue",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90211",
    "phone": "555-234-5678",
    "email": "john@example.com",
    "work_schedule": "Tuesday-Saturday, 10am-6pm"
  },
  "section_3_children_info": {
    "children": [
      {
        "full_name": "Emily Rose Johnson",
        "nickname": "Emmy",
        "date_of_birth": "2015-03-15",
        "school": "Lincoln Elementary",
        "grade": "3rd Grade",
        "special_needs": null,
        "allergies": "Peanuts, dairy",
        "medications": "Albuterol inhaler as needed"
      }
    ]
  },
  "section_4_legal_custody": {
    "education_decisions": "Joint Decision",
    "medical_decisions": "Joint Decision",
    "religious_decisions": "Mother Decides",
    "extracurricular_decisions": "Joint Decision",
    "emergency_decisions": "Either parent can make emergency decisions when child is with them"
  }
  // ... additional sections
}
```

## Integration with Agreement Builder

The extracted JSON maps directly to the React component fields:

| Schema Field | React Component | Input Type |
|-------------|----------------|-----------|
| `section_1_parent_info.full_name` | `parent-info.tsx` | Text input |
| `section_3_children_info.children` | `children-info.tsx` | Array of objects |
| `section_4_legal_custody.education_decisions` | `legal-custody.tsx` | Select dropdown |
| `section_7_holiday_schedule.thanksgiving` | `holiday-schedule.tsx` | Textarea |

## Testing the Schema

```python
# Run the example in the schema file
cd /Users/tj/Desktop/CommonGround/mvp/backend
python -m app.services.aria_extraction_schema
```

This will show:
1. The complete extraction prompt template
2. Example conversation
3. Expected JSON output structure

## Next Steps

1. **Integrate with ARIA service** - Add extraction endpoint
2. **Create conversation endpoint** - `/api/v1/aria/conversation`
3. **Build chat interface** - Frontend component for ARIA conversations
4. **Test extraction accuracy** - Validate against real conversations
5. **Add validation layer** - Ensure extracted data meets requirements

## Field Count Summary

- **Section 1 (Parent Info):** 10 fields
- **Section 2 (Other Parent):** 8 fields
- **Section 3 (Children):** 8 fields per child (array)
- **Section 4 (Legal Custody):** 5 fields
- **Section 5 (Physical Custody):** 4 fields
- **Section 6 (Parenting Schedule):** 5 fields
- **Section 7 (Holiday Schedule):** 13 fields
- **Section 8 (Exchange Logistics):** 7 fields
- **Section 9 (Transportation):** 4 fields
- **Section 10 (Child Support):** 11 fields
- **Section 11 (Medical):** 10 fields
- **Section 12 (Education):** 9 fields
- **Section 13 (Parent Communication):** 6 fields
- **Section 14 (Child Communication):** 8 fields
- **Section 15 (Travel):** 9 fields
- **Section 16 (Relocation):** 4 fields
- **Section 17 (Dispute Resolution):** 6 fields
- **Section 18 (Other Provisions):** 8 fields

**Total: 135+ fields** (excluding child array which can be 1-N children × 8 fields each)

---

*Last Updated: 2025-12-31*
*Schema Version: 1.0*
