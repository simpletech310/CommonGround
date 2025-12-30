"""
ARIA Tools
Tools for searching agreements, calculating costs, and checking dates.
"""

import json
import re
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any


class AgreementSearchTool:
    """Tool for searching through a custody agreement"""
    
    def __init__(self, agreement: dict):
        self.agreement = agreement
        self.flat_index = self._build_index()
    
    def _build_index(self) -> Dict[str, Any]:
        """Build a flat searchable index of the agreement"""
        index = {}
        self._flatten_dict(self.agreement, "", index)
        return index
    
    def _flatten_dict(self, d: Any, prefix: str, result: dict):
        """Recursively flatten a dictionary for searching"""
        if isinstance(d, dict):
            for key, value in d.items():
                new_key = f"{prefix}.{key}" if prefix else key
                self._flatten_dict(value, new_key, result)
        elif isinstance(d, list):
            for i, item in enumerate(d):
                self._flatten_dict(item, f"{prefix}[{i}]", result)
        else:
            result[prefix] = d
    
    def search(self, query: str, section: str = None) -> Dict[str, Any]:
        """
        Search the agreement for relevant information.
        
        Args:
            query: What to search for
            section: Optional specific section to search in
            
        Returns:
            Matching sections and their content
        """
        query_lower = query.lower()
        results = {}
        
        # If section specified, search only that section
        if section:
            section_data = self._get_section(section)
            if section_data:
                results[section] = section_data
                return {
                    "found": True,
                    "section": section,
                    "data": section_data,
                    "source": f"Section: {section}"
                }
        
        # Search through all sections
        keywords = query_lower.split()
        matches = []
        
        for path, value in self.flat_index.items():
            if value is None:
                continue
            
            path_lower = path.lower()
            value_str = str(value).lower() if value else ""
            
            # Check if any keyword matches path or value
            for keyword in keywords:
                if keyword in path_lower or keyword in value_str:
                    # Get the top-level section
                    top_section = path.split('.')[0]
                    matches.append({
                        "path": path,
                        "value": value,
                        "section": top_section
                    })
                    break
        
        if matches:
            # Group by section
            by_section = {}
            for match in matches:
                section = match["section"]
                if section not in by_section:
                    by_section[section] = []
                by_section[section].append(match)
            
            return {
                "found": True,
                "matches": matches[:10],  # Limit results
                "by_section": by_section,
                "source": "Agreement search"
            }
        
        return {"found": False, "message": "No matching information found in agreement"}
    
    def _get_section(self, section: str) -> Optional[dict]:
        """Get a specific section from the agreement"""
        return self.agreement.get(section)
    
    def get_exchange_info(self) -> dict:
        """Get exchange/pickup information"""
        return {
            "exchange": self.agreement.get("exchange", {}),
            "parenting_schedule": self.agreement.get("parenting_schedule", {}),
            "source": "Sections: exchange, parenting_schedule"
        }
    
    def get_financial_info(self) -> dict:
        """Get financial/cost-sharing information"""
        return {
            "child_support": self.agreement.get("child_support", {}),
            "additional_expenses": self.agreement.get("additional_expenses", {}),
            "health_insurance": self.agreement.get("health_insurance", {}),
            "source": "Sections: child_support, additional_expenses, health_insurance"
        }
    
    def get_medical_info(self) -> dict:
        """Get medical/health information"""
        return {
            "medical": self.agreement.get("medical", {}),
            "health_insurance": self.agreement.get("health_insurance", {}),
            "additional_expenses": self.agreement.get("additional_expenses", {}).get("medical_copays", {}),
            "source": "Sections: medical, health_insurance, additional_expenses.medical_copays"
        }
    
    def get_travel_info(self) -> dict:
        """Get travel-related information"""
        return {
            "travel": self.agreement.get("travel", {}),
            "source": "Section: travel"
        }
    
    def get_holiday_info(self) -> dict:
        """Get holiday schedule information"""
        return {
            "holidays": self.agreement.get("holidays", {}),
            "source": "Section: holidays"
        }
    
    def get_children_info(self) -> List[dict]:
        """Get information about the children"""
        return self.agreement.get("children", [])
    
    def get_parties_info(self) -> dict:
        """Get parent information"""
        return self.agreement.get("parties", {})
    
    def get_full_section(self, section_name: str) -> dict:
        """Get a full section by name"""
        section = self.agreement.get(section_name)
        if section:
            return {
                "found": True,
                "section": section_name,
                "data": section,
                "source": f"Section: {section_name}"
            }
        return {"found": False, "section": section_name}


