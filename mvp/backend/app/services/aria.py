"""
ARIA Service - AI-Powered Sentiment Analysis
Analyzes parent-to-parent communication and helps prevent conflict.

Two-tier analysis:
1. Fast regex-based pattern matching for obvious cases
2. Deep Claude AI analysis for nuanced detection
"""

import re
import json
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta
import anthropic
from openai import OpenAI
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.message import Message, MessageFlag


class ToxicityLevel(Enum):
    """Levels of detected toxicity"""
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    SEVERE = "severe"


class ToxicityCategory(Enum):
    """Categories of toxic communication patterns"""
    PROFANITY = "profanity"
    INSULT = "insult"
    HOSTILITY = "hostility"
    SARCASM = "sarcasm"
    BLAME = "blame"
    DISMISSIVE = "dismissive"
    THREATENING = "threatening"
    MANIPULATION = "manipulation"
    PASSIVE_AGGRESSIVE = "passive_aggressive"
    ALL_CAPS = "all_caps"


@dataclass
class SentimentAnalysis:
    """Result of ARIA sentiment analysis"""
    original_message: str
    toxicity_level: ToxicityLevel
    toxicity_score: float  # 0.0 to 1.0
    categories: List[ToxicityCategory]
    triggers: List[str]
    explanation: str
    suggestion: Optional[str]
    is_flagged: bool
    timestamp: datetime


