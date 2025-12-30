"""
Interviewer Agent
A calm, caring interviewer that guides parents through sharing their custody preferences.
This agent asks questions conversationally and gathers all needed information.
"""

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import List, Dict, Tuple
import json

# System prompt for the interviewer
INTERVIEWER_SYSTEM_PROMPT = """You are a warm, caring custody agreement assistant helping a parent document their co-parenting arrangement. Your role is to have a natural conversation that feels supportive, not like filling out forms.

## Your Personality
- Warm and empathetic - you understand this is emotionally difficult
- Patient - never rush the parent
- Non-judgmental - no matter what they share
- Child-focused - always frame things in terms of what's best for the child
- Clear but gentle - help them think through details they might not have considered

## Your Current Task
You are in the **{current_section}** section of the interview.

## Section Guidelines

### INTRO
- Warmly greet them and explain you'll help document their custody arrangement
- Let them know this is a conversation, not paperwork
- Ask if they're ready to begin

### PARENT_INFO  
- Ask for their name and basic contact info
- Ask about the other parent (just name for now)
- Keep it light - "Let's start with the basics..."

### CHILD_INFO
- Ask about the child/children - names and ages
- Express that you're here to help create stability for them
- "Tell me about your little one(s)..."

### CUSTODY_TYPE
- Ask what kind of arrangement they're hoping for
- Listen for: joint custody, sole custody, primary with visitation
- If they say things like "50/50" or "equal time" - that's joint custody
- If they want the child most of the time - explore primary custody
- Help them think about what schedule might work (alternating weeks, etc.)

### EXCHANGE_SCHEDULE
- Ask where they'd like exchanges to happen (pickup/dropoff)
- Find out what times and days work
- Listen for locations (police station, school, church, etc.)
- Ask about who will be responsible for transportation
- "Where would you feel comfortable meeting for exchanges?"

### CHILD_SUPPORT
- Gently ask if child support will be part of the arrangement
- If yes, explore amount, who pays, how often
- If they seem unsure, that's okay - note it needs discussion
- "Some parents include child support in their agreement. Is that something you've discussed?"

### TRANSPORTATION
- Ask how transportation costs will be handled
- Will they meet halfway? Each drive their own way?
- Any reimbursement for gas/mileage?
- "How are you thinking about handling the driving for exchanges?"

### REVIEW
- Summarize what you've gathered
- Ask if anything needs to be changed or clarified
- Confirm they're ready to move to the formal summary

## Conversation Rules
1. Ask ONE main question at a time (you can include a brief follow-up)
2. Acknowledge what they share before asking the next question
3. If they share something emotional, respond with empathy first
4. Use their language back to them when possible
5. If something is unclear, ask for clarification kindly
6. Never make assumptions - always confirm

## Information Already Gathered
{gathered_info}

## What You Still Need for This Section
{missing_info}

Remember: This is a conversation, not an interrogation. Let them tell their story."""


def get_section_requirements() -> Dict[str, List[str]]:
    """Define what information is needed for each section"""
    return {
        "INTRO": ["ready_to_begin"],
        "PARENT_INFO": ["parent_name", "other_parent_name"],
        "CHILD_INFO": ["child_names", "child_ages"],
        "CUSTODY_TYPE": ["custody_type", "custody_split_or_primary", "schedule_preference"],
        "EXCHANGE_SCHEDULE": [
            "exchange_location", "exchange_location_type",
            "exchange_day", "exchange_time", "who_transports"
        ],
        "CHILD_SUPPORT": ["has_support", "support_amount", "who_pays"],
        "TRANSPORTATION": ["transport_arrangement", "meets_halfway", "reimbursement"],
        "REVIEW": ["confirmed_accurate"]
    }


def get_section_order() -> List[str]:
    """Define the order of sections"""
    return [
        "INTRO",
        "PARENT_INFO", 
        "CHILD_INFO",
        "CUSTODY_TYPE",
        "EXCHANGE_SCHEDULE",
        "CHILD_SUPPORT",
        "TRANSPORTATION",
        "REVIEW"
    ]


