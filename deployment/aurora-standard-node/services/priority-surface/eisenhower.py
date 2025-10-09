#!/usr/bin/env python3
"""
Eisenhower Matrix Implementation
Classifies items into 4 quadrants based on importance + urgency
"""

from enum import Enum
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime, timedelta


class Quadrant(Enum):
    """Eisenhower Matrix Quadrants"""
    Q1_DO_NOW = 1        # Important + Urgent (DO IMMEDIATELY)
    Q2_SCHEDULE = 2      # Important + Not Urgent (SCHEDULE)
    Q3_DELEGATE = 3      # Not Important + Urgent (DELEGATE)
    Q4_ELIMINATE = 4     # Not Important + Not Urgent (ELIMINATE)


@dataclass
class PriorityItem:
    """Represents any item that can be prioritized"""
    id: str
    type: str  # email, task, meeting, deal, etc.
    title: str
    importance_score: float  # 0-100
    urgency_score: float     # 0-100
    quadrant: Quadrant
    revenue_potential: float = 0.0
    deadline: datetime = None
    context: Dict = None
    
    @property
    def priority_score(self) -> float:
        """Combined priority score (0-100)"""
        # Q1 gets highest weight, Q4 gets lowest
        quadrant_weights = {
            Quadrant.Q1_DO_NOW: 1.0,
            Quadrant.Q2_SCHEDULE: 0.7,
            Quadrant.Q3_DELEGATE: 0.4,
            Quadrant.Q4_ELIMINATE: 0.1
        }
        
        base_score = (self.importance_score * 0.6) + (self.urgency_score * 0.4)
        weighted_score = base_score * quadrant_weights[self.quadrant]
        
        # Revenue boost (deals with high $ get priority)
        if self.revenue_potential > 0:
            revenue_boost = min(20, self.revenue_potential / 1000)  # Cap at +20 points
            weighted_score += revenue_boost
            
        return min(100, weighted_score)
    
    @property
    def display_priority(self) -> str:
        """Human-readable priority"""
        if self.quadrant == Quadrant.Q1_DO_NOW:
            return "🔴 DO NOW"
        elif self.quadrant == Quadrant.Q2_SCHEDULE:
            return "🟡 SCHEDULE"
        elif self.quadrant == Quadrant.Q3_DELEGATE:
            return "🟢 DELEGATE"
        else:
            return "⚪ ELIMINATE"


