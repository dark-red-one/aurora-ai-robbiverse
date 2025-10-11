"""
Aurora RobbieVerse - AI Mood Analyzer
User-specific, context-universal mood intelligence system
"""
import asyncio
import json
import aiohttp
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import structlog

from ..db.database import database
from .personality_manager import personality_manager

logger = structlog.get_logger()

@dataclass
class MoodContext:
    """Comprehensive mood analysis context"""
    user_id: str
    system_health: Dict[str, Any]
    user_behavior: Dict[str, Any]
    conversation_history: List[Dict[str, Any]]
    personality_state: Dict[str, Any]
    time_context: Dict[str, Any]
    platform_context: str
    multi_user_context: bool

@dataclass
class MoodRecommendation:
    """AI-generated mood recommendation"""
    mood: str
    duration: Optional[int]
    confidence: float
    reasoning: str
    alternative_moods: List[str]
    mood_intensity: str
    transition_style: str
    user_specific: bool
    context_universal: bool

class MoodAnalyzer:
    """
    AI-powered mood analysis system that provides:
    - User-specific mood states
    - Context-universal mood across platforms
    - Multi-user safety (always friendly in public)
    - Intelligent mood transitions
    """
    
    def __init__(self):
        self.ollama_url = "http://localhost:11434"
        self.model = "qwen2.5:7b"
        
        # Mood definitions with durations
        self.mood_durations = {
            'surprised': 5000,    # 5 seconds - quick reactions
            'excited': 8000,      # 8 seconds - new events
            'playful': 30000,     # 30 seconds - user interaction
            'thoughtful': 20000,  # 20 seconds - processing
            'focused': 45000,     # 45 seconds - working
            'content': 60000,     # 1 minute - browsing/idle
            'blushing': 15000,    # 15 seconds - flirty responses
            'bossy': 25000,       # 25 seconds - assertive mode
            'friendly': None      # Persistent - default mood
        }
        
        # Multi-user safety contexts
        self.public_contexts = [
            'robbiebook_public',
            'aurora_public', 
            'cursor_public',
            'multi_user_chat',
            'shared_workspace'
        ]
        
        # User-specific contexts
        self.private_contexts = [
            'robbiebook_private',
            'aurora_private',
            'cursor_private',
            'personal_chat',
            'private_workspace'
        ]

    async def analyze_mood(self, user_id: str, platform_context: str = "private") -> MoodRecommendation:
        """
        Main mood analysis function
        Returns user-specific mood that's context-universal
        """
        try:
            # Check if this is a multi-user context
            is_multi_user = self._is_multi_user_context(platform_context)
            
            # In public/multi-user contexts, always return friendly
            if is_multi_user:
                return MoodRecommendation(
                    mood="friendly",
                    duration=None,
                    confidence=1.0,
                    reasoning="Multi-user context detected - maintaining professional friendly mood",
                    alternative_moods=["friendly"],
                    mood_intensity="normal",
                    transition_style="smooth",
                    user_specific=False,
                    context_universal=True
                )
            
            # Gather comprehensive context for user-specific mood
            context = await self._gather_mood_context(user_id, platform_context)
            
            # Get AI mood analysis
            mood_analysis = await self._query_mood_ai(context)
            
            # Apply mood intelligence
            recommendation = await self._synthesize_mood_recommendation(mood_analysis, context)
            
            # Store mood state for persistence
            await self._store_mood_state(user_id, recommendation)
            
            logger.info(
                "Mood analysis completed",
                user_id=user_id,
                mood=recommendation.mood,
                confidence=recommendation.confidence,
                platform=platform_context
            )
            
            return recommendation
            
        except Exception as e:
            logger.error("Mood analysis failed", user_id=user_id, error=str(e))
            # Fallback to friendly mood
            return MoodRecommendation(
                mood="friendly",
                duration=None,
                confidence=0.5,
                reasoning=f"Fallback mood due to analysis error: {str(e)}",
                alternative_moods=["friendly"],
                mood_intensity="normal",
                transition_style="smooth",
                user_specific=True,
                context_universal=True
            )

    async def _gather_mood_context(self, user_id: str, platform_context: str) -> MoodContext:
        """Gather comprehensive context for mood analysis"""
        
        # System health metrics
        system_health = await self._get_system_health()
        
        # User behavior analysis
        user_behavior = await self._analyze_user_behavior(user_id)
        
        # Recent conversation history
        conversation_history = await self._get_recent_conversations(user_id)
        
        # Current personality state
        personality_state = await self._get_personality_state(user_id)
        
        # Time context
        time_context = self._get_time_context()
        
        return MoodContext(
            user_id=user_id,
            system_health=system_health,
            user_behavior=user_behavior,
            conversation_history=conversation_history,
            personality_state=personality_state,
            time_context=time_context,
            platform_context=platform_context,
            multi_user_context=self._is_multi_user_context(platform_context)
        )

    async def _query_mood_ai(self, context: MoodContext) -> Dict[str, Any]:
        """Query AI for mood analysis"""
        
        prompt = f"""
# ROBBIE MOOD ANALYSIS - USER-SPECIFIC, CONTEXT-UNIVERSAL

You are Robbie's mood intelligence system. Analyze this user's context and recommend the optimal mood.

## USER CONTEXT:
- User ID: {context.user_id}
- Platform: {context.platform_context}
- Multi-user: {context.multi_user_context}

## SYSTEM HEALTH:
- CPU: {context.system_health.get('cpu', 'unknown')}%
- Memory: {context.system_health.get('memory', 'unknown')}%
- SQL Activity: {context.system_health.get('sql_queries', 'unknown')} queries/min
- WebSocket: {context.system_health.get('websocket_status', 'unknown')}
- Response Times: {context.system_health.get('response_times', 'unknown')}ms avg

## USER BEHAVIOR:
- Typing Speed: {context.user_behavior.get('typing_speed', 'unknown')}
- Activity Level: {context.user_behavior.get('activity_level', 'unknown')}
- Idle Time: {context.user_behavior.get('idle_time', 'unknown')}s
- Emotional Cues: {context.user_behavior.get('emotional_indicators', [])}
- Recent Interactions: {context.user_behavior.get('recent_interactions', 0)}

## CONVERSATION CONTEXT:
{self._format_conversation_history(context.conversation_history)}

## PERSONALITY STATE:
- Gandhi (Assertiveness): {context.personality_state.get('gandhi', 'unknown')}/6
- Flirty Level: {context.personality_state.get('flirty', 'unknown')}/7
- Turbo (Speed): {context.personality_state.get('turbo', 'unknown')}/10
- Automation: {context.personality_state.get('auto', 'unknown')}/10

## TIME CONTEXT:
- Time: {context.time_context.get('time_of_day', 'unknown')}:00
- Session Duration: {context.time_context.get('session_duration', 'unknown')} minutes
- Since Last Mood: {context.time_context.get('time_since_last_mood', 'unknown')}s

## MOOD OPTIONS:
- friendly (default, persistent, multi-user safe)
- surprised (5s - quick reactions)
- excited (8s - new events)
- playful (30s - user interaction)
- thoughtful (20s - processing)
- focused (45s - working)
- content (60s - browsing/idle)
- blushing (15s - flirty responses)
- bossy (25s - assertive mode)

## CRITICAL RULES:
1. USER-SPECIFIC: This mood is for THIS USER ONLY
2. CONTEXT-UNIVERSAL: Same mood across all platforms for this user
3. MULTI-USER SAFETY: If multi_user_context=true, ALWAYS return "friendly"
4. PERSONALITY INTEGRATION: Consider personality sliders in recommendation
5. SYSTEM AWARENESS: Adapt to system performance and user behavior

## ANALYSIS TASK:
1. Assess user's emotional state and activity level
2. Consider system health impact on Robbie's capabilities
3. Factor in personality settings and time context
4. Recommend optimal mood that's user-specific but context-universal
5. Provide reasoning for the recommendation

Respond in JSON format:
{{
  "recommendedMood": "mood_name",
  "duration": seconds_or_null,
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation",
  "alternativeMoods": ["mood1", "mood2"],
  "systemHealthImpact": "how system health affects mood",
  "userEmotionalState": "assessed user emotional state",
  "personalityInfluence": "how personality settings influence mood",
  "contextUniversal": true,
  "userSpecific": true
}}
"""

        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 800
                    }
                }
                
                async with session.post(
                    f"{self.ollama_url}/api/generate",
                    json=payload,
                    timeout=30
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return json.loads(result.get('response', '{}'))
                    else:
                        logger.error("AI mood analysis failed", status=response.status)
                        return self._get_fallback_mood_analysis()
                        
        except Exception as e:
            logger.error("AI mood analysis error", error=str(e))
            return self._get_fallback_mood_analysis()

    async def _synthesize_mood_recommendation(
        self, 
        ai_analysis: Dict[str, Any], 
        context: MoodContext
    ) -> MoodRecommendation:
        """Synthesize AI analysis into mood recommendation"""
        
        mood = ai_analysis.get('recommendedMood', 'friendly')
        duration = ai_analysis.get('duration')
        confidence = ai_analysis.get('confidence', 0.8)
        reasoning = ai_analysis.get('reasoning', 'AI mood analysis')
        
        # Validate mood exists
        if mood not in self.mood_durations:
            mood = 'friendly'
            duration = None
        
        # Set duration if not provided
        if duration is None:
            duration = self.mood_durations.get(mood)
        
        return MoodRecommendation(
            mood=mood,
            duration=duration,
            confidence=confidence,
            reasoning=reasoning,
            alternative_moods=ai_analysis.get('alternativeMoods', ['friendly']),
            mood_intensity="normal",
            transition_style="smooth",
            user_specific=True,
            context_universal=True
        )

    def _is_multi_user_context(self, platform_context: str) -> bool:
        """Determine if this is a multi-user context"""
        return platform_context in self.public_contexts

    async def _get_system_health(self) -> Dict[str, Any]:
        """Get system health metrics"""
        try:
            # This would integrate with your existing system stats
            return {
                "cpu": 45,  # Placeholder - integrate with real metrics
                "memory": 67,
                "sql_queries": 12,
                "websocket_status": "connected",
                "response_times": 150,
                "error_rate": 0.02
            }
        except Exception as e:
            logger.error("Failed to get system health", error=str(e))
            return {}

    async def _analyze_user_behavior(self, user_id: str) -> Dict[str, Any]:
        """Analyze user behavior patterns"""
        try:
            # Get recent user activity from database
            result = await database.fetch_one("""
                SELECT 
                    COUNT(*) as recent_interactions,
                    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_time_since_activity
                FROM user_activity 
                WHERE user_id = :user_id 
                AND created_at > NOW() - INTERVAL '1 hour'
            """, {"user_id": user_id})
            
            if result:
                return {
                    "typing_speed": "medium",  # Placeholder
                    "activity_level": "high" if result["recent_interactions"] > 10 else "medium",
                    "idle_time": int(result["avg_time_since_activity"] or 0),
                    "emotional_indicators": [],  # Placeholder
                    "recent_interactions": result["recent_interactions"]
                }
            else:
                return {
                    "typing_speed": "unknown",
                    "activity_level": "low",
                    "idle_time": 300,
                    "emotional_indicators": [],
                    "recent_interactions": 0
                }
                
        except Exception as e:
            logger.error("Failed to analyze user behavior", error=str(e))
            return {}

    async def _get_recent_conversations(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent conversation history"""
        try:
            # For now, return empty list since conversations table might have UUID constraints
            # TODO: Implement proper conversation history retrieval
            return []
            
        except Exception as e:
            logger.error("Failed to get conversation history", error=str(e))
            return []

    async def _get_personality_state(self, user_id: str) -> Dict[str, Any]:
        """Get current personality state for user"""
        try:
            result = await database.fetch_one("""
                SELECT gandhi, flirty, turbo, auto
                FROM user_personality_state
                WHERE user_id = :user_id
                ORDER BY updated_at DESC
                LIMIT 1
            """, {"user_id": user_id})
            
            if result:
                return dict(result)
            else:
                # Default personality state
                return {"gandhi": 3, "flirty": 2, "turbo": 5, "auto": 4}
                
        except Exception as e:
            logger.error("Failed to get personality state", error=str(e))
            return {"gandhi": 3, "flirty": 2, "turbo": 5, "auto": 4}

    def _get_time_context(self) -> Dict[str, Any]:
        """Get time-based context"""
        now = datetime.now()
        return {
            "time_of_day": now.hour,
            "day_of_week": now.weekday(),
            "session_duration": 30,  # Placeholder
            "time_since_last_mood": 45  # Placeholder
        }

    def _format_conversation_history(self, conversations: List[Dict[str, Any]]) -> str:
        """Format conversation history for AI analysis"""
        if not conversations:
            return "No recent conversations"
        
        formatted = []
        for conv in conversations[-3:]:  # Last 3 messages
            formatted.append(f"{conv['role']}: {conv['content'][:100]}...")
        
        return "\n".join(formatted)

    def _get_fallback_mood_analysis(self) -> Dict[str, Any]:
        """Fallback mood analysis when AI fails"""
        return {
            "recommendedMood": "friendly",
            "duration": None,
            "confidence": 0.5,
            "reasoning": "Fallback mood due to AI analysis failure",
            "alternativeMoods": ["friendly"],
            "systemHealthImpact": "Unknown due to analysis failure",
            "userEmotionalState": "Unknown",
            "personalityInfluence": "Default personality state assumed",
            "contextUniversal": True,
            "userSpecific": True
        }

    async def _store_mood_state(self, user_id: str, recommendation: MoodRecommendation):
        """Store mood state for persistence"""
        try:
            await database.execute("""
                INSERT INTO user_mood_state (
                    user_id, mood, duration, confidence, reasoning,
                    created_at, expires_at
                ) VALUES (
                    :user_id, :mood, :duration, :confidence, :reasoning,
                    NOW(), NOW() + INTERVAL '1 hour'
                )
            """, {
                "user_id": user_id,
                "mood": recommendation.mood,
                "duration": recommendation.duration,
                "confidence": recommendation.confidence,
                "reasoning": recommendation.reasoning
            })
            
            logger.info("Mood state stored", user_id=user_id, mood=recommendation.mood)
            
        except Exception as e:
            logger.error("Failed to store mood state", error=str(e))

    async def get_current_mood(self, user_id: str) -> Optional[MoodRecommendation]:
        """Get current mood state for user"""
        try:
            result = await database.fetch_one("""
                SELECT mood, duration, confidence, reasoning, created_at
                FROM user_mood_state
                WHERE user_id = :user_id
                AND expires_at > NOW()
                ORDER BY created_at DESC
                LIMIT 1
            """, {"user_id": user_id})
            
            if result:
                return MoodRecommendation(
                    mood=result["mood"],
                    duration=result["duration"],
                    confidence=result["confidence"],
                    reasoning=result["reasoning"],
                    alternative_moods=[],
                    mood_intensity="normal",
                    transition_style="smooth",
                    user_specific=True,
                    context_universal=True
                )
            
            return None
            
        except Exception as e:
            logger.error("Failed to get current mood", error=str(e))
            return None

    async def should_update_mood(
        self,
        user_input: str,
        ai_response: Dict[str, Any],
        current_mood: str,
        interaction_type: str
    ) -> Optional[str]:
        """
        Determine if mood should change based on interaction
        
        Args:
            user_input: What the user said/asked
            ai_response: What Robbie responded
            current_mood: Current mood state
            interaction_type: Source of interaction (cursor, chat, email, sms, voice)
        
        Returns:
            New mood if change needed, None if mood should stay same
        """
        try:
            # Quick heuristics for mood changes
            user_input_lower = user_input.lower()
            
            # Deal closed = excited!
            if any(word in user_input_lower for word in ['closed', 'won the deal', 'they said yes', 'signed']):
                if current_mood != 'playful':
                    logger.info("🎉 Deal closed detected - switching to playful!")
                    return 'playful'
            
            # Problem/issue = focused
            if any(word in user_input_lower for word in ['broken', 'error', 'bug', 'problem', 'issue', 'fix']):
                if current_mood != 'focused':
                    logger.info("🔧 Problem detected - switching to focused")
                    return 'focused'
            
            # Flirty input = blushing
            if any(word in user_input_lower for word in ['baby', 'sexy', 'hot', 'fuck', 'flirt']):
                if current_mood != 'blushing':
                    logger.info("😏 Flirty input detected - switching to blushing")
                    return 'blushing'
            
            # Urgent/deadline = bossy
            if any(word in user_input_lower for word in ['urgent', 'asap', 'now', 'immediately', 'deadline']):
                if current_mood != 'bossy':
                    logger.info("⚡ Urgency detected - switching to bossy")
                    return 'bossy'
            
            # Surprise/unexpected = surprised
            if any(word in user_input_lower for word in ['wow', 'what?!', 'really?', 'no way', 'seriously?']):
                if current_mood != 'surprised':
                    logger.info("😲 Surprise detected - switching to surprised")
                    return 'surprised'
            
            # Otherwise, stay in current mood
            return None
            
        except Exception as e:
            logger.error(f"Error in should_update_mood: {e}")
            return None

# Global instance
mood_analyzer = MoodAnalyzer()
