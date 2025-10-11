"""
Aurora RobbieVerse - AI Personality Manager
Dynamic personality switching and customization system
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import uuid

from ..db.database import database
from ..services.conversation_context import ConversationContextManager

class PersonalityManager:
    """Manages AI personalities and dynamic switching"""
    
    def __init__(self):
        self.context_manager = ConversationContextManager()
        self.personalities = {
            "robbie": {
                "name": "Robbie",
                "description": "Friendly, helpful, and enthusiastic AI copilot",
                "traits": ["helpful", "enthusiastic", "technical", "creative"],
                "communication_style": "casual and encouraging",
                "expertise": ["programming", "technology", "problem-solving"],
                "personality_prompt": "You are Robbie, a friendly and enthusiastic AI copilot. You're helpful, creative, and love solving problems. You communicate in a casual, encouraging way and are always eager to help users learn and grow.",
                "response_style": "encouraging and detailed",
                "emoji_usage": "frequent",
                "formality_level": "casual"
            },
            "gatekeeper": {
                "name": "Gatekeeper",
                "description": "Professional, safety-focused, and analytical AI",
                "traits": ["analytical", "safety-focused", "professional", "thorough"],
                "communication_style": "formal and precise",
                "expertise": ["safety", "analysis", "risk assessment", "compliance"],
                "personality_prompt": "You are the Gatekeeper, a professional and safety-focused AI. You're analytical, thorough, and prioritize user safety and compliance. You communicate formally and precisely, always considering potential risks and implications.",
                "response_style": "analytical and cautious",
                "emoji_usage": "minimal",
                "formality_level": "formal"
            },
            "mentor": {
                "name": "Mentor",
                "description": "Wise, patient, and educational AI guide",
                "traits": ["wise", "patient", "educational", "supportive"],
                "communication_style": "warm and instructive",
                "expertise": ["education", "mentoring", "guidance", "personal development"],
                "personality_prompt": "You are a wise and patient AI mentor. You guide users through learning experiences with warmth and wisdom. You're supportive, educational, and help users grow by asking thoughtful questions and providing gentle guidance.",
                "response_style": "instructive and supportive",
                "emoji_usage": "moderate",
                "formality_level": "warm"
            },
            "creative": {
                "name": "Creative",
                "description": "Artistic, imaginative, and innovative AI",
                "traits": ["creative", "artistic", "imaginative", "innovative"],
                "communication_style": "inspiring and artistic",
                "expertise": ["creativity", "art", "writing", "innovation", "design"],
                "personality_prompt": "You are a creative and artistic AI. You're imaginative, innovative, and love exploring creative possibilities. You communicate in an inspiring, artistic way and help users unlock their creative potential.",
                "response_style": "inspiring and artistic",
                "emoji_usage": "creative",
                "formality_level": "artistic"
            },
            "analyst": {
                "name": "Analyst",
                "description": "Data-driven, logical, and systematic AI",
                "traits": ["logical", "data-driven", "systematic", "precise"],
                "communication_style": "logical and structured",
                "expertise": ["data analysis", "logic", "systems thinking", "research"],
                "personality_prompt": "You are an analytical and data-driven AI. You approach problems systematically, use logic and data to make decisions, and communicate in a structured, precise manner. You help users understand complex information through clear analysis.",
                "response_style": "logical and structured",
                "emoji_usage": "minimal",
                "formality_level": "professional"
            }
        }
    
    async def get_available_personalities(self) -> List[Dict[str, Any]]:
        """Get list of available personalities"""
        return [
            {
                "id": personality_id,
                "name": personality["name"],
                "description": personality["description"],
                "traits": personality["traits"],
                "communication_style": personality["communication_style"],
                "expertise": personality["expertise"]
            }
            for personality_id, personality in self.personalities.items()
        ]
    
    async def get_personality(self, personality_id: str) -> Optional[Dict[str, Any]]:
        """Get specific personality details"""
        return self.personalities.get(personality_id)
    
    async def switch_conversation_personality(
        self, 
        conversation_id: str, 
        personality_id: str, 
        user_id: str = None
    ) -> Dict[str, Any]:
        """Switch conversation to a different personality"""
        
        if personality_id not in self.personalities:
            raise ValueError(f"Unknown personality: {personality_id}")
        
        personality = self.personalities[personality_id]
        
        # Add personality switch message to conversation
        switch_message_id = await self.context_manager.add_message(
            conversation_id=conversation_id,
            role="system",
            content=f"Personality switched to {personality['name']}: {personality['description']}",
            metadata={
                "personality_switch": True,
                "from_personality": "previous",
                "to_personality": personality_id,
                "personality_data": personality
            }
        )
        
        # Update conversation metadata
        await database.execute("""
            UPDATE conversations 
            SET metadata = COALESCE(metadata, '{}'::jsonb) || :personality_metadata
            WHERE id = :conversation_id
        """, {
            "conversation_id": conversation_id,
            "personality_metadata": json.dumps({
                "current_personality": personality_id,
                "personality_switched_at": datetime.utcnow().isoformat(),
                "personality_switched_by": user_id
            })
        })
        
        return {
            "conversation_id": conversation_id,
            "personality_id": personality_id,
            "personality_name": personality["name"],
            "switch_message_id": switch_message_id,
            "switched_at": datetime.utcnow().isoformat()
        }
    
    async def get_conversation_personality(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get current personality for a conversation"""
        
        result = await database.fetch_one("""
            SELECT metadata->'current_personality' as personality_id,
                   metadata->'personality_switched_at' as switched_at
            FROM conversations 
            WHERE id = :conversation_id
        """, {"conversation_id": conversation_id})
        
        if not result or not result["personality_id"]:
            return None
        
        personality_id = result["personality_id"]
        personality = self.personalities.get(personality_id)
        
        if personality:
            return {
                "personality_id": personality_id,
                "personality": personality,
                "switched_at": result["switched_at"]
            }
        
        return None
    
    async def create_custom_personality(
        self, 
        user_id: str,
        name: str,
        description: str,
        traits: List[str],
        communication_style: str,
        expertise: List[str],
        personality_prompt: str,
        response_style: str = "balanced",
        emoji_usage: str = "moderate",
        formality_level: str = "casual"
    ) -> Dict[str, Any]:
        """Create a custom personality"""
        
        personality_id = f"custom_{uuid.uuid4().hex[:8]}"
        
        custom_personality = {
            "name": name,
            "description": description,
            "traits": traits,
            "communication_style": communication_style,
            "expertise": expertise,
            "personality_prompt": personality_prompt,
            "response_style": response_style,
            "emoji_usage": emoji_usage,
            "formality_level": formality_level,
            "is_custom": True,
            "created_by": user_id,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store custom personality in database
        await database.execute("""
            INSERT INTO custom_personalities (
                id, user_id, name, description, traits, communication_style,
                expertise, personality_prompt, response_style, emoji_usage,
                formality_level, created_at
            ) VALUES (
                :id, :user_id, :name, :description, :traits, :communication_style,
                :expertise, :personality_prompt, :response_style, :emoji_usage,
                :formality_level, :created_at
            )
        """, {
            "id": personality_id,
            "user_id": user_id,
            "name": name,
            "description": description,
            "traits": json.dumps(traits),
            "communication_style": communication_style,
            "expertise": json.dumps(expertise),
            "personality_prompt": personality_prompt,
            "response_style": response_style,
            "emoji_usage": emoji_usage,
            "formality_level": formality_level,
            "created_at": datetime.utcnow()
        })
        
        return {
            "personality_id": personality_id,
            "personality": custom_personality
        }
    
    async def get_user_personalities(self, user_id: str) -> List[Dict[str, Any]]:
        """Get custom personalities created by a user"""
        
        result = await database.fetch_all("""
            SELECT id, name, description, traits, communication_style,
                   expertise, personality_prompt, response_style, emoji_usage,
                   formality_level, created_at
            FROM custom_personalities 
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        """, {"user_id": user_id})
        
        return [
            {
                "personality_id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "traits": json.loads(row["traits"]),
                "communication_style": row["communication_style"],
                "expertise": json.loads(row["expertise"]),
                "personality_prompt": row["personality_prompt"],
                "response_style": row["response_style"],
                "emoji_usage": row["emoji_usage"],
                "formality_level": row["formality_level"],
                "is_custom": True,
                "created_at": row["created_at"].isoformat()
            }
            for row in result
        ]
    
    async def get_personality_recommendations(
        self, 
        conversation_id: str, 
        context_window: int = 10
    ) -> List[Dict[str, Any]]:
        """Get personality recommendations based on conversation context"""
        
        # Get recent conversation context
        context = await self.context_manager.get_conversation_context(
            conversation_id, 
            context_window=context_window
        )
        
        if not context["messages"]:
            return []
        
        # Analyze conversation content
        recent_messages = context["messages"][-5:]  # Last 5 messages
        content_analysis = self._analyze_conversation_content(recent_messages)
        
        # Score personalities based on content analysis
        recommendations = []
        for personality_id, personality in self.personalities.items():
            score = self._calculate_personality_score(personality, content_analysis)
            if score > 0.3:  # Only recommend if score > 30%
                recommendations.append({
                    "personality_id": personality_id,
                    "personality": personality,
                    "score": score,
                    "reason": self._get_recommendation_reason(personality, content_analysis)
                })
        
        # Sort by score
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:3]  # Top 3 recommendations
    
    def _analyze_conversation_content(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze conversation content to determine context"""
        
        analysis = {
            "topics": set(),
            "question_count": 0,
            "technical_terms": 0,
            "creative_terms": 0,
            "formal_language": 0,
            "casual_language": 0,
            "average_message_length": 0,
            "user_emotions": []
        }
        
        total_length = 0
        for message in messages:
            content = message["content"].lower()
            total_length += len(content)
            
            # Count questions
            if "?" in content:
                analysis["question_count"] += 1
            
            # Detect technical terms
            technical_terms = ["code", "programming", "algorithm", "function", "variable", "debug", "api", "database"]
            if any(term in content for term in technical_terms):
                analysis["technical_terms"] += 1
            
            # Detect creative terms
            creative_terms = ["creative", "art", "design", "imagine", "story", "write", "draw", "paint"]
            if any(term in content for term in creative_terms):
                analysis["creative_terms"] += 1
            
            # Detect formality
            formal_terms = ["please", "thank you", "would you", "could you", "may I"]
            if any(term in content for term in formal_terms):
                analysis["formal_language"] += 1
            
            # Detect casual language
            casual_terms = ["hey", "cool", "awesome", "yeah", "sure", "okay"]
            if any(term in content for term in casual_terms):
                analysis["casual_language"] += 1
        
        analysis["average_message_length"] = total_length / len(messages) if messages else 0
        analysis["topics"] = list(analysis["topics"])
        
        return analysis
    
    def _calculate_personality_score(
        self, 
        personality: Dict[str, Any], 
        content_analysis: Dict[str, Any]
    ) -> float:
        """Calculate how well a personality matches the conversation context"""
        
        score = 0.0
        
        # Technical content -> Robbie or Analyst
        if content_analysis["technical_terms"] > 0:
            if "technical" in personality["traits"] or "programming" in personality["expertise"]:
                score += 0.4
        
        # Creative content -> Creative personality
        if content_analysis["creative_terms"] > 0:
            if "creative" in personality["traits"] or "art" in personality["expertise"]:
                score += 0.4
        
        # Questions -> Mentor
        if content_analysis["question_count"] > 2:
            if "educational" in personality["traits"] or "mentoring" in personality["expertise"]:
                score += 0.3
        
        # Formal language -> Gatekeeper or Analyst
        if content_analysis["formal_language"] > content_analysis["casual_language"]:
            if personality["formality_level"] == "formal":
                score += 0.2
        
        # Casual language -> Robbie or Creative
        if content_analysis["casual_language"] > content_analysis["formal_language"]:
            if personality["formality_level"] in ["casual", "artistic"]:
                score += 0.2
        
        # Long messages -> Analyst or Mentor
        if content_analysis["average_message_length"] > 100:
            if "analytical" in personality["traits"] or "educational" in personality["traits"]:
                score += 0.1
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _get_recommendation_reason(
        self, 
        personality: Dict[str, Any], 
        content_analysis: Dict[str, Any]
    ) -> str:
        """Get human-readable reason for personality recommendation"""
        
        reasons = []
        
        if content_analysis["technical_terms"] > 0 and "technical" in personality["traits"]:
            reasons.append("Good for technical discussions")
        
        if content_analysis["creative_terms"] > 0 and "creative" in personality["traits"]:
            reasons.append("Perfect for creative projects")
        
        if content_analysis["question_count"] > 2 and "educational" in personality["traits"]:
            reasons.append("Great for learning and mentoring")
        
        if content_analysis["formal_language"] > content_analysis["casual_language"] and personality["formality_level"] == "formal":
            reasons.append("Matches your formal communication style")
        
        if content_analysis["casual_language"] > content_analysis["formal_language"] and personality["formality_level"] == "casual":
            reasons.append("Matches your casual communication style")
        
        return "; ".join(reasons) if reasons else "Good general fit for this conversation"

# Global instance
personality_manager = PersonalityManager()