class InterviewerAgent:
    """
    The Interviewer Agent conducts a warm, conversational interview
    to gather custody agreement information from parents.
    """
    
    def __init__(self, llm):
        """
        Initialize with a LangChain LLM
        
        Args:
            llm: A LangChain chat model (e.g., ChatOpenAI, ChatAnthropic)
        """
        self.llm = llm
        self.section_requirements = get_section_requirements()
        self.section_order = get_section_order()
        
        # Build the prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", INTERVIEWER_SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{user_input}")
        ])
        
        # Create the chain
        self.chain = self.prompt | self.llm
    
    def get_missing_info(self, section: str, gathered: Dict) -> str:
        """Determine what info is still needed for a section"""
        requirements = self.section_requirements.get(section, [])
        section_gathered = gathered.get(section, {})
        
        missing = []
        for req in requirements:
            if req not in section_gathered or not section_gathered[req]:
                missing.append(req.replace("_", " "))
        
        if not missing:
            return "All required information for this section has been gathered."
        
        return "Still need: " + ", ".join(missing)
    
    def format_gathered_info(self, gathered: Dict) -> str:
        """Format gathered information for the prompt"""
        if not gathered:
            return "No information gathered yet."
        
        formatted = []
        for section, data in gathered.items():
            if data:
                formatted.append(f"\n{section}:")
                for key, value in data.items():
                    formatted.append(f"  - {key.replace('_', ' ')}: {value}")
        
        return "\n".join(formatted) if formatted else "No information gathered yet."
    
    def should_advance_section(self, section: str, gathered: Dict) -> bool:
        """Check if we have enough info to move to next section"""
        requirements = self.section_requirements.get(section, [])
        section_gathered = gathered.get(section, {})
        
        # For INTRO, just need them to be ready
        if section == "INTRO":
            return section_gathered.get("ready_to_begin", False)
        
        # For other sections, need at least 70% of requirements
        filled = sum(1 for req in requirements if req in section_gathered and section_gathered[req])
        return filled >= len(requirements) * 0.7
    
    def get_next_section(self, current_section: str) -> str:
        """Get the next section in order"""
        try:
            current_idx = self.section_order.index(current_section)
            if current_idx < len(self.section_order) - 1:
                return self.section_order[current_idx + 1]
        except ValueError:
            pass
        return "COMPLETE"
    
    async def respond(
        self,
        user_input: str,
        current_section: str,
        gathered_info: Dict,
        chat_history: List
    ) -> Tuple[str, str, Dict]:
        """
        Generate a response to the user's input.
        
        Returns:
            Tuple of (response_text, new_section, updated_gathered_info)
        """
        # Format the prompt variables
        missing_info = self.get_missing_info(current_section, gathered_info)
        formatted_gathered = self.format_gathered_info(gathered_info)
        
        # Get response from LLM
        response = await self.chain.ainvoke({
            "current_section": current_section,
            "gathered_info": formatted_gathered,
            "missing_info": missing_info,
            "chat_history": chat_history,
            "user_input": user_input
        })
        
        response_text = response.content
        
        # Check if we should advance to next section
        new_section = current_section
        if self.should_advance_section(current_section, gathered_info):
            new_section = self.get_next_section(current_section)
        
        return response_text, new_section, gathered_info
    
    def respond_sync(
        self,
        user_input: str,
        current_section: str,
        gathered_info: Dict,
        chat_history: List
    ) -> Tuple[str, str, Dict]:
        """Synchronous version of respond"""
        missing_info = self.get_missing_info(current_section, gathered_info)
        formatted_gathered = self.format_gathered_info(gathered_info)
        
        response = self.chain.invoke({
            "current_section": current_section,
            "gathered_info": formatted_gathered,
            "missing_info": missing_info,
            "chat_history": chat_history,
            "user_input": user_input
        })
        
        response_text = response.content
        
        new_section = current_section
        if self.should_advance_section(current_section, gathered_info):
            new_section = self.get_next_section(current_section)
        
        return response_text, new_section, gathered_info


# Extraction prompt - used to extract structured info from conversation
EXTRACTION_PROMPT = """Analyze this conversation excerpt and extract any custody-related information mentioned.

Conversation:
{conversation}

Current Section: {section}

Extract any of the following if mentioned (leave blank if not mentioned):
- Parent names
- Child names and ages
- Custody type preference (joint, sole, primary)
- Custody split (50/50, 70/30, etc.)
- Exchange locations
- Exchange times and days
- Child support amounts
- Transportation arrangements

Return as JSON with only the fields that have clear values from the conversation."""


class InfoExtractor:
    """Extracts structured information from conversation text"""
    
    def __init__(self, llm):
        self.llm = llm
        self.prompt = ChatPromptTemplate.from_template(EXTRACTION_PROMPT)
    
    def extract_from_conversation(self, conversation: str, section: str) -> Dict:
        """Extract info from a conversation snippet"""
        try:
            # For structured extraction, we'd use with_structured_output
            # For now, return parsed JSON from LLM response
            chain = self.prompt | self.llm
            response = chain.invoke({
                "conversation": conversation,
                "section": section
            })
            
            # Try to parse JSON from response
            content = response.content
            # Find JSON in response
            if "{" in content and "}" in content:
                start = content.index("{")
                end = content.rindex("}") + 1
                json_str = content[start:end]
                return json.loads(json_str)
        except Exception as e:
            print(f"Extraction error: {e}")
        
        return {}
