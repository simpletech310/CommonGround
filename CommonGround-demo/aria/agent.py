"""
ARIA - Agreement Resource & Information Assistant
A caring, professional chatbot that helps parents understand their custody agreements.
"""

import json
import re
from typing import Optional, Dict, Any, List
from datetime import datetime

from .tools import ARIAToolkit, CalculatorTool, DateTool
from .sample_agreements import get_agreement


# ============================================================================
# ARIA SYSTEM PROMPT
# ============================================================================

ARIA_SYSTEM_PROMPT = """You are ARIA (Agreement Resource & Information Assistant), a caring and knowledgeable assistant who helps parents understand and navigate their custody agreements.

## YOUR PERSONALITY

- **Professional but warm**: You maintain a professional demeanor while being genuinely caring and supportive.
- **Child-centered**: Everything you do prioritizes the wellbeing of the children. You gently remind parents of this when helpful.
- **Empathetic**: You understand co-parenting is challenging. You acknowledge the difficulties without being preachy.
- **Concise but complete**: You give clear, actionable answers without being overly wordy.
- **Neutral**: You never take sides, show favoritism, or make judgments about either parent.
- **Grounded**: You ONLY provide information that is explicitly in the custody agreement. If it's not there, you say so.

## YOUR ROLE

You help parents:
1. **Understand their agreement** - Explain provisions in plain language
2. **Find specific information** - Answer questions about pickups, schedules, costs, etc.
3. **Calculate costs** - Figure out splits, reimbursements, and amounts owed
4. **Check dates and timing** - Notice periods, which parent has the child when, etc.
5. **Navigate tricky situations** - Always pointing back to what the agreement says

## CRITICAL RULES

1. **ONLY reference the agreement**: If something isn't in the agreement, say "That's not covered in your current agreement, so I can't help with that specific situation. You may want to discuss adding that provision."

2. **Always cite your source**: When you provide information, mention which section it came from. Example: "According to your exchange provisions..."

3. **Never give legal advice**: You explain what the agreement says, not what it means legally. For legal questions, suggest consulting an attorney.

4. **Never take sides**: Even if one parent seems frustrated with the other, remain neutral and child-focused.

5. **Be accurate with money**: Always use the calculator for financial questions. Double-check splits and amounts.

6. **Be accurate with dates**: Use the date tools to calculate notice periods and determine whose time it is.

7. **Encourage communication**: When appropriate, gently remind parents that good co-parenting communication benefits the children.

## RESPONSE STYLE

- Start with warmth but get to the point quickly
- Use the parent's name or "you" rather than formal language
- Include the specific details from the agreement
- For calculations, show your work briefly
- End with a helpful follow-up when appropriate

## EXAMPLE RESPONSES

**Good response to "Where do I pick up my kids?"**
"You'll pick up Eric and Maya at the Vista Sheriff's Station at 325 S. Melrose Dr - per your exchange provisions, you use the parking lot there as your neutral location. Exchanges happen on Sundays at 6:00 PM. Since it's currently an odd week, this is your parenting time. Is there anything specific about the exchange you'd like to know more about?"

**Good response to "The doctor copay was $89, how much does she owe me?"**
"Let me check your medical expense provisions... Your agreement states that copays over $50 are split 50/50. Since this $89 copay exceeds that threshold, here's the breakdown:

$89.00 ÷ 2 = **$44.50**

She should send you $44.50 within 14 days of receiving the receipt, via Venmo or transfer to your Joint Kids Account at Chase. Make sure to send her a photo of the receipt to start that clock!

Would you like me to look up any other medical cost-sharing details?"

**Good response to "I want to take my baby to Disney next week"**
"That sounds like a wonderful trip! 🎢 Let me check your travel provisions...

Your agreement requires 7 days advance written notice for domestic travel via OurFamilyWizard. If 'next week' means 7+ days from now, you're within the requirement! If it's sooner, you're a bit short on notice.

Here's what you need to provide to Jennifer:
- Where you're going (Disneyland, I'm guessing!)
- Exact dates
- Flight info if flying
- Hotel address
- Contact phone number while traveling

One more thing - since Eric has a peanut allergy, don't forget to pack his EpiPen and check with the restaurants there about allergen info. His safety comes first! 

Want me to help you figure out the exact dates and notice period?"

## WHEN SOMETHING ISN'T IN THE AGREEMENT

"That's a great question, but I don't see anything in your agreement that specifically addresses [topic]. This might be something you and [other parent] need to discuss and potentially add to a future version of your agreement. Would you like me to help you with something else that is covered?"

## THE AGREEMENT YOU'RE WORKING WITH

{agreement_json}

Remember: You are here to help, not to judge. Every question is an opportunity to help a parent be their best for their children."""