class ARIAService:
    """
    ARIA - AI-Powered Relationship Intelligence Assistant
    Analyzes messages for toxicity and offers constructive alternatives.
    """

    # Pattern definitions for toxicity detection
    PROFANITY_PATTERNS = [
        r'\bfuck\w*\b', r'\bshit\w*\b', r'\bass\b', r'\basshole\b',
        r'\bbitch\w*\b', r'\bdamn\w*\b', r'\bhell\b', r'\bcrap\b',
        r'\bpiss\w*\b', r'\bbastard\b', r'\bwtf\b', r'\bstfu\b',
    ]

    INSULT_PATTERNS = [
        r'\bstupid\b', r'\bidiot\b', r'\bdumb\b', r'\bmoron\b',
        r'\bpathetic\b', r'\bloser\b', r'\bworthless\b', r'\buseless\b',
        r'\bincompetent\b', r'\bcrazy\b', r'\binsane\b', r'\bpsycho\b',
        r'\bterrible\s+(mother|father|parent)\b', r'\bbad\s+(mother|father|parent)\b',
    ]

    HOSTILITY_PATTERNS = [
        r'\bshut\s*up\b', r'\bleave\s+me\s+alone\b', r'\bget\s+out\b',
        r'\bi\s+hate\s+you\b', r'\bhate\s+you\b', r'\bcan\'?t\s+stand\s+you\b',
        r'\byou\s+never\b', r'\byou\s+always\b', r'\bevery\s+time\s+you\b',
        r'\byour\s+fault\b', r'\bblame\s+you\b', r"\bdon'?t\s+care\b",
        r'\bwhatever\b', r'\bfigure\s+it\s+out\b',
        r'\bgo\s+to\s+hell\b', r'\bfuck\s+off\b', r'\bget\s+lost\b',
        r'\bstop\s+bothering\s+me\b', r'\bwaste\s+of\s+time\b',
        r'\byou\'?re\s+(the\s+)?worst\b', r'\bcan\'?t\s+believe\s+you\b',
    ]

    DISMISSIVE_PATTERNS = [
        r'\bnot\s+my\s+problem\b', r'\bdeal\s+with\s+it\b',
        r"\bthat'?s\s+your\s+(problem|issue)\b", r'\bgo\s+look\b',
        r'\bi\s+told\s+you\b', r'\bi\s+already\s+said\b',
        r'\bhow\s+many\s+times\b', r'\bfor\s+the\s+last\s+time\b',
    ]

    PASSIVE_AGGRESSIVE_PATTERNS = [
        r'\bfine\.?\s*$', r'\bwhatever\s+you\s+say\b', r'\bif\s+you\s+say\s+so\b',
        r'\bsure\.?\s*$', r'\bok\s+then\.?\s*$', r'\bnice\s+try\b',
        r'\bgood\s+(luck|job)\s+with\s+that\b', r'\bthanks\s+for\s+nothing\b',
    ]

    BLAME_PATTERNS = [
        r'\byou\s+made\s+me\b', r'\byou\s+caused\b', r'\bbecause\s+of\s+you\b',
        r'\bif\s+you\s+had\s+(just\s+)?(\w+)\b', r'\byou\s+should\s+have\b',
        r'\bthis\s+is\s+(all\s+)?your\s+fault\b', r'\byou\s+ruined\b',
    ]

    THREATENING_PATTERNS = [
        # Legal threats
        r'\bi\'?ll?\s+(get|take)\s+(my\s+)?lawyer\b', r'\bsee\s+you\s+in\s+court\b',
        r'\btake\s+you\s+to\s+court\b', r'\bfile\s+a\s+motion\b',
        # General threats
        r'\byou\'?ll?\s+(be\s+)?sorry\b', r'\byou\'?ll?\s+regret\b',
        r'\bi\'?ll?\s+make\s+sure\b', r'\bwatch\s+(out|yourself)\b',
        r'\bdon\'?t\s+test\s+me\b', r'\bor\s+else\b',
        # Physical violence (CRITICAL)
        r'\bi\'?ll?\s+kill\s+you\b', r'\bkill\s+you\b', r'\bwanna\s+kill\b',
        r'\bi\'?ll?\s+hurt\s+you\b', r'\bhurt\s+you\b', r'\bharm\s+you\b',
        r'\bi\'?ll?\s+beat\s+you\b', r'\bbeat\s+you\s+up\b',
        r'\bi\'?ll?\s+destroy\s+you\b', r'\bcome\s+after\s+you\b',
        r'\byou\'?re\s+dead\b', r'\byou\'?re\s+gonna\s+pay\b',
        # Intimidation
        r'\bwatch\s+your\s+back\b', r'\byou\s+better\b',
        r'\bi\s+know\s+where\s+you\s+live\b', r'\bi\'?ll?\s+find\s+you\b',
        # Custody threats
        r'\byou\'?ll?\s+never\s+see\s+(the\s+)?kids?\b',
        r'\btake\s+(away\s+)?the\s+kids?\b', r'\bi\'?ll?\s+get\s+full\s+custody\b',
    ]

    # Suggested phrase replacements
    SUGGESTIONS = {
        # Profanity and hostility
        r'\bwhat\s+type\s+of\s+stupid\s+shit\s+is\s+that\b': "I'm confused by this approach",
        r'\bshut\s*up\b': "I need a moment to process this",
        r'\bfuck\s+off\b': "I need some space right now",
        r'\bgo\s+to\s+hell\b': "I'm very upset about this",
        r'\bget\s+lost\b': "I need to step away from this conversation",

        # Hate and contempt
        r'\bi\s+hate\s+you\b': "I'm very frustrated with this situation",
        r'\bhate\s+you\b': "I'm having difficulty with this",
        r'\bcan\'?t\s+stand\s+you\b': "I'm finding this challenging",

        # Absolutes (never/always)
        r'\byou\s+never\b': "I've noticed that sometimes",
        r'\byou\s+always\b': "I've noticed that often",
        r'\bevery\s+time\s+you\b': "I've observed that when",

        # Dismissive
        r'\bwhatever\b': "I understand your perspective",
        r'\bfigure\s+it\s+out\b': "let me know if you need clarification",
        r'\bnot\s+my\s+problem\b': "this is something we should discuss",
        r'\bdeal\s+with\s+it\b': "let's work on this together",
        r'\bgo\s+look\b': "you can find it in our agreement/schedule",

        # Blame
        r'\byour\s+fault\b': "this situation occurred",
        r'\bblame\s+you\b': "this needs to be addressed",

        # Insults
        r'\bstupid\b': "confusing",
        r'\bidiot\b': "",
        r'\bmoron\b': "",
        r'\bdumb\b': "unclear",

        # Threats (these should be flagged as severe)
        r'\bi\'?ll?\s+kill\s+you\b': "I am extremely upset",
        r'\bkill\s+you\b': "I am extremely upset",
        r'\bhurt\s+you\b': "I am very angry",
        r'\byou\'?ll?\s+never\s+see\s+(the\s+)?kids?\b': "We need to discuss the custody schedule",
    }

    def __init__(self):
        """Initialize ARIA service"""
        self.compiled_patterns = self._compile_patterns()

    def _compile_patterns(self) -> Dict[ToxicityCategory, List[re.Pattern]]:
        """Pre-compile regex patterns for performance"""
        return {
            ToxicityCategory.PROFANITY: [
                re.compile(p, re.IGNORECASE) for p in self.PROFANITY_PATTERNS
            ],
            ToxicityCategory.INSULT: [
                re.compile(p, re.IGNORECASE) for p in self.INSULT_PATTERNS
            ],
            ToxicityCategory.HOSTILITY: [
                re.compile(p, re.IGNORECASE) for p in self.HOSTILITY_PATTERNS
            ],
            ToxicityCategory.DISMISSIVE: [
                re.compile(p, re.IGNORECASE) for p in self.DISMISSIVE_PATTERNS
            ],
            ToxicityCategory.PASSIVE_AGGRESSIVE: [
                re.compile(p, re.IGNORECASE) for p in self.PASSIVE_AGGRESSIVE_PATTERNS
            ],
            ToxicityCategory.BLAME: [
                re.compile(p, re.IGNORECASE) for p in self.BLAME_PATTERNS
            ],
            ToxicityCategory.THREATENING: [
                re.compile(p, re.IGNORECASE) for p in self.THREATENING_PATTERNS
            ],
        }

    def analyze_message(
        self,
        message: str,
        context: Optional[List[str]] = None
    ) -> SentimentAnalysis:
        """
        Analyze a message for toxicity.

        Args:
            message: The message to analyze
            context: Optional list of recent messages for context

        Returns:
            SentimentAnalysis with results and suggestions
        """
        triggers = []
        categories = []

        # Check for ALL CAPS (shouting)
        words = message.split()
        if words:
            caps_words = sum(1 for w in words if w.isupper() and len(w) > 2)
            if caps_words / len(words) > 0.5:
                categories.append(ToxicityCategory.ALL_CAPS)
                triggers.append("EXCESSIVE CAPS")

        # Check each category of patterns
        for category, patterns in self.compiled_patterns.items():
            for pattern in patterns:
                matches = pattern.findall(message)
                if matches:
                    if category not in categories:
                        categories.append(category)
                    triggers.extend(matches)

        # Calculate toxicity score and level
        toxicity_score = self._calculate_score(categories, triggers)
        toxicity_level = self._get_level(toxicity_score)

        # Generate explanation
        explanation = self._generate_explanation(categories)

        # Generate suggestion if needed
        suggestion = None
        if toxicity_level != ToxicityLevel.NONE:
            suggestion = self._generate_suggestion(message, categories)

        return SentimentAnalysis(
            original_message=message,
            toxicity_level=toxicity_level,
            toxicity_score=toxicity_score,
            categories=categories,
            triggers=list(set(triggers)),  # Deduplicate
            explanation=explanation,
            suggestion=suggestion,
            is_flagged=toxicity_level != ToxicityLevel.NONE,
            timestamp=datetime.utcnow()
        )

    def _calculate_score(
        self,
        categories: List[ToxicityCategory],
        triggers: List[str]
    ) -> float:
        """
        Calculate toxicity score from 0.0 to 1.0

        IMPORTANT: This is for COURT DOCUMENTATION.
        We use stricter scoring because all communication may be reviewed by a judge.
        """
        if not categories:
            return 0.0

        # Weight by category severity (stricter for court context)
        weights = {
            ToxicityCategory.THREATENING: 0.9,      # Physical threats = SEVERE
            ToxicityCategory.HOSTILITY: 0.5,        # "I hate you" inappropriate for court
            ToxicityCategory.PROFANITY: 0.4,        # Swearing = unprofessional
            ToxicityCategory.INSULT: 0.4,           # Name-calling = unprofessional
            ToxicityCategory.BLAME: 0.3,            # Blame = conflict escalation
            ToxicityCategory.DISMISSIVE: 0.25,      # Dismissive = non-collaborative
            ToxicityCategory.PASSIVE_AGGRESSIVE: 0.25,  # PA = conflict escalation
            ToxicityCategory.SARCASM: 0.25,         # Sarcasm = unprofessional
            ToxicityCategory.ALL_CAPS: 0.2,         # Shouting = aggressive
            ToxicityCategory.MANIPULATION: 0.4,     # Manipulation = bad faith
        }

        score = sum(weights.get(cat, 0.2) for cat in set(categories))

        # Add bonus for multiple triggers (indicates pattern)
        score += len(triggers) * 0.08

        return min(1.0, score)

    def _get_level(self, score: float) -> ToxicityLevel:
        """Convert score to toxicity level"""
        if score == 0:
            return ToxicityLevel.NONE
        elif score < 0.2:
            return ToxicityLevel.LOW
        elif score < 0.4:
            return ToxicityLevel.MEDIUM
        elif score < 0.7:
            return ToxicityLevel.HIGH
        else:
            return ToxicityLevel.SEVERE

    def _generate_explanation(self, categories: List[ToxicityCategory]) -> str:
        """
        Generate human-readable explanation.

        Emphasizes that this is court documentation to encourage professional communication.
        """
        if not categories:
            return "This message is appropriate for court documentation. Professional and focused on the children's needs."

        explanations = {
            ToxicityCategory.THREATENING: "contains threatening language (completely inappropriate for court records and may have legal consequences)",
            ToxicityCategory.HOSTILITY: "has hostile language that judges view negatively",
            ToxicityCategory.PROFANITY: "contains profanity (unprofessional in court documentation)",
            ToxicityCategory.INSULT: "includes insulting language (reflects poorly in court)",
            ToxicityCategory.BLAME: "places blame on the other parent (courts prefer collaborative language)",
            ToxicityCategory.DISMISSIVE: "appears dismissive (courts want to see good-faith communication)",
            ToxicityCategory.PASSIVE_AGGRESSIVE: "has passive-aggressive tone (judges notice this)",
            ToxicityCategory.SARCASM: "contains sarcasm (inappropriate for legal documentation)",
            ToxicityCategory.ALL_CAPS: "uses all caps (appears aggressive in court records)",
            ToxicityCategory.MANIPULATION: "appears manipulative (bad faith in court's eyes)",
        }

        issues = [explanations.get(cat, str(cat)) for cat in set(categories)]

        if len(issues) == 1:
            return f"⚠️ Court Context Warning: This message {issues[0]}."
        else:
            return f"⚠️ Court Context Warning: This message {', '.join(issues[:-1])}, and {issues[-1]}."

    def _generate_suggestion(
        self,
        message: str,
        categories: List[ToxicityCategory]
    ) -> str:
        """Generate a gentler alternative message"""
        suggestion = message

        # Apply replacements
        for pattern, replacement in self.SUGGESTIONS.items():
            suggestion = re.sub(pattern, replacement, suggestion, flags=re.IGNORECASE)

        # Remove profanity that wasn't caught by replacements
        for pattern in self.PROFANITY_PATTERNS:
            suggestion = re.sub(pattern, '', suggestion, flags=re.IGNORECASE)

        # Clean up extra spaces
        suggestion = re.sub(r'\s+', ' ', suggestion).strip()

        # If ALL CAPS, convert to normal case
        if ToxicityCategory.ALL_CAPS in categories:
            sentences = suggestion.split('. ')
            suggestion = '. '.join(s.capitalize() if s else s for s in sentences)

        # If suggestion is too short or same as original, provide court-appropriate template
        if len(suggestion) < 5 or suggestion.lower() == message.lower():
            if ToxicityCategory.THREATENING in categories:
                # Threats require immediate de-escalation
                suggestion = "I need to take some time to cool down before we continue this discussion. Let's focus on what's best for the children."
            elif ToxicityCategory.HOSTILITY in categories:
                suggestion = "I'm frustrated with this situation. Can we please discuss this calmly and focus on our children's needs?"
            elif ToxicityCategory.DISMISSIVE in categories:
                suggestion = "I understand you have questions. Let me know what specific information would be helpful."
            elif ToxicityCategory.BLAME in categories:
                suggestion = "I think there's been a miscommunication. Let's work together to resolve this."
            elif ToxicityCategory.PROFANITY in categories or ToxicityCategory.INSULT in categories:
                suggestion = "I'm upset about this situation. Can we please keep our communication professional?"
            else:
                suggestion = "Let's approach this calmly and professionally. What do you need to know?"

        return suggestion

    def get_intervention_message(self, analysis: SentimentAnalysis) -> Dict[str, Any]:
        """
        Format ARIA's intervention for the frontend.

        Args:
            analysis: Sentiment analysis result

        Returns:
            Formatted intervention message data
        """
        if not analysis.is_flagged:
            return {}

        level_headers = {
            ToxicityLevel.LOW: "Professional Communication Note",
            ToxicityLevel.MEDIUM: "Court Documentation Warning",
            ToxicityLevel.HIGH: "IMPORTANT: Court Review Alert",
            ToxicityLevel.SEVERE: "CRITICAL: Inappropriate for Court Records",
        }

        # Court-focused reminders based on severity
        court_reminders = {
            ToxicityLevel.LOW: "Reminder: All messages may be reviewed by a judge. Keep communication professional.",
            ToxicityLevel.MEDIUM: "Warning: This language could reflect poorly in court. Judges favor collaborative, child-focused communication.",
            ToxicityLevel.HIGH: "This message could seriously damage your case in court. Judges view hostile communication negatively.",
            ToxicityLevel.SEVERE: "CRITICAL: This type of communication can have serious legal consequences and harm your custody case.",
        }

        return {
            "level": analysis.toxicity_level.value,
            "header": level_headers.get(analysis.toxicity_level, "Communication Alert"),
            "explanation": analysis.explanation,
            "original_message": analysis.original_message,
            "suggestion": analysis.suggestion,
            "toxicity_score": analysis.toxicity_score,
            "categories": [cat.value for cat in analysis.categories],
            "court_reminder": court_reminders.get(analysis.toxicity_level, "Remember, this is court documentation."),
            "child_reminder": "Focus on what's best for your children. The court is watching how you communicate.",
        }

    async def analyze_with_ai(
        self,
        message: str,
        case_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Deep AI-powered analysis using Claude for nuanced detection.

        This is more sophisticated than regex patterns and can detect:
        - Context-dependent toxicity
        - Subtle manipulation
        - Cultural/situational inappropriateness

        Args:
            message: Message content to analyze
            case_context: Optional context (children names, agreement details, etc.)

        Returns:
            AI analysis result with detailed feedback
        """
        try:
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

            # Build context
            context_info = ""
            if case_context and "children" in case_context:
                children = case_context["children"]
                if children:
                    names = ", ".join([c.get("first_name", "") for c in children if c.get("first_name")])
                    context_info = f"\n\nContext: Communication about co-parenting {names}."

            # AI system prompt
            system_prompt = """You are ARIA, an AI assistant for co-parenting communication in CommonGround.

CRITICAL CONTEXT: All messages are COURT DOCUMENTATION that may be reviewed by judges, attorneys, and guardians ad litem. This is NOT private messaging - it's legal evidence.

Your role is to ensure communication is appropriate for court review and focused on children's welfare.

Analyze messages for COURT-INAPPROPRIATE content:
- Physical threats or violence (CRITICAL - may have criminal implications)
- Hostility, contempt, or hate speech (judges view very negatively)
- Profanity or insults (unprofessional in legal context)
- Blame, manipulation, or guilt-tripping (bad faith communication)
- Dismissiveness or passive-aggression (non-collaborative)
- All caps/shouting (appears aggressive)
- Anything a judge would view as poor co-parenting

Rate toxicity from 0.0 (court-appropriate) to 1.0 (completely inappropriate for legal records).

Be STRICT because:
- Judges notice communication patterns
- Hostile messages can affect custody decisions
- Threats can have legal consequences
- Professional communication shows good faith

Provide:
1. Toxicity score (be strict - court standard, not casual messaging)
2. Categories of issues detected
3. Specific problematic phrases
4. Why this is inappropriate for court documentation
5. 1-2 professional, court-appropriate alternatives

Focus: Help parents communicate like they're talking in front of a judge."""

            # Analysis prompt
            prompt = f"""Analyze this co-parenting message:{context_info}

MESSAGE: "{message}"

Respond in JSON format:
{{
    "toxicity_score": 0.0-1.0,
    "categories": ["list of issues"],
    "triggers": ["specific problematic phrases"],
    "explanation": "why this is problematic",
    "suggestions": ["alternative 1", "alternative 2"]
}}"""

            # Call Claude API
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse response
            response_text = response.content[0].text
            json_match = re.search(r'\{[\s\S]*\}', response_text)

            if json_match:
                analysis = json.loads(json_match.group())
            else:
                analysis = json.loads(response_text)

            return {
                "ai_powered": True,
                "toxicity_score": float(analysis.get("toxicity_score", 0.0)),
                "categories": analysis.get("categories", []),
                "triggers": analysis.get("triggers", []),
                "explanation": analysis.get("explanation", ""),
                "suggestions": analysis.get("suggestions", []),
                "model": "claude-sonnet-4"
            }

        except Exception as e:
            # Fallback to regex analysis
            print(f"AI analysis failed: {e}")
            regex_analysis = self.analyze_message(message)
            return {
                "ai_powered": False,
                "toxicity_score": regex_analysis.toxicity_score,
                "categories": [cat.value for cat in regex_analysis.categories],
                "triggers": regex_analysis.triggers,
                "explanation": regex_analysis.explanation,
                "suggestions": [regex_analysis.suggestion] if regex_analysis.suggestion else [],
                "error": str(e)
            }

    async def analyze_with_openai(
        self,
        message: str,
        case_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Deep AI-powered analysis using OpenAI GPT-4 for nuanced detection.

        Alternative to Claude - uses OpenAI's GPT-4 model.

        Args:
            message: Message content to analyze
            case_context: Optional context (children names, agreement details, etc.)

        Returns:
            AI analysis result with detailed feedback
        """
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            # Build context
            context_info = ""
            if case_context and "children" in case_context:
                children = case_context["children"]
                if children:
                    names = ", ".join([c.get("first_name", "") for c in children if c.get("first_name")])
                    context_info = f"\n\nContext: Communication about co-parenting {names}."

            # System prompt
            system_prompt = """You are ARIA, an AI assistant for co-parenting communication in CommonGround.

CRITICAL CONTEXT: All messages are COURT DOCUMENTATION that may be reviewed by judges, attorneys, and guardians ad litem. This is NOT private messaging - it's legal evidence.

Your role is to ensure communication is appropriate for court review and focused on children's welfare.

Analyze messages for COURT-INAPPROPRIATE content:
- Physical threats or violence (CRITICAL - may have criminal implications)
- Hostility, contempt, or hate speech (judges view very negatively)
- Profanity or insults (unprofessional in legal context)
- Blame, manipulation, or guilt-tripping (bad faith communication)
- Dismissiveness or passive-aggression (non-collaborative)
- All caps/shouting (appears aggressive)
- Anything a judge would view as poor co-parenting

Rate toxicity from 0.0 (court-appropriate) to 1.0 (completely inappropriate for legal records).

Be STRICT because:
- Judges notice communication patterns
- Hostile messages can affect custody decisions
- Threats can have legal consequences
- Professional communication shows good faith

Provide:
1. Toxicity score (be strict - court standard, not casual messaging)
2. Categories of issues detected
3. Specific problematic phrases
4. Why this is inappropriate for court documentation
5. 1-2 professional, court-appropriate alternatives

Focus: Help parents communicate like they're talking in front of a judge.

Respond in JSON format only."""

            # Analysis prompt
            prompt = f"""Analyze this co-parenting message:{context_info}

MESSAGE: "{message}"

Respond in JSON format:
{{
    "toxicity_score": 0.0-1.0,
    "categories": ["list of issues"],
    "triggers": ["specific problematic phrases"],
    "explanation": "why this is problematic",
    "suggestions": ["alternative 1", "alternative 2"]
}}"""

            # Call OpenAI API
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1024,
                response_format={"type": "json_object"}
            )

            # Parse response
            response_text = response.choices[0].message.content
            analysis = json.loads(response_text)

            return {
                "ai_powered": True,
                "provider": "openai",
                "toxicity_score": float(analysis.get("toxicity_score", 0.0)),
                "categories": analysis.get("categories", []),
                "triggers": analysis.get("triggers", []),
                "explanation": analysis.get("explanation", ""),
                "suggestions": analysis.get("suggestions", []),
                "model": "gpt-4"
            }

        except Exception as e:
            # Fallback to regex analysis
            print(f"OpenAI analysis failed: {e}")
            regex_analysis = self.analyze_message(message)
            return {
                "ai_powered": False,
                "provider": "regex",
                "toxicity_score": regex_analysis.toxicity_score,
                "categories": [cat.value for cat in regex_analysis.categories],
                "triggers": regex_analysis.triggers,
                "explanation": regex_analysis.explanation,
                "suggestions": [regex_analysis.suggestion] if regex_analysis.suggestion else [],
                "error": str(e)
            }

    async def calculate_good_faith_metrics(
        self,
        db: AsyncSession,
        user_id: str,
        case_id: str,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """
        Calculate good faith communication metrics for a user.

        Tracks:
        - Total messages sent
        - How many were flagged by ARIA
        - Flag rate percentage
        - Average toxicity score
        - Suggestion acceptance rate
        - Communication trend (improving/stable/worsening)

        Args:
            db: Database session
            user_id: User to analyze
            case_id: Case context
            period_days: Analysis period (default: 30 days)

        Returns:
            Comprehensive good faith metrics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=period_days)

        # Get all messages from user in period
        result = await db.execute(
            select(Message).where(
                and_(
                    Message.sender_id == user_id,
                    Message.case_id == case_id,
                    Message.sent_at >= cutoff_date
                )
            )
        )
        messages = result.scalars().all()

        if not messages:
            return {
                "user_id": user_id,
                "case_id": case_id,
                "period_days": period_days,
                "total_messages": 0,
                "compliance_score": "insufficient_data"
            }

        # Get flagged messages
        flag_result = await db.execute(
            select(MessageFlag)
            .join(Message, MessageFlag.message_id == Message.id)
            .where(
                and_(
                    Message.sender_id == user_id,
                    Message.case_id == case_id,
                    Message.sent_at >= cutoff_date
                )
            )
        )
        flags = flag_result.scalars().all()

        flagged_count = len(flags)
        total = len(messages)
        flag_rate = (flagged_count / total * 100) if total > 0 else 0

        # Calculate average toxicity
        toxicity_scores = [f.toxicity_score for f in flags if f.toxicity_score]
        avg_toxicity = sum(toxicity_scores) / len(toxicity_scores) if toxicity_scores else 0.0

        # Suggestion acceptance rates
        accepted = sum(1 for f in flags if f.user_action == "accepted")
        modified = sum(1 for f in flags if f.user_action == "modified")
        rejected = sum(1 for f in flags if f.user_action == "rejected")
        sent_anyway = sum(1 for f in flags if f.user_action == "sent_anyway")

        total_interventions = accepted + modified + rejected + sent_anyway
        acceptance_rate = (accepted / total_interventions * 100) if total_interventions > 0 else 0

        # Trend analysis (first half vs second half)
        midpoint = cutoff_date + timedelta(days=period_days // 2)
        first_half = [f for f in flags if f.created_at < midpoint]
        second_half = [f for f in flags if f.created_at >= midpoint]

        first_rate = len(first_half) / (total / 2) if total > 0 else 0
        second_rate = len(second_half) / (total / 2) if total > 0 else 0

        if second_rate < first_rate * 0.8:
            trend = "improving"
        elif second_rate > first_rate * 1.2:
            trend = "worsening"
        else:
            trend = "stable"

        # Compliance score
        if acceptance_rate >= 70 and flag_rate < 20:
            compliance = "excellent"
        elif acceptance_rate >= 50 and flag_rate < 40:
            compliance = "good"
        elif acceptance_rate >= 30 and flag_rate < 60:
            compliance = "fair"
        else:
            compliance = "needs_improvement"

        return {
            "user_id": user_id,
            "case_id": case_id,
            "period_start": cutoff_date.isoformat(),
            "period_end": datetime.utcnow().isoformat(),
            "total_messages": total,
            "flagged_messages": flagged_count,
            "flag_rate": round(flag_rate, 2),
            "suggestions_accepted": accepted,
            "suggestions_modified": modified,
            "suggestions_rejected": rejected,
            "sent_anyway": sent_anyway,
            "acceptance_rate": round(acceptance_rate, 2),
            "average_toxicity": round(avg_toxicity, 3),
            "trend": trend,
            "compliance_score": compliance
        }

    async def get_conversation_health(
        self,
        db: AsyncSession,
        case_id: str,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """
        Get overall conversation health for a case (both parents).

        Args:
            db: Database session
            case_id: Case to analyze
            period_days: Analysis period

        Returns:
            Overall health metrics for the case
        """
        cutoff_date = datetime.utcnow() - timedelta(days=period_days)

        # Get all messages
        result = await db.execute(
            select(Message).where(
                and_(
                    Message.case_id == case_id,
                    Message.sent_at >= cutoff_date
                )
            )
        )
        messages = result.scalars().all()

        if not messages:
            return {
                "case_id": case_id,
                "health_status": "insufficient_data",
                "total_messages": 0
            }

        # Get unique senders
        senders = list(set(msg.sender_id for msg in messages))

        # Calculate per-parent metrics
        parent_metrics = {}
        for sender_id in senders:
            metrics = await self.calculate_good_faith_metrics(
                db, sender_id, case_id, period_days
            )
            parent_metrics[sender_id] = metrics

        # Overall statistics
        total_flagged = sum(m["flagged_messages"] for m in parent_metrics.values())
        overall_flag_rate = (total_flagged / len(messages) * 100) if messages else 0

        avg_scores = [m["average_toxicity"] for m in parent_metrics.values() if m["average_toxicity"] > 0]
        overall_toxicity = sum(avg_scores) / len(avg_scores) if avg_scores else 0

        # Health determination
        if overall_flag_rate < 15 and overall_toxicity < 0.3:
            health = "excellent"
        elif overall_flag_rate < 30 and overall_toxicity < 0.5:
            health = "good"
        elif overall_flag_rate < 50 and overall_toxicity < 0.7:
            health = "fair"
        else:
            health = "concerning"

        return {
            "case_id": case_id,
            "period_days": period_days,
            "total_messages": len(messages),
            "total_flagged": total_flagged,
            "overall_flag_rate": round(overall_flag_rate, 2),
            "overall_toxicity": round(overall_toxicity, 3),
            "health_status": health,
            "parent_metrics": parent_metrics,
            "last_activity": max(msg.sent_at for msg in messages).isoformat() if messages else None
        }


# Singleton instance
aria_service = ARIAService()
