"""
Extractor Agent
Takes approved parent-friendly summaries and extracts structured data
using Pydantic models for the final legal document generation.
"""

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schemas.custody_models import (
    CustodyAgreementData,
    CustodyArrangement,
    CustodyType,
    Parent,
    ExchangeSchedule,
    ExchangeLocation,
    DayOfWeek,
    Frequency,
    ChildSupport,
    TransportationCosts,
    ChildInfo,
    ParentInfo
)


# ============================================================================
# EXTRACTION SCHEMAS - Simpler models for LLM extraction
# ============================================================================

class ExtractedParent(BaseModel):
    """Extracted parent information"""
    full_name: str = Field(description="Parent's full name")
    role: Literal["mother", "father"] = Field(description="Parent's role")
    is_completing_form: bool = Field(description="Is this the parent filling out the form?")


class ExtractedChild(BaseModel):
    """Extracted child information"""
    name: str = Field(description="Child's name")
    age: Optional[int] = Field(default=None, description="Child's age if mentioned")


class ExtractedCustody(BaseModel):
    """Extracted custody arrangement"""
    custody_type: Literal["joint", "sole", "primary_with_visitation"] = Field(
        description="Type of custody arrangement"
    )
    primary_parent: Optional[Literal["mother", "father"]] = Field(
        default=None,
        description="If primary_with_visitation, who has primary custody"
    )
    mother_percentage: Optional[int] = Field(
        default=None,
        description="Percentage of time with mother (e.g., 50 for 50/50)"
    )
    father_percentage: Optional[int] = Field(
        default=None,
        description="Percentage of time with father"
    )
    schedule_description: Optional[str] = Field(
        default=None,
        description="Description of schedule (e.g., alternating weeks)"
    )


class ExtractedExchange(BaseModel):
    """Extracted exchange details"""
    location_address: str = Field(description="Address of exchange location")
    location_type: Optional[str] = Field(
        default=None,
        description="Type of location (police station, school, etc.)"
    )
    day_of_week: Optional[str] = Field(default=None, description="Day of week for exchange")
    time: str = Field(description="Time of exchange (e.g., 4:00 PM)")
    frequency: Literal["weekly", "biweekly", "monthly"] = Field(
        default="weekly",
        description="How often exchanges occur"
    )
    responsible_parent: Literal["mother", "father"] = Field(
        description="Which parent is responsible for transport"
    )


class ExtractedChildSupport(BaseModel):
    """Extracted child support details"""
    has_child_support: bool = Field(description="Whether child support is included")
    paying_parent: Optional[Literal["mother", "father"]] = Field(default=None)
    monthly_amount: Optional[float] = Field(default=None)
    payment_method: Optional[str] = Field(default=None)


class ExtractedTransportation(BaseModel):
    """Extracted transportation arrangement"""
    arrangement: Literal["each_pays_own", "split_equally", "one_parent_pays", "meets_halfway"] = Field(
        description="How transportation is handled"
    )
    paying_parent: Optional[Literal["mother", "father"]] = Field(
        default=None,
        description="If one parent pays, which one"
    )


class FullExtraction(BaseModel):
    """Complete extraction from summary"""
    completing_parent: ExtractedParent
    other_parent: Optional[ExtractedParent] = None
    children: List[ExtractedChild]
    custody: ExtractedCustody
    pickup: Optional[ExtractedExchange] = None
    dropoff: Optional[ExtractedExchange] = None
    child_support: Optional[ExtractedChildSupport] = None
    transportation: Optional[ExtractedTransportation] = None
    special_provisions: Optional[str] = None


# ============================================================================
# EXTRACTION PROMPT
# ============================================================================