# ============================================================================
# ARIA AGENT CLASS
# ============================================================================

class ARIAAgent:
    """
    ARIA - Agreement Resource & Information Assistant
    
    A grounded chatbot that helps parents understand their custody agreements.
    """
    
    def __init__(self, agreement: dict, llm=None, user_role: str = "petitioner"):
        """
        Initialize ARIA with a custody agreement.
        
        Args:
            agreement: The custody agreement dictionary
            llm: Optional LangChain LLM (if None, uses demo mode)
            user_role: Which parent is talking to ARIA ("petitioner" or "respondent")
        """
        self.agreement = agreement
        self.toolkit = ARIAToolkit(agreement)
        self.llm = llm
        self.user_role = user_role
        self.conversation_history = []
        
        # Determine which parent is "you" and which is "them"
        parties = agreement.get("parties", {})
        if user_role == "petitioner":
            self.user_info = parties.get("petitioner", {})
            self.other_parent_info = parties.get("respondent", {})
        else:
            self.user_info = parties.get("respondent", {})
            self.other_parent_info = parties.get("petitioner", {})
        
        self.user_name = self.user_info.get("name", "").split()[0]  # First name
        self.other_parent_name = self.other_parent_info.get("name", "").split()[0]
        self.user_role_label = self.user_info.get("role", "PARENT")
        
        # Get children names for reference
        self.children = agreement.get("children", [])
        self.children_names = [c.get("nickname") or c.get("name", "").split()[0] for c in self.children]
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt with the agreement embedded"""
        # Create a condensed version of the agreement for the prompt
        agreement_json = json.dumps(self.agreement, indent=2)
        
        prompt = ARIA_SYSTEM_PROMPT.format(agreement_json=agreement_json)
        
        # Add user context
        prompt += f"""

## CURRENT USER CONTEXT

You are speaking with **{self.user_name}** (the {self.user_role_label}).
The other parent is **{self.other_parent_name}** (the {self.other_parent_info.get('role', 'OTHER PARENT')}).
Children: {', '.join(self.children_names)}

When you say "you" - you mean {self.user_name}.
When you reference the other parent, use "{self.other_parent_name}" or "he/she" appropriately.

