"""
ARIA Message Store
Tracks messages, ARIA suggestions, and accept/reject statistics.
Provides trend analysis to see if communication is improving.
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict

# Try to use SQLite, fallback to JSON file storage
try:
    from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import sessionmaker, relationship
    USE_SQLITE = True
    Base = declarative_base()
except ImportError:
    USE_SQLITE = False


class UserAction(Enum):
    """What the user did with ARIA's suggestion"""
    ACCEPTED = "accepted"        # Used ARIA's suggestion
    MODIFIED = "modified"        # Edited their message (partially accepted)
    REJECTED = "rejected"        # Sent original message anyway
    CANCELLED = "cancelled"      # Deleted the message entirely


@dataclass
class MessageRecord:
    """Record of a single message exchange"""
    id: int
    conversation_id: str
    sender: str  # "parent_a" or "parent_b"
    recipient: str
    timestamp: datetime
    original_message: str
    final_message: str
    was_flagged: bool
    toxicity_level: str
    toxicity_score: float
    categories: List[str]
    aria_suggestion: Optional[str]
    user_action: Optional[str]
    explanation: str


@dataclass
class ConversationStats:
    """Statistics for a conversation"""
    conversation_id: str
    parent_a_name: str
    parent_b_name: str
    total_messages: int
    flagged_messages: int
    accepted_suggestions: int
    modified_messages: int
    rejected_suggestions: int
    cancelled_messages: int
    average_toxicity: float
    trend_direction: str  # "improving", "stable", "worsening"
    last_activity: datetime


# ============================================================================
# SQLITE MODELS (if available)
# ============================================================================

if USE_SQLITE:
    class Message(Base):
        """SQLite model for messages"""
        __tablename__ = "messages"
        
        id = Column(Integer, primary_key=True, autoincrement=True)
        conversation_id = Column(String(100), index=True)
        sender = Column(String(100))
        recipient = Column(String(100))
        timestamp = Column(DateTime, default=datetime.utcnow)
        original_message = Column(Text)
        final_message = Column(Text)
        was_flagged = Column(Boolean, default=False)
        toxicity_level = Column(String(50))
        toxicity_score = Column(Float, default=0.0)
        categories = Column(JSON, default=list)
        aria_suggestion = Column(Text, nullable=True)
        user_action = Column(String(50), nullable=True)
        explanation = Column(Text, nullable=True)
    
    class Conversation(Base):
        """SQLite model for conversations"""
        __tablename__ = "conversations"
        
        id = Column(String(100), primary_key=True)
        parent_a_name = Column(String(200))
        parent_b_name = Column(String(200))
        created_at = Column(DateTime, default=datetime.utcnow)
        updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# MESSAGE STORE
# ============================================================================