EXTRACTION_SYSTEM_PROMPT = """You are a precise data extractor. Your job is to read a custody agreement summary and extract structured data from it.

## Rules
1. Only extract information that is explicitly stated
2. Use exact values when provided (names, addresses, times)
3. Infer standard values only when obvious (e.g., "50/50" means 50% each)
4. Leave fields as null if the information is not clearly provided
5. Be consistent with naming (use the same name format throughout)

## Output Format
Return a JSON object matching this exact structure. Include all fields, using null for missing values.

```json
{
  "completing_parent": {
    "full_name": "string",
    "role": "mother" or "father",
    "is_completing_form": true
  },
  "other_parent": {
    "full_name": "string or null",
    "role": "mother" or "father",
    "is_completing_form": false
  },
  "children": [
    {
      "name": "string",
      "age": number or null
    }
  ],
  "custody": {
    "custody_type": "joint" or "sole" or "primary_with_visitation",
    "primary_parent": "mother" or "father" or null,
    "mother_percentage": number or null,
    "father_percentage": number or null,
    "schedule_description": "string or null"
  },
  "pickup": {
    "location_address": "string",
    "location_type": "string or null",
    "day_of_week": "string or null",
    "time": "string",
    "frequency": "weekly" or "biweekly" or "monthly",
    "responsible_parent": "mother" or "father"
  },
  "dropoff": {
    "location_address": "string",
    "location_type": "string or null", 
    "day_of_week": "string or null",
    "time": "string",
    "frequency": "weekly" or "biweekly" or "monthly",
    "responsible_parent": "mother" or "father"
  },
  "child_support": {
    "has_child_support": boolean,
    "paying_parent": "mother" or "father" or null,
    "monthly_amount": number or null,
    "payment_method": "string or null"
  },
  "transportation": {
    "arrangement": "each_pays_own" or "split_equally" or "one_parent_pays" or "meets_halfway",
    "paying_parent": "mother" or "father" or null
  },
  "special_provisions": "string or null"
}
```

IMPORTANT: Return ONLY the JSON object, no other text."""


EXTRACTION_USER_PROMPT = """Extract structured data from this custody agreement summary:

---
{summary}
---

Return the JSON object with all extracted information."""