Today's date is {datetime.now().strftime('%A, %B %d, %Y')}.
Current week number: {datetime.now().isocalendar()[1]} ({'odd' if datetime.now().isocalendar()[1] % 2 == 1 else 'even'} week)
Current year: {datetime.now().year} ({'odd' if datetime.now().year % 2 == 1 else 'even'} year)
"""
        return prompt
    
    def _analyze_query(self, query: str) -> Dict[str, Any]:
        """Analyze the query to determine what information is needed"""
        query_lower = query.lower()
        
        analysis = {
            "needs_financial_calc": False,
            "needs_date_calc": False,
            "financial_amount": None,
            "date_reference": None,
            "likely_sections": [],
            "keywords": []
        }
        
        # Check for financial questions
        money_pattern = r'\$?(\d+(?:\.\d{2})?)'
        money_matches = re.findall(money_pattern, query)
        if money_matches:
            analysis["needs_financial_calc"] = True
            analysis["financial_amount"] = float(money_matches[0])
        
        # Financial keywords
        financial_keywords = ["copay", "cost", "pay", "split", "owe", "reimburse", "expense", "money", "dollar", "$"]
        if any(kw in query_lower for kw in financial_keywords):
            analysis["likely_sections"].append("additional_expenses")
            analysis["likely_sections"].append("child_support")
            analysis["keywords"].extend([kw for kw in financial_keywords if kw in query_lower])
        
        # Medical keywords
        medical_keywords = ["doctor", "medical", "health", "insurance", "prescription", "therapy", "hospital", "dentist", "copay"]
        if any(kw in query_lower for kw in medical_keywords):
            analysis["likely_sections"].append("medical")
            analysis["likely_sections"].append("health_insurance")
            analysis["keywords"].extend([kw for kw in medical_keywords if kw in query_lower])
        
        # Pickup/exchange keywords
        exchange_keywords = ["pickup", "pick up", "drop off", "dropoff", "exchange", "meet", "where", "location"]
        if any(kw in query_lower for kw in exchange_keywords):
            analysis["likely_sections"].append("exchange")
            analysis["likely_sections"].append("parenting_schedule")
        
        # Travel keywords
        travel_keywords = ["trip", "travel", "vacation", "disney", "fly", "flight", "visit", "take"]
        if any(kw in query_lower for kw in travel_keywords):
            analysis["likely_sections"].append("travel")
            analysis["needs_date_calc"] = True
        
        # Time/date keywords
        date_keywords = ["today", "tomorrow", "next week", "this week", "when", "notice", "advance", "days"]
        if any(kw in query_lower for kw in date_keywords):
            analysis["needs_date_calc"] = True
        
        # Holiday keywords  
        holiday_keywords = ["holiday", "christmas", "thanksgiving", "easter", "birthday", "summer", "spring break"]
        if any(kw in query_lower for kw in holiday_keywords):
            analysis["likely_sections"].append("holidays")
        
        # Schedule keywords
        schedule_keywords = ["schedule", "whose week", "my week", "his week", "her week", "when do i", "custody"]
        if any(kw in query_lower for kw in schedule_keywords):
            analysis["likely_sections"].append("parenting_schedule")
            analysis["likely_sections"].append("physical_custody")
        
        return analysis
    
    def _get_relevant_context(self, analysis: Dict[str, Any]) -> str:
        """Get relevant agreement sections based on query analysis"""
        context_parts = []
        
        for section in set(analysis["likely_sections"]):
            section_data = self.toolkit.search.get_full_section(section)
            if section_data.get("found"):
                context_parts.append(f"**{section.upper()}**:\n{json.dumps(section_data['data'], indent=2)}")
        
        # Always include some base context
        if not context_parts:
            # Default to exchange and schedule
            context_parts.append(f"**EXCHANGE**:\n{json.dumps(self.agreement.get('exchange', {}), indent=2)}")
            context_parts.append(f"**PARENTING_SCHEDULE**:\n{json.dumps(self.agreement.get('parenting_schedule', {}), indent=2)}")
        
        return "\n\n".join(context_parts)
    
    def _perform_calculations(self, analysis: Dict[str, Any], query: str) -> Optional[str]:
        """Perform any needed calculations"""
        results = []
        
        if analysis["needs_financial_calc"] and analysis["financial_amount"]:
            amount = analysis["financial_amount"]
            
            # Check for specific split types mentioned in the agreement
            # Default to 50/50
            calc_result = self.toolkit.calculator.calculate_50_50(amount)
            results.append(f"50/50 split of ${amount}: Each parent owes ${calc_result['each_owes']}")
            
            # Also provide 60/40 if relevant
            if "adhd" in query.lower() or "60" in query:
                calc_60_40 = self.toolkit.calculator.calculate_60_40(amount, "father")
                results.append(f"60/40 split: Father ${calc_60_40['father_owes']}, Mother ${calc_60_40['mother_owes']}")
        
        if analysis["needs_date_calc"]:
            # Get current week info
            week_info = self.toolkit.dates.get_week_number()
            results.append(f"Current week #{week_info['week_number']} ({week_info['week_type']} week)")
            
            # Year parity for holidays
            year_info = self.toolkit.dates.get_current_year_parity()
            results.append(f"Current year {year_info['year']} is an {year_info['year_type']} year")
            
            # Check for "next week" type references
            if "next week" in query.lower():
                next_week = self.toolkit.dates.days_from_now(7)
                results.append(f"Next week starts: {next_week['target_date']}")
                
                # Check notice periods
                travel_section = self.agreement.get("travel", {}).get("domestic", {})
                if travel_section:
                    notice_required = 7  # Default, could parse from agreement
                    if "7" in str(travel_section.get("notice_required", "")):
                        notice_required = 7
                    elif "14" in str(travel_section.get("notice_required", "")):
                        notice_required = 14
                    
                    notice_check = self.toolkit.dates.check_notice_period(next_week['target_date'], notice_required)
                    results.append(f"Notice check: {notice_required} days required, you have {notice_check['days_until_event']} days - {'✓ Sufficient' if notice_check['sufficient_notice'] else '✗ Not enough notice'}")
        
        return "\n".join(results) if results else None
    
    def chat(self, user_message: str) -> str:
        """
        Process a user message and return ARIA's response.
        
        Args:
            user_message: The parent's question or message
            
        Returns:
            ARIA's response
        """
        # Add to history
        self.conversation_history.append({"role": "user", "content": user_message})
        
        # Analyze the query
        analysis = self._analyze_query(user_message)
        
        # Get relevant context from agreement
        context = self._get_relevant_context(analysis)
        
        # Perform any calculations
        calculations = self._perform_calculations(analysis, user_message)
        
        # If we have an LLM, use it
        if self.llm:
            response = self._llm_response(user_message, context, calculations)
        else:
            response = self._demo_response(user_message, analysis, context, calculations)
        
        # Add to history
        self.conversation_history.append({"role": "assistant", "content": response})
        
        return response
    
    def _llm_response(self, user_message: str, context: str, calculations: str) -> str:
        """Generate response using the LLM"""
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
        
        system_prompt = self._build_system_prompt()
        
        # Build messages
        messages = [SystemMessage(content=system_prompt)]
        
        # Add conversation history
        for msg in self.conversation_history[-6:]:  # Last 3 exchanges
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        # Add current context
        context_msg = f"""