class CalculatorTool:
    """Tool for financial calculations"""
    
    @staticmethod
    def split_cost(amount: float, split_percentage: float = 50.0) -> dict:
        """
        Calculate cost split between parents.
        
        Args:
            amount: Total amount to split
            split_percentage: Percentage for first party (default 50%)
            
        Returns:
            Both parties' shares
        """
        party1_share = round(amount * (split_percentage / 100), 2)
        party2_share = round(amount - party1_share, 2)
        
        return {
            "total_amount": amount,
            "split_ratio": f"{split_percentage}/{100-split_percentage}",
            "party1_owes": party1_share,
            "party2_owes": party2_share
        }
    
    @staticmethod
    def calculate_50_50(amount: float) -> dict:
        """Calculate a 50/50 split"""
        half = round(amount / 2, 2)
        return {
            "total_amount": amount,
            "each_owes": half,
            "split": "50/50"
        }
    
    @staticmethod
    def calculate_60_40(amount: float, who_pays_60: str = "father") -> dict:
        """Calculate a 60/40 split"""
        sixty = round(amount * 0.6, 2)
        forty = round(amount * 0.4, 2)
        
        if who_pays_60.lower() == "father":
            return {
                "total_amount": amount,
                "father_owes": sixty,
                "mother_owes": forty,
                "split": "60/40 (Father/Mother)"
            }
        else:
            return {
                "total_amount": amount,
                "mother_owes": sixty,
                "father_owes": forty,
                "split": "60/40 (Mother/Father)"
            }
    
    @staticmethod
    def calculate_reimbursement(total_paid: float, your_share_percent: float) -> dict:
        """
        Calculate how much the other parent should reimburse you.
        
        Args:
            total_paid: Amount you paid upfront
            your_share_percent: Your percentage of the split
        """
        your_share = round(total_paid * (your_share_percent / 100), 2)
        other_owes_you = round(total_paid - your_share, 2)
        
        return {
            "total_paid": total_paid,
            "your_share": your_share,
            "your_share_percent": your_share_percent,
            "other_parent_owes_you": other_owes_you
        }
    
    @staticmethod
    def check_threshold(amount: float, threshold: float) -> dict:
        """Check if an amount meets a threshold"""
        meets_threshold = amount > threshold
        return {
            "amount": amount,
            "threshold": threshold,
            "meets_threshold": meets_threshold,
            "message": f"${amount} {'exceeds' if meets_threshold else 'does not exceed'} ${threshold} threshold"
        }


