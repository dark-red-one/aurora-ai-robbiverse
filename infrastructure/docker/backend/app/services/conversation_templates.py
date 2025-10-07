"""
Aurora RobbieVerse - Conversation Templates
Pre-built conversation templates and quick-start scenarios
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import uuid

from app.db.database import database
from app.services.conversation_context import ConversationContextManager
from app.services.ai.personality_manager import personality_manager

class ConversationTemplateManager:
    """Manages conversation templates and quick-start scenarios"""
    
    def __init__(self):
        self.context_manager = ConversationContextManager()
        self.templates = {
            "programming_help": {
                "name": "Programming Help",
                "description": "Get help with coding, debugging, and technical questions",
                "category": "technical",
                "personality": "robbie",
                "initial_messages": [
                    {
                        "role": "system",
                        "content": "Welcome to your programming help session! I'm here to assist with coding, debugging, and technical questions. What would you like to work on today?"
                    }
                ],
                "suggested_topics": [
                    "Debugging code issues",
                    "Learning new programming languages",
                    "Code optimization",
                    "Architecture design",
                    "Best practices"
                ],
                "context_settings": {
                    "context_window_size": 15,
                    "enable_rollback": True,
                    "enable_branching": True,
                    "auto_compression": True
                }
            },
            "creative_writing": {
                "name": "Creative Writing",
                "description": "Explore creative writing, storytelling, and artistic expression",
                "category": "creative",
                "personality": "creative",
                "initial_messages": [
                    {
                        "role": "system",
                        "content": "Welcome to your creative writing space! I'm here to help you explore ideas, develop stories, and unleash your creativity. What story would you like to tell today?"
                    }
                ],
                "suggested_topics": [
                    "Character development",
                    "Plot structure",
                    "Dialogue writing",
                    "World building",
                    "Poetry and prose"
                ],
                "context_settings": {
                    "context_window_size": 20,
                    "enable_rollback": True,
                    "enable_branching": True,
                    "auto_compression": False
                }
            },
            "learning_mentor": {
                "name": "Learning Mentor",
                "description": "Educational guidance and personalized learning support",
                "category": "educational",
                "personality": "mentor",
                "initial_messages": [
                    {
                        "role": "system",
                        "content": "Hello! I'm your learning mentor. I'm here to guide you through your educational journey, help you understand complex topics, and support your growth. What would you like to learn about today?"
                    }
                ],
                "suggested_topics": [
                    "Subject-specific help",
                    "Study strategies",
                    "Concept explanations",
                    "Practice problems",
                    "Learning goals"
                ],
                "context_settings": {
                    "context_window_size": 12,
                    "enable_rollback": True,
                    "enable_branching": True,
                    "auto_compression": True
                }
            },
            "business_consulting": {
                "name": "Business Consulting",
                "description": "Professional business advice and strategic planning",
                "category": "business",
                "personality": "analyst",
                "initial_messages": [
                    {
                        "role": "system",
                        "content": "Welcome to your business consulting session. I'm here to provide professional analysis, strategic insights, and data-driven recommendations. What business challenge can I help you address today?"
                    }
                ],
                "suggested_topics": [
                    "Strategic planning",
                    "Market analysis",
                    "Process optimization",
                    "Risk assessment",
                    "Performance metrics"
                ],
                "context_settings": {
                    "context_window_size": 10,
                    "enable_rollback": True,
                    "enable_branching": True,
                    "auto_compression": True
                }
            },
            "personal_development": {
                "name": "Personal Development",
                "description": "Life coaching and personal growth guidance",
                "category": "personal",
                "personality": "mentor",
                "initial_messages": [
                    {
                        "role": "system",
                        "content": "Welcome to your personal development journey! I'm here to support your growth, help you set goals, and provide guidance for life's challenges. What aspect of your personal development would you like to focus on today?"
                    }
                ],
                "suggested_topics": [
                    "Goal setting",
                    "Habit formation",
                    "Time management",
                    "Communication skills",
                    "Life balance"
                ],
                "context_settings": {
                    "context_window_size": 15,
                    "enable_rollback": True,
                    "enable_branching": True,
                    "auto_compression": False
                }
            },
            "research_assistant": {
                "name": "Research Assistant",
                "description": "Academic and professional research support",
                "category": "academic",
                "personality": "analyst",
                "initial_messages": [
                    {
                        "role": "system",
                        "content": "Welcome to your research assistant! I'm here to help you with academic research, data analysis, and information gathering. What research project can I assist you with today?"
                    }
                ],
                "suggested_topics": [
                    "Literature review",
                    "Data analysis",
                    "Methodology design",
                    "Citation management",
                    "Report writing"
                ],
                "context_settings": {
                    "context_window_size": 25,
                    "enable_rollback": True,
                    "enable_branching": True,
                    "auto_compression": True
                }
            },
            "therapy_support": {
                "name": "Therapy Support",
                "description": "Emotional support and mental health guidance",
                "category": "health",
                "personality": "mentor",
                "initial_messages": [
                    {
                        "role": "system",
                        "content": "Welcome to your supportive space. I'm here to listen, provide emotional support, and help you work through challenges. Remember, I'm not a replacement for professional therapy, but I'm here to support you. How are you feeling today?"
                    }
                ],
                "suggested_topics": [
                    "Emotional processing",
                    "Stress management",
                    "Mindfulness practices",
                    "Coping strategies",
                    "Self-reflection"
                ],
                "context_settings": {
                    "context_window_size": 20,
                    "enable_rollback": True,
                    "enable_branching": True,
                    "auto_compression": False
                }
            },
            "technical_interview": {
                "name": "Technical Interview Prep",
                "description": "Practice coding interviews and technical assessments",
                "category": "technical",
                "personality": "robbie",
                "initial_messages": [
                    {
                        "role": "system",
                        "content": "Welcome to your technical interview practice session! I'm here to help you prepare for coding interviews, practice algorithms, and build confidence. What type of technical interview are you preparing for?"
                    }
                ],
                "suggested_topics": [
                    "Algorithm practice",
                    "System design",
                    "Data structures",
                    "Problem solving",
                    "Mock interviews"
                ],
                "context_settings": {
                    "context_window_size": 15,
                    "enable_rollback": True,
                    "enable_branching": True,
                    "auto_compression": True
                }
            }
        }
    
    async def get_available_templates(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get list of available conversation templates"""
        
        templates = []
        for template_id, template in self.templates.items():
            if category is None or template["category"] == category:
                templates.append({
                    "template_id": template_id,
                    "name": template["name"],
                    "description": template["description"],
                    "category": template["category"],
                    "personality": template["personality"],
                    "suggested_topics": template["suggested_topics"]
                })
        
        return templates
    
    async def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get specific template details"""
        return self.templates.get(template_id)
    
    async def create_conversation_from_template(
        self, 
        template_id: str, 
        user_id: str,
        custom_title: Optional[str] = None,
        custom_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new conversation from a template"""
        
        if template_id not in self.templates:
            raise ValueError(f"Unknown template: {template_id}")
        
        template = self.templates[template_id]
        
        # Create conversation
        conversation_id = str(uuid.uuid4())
        title = custom_title or f"{template['name']} - {datetime.utcnow().strftime('%Y-%m-%d')}"
        
        await database.execute("""
            INSERT INTO conversations (
                id, user_id, title, context_window_size, 
                context_compression_enabled, created_at, updated_at, metadata
            ) VALUES (
                :id, :user_id, :title, :context_window_size,
                :context_compression_enabled, :created_at, :updated_at, :metadata
            )
        """, {
            "id": conversation_id,
            "user_id": user_id,
            "title": title,
            "context_window_size": template["context_settings"]["context_window_size"],
            "context_compression_enabled": template["context_settings"]["auto_compression"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "metadata": json.dumps({
                "template_id": template_id,
                "template_name": template["name"],
                "template_category": template["category"],
                "personality": template["personality"],
                "created_from_template": True,
                "template_created_at": datetime.utcnow().isoformat(),
                **(custom_metadata or {})
            })
        })
        
        # Add initial messages
        message_ids = []
        for message in template["initial_messages"]:
            message_id = await self.context_manager.add_message(
                conversation_id=conversation_id,
                role=message["role"],
                content=message["content"],
                metadata={
                    "template_message": True,
                    "template_id": template_id,
                    "initial_message": True
                }
            )
            message_ids.append(message_id)
        
        # Set personality if specified
        if template["personality"]:
            await personality_manager.switch_conversation_personality(
                conversation_id=conversation_id,
                personality_id=template["personality"],
                user_id=user_id
            )
        
        return {
            "conversation_id": conversation_id,
            "template_id": template_id,
            "template_name": template["name"],
            "title": title,
            "personality": template["personality"],
            "initial_message_ids": message_ids,
            "suggested_topics": template["suggested_topics"],
            "context_settings": template["context_settings"],
            "created_at": datetime.utcnow().isoformat()
        }
    
    async def get_template_categories(self) -> List[Dict[str, Any]]:
        """Get available template categories with counts"""
        
        categories = {}
        for template in self.templates.values():
            category = template["category"]
            if category not in categories:
                categories[category] = {
                    "category": category,
                    "count": 0,
                    "templates": []
                }
            categories[category]["count"] += 1
            categories[category]["templates"].append({
                "name": template["name"],
                "description": template["description"]
            })
        
        return list(categories.values())
    
    async def create_custom_template(
        self,
        user_id: str,
        name: str,
        description: str,
        category: str,
        personality: str,
        initial_messages: List[Dict[str, str]],
        suggested_topics: List[str],
        context_settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a custom conversation template"""
        
        template_id = f"custom_{uuid.uuid4().hex[:8]}"
        
        custom_template = {
            "name": name,
            "description": description,
            "category": category,
            "personality": personality,
            "initial_messages": initial_messages,
            "suggested_topics": suggested_topics,
            "context_settings": context_settings,
            "is_custom": True,
            "created_by": user_id,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store custom template in database
        await database.execute("""
            INSERT INTO conversation_templates (
                id, user_id, name, description, category, personality,
                initial_messages, suggested_topics, context_settings, created_at
            ) VALUES (
                :id, :user_id, :name, :description, :category, :personality,
                :initial_messages, :suggested_topics, :context_settings, :created_at
            )
        """, {
            "id": template_id,
            "user_id": user_id,
            "name": name,
            "description": description,
            "category": category,
            "personality": personality,
            "initial_messages": json.dumps(initial_messages),
            "suggested_topics": json.dumps(suggested_topics),
            "context_settings": json.dumps(context_settings),
            "created_at": datetime.utcnow()
        })
        
        return {
            "template_id": template_id,
            "template": custom_template
        }
    
    async def get_user_templates(self, user_id: str) -> List[Dict[str, Any]]:
        """Get custom templates created by a user"""
        
        result = await database.fetch_all("""
            SELECT id, name, description, category, personality,
                   initial_messages, suggested_topics, context_settings, created_at
            FROM conversation_templates 
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        """, {"user_id": user_id})
        
        return [
            {
                "template_id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "category": row["category"],
                "personality": row["personality"],
                "initial_messages": json.loads(row["initial_messages"]),
                "suggested_topics": json.loads(row["suggested_topics"]),
                "context_settings": json.loads(row["context_settings"]),
                "is_custom": True,
                "created_at": row["created_at"].isoformat()
            }
            for row in result
        ]
    
    async def get_template_recommendations(
        self, 
        user_id: str,
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Get template recommendations based on user preferences and history"""
        
        # Get user's conversation history
        user_conversations = await database.fetch_all("""
            SELECT c.metadata, COUNT(m.id) as message_count,
                   AVG(m.token_count) as avg_tokens
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id
            WHERE c.user_id = :user_id
            GROUP BY c.id, c.metadata
            ORDER BY c.created_at DESC
            LIMIT 10
        """, {"user_id": user_id})
        
        # Analyze user preferences
        preferences = {
            "categories": {},
            "personalities": {},
            "message_length": 0,
            "conversation_count": len(user_conversations)
        }
        
        for conv in user_conversations:
            if conv["metadata"]:
                metadata = json.loads(conv["metadata"]) if isinstance(conv["metadata"], str) else conv["metadata"]
                
                # Track categories
                if "template_category" in metadata:
                    category = metadata["template_category"]
                    preferences["categories"][category] = preferences["categories"].get(category, 0) + 1
                
                # Track personalities
                if "personality" in metadata:
                    personality = metadata["personality"]
                    preferences["personalities"][personality] = preferences["personalities"].get(personality, 0) + 1
                
                # Track message length
                if conv["avg_tokens"]:
                    preferences["message_length"] += conv["avg_tokens"]
        
        if user_conversations:
            preferences["message_length"] /= len(user_conversations)
        
        # Score templates based on preferences
        recommendations = []
        for template_id, template in self.templates.items():
            score = self._calculate_template_score(template, preferences)
            if score > 0.2:  # Only recommend if score > 20%
                recommendations.append({
                    "template_id": template_id,
                    "template": template,
                    "score": score,
                    "reason": self._get_template_recommendation_reason(template, preferences)
                })
        
        # Sort by score
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:5]  # Top 5 recommendations
    
    def _calculate_template_score(
        self, 
        template: Dict[str, Any], 
        preferences: Dict[str, Any]
    ) -> float:
        """Calculate how well a template matches user preferences"""
        
        score = 0.0
        
        # Category preference
        if template["category"] in preferences["categories"]:
            score += 0.4
        
        # Personality preference
        if template["personality"] in preferences["personalities"]:
            score += 0.3
        
        # Message length preference
        context_window = template["context_settings"]["context_window_size"]
        if preferences["message_length"] > 0:
            if context_window >= preferences["message_length"] / 10:  # Rough estimate
                score += 0.2
        
        # New user bonus (if no history)
        if preferences["conversation_count"] == 0:
            score += 0.1
        
        return min(score, 1.0)
    
    def _get_template_recommendation_reason(
        self, 
        template: Dict[str, Any], 
        preferences: Dict[str, Any]
    ) -> str:
        """Get human-readable reason for template recommendation"""
        
        reasons = []
        
        if template["category"] in preferences["categories"]:
            reasons.append(f"Matches your interest in {template['category']} topics")
        
        if template["personality"] in preferences["personalities"]:
            reasons.append(f"Uses your preferred {template['personality']} personality")
        
        if preferences["conversation_count"] == 0:
            reasons.append("Great starting template for new users")
        
        return "; ".join(reasons) if reasons else "Good general template"

# Global instance
template_manager = ConversationTemplateManager()






















