class EisenhowerEngine:
    """Classifies items into Eisenhower Matrix quadrants"""
    
    # Thresholds for classification
    IMPORTANT_THRESHOLD = 50
    URGENT_THRESHOLD = 50
    
    @staticmethod
    def classify(importance: float, urgency: float) -> Quadrant:
        """Classify item into Eisenhower quadrant"""
        is_important = importance >= EisenhowerEngine.IMPORTANT_THRESHOLD
        is_urgent = urgency >= EisenhowerEngine.URGENT_THRESHOLD
        
        if is_important and is_urgent:
            return Quadrant.Q1_DO_NOW
        elif is_important and not is_urgent:
            return Quadrant.Q2_SCHEDULE
        elif not is_important and is_urgent:
            return Quadrant.Q3_DELEGATE
        else:
            return Quadrant.Q4_ELIMINATE
    
    @staticmethod
    def calculate_importance(item: Dict) -> float:
        """Calculate importance score (0-100)"""
        score = 0.0
        
        # Revenue potential (0-40 points)
        revenue = item.get("revenue_potential", 0)
        if revenue > 0:
            score += min(40, (revenue / 100000) * 40)  # Max at $100k+
        
        # Sender/participant importance (0-30 points)
        sender_score = item.get("sender_score", 0)
        score += (sender_score / 100) * 30
        
        # Business relationship (0-20 points)
        relationship = item.get("relationship_tier", "unknown")
        relationship_scores = {
            "founder": 20,
            "c_level": 18,
            "vp": 15,
            "director": 12,
            "manager": 8,
            "individual": 5,
            "unknown": 0
        }
        score += relationship_scores.get(relationship, 0)
        
        # Strategic importance (0-10 points)
        if item.get("is_strategic", False):
            score += 10
            
        return min(100, score)
    
    @staticmethod
    def calculate_urgency(item: Dict) -> float:
        """Calculate urgency score (0-100)"""
        score = 0.0
        
        # Explicit deadline (0-50 points)
        deadline = item.get("deadline")
        if deadline:
            if isinstance(deadline, str):
                deadline = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
            
            time_until = deadline - datetime.now(deadline.tzinfo)
            hours_until = time_until.total_seconds() / 3600
            
            if hours_until < 0:
                score += 50  # OVERDUE
            elif hours_until < 4:
                score += 45  # Today (urgent)
            elif hours_until < 24:
                score += 35  # Tomorrow
            elif hours_until < 72:
                score += 25  # This week
            elif hours_until < 168:
                score += 15  # Next week
            else:
                score += 5   # Future
        
        # Response time expectations (0-30 points)
        expected_response_time = item.get("expected_response_hours", 48)
        if expected_response_time <= 4:
            score += 30  # Immediate response expected
        elif expected_response_time <= 24:
            score += 20  # Same day
        elif expected_response_time <= 48:
            score += 10  # 2 days
        
        # Keywords/urgency markers (0-20 points)
        text = (item.get("subject", "") + " " + item.get("body", "")).lower()
        urgency_keywords = {
            "urgent": 10,
            "asap": 10,
            "immediate": 10,
            "critical": 8,
            "deadline": 8,
            "today": 7,
            "now": 7,
            "emergency": 10
        }
        
        for keyword, points in urgency_keywords.items():
            if keyword in text:
                score += points
                break  # Only count once
        
        return min(100, score)
    
    @staticmethod
    def create_priority_item(item: Dict) -> PriorityItem:
        """Create PriorityItem from raw data"""
        importance = EisenhowerEngine.calculate_importance(item)
        urgency = EisenhowerEngine.calculate_urgency(item)
        quadrant = EisenhowerEngine.classify(importance, urgency)
        
        return PriorityItem(
            id=item.get("id", ""),
            type=item.get("type", "unknown"),
            title=item.get("title", item.get("subject", "Untitled")),
            importance_score=importance,
            urgency_score=urgency,
            quadrant=quadrant,
            revenue_potential=item.get("revenue_potential", 0),
            deadline=item.get("deadline"),
            context=item.get("context", {})
        )
    
    @staticmethod
    def get_top_n(items: List[PriorityItem], n: int = 10) -> List[PriorityItem]:
        """Get top N items by priority score"""
        return sorted(items, key=lambda x: x.priority_score, reverse=True)[:n]
    
    @staticmethod
    def surface_priorities(all_items: List[Dict], top_n: int = 10) -> Dict:
        """Surface top priorities, submerge the rest"""
        # Convert to PriorityItems
        priority_items = [EisenhowerEngine.create_priority_item(item) for item in all_items]
        
        # Get top N
        surfaced = EisenhowerEngine.get_top_n(priority_items, top_n)
        
        # Submerge the rest (grouped by quadrant)
        submerged = [item for item in priority_items if item not in surfaced]
        submerged_by_quadrant = {
            "Q1_DO_NOW": [],
            "Q2_SCHEDULE": [],
            "Q3_DELEGATE": [],
            "Q4_ELIMINATE": []
        }
        
        for item in submerged:
            submerged_by_quadrant[item.quadrant.name].append(item)
        
        return {
            "surfaced": [
                {
                    "id": item.id,
                    "type": item.type,
                    "title": item.title,
                    "priority": item.display_priority,
                    "priority_score": round(item.priority_score, 1),
                    "importance": round(item.importance_score, 1),
                    "urgency": round(item.urgency_score, 1),
                    "revenue_potential": item.revenue_potential,
                    "deadline": item.deadline.isoformat() if item.deadline else None,
                    "context": item.context
                }
                for item in surfaced
            ],
            "submerged": {
                quadrant: [
                    {
                        "id": item.id,
                        "type": item.type,
                        "title": item.title,
                        "priority_score": round(item.priority_score, 1)
                    }
                    for item in items
                ]
                for quadrant, items in submerged_by_quadrant.items()
            },
            "stats": {
                "total_items": len(priority_items),
                "surfaced_count": len(surfaced),
                "submerged_count": len(submerged),
                "q1_count": len([i for i in priority_items if i.quadrant == Quadrant.Q1_DO_NOW]),
                "q2_count": len([i for i in priority_items if i.quadrant == Quadrant.Q2_SCHEDULE]),
                "q3_count": len([i for i in priority_items if i.quadrant == Quadrant.Q3_DELEGATE]),
                "q4_count": len([i for i in priority_items if i.quadrant == Quadrant.Q4_ELIMINATE])
            }
        }