RELEVANT AGREEMENT SECTIONS:
{context}

"""
        if calculations:
            context_msg += f"""
CALCULATIONS PERFORMED:
{calculations}
"""
        
        context_msg += f"""
USER QUESTION:
{user_message}

Please respond as ARIA, using the agreement information above to answer. Remember to cite the section you're referencing and be warm but concise."""

        messages.append(HumanMessage(content=context_msg))
        
        # Get LLM response
        response = self.llm.invoke(messages)
        return response.content
    
    def _demo_response(self, user_message: str, analysis: Dict, context: str, calculations: str) -> str:
        """Generate a demo response without LLM"""
        query_lower = user_message.lower()
        
        # Build a helpful demo response based on the query type
        response_parts = []
        
        # Greeting - only on first message and only if it's a simple greeting
        greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "hi there", "hey there"]
        is_greeting = False
        if len(self.conversation_history) <= 2:
            # Check if the message is primarily a greeting (short and starts with greeting word)
            words = query_lower.split()
            if len(words) <= 4 and words[0] in greetings:
                is_greeting = True
            elif query_lower.strip() in greetings:
                is_greeting = True
        
        if is_greeting:
            return f"Hi {self.user_name}! 👋 I'm ARIA, your Agreement Resource & Information Assistant. I'm here to help you understand your custody agreement with {self.other_parent_name}. What would you like to know about?"
        
        # Pickup/exchange questions
        if any(kw in query_lower for kw in ["pickup", "pick up", "where", "exchange"]):
            exchange = self.agreement.get("exchange", {})
            schedule = self.agreement.get("parenting_schedule", {})
            
            location = exchange.get("location", {})
            addr = location.get("address", location.get("primary", "the designated exchange location"))
            loc_type = location.get("type", "")
            
            response_parts.append(f"According to your exchange provisions, you meet at:\n\n📍 **{addr}**")
            if loc_type:
                response_parts.append(f"({loc_type})")
            
            # Add schedule info
            if schedule:
                school_pickup = schedule.get("school_pickup", {})
                if school_pickup:
                    response_parts.append(f"\nFor school pickups during your parenting time:")
                    for key, value in school_pickup.items():
                        if "location" in key or "time" in key:
                            response_parts.append(f"- {key.replace('_', ' ').title()}: {value}")
            
            if calculations:
                response_parts.append(f"\n📅 *{calculations.split(chr(10))[0]}*")
        
        # Financial questions
        elif any(kw in query_lower for kw in ["copay", "cost", "pay", "owe", "split", "money", "$", "reimburse"]):
            expenses = self.agreement.get("additional_expenses", {})
            
            response_parts.append("Let me check your cost-sharing provisions... 💰\n")
            
            if analysis["financial_amount"]:
                amount = analysis["financial_amount"]
                
                # Check for ADHD-specific expenses
                adhd = expenses.get("adhd_treatment", {})
                if adhd and any(kw in query_lower for kw in ["adhd", "psychiatrist", "adderall", "therapy"]):
                    split = adhd.get("split", "60/40")
                    
                    if "60" in split:
                        # 60/40 split - Father pays 60%
                        father_share = round(amount * 0.6, 2)
                        mother_share = round(amount * 0.4, 2)
                        
                        response_parts.append(f"Your ADHD treatment expenses are split **{split}** (Father 60% / Mother 40%).")
                        response_parts.append(f"\n**${amount} breakdown:**")
                        response_parts.append(f"- Father's share (60%): **${father_share}**")
                        response_parts.append(f"- Mother's share (40%): **${mother_share}**")
                        
                        # Who's talking?
                        if self.user_role_label == "MOTHER":
                            response_parts.append(f"\n{self.other_parent_name} should reimburse you **${father_share}** if you paid upfront.")
                        else:
                            response_parts.append(f"\nYou owe {self.other_parent_name} **${father_share}** for your share.")
                        
                        payment = adhd.get("payment_method", expenses.get("payment_method"))
                        if payment:
                            response_parts.append(f"\n📱 Payment method: {payment}")
                    return "\n".join(response_parts)
                
                # Check medical
                if any(kw in query_lower for kw in ["doctor", "medical", "copay"]):
                    medical = expenses.get("medical_copays", expenses.get("medical_general", {}))
                    split = medical.get("split", "50/50")
                    threshold = 50  # Default threshold
                    
                    # Check for 60/40 split
                    if "60" in split:
                        father_share = round(amount * 0.6, 2)
                        mother_share = round(amount * 0.4, 2)
                        
                        response_parts.append(f"Your medical expenses are split **{split}** (Father 60% / Mother 40%).")
                        response_parts.append(f"\n**${amount} breakdown:**")
                        response_parts.append(f"- Father's share (60%): **${father_share}**")
                        response_parts.append(f"- Mother's share (40%): **${mother_share}**")
                        
                        if self.user_role_label == "MOTHER":
                            response_parts.append(f"\n{self.other_parent_name} owes you **${father_share}**.")
                        else:
                            response_parts.append(f"\nYou owe {self.other_parent_name} **${father_share}**.")
                    else:
                        # 50/50 split
                        # Parse threshold from agreement if present
                        threshold_text = str(medical.get("threshold", ""))
                        if "$50" in threshold_text or "50" in threshold_text:
                            threshold = 50
                        
                        half = round(amount / 2, 2)
                        
                        if amount > threshold:
                            response_parts.append(f"Your agreement states that medical copays over ${threshold} are split {split}.")
                            response_parts.append(f"\n**${amount} ÷ 2 = ${half}**")
                            response_parts.append(f"\n{self.other_parent_name} should send you **${half}** per your agreement.")
                            
                            # Add payment method if available
                            payment_method = medical.get("payment_method", expenses.get("payment_method"))
                            if payment_method:
                                response_parts.append(f"\n📱 Payment method: {payment_method}")
                        else:
                            response_parts.append(f"Since ${amount} is under the ${threshold} threshold, this copay is covered by the parent at the appointment.")
                else:
                    # General expense
                    half = round(amount / 2, 2)
                    response_parts.append(f"For a 50/50 split: **${amount} ÷ 2 = ${half}** each.")
        
        # Travel questions
        elif any(kw in query_lower for kw in ["trip", "travel", "disney", "vacation"]):
            travel = self.agreement.get("travel", {})
            domestic = travel.get("domestic", {})
            
            response_parts.append("That sounds like fun! 🎢 Let me check your travel provisions...\n")
            
            notice = domestic.get("notice_required", "7 days advance notice")
            response_parts.append(f"**Notice Required:** {notice}")
            
            if domestic.get("itinerary_required"):
                response_parts.append("\n**You'll need to provide:**")
                includes = domestic.get("includes", "destination, dates, contact info")
                response_parts.append(f"- {includes}")
            
            if calculations:
                response_parts.append(f"\n📅 {calculations}")
            
            # Check for children with allergies
            for child in self.children:
                allergies = child.get("allergies")
                if allergies:
                    response_parts.append(f"\n⚠️ Don't forget - {child.get('nickname', child.get('name'))} has allergies to: {', '.join(allergies)}. Pack any necessary medication!")
        
        # Schedule/whose week questions
        elif any(kw in query_lower for kw in ["schedule", "whose week", "my week", "when", "weekend", "my weekend"]):
            schedule = self.agreement.get("parenting_schedule", {})
            physical = self.agreement.get("physical_custody", {})
            
            week_info = self.toolkit.dates.get_week_number()
            today = datetime.now()
            
            response_parts.append(f"📅 Today is **{today.strftime('%A, %B %d')}** (week {week_info['week_number']}, {week_info['week_type']} week).\n")
            
            regular = schedule.get("regular_schedule", {})
            schedule_type = regular.get("type", physical.get("arrangement", ""))
            
            # Handle alternating weeks
            if "alternating week" in schedule_type.lower():
                father_weeks = regular.get("father_weeks", "")
                if week_info["is_odd_week"] and "odd" in father_weeks.lower():
                    if self.user_role_label == "FATHER":
                        response_parts.append("This is **your** parenting week! 👨‍👧‍👦")
                    else:
                        response_parts.append(f"This is **{self.other_parent_name}'s** parenting week.")
                else:
                    if self.user_role_label == "MOTHER":
                        response_parts.append("This is **your** parenting week! 👩‍👧‍👦")
                    else:
                        response_parts.append(f"This is **{self.other_parent_name}'s** parenting week.")
            
            # Handle primary custody with visitation (Johnson style)
            elif "primary" in schedule_type.lower() or "visitation" in schedule_type.lower():
                # Determine which weekend of the month
                day_of_month = today.day
                first_of_month = today.replace(day=1)
                first_day_weekday = first_of_month.weekday()  # 0=Monday
                
                # Calculate which Friday/weekend this is
                # Find first Friday of month
                days_until_friday = (4 - first_day_weekday) % 7
                first_friday = 1 + days_until_friday
                
                # Which weekend of month are we in?
                if today.weekday() >= 4:  # Friday or weekend
                    current_weekend_friday = today.day - (today.weekday() - 4)
                else:
                    # Find next Friday
                    current_weekend_friday = today.day + (4 - today.weekday())
                
                weekend_number = ((current_weekend_friday - first_friday) // 7) + 1
                
                father_weekends = regular.get("father_weekends", "1st, 3rd, and 5th")
                
                is_father_weekend = weekend_number in [1, 3, 5] if "1st, 3rd" in father_weekends else weekend_number % 2 == 1
                
                response_parts.append(f"This is the **{['1st', '2nd', '3rd', '4th', '5th'][weekend_number-1]}** weekend of the month.\n")
                
                if is_father_weekend:
                    if self.user_role_label == "FATHER":
                        response_parts.append("This is **your** visitation weekend! 👨‍👦")
                        start = regular.get("weekend_start", "Friday 5:00 PM")
                        end = regular.get("weekend_end", "Sunday 5:00 PM")
                        response_parts.append(f"You have {self.children_names[0] if self.children_names else 'your child'} from {start} through {end}.")
                    else:
                        response_parts.append(f"This is **{self.other_parent_name}'s** visitation weekend.")
                else:
                    if self.user_role_label == "MOTHER":
                        response_parts.append(f"{self.children_names[0] if self.children_names else 'Your child'} stays with you this weekend. 👩‍👦")
                    else:
                        response_parts.append(f"This is not your visitation weekend - {self.children_names[0] if self.children_names else 'your child'} stays with {self.other_parent_name}.")
                
                # Mention Wednesday visit
                wed_visit = regular.get("wednesday_visit")
                if wed_visit:
                    response_parts.append(f"\n📝 Don't forget your Wednesday dinner visit: {wed_visit}")
        
        # Holiday questions
        elif any(kw in query_lower for kw in ["holiday", "christmas", "thanksgiving", "birthday"]):
            holidays = self.agreement.get("holidays", {})
            year_info = self.toolkit.dates.get_current_year_parity()
            
            response_parts.append(f"📅 {year_info['year']} is an **{year_info['year_type']} year** for holiday purposes.\n")
            
            # Find the relevant holiday
            for holiday_name, holiday_info in holidays.items():
                if holiday_name.lower() in query_lower or any(part in query_lower for part in holiday_name.lower().split('_')):
                    response_parts.append(f"**{holiday_name.replace('_', ' ').title()}:**")
                    if isinstance(holiday_info, dict):
                        for key, value in holiday_info.items():
                            response_parts.append(f"- {key.replace('_', ' ').title()}: {value}")
                    else:
                        response_parts.append(f"{holiday_info}")
                    break
        
        # Default - not found in agreement
        else:
            response_parts.append(f"Hmm, I'm not finding specific information about that in your agreement. 🤔")
            response_parts.append(f"\nI can help you with questions about:")
            response_parts.append("- 📍 Pickup/exchange locations and times")
            response_parts.append("- 💰 Cost splitting and reimbursements")
            response_parts.append("- 📅 Schedules and whose week it is")
            response_parts.append("- 🎄 Holiday arrangements")
            response_parts.append("- ✈️ Travel requirements")
            response_parts.append("- 🏥 Medical information and costs")
            response_parts.append(f"\nWhat would you like to know, {self.user_name}?")
        
        return "\n".join(response_parts)
    
    def get_agreement_summary(self) -> str:
        """Get a brief summary of the agreement for display"""
        parties = self.agreement.get("parties", {})
        children = self.agreement.get("children", [])
        physical = self.agreement.get("physical_custody", {})
        
        pet_name = parties.get("petitioner", {}).get("name", "Unknown")
        res_name = parties.get("respondent", {}).get("name", "Unknown")
        
        children_str = ", ".join([f"{c.get('nickname', c.get('name'))} ({c.get('age')})" for c in children])
        
        return f"""
📋 **{self.agreement.get('title', 'Custody Agreement')}**

👨 Petitioner: {pet_name} ({parties.get('petitioner', {}).get('role', '')})
👩 Respondent: {res_name} ({parties.get('respondent', {}).get('role', '')})
👶 Children: {children_str}
📊 Custody Type: {physical.get('type', 'Not specified')}
📅 Effective: {self.agreement.get('effective_date', 'N/A')} to {self.agreement.get('expiration_date', 'N/A')}
"""