class DateTool:
    """Tool for date calculations"""
    
    @staticmethod
    def days_until(target_date_str: str, from_date: datetime = None) -> dict:
        """
        Calculate days until a target date.
        
        Args:
            target_date_str: Target date in various formats
            from_date: Starting date (default: today)
        """
        if from_date is None:
            from_date = datetime.now()
        
        # Try to parse the target date
        target = DateTool._parse_date(target_date_str)
        if not target:
            return {"error": f"Could not parse date: {target_date_str}"}
        
        delta = target - from_date
        days = delta.days
        
        return {
            "target_date": target.strftime("%Y-%m-%d"),
            "from_date": from_date.strftime("%Y-%m-%d"),
            "days_until": days,
            "is_future": days > 0,
            "is_past": days < 0,
            "is_today": days == 0
        }
    
    @staticmethod
    def days_from_now(days: int) -> dict:
        """Calculate a date that is N days from now"""
        today = datetime.now()
        target = today + timedelta(days=days)
        
        return {
            "today": today.strftime("%Y-%m-%d"),
            "days_from_now": days,
            "target_date": target.strftime("%Y-%m-%d"),
            "target_day": target.strftime("%A")
        }
    
    @staticmethod
    def check_notice_period(event_date_str: str, required_days: int) -> dict:
        """
        Check if there's enough notice for an event.
        
        Args:
            event_date_str: When the event is happening
            required_days: How many days notice is required
        """
        today = datetime.now()
        event_date = DateTool._parse_date(event_date_str)
        
        if not event_date:
            return {"error": f"Could not parse date: {event_date_str}"}
        
        days_until_event = (event_date - today).days
        days_short = required_days - days_until_event
        
        return {
            "event_date": event_date.strftime("%Y-%m-%d"),
            "today": today.strftime("%Y-%m-%d"),
            "days_until_event": days_until_event,
            "required_notice_days": required_days,
            "sufficient_notice": days_until_event >= required_days,
            "days_short": max(0, days_short),
            "deadline_to_notify": (event_date - timedelta(days=required_days)).strftime("%Y-%m-%d")
        }
    
    @staticmethod
    def get_week_number() -> dict:
        """Get the current week number (for alternating week schedules)"""
        today = datetime.now()
        week_num = today.isocalendar()[1]
        
        return {
            "date": today.strftime("%Y-%m-%d"),
            "week_number": week_num,
            "is_odd_week": week_num % 2 == 1,
            "is_even_week": week_num % 2 == 0,
            "week_type": "odd" if week_num % 2 == 1 else "even"
        }
    
    @staticmethod
    def get_current_year_parity() -> dict:
        """Get whether the current year is odd or even (for holiday schedules)"""
        year = datetime.now().year
        return {
            "year": year,
            "is_odd_year": year % 2 == 1,
            "is_even_year": year % 2 == 0,
            "year_type": "odd" if year % 2 == 1 else "even"
        }
    
    @staticmethod
    def _parse_date(date_str: str) -> Optional[datetime]:
        """Try to parse a date string in various formats"""
        if isinstance(date_str, datetime):
            return date_str
        
        # Common formats
        formats = [
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%m/%d/%y",
            "%B %d, %Y",
            "%b %d, %Y",
            "%d %B %Y",
            "%Y/%m/%d"
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        
        # Try relative dates
        date_str_lower = date_str.lower().strip()
        today = datetime.now()
        
        if date_str_lower == "today":
            return today
        elif date_str_lower == "tomorrow":
            return today + timedelta(days=1)
        elif date_str_lower == "next week":
            return today + timedelta(days=7)
        elif "next" in date_str_lower:
            # Handle "next Tuesday" etc
            days_map = {
                "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
                "friday": 4, "saturday": 5, "sunday": 6
            }
            for day_name, day_num in days_map.items():
                if day_name in date_str_lower:
                    current_day = today.weekday()
                    days_ahead = day_num - current_day
                    if days_ahead <= 0:
                        days_ahead += 7
                    return today + timedelta(days=days_ahead)
        
        return None


class ARIAToolkit:
    """Combined toolkit for ARIA"""
    
    def __init__(self, agreement: dict):
        self.agreement = agreement
        self.search = AgreementSearchTool(agreement)
        self.calculator = CalculatorTool()
        self.dates = DateTool()
    
    def get_tool_descriptions(self) -> str:
        """Get descriptions of available tools for the LLM"""
        return """
Available Tools:

1. AGREEMENT_SEARCH: Search the custody agreement for specific information
   - search(query, section=None): General search
   - get_exchange_info(): Get pickup/dropoff details
   - get_financial_info(): Get cost-sharing and child support info
   - get_medical_info(): Get medical/insurance info
   - get_travel_info(): Get travel rules and requirements
   - get_holiday_info(): Get holiday schedule
   - get_children_info(): Get info about the children
   - get_parties_info(): Get parent information
   - get_full_section(section_name): Get a complete section

2. CALCULATOR: Perform financial calculations
   - calculate_50_50(amount): Split an amount 50/50
   - calculate_60_40(amount, who_pays_60): Split 60/40
   - split_cost(amount, percentage): Custom percentage split
   - calculate_reimbursement(total_paid, your_share_percent): Calculate what other parent owes
   - check_threshold(amount, threshold): Check if amount exceeds threshold

3. DATES: Date calculations
   - days_until(date): Days until a date
   - days_from_now(days): What date is N days from now
   - check_notice_period(event_date, required_days): Check if notice requirement is met
   - get_week_number(): Current week (for alternating schedules)
   - get_current_year_parity(): Is it an odd or even year (for holidays)
"""
