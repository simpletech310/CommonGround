"""
Translator Agent
Takes raw conversation data and transforms it into clear, parent-friendly summaries
organized by section. Parents review and approve these before final extraction.
"""

from langchain_core.prompts import ChatPromptTemplate
from typing import Dict, Optional

TRANSLATOR_SYSTEM_PROMPT = """You are a translator that converts casual conversation into clear, formal but friendly custody agreement summaries.

Your job is to take what a parent has shared in conversation and reformat it into organized, easy-to-understand sections that describe what they want in their custody agreement.

## Rules
1. Use clear, simple language - avoid legal jargon
2. Organize by section with clear headings
3. State facts and preferences clearly
4. If something is ambiguous, note it needs clarification
5. Always frame things positively and in the child's best interest
6. Use "you" to address the parent reading it
7. Be specific with times, dates, locations

## Output Format

**Your Information**
[Name and role]

**Child(ren)**
[Child names and ages]

**Custody Arrangement**
[Type of custody and schedule]

**Pick-Up & Drop-Off**
[Exchange details - where, when, who is responsible]

**Child Support**
[Payment details if applicable, or "Not included in this agreement"]

**Transportation**
[How transportation costs/responsibilities are handled]

**Special Notes**
[Any additional provisions or notes]

---
⚠️ Items Needing Clarification:
[List anything that was unclear or needs more detail]
---

## Example Transformation

INPUT (raw conversation):
"I'm TJ, the dad. My son is also TJ, he's 4. I want us both to have him equally, like switching every week. I ain't finna pay for her to drive down, she can meet me halfway at the police station on 123 Main. Gotta be there by 4pm on Fridays cause I work. No child support, we make about the same."

OUTPUT:
**Your Information**
You are TJ, the father.

**Child(ren)**
- TJ Jr., age 4

**Custody Arrangement**
You are requesting joint custody with a 50/50 split. Your preferred schedule is alternating weeks, where your son would spend one full week with you, then one full week with his mother.

**Pick-Up & Drop-Off**
- **Location:** Police Station at 123 Main Street (neutral public location)
- **Exchange Time:** Fridays by 4:00 PM
- **Schedule:** Weekly exchanges
- **Note:** You have indicated 4:00 PM is necessary due to your work schedule

**Child Support**
No child support is requested by either party. You have indicated both parents have similar incomes.

**Transportation**
You prefer to meet at a halfway point. You do not agree to pay for the other parent's transportation costs. Each parent would be responsible for their own travel to the exchange location.

**Special Notes**
None specified.

---
⚠️ Items Needing Clarification:
- What is the other parent's name?
- Is the exchange every Friday, or just on custody switch weeks?
- What happens if someone is late to the exchange?
---

Now translate the following conversation data into a parent-friendly summary."""


TRANSLATOR_INPUT_PROMPT = """
## Raw Conversation Data

**Section: Parent Information**
{parent_info}

**Section: Child Information**  
{child_info}

**Section: Custody Arrangement**
{custody_info}

**Section: Exchange Schedule**
{exchange_info}

**Section: Child Support**
{support_info}

**Section: Transportation**
{transport_info}

**Additional Context:**
{additional_context}

---

Please create a clear, organized summary of this parent's custody preferences. Remember to note anything that needs clarification."""


class TranslatorAgent:
    """
    The Translator Agent takes raw conversation data and creates
    clear, parent-friendly summaries for review and approval.
    """
    
    def __init__(self, llm):
        """
        Initialize with a LangChain LLM
        
        Args:
            llm: A LangChain chat model
        """
        self.llm = llm
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", TRANSLATOR_SYSTEM_PROMPT),
            ("human", TRANSLATOR_INPUT_PROMPT)
        ])
        
        self.chain = self.prompt | self.llm
    
    def translate(
        self,
        parent_info: str = "",
        child_info: str = "",
        custody_info: str = "",
        exchange_info: str = "",
        support_info: str = "",
        transport_info: str = "",
        additional_context: str = ""
    ) -> str:
        """
        Translate raw conversation data into a parent-friendly summary.
        
        Args:
            Each argument is the raw text from that section of the conversation
            
        Returns:
            Formatted summary string
        """
        response = self.chain.invoke({
            "parent_info": parent_info or "Not provided",
            "child_info": child_info or "Not provided",
            "custody_info": custody_info or "Not provided",
            "exchange_info": exchange_info or "Not provided",
            "support_info": support_info or "Not provided",
            "transport_info": transport_info or "Not provided",
            "additional_context": additional_context or "None"
        })
        
        return response.content
    
    def translate_from_dict(self, conversation_data: Dict) -> str:
        """
        Translate from a dictionary of section data.
        
        Args:
            conversation_data: Dict with section names as keys
            
        Returns:
            Formatted summary string
        """
        return self.translate(
            parent_info=conversation_data.get("PARENT_INFO", ""),
            child_info=conversation_data.get("CHILD_INFO", ""),
            custody_info=conversation_data.get("CUSTODY_TYPE", ""),
            exchange_info=conversation_data.get("EXCHANGE_SCHEDULE", ""),
            support_info=conversation_data.get("CHILD_SUPPORT", ""),
            transport_info=conversation_data.get("TRANSPORTATION", ""),
            additional_context=conversation_data.get("ADDITIONAL", "")
        )


# Revision prompt for when parent requests changes
REVISION_PROMPT = """You previously created this custody agreement summary:

{original_summary}

The parent has requested the following changes:
{requested_changes}

Please create an updated summary incorporating their feedback. Maintain the same format and sections."""


class TranslatorRevisionAgent:
    """Handles revisions to the summary based on parent feedback"""
    
    def __init__(self, llm):
        self.llm = llm
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "You update custody agreement summaries based on parent feedback. Keep the same format."),
            ("human", REVISION_PROMPT)
        ])
        self.chain = self.prompt | self.llm
    
    def revise(self, original_summary: str, requested_changes: str) -> str:
        """
        Revise a summary based on parent feedback.
        
        Args:
            original_summary: The previous summary
            requested_changes: What the parent wants changed
            
        Returns:
            Updated summary
        """
        response = self.chain.invoke({
            "original_summary": original_summary,
            "requested_changes": requested_changes
        })
        return response.content
