"""
Aurora RobbieVerse - Personality Learning System
AI personalities that learn and adapt from user interactions
"""
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import json
import uuid
import math
from collections import defaultdict

from app.db.database import database
from app.services.conversation_context import ConversationContextManager
from app.services.ai.personality_manager import personality_manager

class PersonalityLearningManager:
    """Manages AI personality learning and adaptation"""
    
    def __init__(self):
        self.context_manager = ConversationContextManager()
        self.learning_decay_days = 30  # How long learning stays relevant
        self.min_interactions = 5  # Minimum interactions before learning kicks in
        self.learning_rate = 0.1  # How quickly personalities adapt
    
    async def record_user_interaction(
        self,
        user_id: str,
        conversation_id: str,
        message_id: str,
        personality_id: str,
        interaction_type: str,  # 'positive', 'negative', 'neutral', 'rollback', 'branch'
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Record a user interaction for personality learning"""
        
        interaction_id = str(uuid.uuid4())
        
        # Analyze interaction context
        analysis = await self._analyze_interaction_context(
            conversation_id, 
            message_id, 
            interaction_type, 
            context_data
        )
        
        # Store interaction record
        await database.execute("""
            INSERT INTO personality_interactions (
                id, user_id, conversation_id, message_id, personality_id,
                interaction_type, context_analysis, created_at
            ) VALUES (
                :id, :user_id, :conversation_id, :message_id, :personality_id,
                :interaction_type, :context_analysis, :created_at
            )
        """, {
            "id": interaction_id,
            "user_id": user_id,
            "conversation_id": conversation_id,
            "message_id": message_id,
            "personality_id": personality_id,
            "interaction_type": interaction_type,
            "context_analysis": json.dumps(analysis),
            "created_at": datetime.utcnow()
        })
        
        # Update personality learning profile
        await self._update_personality_learning(user_id, personality_id, interaction_type, analysis)
        
        return {
            "interaction_id": interaction_id,
            "learning_updated": True,
            "analysis": analysis
        }
    
    async def get_personalized_personality_for_user(
        self,
        user_id: str,
        conversation_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get the best personality for a user based on learning"""
        
        # Get user's learning profile
        learning_profile = await self._get_user_learning_profile(user_id)
        
        # Get base personalities
        available_personalities = await personality_manager.get_available_personalities()
        
        # Score personalities based on learning
        scored_personalities = []
        for personality in available_personalities:
            score = await self._calculate_personality_fit_score(
                personality, 
                learning_profile, 
                conversation_context
            )
            
            scored_personalities.append({
                "personality": personality,
                "fit_score": score,
                "learning_data": learning_profile.get(personality["id"], {})
            })
        
        # Sort by fit score
        scored_personalities.sort(key=lambda x: x["fit_score"], reverse=True)
        
        best_personality = scored_personalities[0] if scored_personalities else None
        
        return {
            "recommended_personality": best_personality,
            "all_scores": scored_personalities[:3],  # Top 3
            "learning_profile_strength": len(learning_profile),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    async def create_adaptive_personality(
        self,
        user_id: str,
        base_personality_id: str,
        adaptation_name: str
    ) -> Dict[str, Any]:
        """Create an adaptive personality based on user learning"""
        
        # Get user learning profile
        learning_profile = await self._get_user_learning_profile(user_id)
        
        if base_personality_id not in learning_profile:
            raise ValueError(f"No learning data for personality {base_personality_id}")
        
        # Get base personality
        base_personality = await personality_manager.get_personality(base_personality_id)
        if not base_personality:
            raise ValueError(f"Base personality {base_personality_id} not found")
        
        # Create adaptive version
        learning_data = learning_profile[base_personality_id]
        adaptive_personality = await self._adapt_personality_from_learning(
            base_personality, 
            learning_data, 
            adaptation_name
        )
        
        # Store adaptive personality
        adaptive_id = f"adaptive_{uuid.uuid4().hex[:12]}"
        
        await database.execute("""
            INSERT INTO adaptive_personalities (
                id, user_id, base_personality_id, name, description,
                adapted_traits, adapted_communication_style, adapted_expertise,
                personality_prompt, learning_data, created_at
            ) VALUES (
                :id, :user_id, :base_personality_id, :name, :description,
                :adapted_traits, :adapted_communication_style, :adapted_expertise,
                :personality_prompt, :learning_data, :created_at
            )
        """, {
            "id": adaptive_id,
            "user_id": user_id,
            "base_personality_id": base_personality_id,
            "name": adaptive_personality["name"],
            "description": adaptive_personality["description"],
            "adapted_traits": json.dumps(adaptive_personality["traits"]),
            "adapted_communication_style": adaptive_personality["communication_style"],
            "adapted_expertise": json.dumps(adaptive_personality["expertise"]),
            "personality_prompt": adaptive_personality["personality_prompt"],
            "learning_data": json.dumps(learning_data),
            "created_at": datetime.utcnow()
        })
        
        return {
            "adaptive_personality_id": adaptive_id,
            "base_personality_id": base_personality_id,
            "name": adaptive_personality["name"],
            "description": adaptive_personality["description"],
            "adaptations_made": len(learning_data.get("adaptations", {})),
            "learning_strength": learning_data.get("interaction_count", 0)
        }
    
    async def get_learning_insights(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get insights about user's personality learning patterns"""
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get interaction statistics
        interactions = await database.fetch_all("""
            SELECT 
                personality_id,
                interaction_type,
                COUNT(*) as interaction_count
            FROM personality_interactions
            WHERE user_id = :user_id AND created_at >= :start_date
            GROUP BY personality_id, interaction_type
            ORDER BY interaction_count DESC
        """, {"user_id": user_id, "start_date": start_date})
        
        # Analyze patterns
        personality_preferences = defaultdict(lambda: {"positive": 0, "negative": 0, "neutral": 0})
        total_interactions = 0
        
        for interaction in interactions:
            personality_id = interaction["personality_id"]
            interaction_type = interaction["interaction_type"]
            count = interaction["interaction_count"]
            
            personality_preferences[personality_id][interaction_type] += count
            total_interactions += count
        
        # Calculate preferences
        preferences = []
        for personality_id, stats in personality_preferences.items():
            total_for_personality = sum(stats.values())
            positive_ratio = stats["positive"] / total_for_personality if total_for_personality > 0 else 0
            
            personality_info = await personality_manager.get_personality(personality_id)
            preferences.append({
                "personality_id": personality_id,
                "personality_name": personality_info["name"] if personality_info else "Unknown",
                "total_interactions": total_for_personality,
                "positive_ratio": round(positive_ratio, 2),
                "stats": dict(stats)
            })
        
        preferences.sort(key=lambda x: x["positive_ratio"], reverse=True)
        
        # Learning trajectory
        trajectory = await self._calculate_learning_trajectory(user_id, days)
        
        return {
            "user_id": user_id,
            "analysis_period_days": days,
            "total_interactions": total_interactions,
            "personality_preferences": preferences,
            "learning_trajectory": trajectory,
            "learning_maturity": "beginner" if total_interactions < 20 else "intermediate" if total_interactions < 100 else "advanced",
            "generated_at": datetime.utcnow().isoformat()
        }
    
    async def _analyze_interaction_context(
        self,
        conversation_id: str,
        message_id: str,
        interaction_type: str,
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Analyze the context of a user interaction"""
        
        # Get message context
        message_context = await database.fetch_one("""
            SELECT 
                m.content,
                m.role,
                m.token_count,
                m.context_importance,
                c.title,
                c.context_window_size
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE m.id = :message_id
        """, {"message_id": message_id})
        
        if not message_context:
            return {"error": "Message not found"}
        
        analysis = {
            "message_length": len(message_context["content"]),
            "message_role": message_context["role"],
            "conversation_context": message_context["title"],
            "interaction_type": interaction_type,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Analyze content characteristics
        content = message_context["content"].lower()
        
        # Detect question types
        if "?" in content:
            analysis["contains_questions"] = True
            if any(word in content for word in ["how", "what", "why", "when", "where"]):
                analysis["question_type"] = "informational"
            elif any(word in content for word in ["can you", "could you", "would you"]):
                analysis["question_type"] = "request"
            else:
                analysis["question_type"] = "general"
        
        # Detect emotional tone
        positive_words = ["great", "good", "excellent", "perfect", "amazing", "helpful", "thank"]
        negative_words = ["bad", "wrong", "error", "problem", "issue", "confusing", "unclear"]
        
        positive_count = sum(1 for word in positive_words if word in content)
        negative_count = sum(1 for word in negative_words if word in content)
        
        if positive_count > negative_count:
            analysis["emotional_tone"] = "positive"
        elif negative_count > positive_count:
            analysis["emotional_tone"] = "negative"
        else:
            analysis["emotional_tone"] = "neutral"
        
        # Add context data if provided
        if context_data:
            analysis["context_data"] = context_data
        
        return analysis
    
    async def _update_personality_learning(
        self,
        user_id: str,
        personality_id: str,
        interaction_type: str,
        analysis: Dict[str, Any]
    ) -> None:
        """Update personality learning profile"""
        
        # Get existing learning profile
        existing = await database.fetch_one("""
            SELECT learning_data FROM personality_learning_profiles
            WHERE user_id = :user_id AND personality_id = :personality_id
        """, {"user_id": user_id, "personality_id": personality_id})
        
        if existing:
            learning_data = json.loads(existing["learning_data"])
        else:
            learning_data = {
                "interaction_count": 0,
                "positive_interactions": 0,
                "negative_interactions": 0,
                "neutral_interactions": 0,
                "preferences": {},
                "adaptations": {},
                "last_updated": datetime.utcnow().isoformat()
            }
        
        # Update learning data
        learning_data["interaction_count"] += 1
        learning_data[f"{interaction_type}_interactions"] += 1
        
        # Update preferences based on analysis
        if "emotional_tone" in analysis:
            tone = analysis["emotional_tone"]
            if tone not in learning_data["preferences"]:
                learning_data["preferences"][tone] = 0
            learning_data["preferences"][tone] += 1
        
        if "question_type" in analysis:
            qtype = analysis["question_type"]
            pref_key = f"question_{qtype}"
            if pref_key not in learning_data["preferences"]:
                learning_data["preferences"][pref_key] = 0
            learning_data["preferences"][pref_key] += 1
        
        learning_data["last_updated"] = datetime.utcnow().isoformat()
        
        # Upsert learning profile
        await database.execute("""
            INSERT INTO personality_learning_profiles (
                user_id, personality_id, learning_data, updated_at
            ) VALUES (
                :user_id, :personality_id, :learning_data, :updated_at
            )
            ON CONFLICT (user_id, personality_id) 
            DO UPDATE SET 
                learning_data = :learning_data,
                updated_at = :updated_at
        """, {
            "user_id": user_id,
            "personality_id": personality_id,
            "learning_data": json.dumps(learning_data),
            "updated_at": datetime.utcnow()
        })
    
    async def _get_user_learning_profile(self, user_id: str) -> Dict[str, Any]:
        """Get complete learning profile for a user"""
        
        profiles = await database.fetch_all("""
            SELECT personality_id, learning_data
            FROM personality_learning_profiles
            WHERE user_id = :user_id
            AND updated_at >= :cutoff_date
        """, {
            "user_id": user_id,
            "cutoff_date": datetime.utcnow() - timedelta(days=self.learning_decay_days)
        })
        
        learning_profile = {}
        for profile in profiles:
            learning_profile[profile["personality_id"]] = json.loads(profile["learning_data"])
        
        return learning_profile
    
    async def _calculate_personality_fit_score(
        self,
        personality: Dict[str, Any],
        learning_profile: Dict[str, Any],
        conversation_context: Optional[Dict[str, Any]] = None
    ) -> float:
        """Calculate how well a personality fits a user based on learning"""
        
        personality_id = personality["id"]
        
        if personality_id not in learning_profile:
            return 0.5  # Neutral score for unknown personalities
        
        learning_data = learning_profile[personality_id]
        
        # Base score from positive/negative interactions
        total_interactions = learning_data.get("interaction_count", 0)
        positive_interactions = learning_data.get("positive_interactions", 0)
        negative_interactions = learning_data.get("negative_interactions", 0)
        
        if total_interactions == 0:
            return 0.5
        
        # Calculate base preference score
        positive_ratio = positive_interactions / total_interactions
        negative_ratio = negative_interactions / total_interactions
        
        base_score = positive_ratio - (negative_ratio * 0.5)  # Negative interactions count more
        
        # Boost score based on interaction frequency (more interactions = higher confidence)
        frequency_boost = min(0.2, total_interactions / 50)  # Max boost of 0.2
        
        # Context-based adjustments
        context_adjustment = 0.0
        if conversation_context:
            # Adjust based on conversation type, complexity, etc.
            context_adjustment = 0.1  # Placeholder
        
        final_score = max(0.0, min(1.0, base_score + frequency_boost + context_adjustment))
        
        return final_score
    
    async def _adapt_personality_from_learning(
        self,
        base_personality: Dict[str, Any],
        learning_data: Dict[str, Any],
        adaptation_name: str
    ) -> Dict[str, Any]:
        """Create adapted personality based on learning data"""
        
        adapted = base_personality.copy()
        adapted["name"] = adaptation_name
        adapted["description"] = f"Personalized {base_personality['name']} - {base_personality['description']}"
        
        # Adapt traits based on user preferences
        preferences = learning_data.get("preferences", {})
        
        # Adapt communication style
        if preferences.get("positive", 0) > preferences.get("negative", 0):
            adapted["communication_style"] = f"warm and {adapted['communication_style']}"
        
        # Adapt personality prompt
        adapted["personality_prompt"] = f"""
        {base_personality['personality_prompt']}
        
        Based on your interactions with this user, you should:
        - Be more {self._get_preferred_tone(preferences)}
        - Focus on {self._get_preferred_topics(preferences)}
        - Adapt your responses to be more personalized and engaging
        """
        
        return adapted
    
    def _get_preferred_tone(self, preferences: Dict[str, Any]) -> str:
        """Determine preferred communication tone from preferences"""
        
        if preferences.get("positive", 0) > 5:
            return "encouraging and supportive"
        elif preferences.get("question_informational", 0) > 3:
            return "detailed and educational"
        else:
            return "balanced and helpful"
    
    def _get_preferred_topics(self, preferences: Dict[str, Any]) -> str:
        """Determine preferred topics from preferences"""
        
        if preferences.get("question_request", 0) > 3:
            return "practical solutions and step-by-step guidance"
        elif preferences.get("question_informational", 0) > 3:
            return "detailed explanations and educational content"
        else:
            return "clear and helpful information"
    
    async def _calculate_learning_trajectory(self, user_id: str, days: int) -> Dict[str, Any]:
        """Calculate user's learning trajectory over time"""
        
        # Get daily interaction counts
        daily_stats = await database.fetch_all("""
            SELECT 
                DATE(created_at) as interaction_date,
                personality_id,
                interaction_type,
                COUNT(*) as count
            FROM personality_interactions
            WHERE user_id = :user_id 
            AND created_at >= :start_date
            GROUP BY DATE(created_at), personality_id, interaction_type
            ORDER BY interaction_date
        """, {
            "user_id": user_id,
            "start_date": datetime.utcnow() - timedelta(days=days)
        })
        
        trajectory = {
            "engagement_trend": "stable",
            "learning_velocity": 0.0,
            "consistency_score": 0.0,
            "daily_stats": []
        }
        
        if not daily_stats:
            return trajectory
        
        # Calculate daily totals
        daily_totals = defaultdict(int)
        for stat in daily_stats:
            daily_totals[stat["interaction_date"]] += stat["count"]
        
        trajectory["daily_stats"] = [
            {"date": date.isoformat(), "interactions": count}
            for date, count in daily_totals.items()
        ]
        
        # Calculate trends
        total_days = len(daily_totals)
        if total_days > 1:
            values = list(daily_totals.values())
            
            # Simple trend calculation
            first_half_avg = sum(values[:total_days//2]) / (total_days//2)
            second_half_avg = sum(values[total_days//2:]) / (total_days - total_days//2)
            
            if second_half_avg > first_half_avg * 1.2:
                trajectory["engagement_trend"] = "increasing"
            elif second_half_avg < first_half_avg * 0.8:
                trajectory["engagement_trend"] = "decreasing"
            
            trajectory["learning_velocity"] = (second_half_avg - first_half_avg) / total_days
        
        return trajectory

# Global instance
personality_learning_manager = PersonalityLearningManager()