class ExtractorAgent:
    """
    The Extractor Agent takes approved summaries and extracts
    structured data for legal document generation.
    """
    
    def __init__(self, llm):
        """
        Initialize with a LangChain LLM
        
        Args:
            llm: A LangChain chat model
        """
        self.llm = llm
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", EXTRACTION_SYSTEM_PROMPT),
            ("human", EXTRACTION_USER_PROMPT)
        ])
        
        # Try to use structured output if the LLM supports it
        try:
            self.structured_llm = llm.with_structured_output(FullExtraction)
            self.use_structured = True
        except Exception:
            self.use_structured = False
            self.chain = self.prompt | self.llm
    
    def extract(self, summary: str) -> FullExtraction:
        """
        Extract structured data from a custody summary.
        
        Args:
            summary: The approved parent-friendly summary
            
        Returns:
            FullExtraction Pydantic model with all structured data
        """
        if self.use_structured:
            # Use structured output directly
            prompt = ChatPromptTemplate.from_messages([
                ("system", "Extract custody agreement information into structured format."),
                ("human", "Extract from this summary:\n\n{summary}")
            ])
            chain = prompt | self.structured_llm
            return chain.invoke({"summary": summary})
        else:
            # Parse JSON from response
            response = self.chain.invoke({"summary": summary})
            content = response.content
            
            # Find and parse JSON
            if "{" in content:
                start = content.index("{")
                end = content.rindex("}") + 1
                json_str = content[start:end]
                data = json.loads(json_str)
                return FullExtraction(**data)
            else:
                raise ValueError("No JSON found in response")
    
    def extract_to_dict(self, summary: str) -> dict:
        """
        Extract structured data and return as dictionary.
        
        Args:
            summary: The approved parent-friendly summary
            
        Returns:
            Dictionary with all structured data
        """
        extraction = self.extract(summary)
        return extraction.model_dump()
    
    def extract_to_legal_format(self, summary: str) -> dict:
        """
        Extract and convert to format needed for legal document.
        
        Args:
            summary: The approved parent-friendly summary
            
        Returns:
            Dictionary formatted for legal document generation
        """
        extraction = self.extract(summary)
        
        # Convert to legal format with proper terminology
        legal_data = {
            "petitioner": None,
            "respondent": None,
            "minor_children": [],
            "custody_arrangement": {},
            "parenting_time_schedule": {},
            "exchange_provisions": {},
            "child_support": {},
            "transportation": {},
            "additional_provisions": None
        }
        
        # Determine petitioner/respondent (completing parent is petitioner)
        if extraction.completing_parent:
            legal_data["petitioner"] = {
                "name": extraction.completing_parent.full_name,
                "relationship": extraction.completing_parent.role.upper()
            }
        
        if extraction.other_parent:
            legal_data["respondent"] = {
                "name": extraction.other_parent.full_name,
                "relationship": extraction.other_parent.role.upper()
            }
        
        # Children
        for child in extraction.children:
            legal_data["minor_children"].append({
                "name": child.name,
                "age": child.age,
                "date_of_birth": None  # Would need to be provided
            })
        
        # Custody
        if extraction.custody:
            custody_type_map = {
                "joint": "JOINT LEGAL AND PHYSICAL CUSTODY",
                "sole": "SOLE CUSTODY",
                "primary_with_visitation": "PRIMARY PHYSICAL CUSTODY WITH VISITATION"
            }
            legal_data["custody_arrangement"] = {
                "type": custody_type_map.get(extraction.custody.custody_type, "JOINT CUSTODY"),
                "primary_custodian": extraction.custody.primary_parent.upper() if extraction.custody.primary_parent else None,
                "time_share": {
                    "mother_percentage": extraction.custody.mother_percentage,
                    "father_percentage": extraction.custody.father_percentage
                },
                "schedule": extraction.custody.schedule_description
            }
        
        # Exchange
        if extraction.pickup:
            legal_data["exchange_provisions"]["pickup"] = {
                "location": extraction.pickup.location_address,
                "location_type": extraction.pickup.location_type,
                "day": extraction.pickup.day_of_week,
                "time": extraction.pickup.time,
                "frequency": extraction.pickup.frequency.upper(),
                "responsible_party": extraction.pickup.responsible_parent.upper()
            }
        
        if extraction.dropoff:
            legal_data["exchange_provisions"]["dropoff"] = {
                "location": extraction.dropoff.location_address,
                "location_type": extraction.dropoff.location_type,
                "day": extraction.dropoff.day_of_week,
                "time": extraction.dropoff.time,
                "frequency": extraction.dropoff.frequency.upper(),
                "responsible_party": extraction.dropoff.responsible_parent.upper()
            }
        
        # Child support
        if extraction.child_support:
            if extraction.child_support.has_child_support:
                legal_data["child_support"] = {
                    "obligor": extraction.child_support.paying_parent.upper() if extraction.child_support.paying_parent else None,
                    "monthly_amount": extraction.child_support.monthly_amount,
                    "payment_method": extraction.child_support.payment_method
                }
            else:
                legal_data["child_support"] = {
                    "status": "WAIVED BY MUTUAL AGREEMENT"
                }
        
        # Transportation
        if extraction.transportation:
            arrangement_map = {
                "each_pays_own": "Each party shall be responsible for their own transportation costs",
                "split_equally": "Transportation costs shall be split equally between the parties",
                "one_parent_pays": f"The {extraction.transportation.paying_parent.upper() if extraction.transportation.paying_parent else 'designated party'} shall be responsible for transportation costs",
                "meets_halfway": "The parties shall meet at a mutually agreed upon midpoint location"
            }
            legal_data["transportation"] = {
                "arrangement": arrangement_map.get(extraction.transportation.arrangement, ""),
                "responsible_party": extraction.transportation.paying_parent.upper() if extraction.transportation.paying_parent else None
            }
        
        # Special provisions
        legal_data["additional_provisions"] = extraction.special_provisions
        
        return legal_data