class MessageStore:
    """
    Stores and tracks all messages and ARIA interactions.
    Provides statistics and trend analysis.
    """
    
    def __init__(self, db_path: str = "aria_messages.db"):
        """Initialize the message store"""
        self.db_path = db_path
        
        if USE_SQLITE:
            self.engine = create_engine(f"sqlite:///{db_path}", echo=False)
            Base.metadata.create_all(self.engine)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
        else:
            # Fallback to JSON file storage
            self.json_path = db_path.replace('.db', '.json')
            self._load_json()
    
    def _load_json(self):
        """Load data from JSON file"""
        if os.path.exists(self.json_path):
            with open(self.json_path, 'r') as f:
                self.data = json.load(f)
        else:
            self.data = {
                "conversations": {},
                "messages": [],
                "next_id": 1
            }
    
    def _save_json(self):
        """Save data to JSON file"""
        with open(self.json_path, 'w') as f:
            json.dump(self.data, f, indent=2, default=str)
    
    # ==================== CONVERSATION OPERATIONS ====================
    
    def create_conversation(self, conversation_id: str, parent_a_name: str, parent_b_name: str) -> str:
        """Create a new conversation"""
        if USE_SQLITE:
            existing = self.session.query(Conversation).filter_by(id=conversation_id).first()
            if not existing:
                conv = Conversation(
                    id=conversation_id,
                    parent_a_name=parent_a_name,
                    parent_b_name=parent_b_name
                )
                self.session.add(conv)
                self.session.commit()
        else:
            if conversation_id not in self.data["conversations"]:
                self.data["conversations"][conversation_id] = {
                    "id": conversation_id,
                    "parent_a_name": parent_a_name,
                    "parent_b_name": parent_b_name,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                self._save_json()
        
        return conversation_id
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """Get conversation info"""
        if USE_SQLITE:
            conv = self.session.query(Conversation).filter_by(id=conversation_id).first()
            if conv:
                return {
                    "id": conv.id,
                    "parent_a_name": conv.parent_a_name,
                    "parent_b_name": conv.parent_b_name,
                    "created_at": conv.created_at,
                    "updated_at": conv.updated_at
                }
        else:
            return self.data["conversations"].get(conversation_id)
        return None
    
    # ==================== MESSAGE OPERATIONS ====================
    
    def save_message(
        self,
        conversation_id: str,
        sender: str,
        recipient: str,
        original_message: str,
        final_message: str,
        was_flagged: bool,
        toxicity_level: str,
        toxicity_score: float,
        categories: List[str],
        aria_suggestion: Optional[str],
        user_action: Optional[str],
        explanation: str
    ) -> int:
        """Save a message record"""
        if USE_SQLITE:
            msg = Message(
                conversation_id=conversation_id,
                sender=sender,
                recipient=recipient,
                original_message=original_message,
                final_message=final_message,
                was_flagged=was_flagged,
                toxicity_level=toxicity_level,
                toxicity_score=toxicity_score,
                categories=categories,
                aria_suggestion=aria_suggestion,
                user_action=user_action,
                explanation=explanation
            )
            self.session.add(msg)
            self.session.commit()
            return msg.id
        else:
            msg_id = self.data["next_id"]
            self.data["next_id"] += 1
            self.data["messages"].append({
                "id": msg_id,
                "conversation_id": conversation_id,
                "sender": sender,
                "recipient": recipient,
                "timestamp": datetime.now().isoformat(),
                "original_message": original_message,
                "final_message": final_message,
                "was_flagged": was_flagged,
                "toxicity_level": toxicity_level,
                "toxicity_score": toxicity_score,
                "categories": categories,
                "aria_suggestion": aria_suggestion,
                "user_action": user_action,
                "explanation": explanation
            })
            self._save_json()
            return msg_id
    
    def get_messages(self, conversation_id: str, limit: int = 50) -> List[Dict]:
        """Get messages for a conversation"""
        if USE_SQLITE:
            messages = self.session.query(Message)\
                .filter_by(conversation_id=conversation_id)\
                .order_by(Message.timestamp.desc())\
                .limit(limit)\
                .all()
            return [{
                "id": m.id,
                "sender": m.sender,
                "recipient": m.recipient,
                "timestamp": m.timestamp,
                "original_message": m.original_message,
                "final_message": m.final_message,
                "was_flagged": m.was_flagged,
                "toxicity_level": m.toxicity_level,
                "toxicity_score": m.toxicity_score,
                "categories": m.categories,
                "aria_suggestion": m.aria_suggestion,
                "user_action": m.user_action,
                "explanation": m.explanation
            } for m in reversed(messages)]
        else:
            conv_messages = [m for m in self.data["messages"] if m["conversation_id"] == conversation_id]
            return conv_messages[-limit:]
    
    # ==================== STATISTICS ====================
    
    def get_user_stats(self, conversation_id: str, user: str) -> Dict[str, Any]:
        """Get statistics for a specific user in a conversation"""
        messages = self.get_messages(conversation_id, limit=1000)
        user_messages = [m for m in messages if m["sender"] == user]
        
        if not user_messages:
            return {
                "user": user,
                "total_messages": 0,
                "flagged_messages": 0,
                "flagged_percentage": 0,
                "accepted": 0,
                "modified": 0,
                "rejected": 0,
                "cancelled": 0,
                "acceptance_rate": 0,
                "average_toxicity": 0,
                "trend": "no_data"
            }
        
        total = len(user_messages)
        flagged = sum(1 for m in user_messages if m["was_flagged"])
        accepted = sum(1 for m in user_messages if m["user_action"] == UserAction.ACCEPTED.value)
        modified = sum(1 for m in user_messages if m["user_action"] == UserAction.MODIFIED.value)
        rejected = sum(1 for m in user_messages if m["user_action"] == UserAction.REJECTED.value)
        cancelled = sum(1 for m in user_messages if m["user_action"] == UserAction.CANCELLED.value)
        
        avg_toxicity = sum(m["toxicity_score"] for m in user_messages) / total if total > 0 else 0
        
        # Calculate trend (compare first half to second half of messages)
        trend = self._calculate_trend(user_messages)
        
        # Acceptance rate (accepted + modified) / flagged
        acceptance_rate = (accepted + modified) / flagged if flagged > 0 else 1.0
        
        return {
            "user": user,
            "total_messages": total,
            "flagged_messages": flagged,
            "flagged_percentage": round((flagged / total) * 100, 1) if total > 0 else 0,
            "accepted": accepted,
            "modified": modified,
            "rejected": rejected,
            "cancelled": cancelled,
            "acceptance_rate": round(acceptance_rate * 100, 1),
            "average_toxicity": round(avg_toxicity, 3),
            "trend": trend
        }
    
    def get_conversation_stats(self, conversation_id: str) -> Dict[str, Any]:
        """Get overall statistics for a conversation"""
        conv = self.get_conversation(conversation_id)
        if not conv:
            return {}
        
        messages = self.get_messages(conversation_id, limit=1000)
        
        if not messages:
            return {
                "conversation_id": conversation_id,
                "parent_a_name": conv.get("parent_a_name"),
                "parent_b_name": conv.get("parent_b_name"),
                "total_messages": 0,
                "parent_a_stats": {},
                "parent_b_stats": {},
                "overall_trend": "no_data"
            }
        
        parent_a_stats = self.get_user_stats(conversation_id, "parent_a")
        parent_b_stats = self.get_user_stats(conversation_id, "parent_b")
        
        total = len(messages)
        flagged = sum(1 for m in messages if m["was_flagged"])
        avg_toxicity = sum(m["toxicity_score"] for m in messages) / total if total > 0 else 0
        
        overall_trend = self._calculate_trend(messages)
        
        return {
            "conversation_id": conversation_id,
            "parent_a_name": conv.get("parent_a_name"),
            "parent_b_name": conv.get("parent_b_name"),
            "total_messages": total,
            "flagged_messages": flagged,
            "flagged_percentage": round((flagged / total) * 100, 1) if total > 0 else 0,
            "average_toxicity": round(avg_toxicity, 3),
            "parent_a_stats": parent_a_stats,
            "parent_b_stats": parent_b_stats,
            "overall_trend": overall_trend
        }
    
    def _calculate_trend(self, messages: List[Dict]) -> str:
        """Calculate if communication is improving, stable, or worsening"""
        if len(messages) < 4:
            return "not_enough_data"
        
        # Split messages into first half and second half
        mid = len(messages) // 2
        first_half = messages[:mid]
        second_half = messages[mid:]
        
        # Calculate average toxicity for each half
        first_avg = sum(m["toxicity_score"] for m in first_half) / len(first_half)
        second_avg = sum(m["toxicity_score"] for m in second_half) / len(second_half)
        
        # Calculate flagged percentage for each half
        first_flagged = sum(1 for m in first_half if m["was_flagged"]) / len(first_half)
        second_flagged = sum(1 for m in second_half if m["was_flagged"]) / len(second_half)
        
        # Determine trend
        toxicity_change = second_avg - first_avg
        flagged_change = second_flagged - first_flagged
        
        if toxicity_change < -0.05 and flagged_change < -0.1:
            return "improving"
        elif toxicity_change > 0.05 and flagged_change > 0.1:
            return "worsening"
        else:
            return "stable"
    
    def get_trend_data(self, conversation_id: str, user: str = None, days: int = 30) -> List[Dict]:
        """Get daily trend data for visualization"""
        messages = self.get_messages(conversation_id, limit=1000)
        
        if user:
            messages = [m for m in messages if m["sender"] == user]
        
        # Group by date
        daily_data = defaultdict(lambda: {"count": 0, "flagged": 0, "total_toxicity": 0, "accepted": 0, "rejected": 0})
        
        for msg in messages:
            if isinstance(msg["timestamp"], str):
                date = msg["timestamp"][:10]
            else:
                date = msg["timestamp"].strftime("%Y-%m-%d")
            
            daily_data[date]["count"] += 1
            daily_data[date]["total_toxicity"] += msg["toxicity_score"]
            if msg["was_flagged"]:
                daily_data[date]["flagged"] += 1
            if msg["user_action"] == UserAction.ACCEPTED.value:
                daily_data[date]["accepted"] += 1
            elif msg["user_action"] == UserAction.REJECTED.value:
                daily_data[date]["rejected"] += 1
        
        # Convert to list
        result = []
        for date, data in sorted(daily_data.items()):
            result.append({
                "date": date,
                "messages": data["count"],
                "flagged": data["flagged"],
                "average_toxicity": round(data["total_toxicity"] / data["count"], 3) if data["count"] > 0 else 0,
                "accepted": data["accepted"],
                "rejected": data["rejected"]
            })
        
        return result[-days:]  # Last N days
    
    def get_flagged_messages_log(self, conversation_id: str, limit: int = 20) -> List[Dict]:
        """Get a log of flagged messages with suggestions and user actions"""
        messages = self.get_messages(conversation_id, limit=1000)
        flagged = [m for m in messages if m["was_flagged"]]
        
        return [{
            "id": m["id"],
            "sender": m["sender"],
            "timestamp": m["timestamp"],
            "original_message": m["original_message"],
            "aria_suggestion": m["aria_suggestion"],
            "final_message": m["final_message"],
            "user_action": m["user_action"],
            "toxicity_level": m["toxicity_level"],
            "categories": m["categories"],
            "explanation": m["explanation"]
        } for m in flagged[-limit:]]
    
    def close(self):
        """Close the database connection"""
        if USE_SQLITE:
            self.session.close()


# ============================================================================
# FORMATTING HELPERS
# ============================================================================

def format_user_stats(stats: Dict) -> str:
    """Format user stats for display"""
    if not stats.get("total_messages"):
        return "No messages yet."
    
    trend_icons = {
        "improving": "📈",
        "stable": "➡️",
        "worsening": "📉",
        "not_enough_data": "📊",
        "no_data": "—"
    }
    
    lines = [
        f"📊 **{stats['user'].replace('_', ' ').title()} Statistics**",
        "",
        f"Total Messages: {stats['total_messages']}",
        f"Flagged: {stats['flagged_messages']} ({stats['flagged_percentage']}%)",
        "",
        "**ARIA Suggestions Response:**",
        f"  ✅ Accepted: {stats['accepted']}",
        f"  ✏️ Modified: {stats['modified']}",
        f"  ❌ Rejected: {stats['rejected']}",
        f"  🗑️ Cancelled: {stats['cancelled']}",
        "",
        f"Acceptance Rate: {stats['acceptance_rate']}%",
        f"Avg Toxicity Score: {stats['average_toxicity']}",
        f"Trend: {trend_icons.get(stats['trend'], '?')} {stats['trend'].replace('_', ' ').title()}"
    ]
    
    return "\n".join(lines)


def format_conversation_stats(stats: Dict) -> str:
    """Format conversation stats for display"""
    if not stats.get("total_messages"):
        return "No messages in this conversation yet."
    
    trend_icons = {
        "improving": "📈 Improving!",
        "stable": "➡️ Stable",
        "worsening": "📉 Needs attention",
        "not_enough_data": "📊 Building data...",
        "no_data": "— No data"
    }
    
    lines = [
        "═" * 50,
        "📊 CONVERSATION ANALYTICS",
        "═" * 50,
        "",
        f"Participants: {stats.get('parent_a_name', 'Parent A')} & {stats.get('parent_b_name', 'Parent B')}",
        "",
        f"📬 Total Messages: {stats['total_messages']}",
        f"⚠️ Flagged Messages: {stats['flagged_messages']} ({stats['flagged_percentage']}%)",
        f"📉 Average Toxicity: {stats['average_toxicity']}",
        f"📈 Overall Trend: {trend_icons.get(stats['overall_trend'], '?')}",
        "",
        "─" * 50,
    ]
    
    # Add parent stats
    if stats.get("parent_a_stats"):
        pa = stats["parent_a_stats"]
        lines.extend([
            f"👤 {stats.get('parent_a_name', 'Parent A')}:",
            f"   Messages: {pa['total_messages']} | Flagged: {pa['flagged_messages']}",
            f"   Acceptance Rate: {pa['acceptance_rate']}% | Trend: {pa['trend']}"
        ])
    
    if stats.get("parent_b_stats"):
        pb = stats["parent_b_stats"]
        lines.extend([
            f"👤 {stats.get('parent_b_name', 'Parent B')}:",
            f"   Messages: {pb['total_messages']} | Flagged: {pb['flagged_messages']}",
            f"   Acceptance Rate: {pb['acceptance_rate']}% | Trend: {pb['trend']}"
        ])
    
    lines.append("═" * 50)
    
    return "\n".join(lines)


def format_flagged_log(log: List[Dict]) -> str:
    """Format the flagged messages log"""
    if not log:
        return "No flagged messages to show."
    
    lines = [
        "═" * 60,
        "📋 ARIA INTERVENTION LOG",
        "═" * 60,
    ]
    
    action_icons = {
        "accepted": "✅",
        "modified": "✏️",
        "rejected": "❌",
        "cancelled": "🗑️"
    }
    
    for msg in log:
        timestamp = msg["timestamp"]
        if isinstance(timestamp, str):
            timestamp = timestamp[:16].replace("T", " ")
        else:
            timestamp = timestamp.strftime("%Y-%m-%d %H:%M")
        
        lines.extend([
            "",
            f"─── {timestamp} ─── {msg['sender'].replace('_', ' ').title()} ───",
            f"Level: {msg['toxicity_level'].upper()}",
            f"",
            f"Original: \"{msg['original_message']}\"",
        ])
        
        if msg["aria_suggestion"]:
            lines.append(f"ARIA suggested: \"{msg['aria_suggestion']}\"")
        
        action = msg.get("user_action", "unknown")
        icon = action_icons.get(action, "?")
        lines.append(f"User action: {icon} {action.upper()}")
        
        if msg["final_message"] != msg["original_message"]:
            lines.append(f"Sent: \"{msg['final_message']}\"")
    
    lines.extend(["", "═" * 60])
    
    return "\n".join(lines)
