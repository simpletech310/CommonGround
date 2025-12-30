"""
ARIA Service - AI-Powered Sentiment Analysis
Analyzes parent-to-parent communication and helps prevent conflict.
"""

import re
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
from datetime import datetime


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
        r'\bi\s+hate\s+you\b', r'\byou\s+never\b', r'\byou\s+always\b',
        r'\byour\s+fault\b', r'\bblame\s+you\b', r"\bdon'?t\s+care\b",
        r'\bwhatever\b', r'\bfigure\s+it\s+out\b',
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
        r'\bi\'?ll?\s+(get|take)\s+(my\s+)?lawyer\b', r'\bsee\s+you\s+in\s+court\b',
        r'\byou\'?ll?\s+(be\s+)?sorry\b', r'\byou\'?ll?\s+regret\b',
        r'\bi\'?ll?\s+make\s+sure\b', r'\bwatch\s+(out|yourself)\b',
        r'\bdon\'?t\s+test\s+me\b', r'\bor\s+else\b',
    ]

    # Suggested phrase replacements
    SUGGESTIONS = {
        r'\bwhat\s+type\s+of\s+stupid\s+shit\s+is\s+that\b': "I'm confused by this",
        r'\bgo\s+look\b': "you can find it in the schedule we agreed on",
        r'\byou\s+never\b': "I've noticed that sometimes",
        r'\byou\s+always\b': "I've noticed that sometimes",
        r'\bshut\s*up\b': "I need a moment before responding",
        r'\bi\s+don\'?t\s+care\b': "I need to think about this",
        r'\bstupid\b': "confusing",
        r'\bidiot\b': "",
        r'\bwhatever\b': "I understand",
        r'\bfigure\s+it\s+out\b': "let me know if you need the details",
        r'\bnot\s+my\s+problem\b': "I'm not sure how to help with that",
        r'\bdeal\s+with\s+it\b': "I hope we can work through this",
        r'\byour\s+fault\b': "this situation",
        r'\bi\s+hate\s+you\b': "I'm frustrated right now",
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
        """Calculate toxicity score from 0.0 to 1.0"""
        if not categories:
            return 0.0

        # Weight by category severity
        weights = {
            ToxicityCategory.THREATENING: 0.4,
            ToxicityCategory.PROFANITY: 0.25,
            ToxicityCategory.INSULT: 0.25,
            ToxicityCategory.HOSTILITY: 0.2,
            ToxicityCategory.BLAME: 0.15,
            ToxicityCategory.DISMISSIVE: 0.1,
            ToxicityCategory.PASSIVE_AGGRESSIVE: 0.1,
            ToxicityCategory.SARCASM: 0.1,
            ToxicityCategory.ALL_CAPS: 0.15,
        }

        score = sum(weights.get(cat, 0.1) for cat in set(categories))

        # Add bonus for multiple triggers
        score += len(triggers) * 0.05

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
        """Generate human-readable explanation"""
        if not categories:
            return "This message looks good! Clear and respectful communication."

        explanations = {
            ToxicityCategory.PROFANITY: "contains strong language",
            ToxicityCategory.INSULT: "includes words that could feel hurtful",
            ToxicityCategory.HOSTILITY: "has a confrontational tone",
            ToxicityCategory.DISMISSIVE: "might come across as dismissive",
            ToxicityCategory.PASSIVE_AGGRESSIVE: "could be seen as passive-aggressive",
            ToxicityCategory.BLAME: "places blame directly on the other person",
            ToxicityCategory.THREATENING: "contains language that could feel threatening",
            ToxicityCategory.ALL_CAPS: "uses caps which can feel like shouting",
        }

        issues = [explanations.get(cat, str(cat)) for cat in set(categories)]

        if len(issues) == 1:
            return f"This message {issues[0]}."
        else:
            return f"This message {', '.join(issues[:-1])}, and {issues[-1]}."

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

        # If suggestion is too short or same as original, provide template
        if len(suggestion) < 5 or suggestion.lower() == message.lower():
            if ToxicityCategory.DISMISSIVE in categories:
                suggestion = "I understand you have questions. Let me know what specific information would help."
            elif ToxicityCategory.HOSTILITY in categories:
                suggestion = "I'm feeling frustrated right now. Can we discuss this calmly for the kids' sake?"
            elif ToxicityCategory.BLAME in categories:
                suggestion = "I think there's been a miscommunication. Let's figure this out together."
            else:
                suggestion = "Let's take a moment and approach this calmly. What do you need from me?"

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
            ToxicityLevel.LOW: "Just a thought...",
            ToxicityLevel.MEDIUM: "Hey, quick check-in...",
            ToxicityLevel.HIGH: "Hold on a moment...",
            ToxicityLevel.SEVERE: "Let's pause here...",
        }

        return {
            "level": analysis.toxicity_level.value,
            "header": level_headers.get(analysis.toxicity_level, "A gentle note..."),
            "explanation": analysis.explanation,
            "original_message": analysis.original_message,
            "suggestion": analysis.suggestion,
            "toxicity_score": analysis.toxicity_score,
            "categories": [cat.value for cat in analysis.categories],
            "child_reminder": "Remember, your little one(s) are counting on both of you to communicate kindly.",
        }
