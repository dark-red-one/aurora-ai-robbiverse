"""
LearningService.py
==================
Real-time learning system that makes Robbie smarter with every interaction.

This service:
- Logs all user interactions and AI responses
- Identifies patterns in user behavior and preferences
- Tracks what works and what doesn't
- Updates AI routing priorities based on success
- Learns user's communication style and preferences
- Improves response quality over time

The system LEARNS from:
- Which models produce better responses for different tasks
- User satisfaction signals (explicit feedback, conversation length, follow-ups)
- Time of day patterns
- Topic preferences
- Communication style preferences

This creates a feedback loop where Robbie gets smarter with every conversation.
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Interaction:
    """A single user interaction"""
    timestamp: datetime
    user_id: str
    prompt: str
    response: str
    model_used: str
    response_time: float
    satisfaction_score: Optional[float] = None
    topic: Optional[str] = None
    context: Optional[Dict] = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data
    
    @staticmethod
    def from_dict(data: Dict) -> 'Interaction':
        """Create from dictionary"""
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return Interaction(**data)


@dataclass
class UserProfile:
    """User behavior and preference profile"""
    user_id: str
    total_interactions: int = 0
    preferred_models: Dict[str, int] = None
    topic_interests: Dict[str, int] = None
    avg_satisfaction: float = 0.0
    communication_style: str = "standard"  # casual, formal, technical, creative
    active_times: Dict[str, int] = None  # hour -> count
    last_updated: Optional[datetime] = None
    
    def __post_init__(self):
        if self.preferred_models is None:
            self.preferred_models = {}
        if self.topic_interests is None:
            self.topic_interests = {}
        if self.active_times is None:
            self.active_times = {}
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['last_updated'] = self.last_updated.isoformat() if self.last_updated else None
        return data
    
    @staticmethod
    def from_dict(data: Dict) -> 'UserProfile':
        """Create from dictionary"""
        if data.get('last_updated'):
            data['last_updated'] = datetime.fromisoformat(data['last_updated'])
        return UserProfile(**data)


class LearningService:
    """
    Service that learns from every interaction to improve future responses
    """
    
    def __init__(self, data_dir: str = "/home/allan/aurora-ai-robbiverse/data/learning"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
        self.interactions_file = os.path.join(data_dir, "interactions.jsonl")
        self.profiles_file = os.path.join(data_dir, "user_profiles.json")
        self.patterns_file = os.path.join(data_dir, "learned_patterns.json")
        
        self.user_profiles: Dict[str, UserProfile] = {}
        self.learned_patterns: Dict[str, Any] = {}
        self.interaction_count = 0
        
        self._load_data()
    
    def _load_data(self):
        """Load existing learning data"""
        # Load user profiles
        try:
            if os.path.exists(self.profiles_file):
                with open(self.profiles_file, 'r') as f:
                    data = json.load(f)
                    self.user_profiles = {
                        uid: UserProfile.from_dict(profile_data)
                        for uid, profile_data in data.items()
                    }
                logger.info(f"Loaded {len(self.user_profiles)} user profiles")
        except Exception as e:
            logger.error(f"Error loading user profiles: {e}")
        
        # Load learned patterns
        try:
            if os.path.exists(self.patterns_file):
                with open(self.patterns_file, 'r') as f:
                    self.learned_patterns = json.load(f)
                logger.info(f"Loaded learned patterns")
        except Exception as e:
            logger.error(f"Error loading patterns: {e}")
        
        # Count interactions
        try:
            if os.path.exists(self.interactions_file):
                with open(self.interactions_file, 'r') as f:
                    self.interaction_count = sum(1 for _ in f)
                logger.info(f"Found {self.interaction_count} historical interactions")
        except Exception as e:
            logger.error(f"Error counting interactions: {e}")
    
    def _save_profiles(self):
        """Save user profiles"""
        try:
            with open(self.profiles_file, 'w') as f:
                json.dump({
                    uid: profile.to_dict()
                    for uid, profile in self.user_profiles.items()
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving profiles: {e}")
    
    def _save_patterns(self):
        """Save learned patterns"""
        try:
            with open(self.patterns_file, 'w') as f:
                json.dump(self.learned_patterns, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving patterns: {e}")
    
    def log_interaction(self,
                       user_id: str,
                       prompt: str,
                       response: str,
                       model_used: str,
                       response_time: float,
                       satisfaction_score: Optional[float] = None,
                       topic: Optional[str] = None,
                       context: Optional[Dict] = None):
        """
        Log an interaction and learn from it
        
        Args:
            user_id: User identifier
            prompt: User's prompt
            response: AI response
            model_used: Which model was used
            response_time: How long it took
            satisfaction_score: Optional explicit satisfaction (0-1)
            topic: Optional topic classification
            context: Optional additional context
        """
        interaction = Interaction(
            timestamp=datetime.now(),
            user_id=user_id,
            prompt=prompt,
            response=response,
            model_used=model_used,
            response_time=response_time,
            satisfaction_score=satisfaction_score,
            topic=topic,
            context=context
        )
        
        # Append to interactions log
        try:
            with open(self.interactions_file, 'a') as f:
                f.write(json.dumps(interaction.to_dict()) + '\n')
            self.interaction_count += 1
        except Exception as e:
            logger.error(f"Error logging interaction: {e}")
        
        # Update user profile
        self._update_user_profile(interaction)
        
        # Learn patterns periodically
        if self.interaction_count % 10 == 0:
            self._analyze_patterns()
        
        logger.info(f"✅ Logged interaction for user {user_id} (total: {self.interaction_count})")
    
    def _update_user_profile(self, interaction: Interaction):
        """Update user profile based on interaction"""
        user_id = interaction.user_id
        
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = UserProfile(user_id=user_id)
        
        profile = self.user_profiles[user_id]
        
        # Update interaction count
        profile.total_interactions += 1
        
        # Update preferred models
        profile.preferred_models[interaction.model_used] = \
            profile.preferred_models.get(interaction.model_used, 0) + 1
        
        # Update topic interests
        if interaction.topic:
            profile.topic_interests[interaction.topic] = \
                profile.topic_interests.get(interaction.topic, 0) + 1
        
        # Update satisfaction
        if interaction.satisfaction_score is not None:
            if profile.avg_satisfaction == 0:
                profile.avg_satisfaction = interaction.satisfaction_score
            else:
                profile.avg_satisfaction = \
                    0.9 * profile.avg_satisfaction + 0.1 * interaction.satisfaction_score
        
        # Update active times
        hour = interaction.timestamp.hour
        hour_key = f"{hour:02d}"
        profile.active_times[hour_key] = profile.active_times.get(hour_key, 0) + 1
        
        profile.last_updated = datetime.now()
        
        # Save profiles periodically
        if profile.total_interactions % 5 == 0:
            self._save_profiles()
    
    def _analyze_patterns(self):
        """Analyze interactions to learn patterns"""
        logger.info("🧠 Analyzing patterns...")
        
        patterns = {
            'model_performance': {},
            'topic_model_fit': {},
            'peak_hours': {},
            'avg_response_times': {},
            'last_analysis': datetime.now().isoformat()
        }
        
        # Analyze recent interactions
        recent_interactions = self._load_recent_interactions(limit=100)
        
        # Model performance by satisfaction
        model_satisfaction = defaultdict(list)
        model_response_times = defaultdict(list)
        topic_models = defaultdict(lambda: defaultdict(int))
        hour_counts = defaultdict(int)
        
        for interaction in recent_interactions:
            model = interaction.model_used
            
            if interaction.satisfaction_score is not None:
                model_satisfaction[model].append(interaction.satisfaction_score)
            
            model_response_times[model].append(interaction.response_time)
            
            if interaction.topic:
                topic_models[interaction.topic][model] += 1
            
            hour_counts[interaction.timestamp.hour] += 1
        
        # Calculate averages
        for model, scores in model_satisfaction.items():
            patterns['model_performance'][model] = {
                'avg_satisfaction': sum(scores) / len(scores) if scores else 0,
                'sample_size': len(scores)
            }
        
        for model, times in model_response_times.items():
            patterns['avg_response_times'][model] = sum(times) / len(times) if times else 0
        
        # Topic-model fit
        for topic, models in topic_models.items():
            patterns['topic_model_fit'][topic] = dict(models)
        
        # Peak hours
        patterns['peak_hours'] = dict(sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:5])
        
        self.learned_patterns = patterns
        self._save_patterns()
        
        logger.info(f"✅ Pattern analysis complete. Analyzed {len(recent_interactions)} interactions")
    
    def _load_recent_interactions(self, limit: int = 100) -> List[Interaction]:
        """Load recent interactions from log"""
        interactions = []
        try:
            if os.path.exists(self.interactions_file):
                with open(self.interactions_file, 'r') as f:
                    lines = f.readlines()
                    for line in lines[-limit:]:
                        data = json.loads(line)
                        interactions.append(Interaction.from_dict(data))
        except Exception as e:
            logger.error(f"Error loading recent interactions: {e}")
        return interactions
    
    def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """Get user profile"""
        return self.user_profiles.get(user_id)
    
    def get_model_recommendation(self, 
                                user_id: str,
                                topic: Optional[str] = None) -> Optional[str]:
        """
        Get recommended model based on learned patterns
        
        Args:
            user_id: User identifier
            topic: Optional topic
        
        Returns:
            Recommended model name or None
        """
        # Check user preferences
        profile = self.user_profiles.get(user_id)
        if profile and profile.preferred_models:
            # Get most used model
            return max(profile.preferred_models.items(), key=lambda x: x[1])[0]
        
        # Check topic-model fit
        if topic and topic in self.learned_patterns.get('topic_model_fit', {}):
            topic_models = self.learned_patterns['topic_model_fit'][topic]
            return max(topic_models.items(), key=lambda x: x[1])[0]
        
        # Check overall best performing model
        if 'model_performance' in self.learned_patterns:
            best_model = max(
                self.learned_patterns['model_performance'].items(),
                key=lambda x: x[1].get('avg_satisfaction', 0)
            )
            return best_model[0]
        
        return None
    
    def get_stats(self) -> Dict[str, Any]:
        """Get learning statistics"""
        return {
            'total_interactions': self.interaction_count,
            'total_users': len(self.user_profiles),
            'learned_patterns': self.learned_patterns,
            'top_users': sorted(
                [(uid, p.total_interactions) for uid, p in self.user_profiles.items()],
                key=lambda x: x[1],
                reverse=True
            )[:5]
        }


# Singleton instance
_learning_instance = None

def get_learning_service() -> LearningService:
    """Get or create the learning service singleton"""
    global _learning_instance
    if _learning_instance is None:
        _learning_instance = LearningService()
    return _learning_instance


# Example usage
if __name__ == "__main__":
    service = get_learning_service()
    
    # Log some test interactions
    service.log_interaction(
        user_id="allan",
        prompt="What's the weather?",
        response="I don't have access to weather data.",
        model_used="ssh_tunnel_gpu",
        response_time=1.2,
        satisfaction_score=0.6,
        topic="information"
    )
    
    service.log_interaction(
        user_id="allan",
        prompt="Write a Python function",
        response="Here's a Python function...",
        model_used="local_qwen",
        response_time=2.5,
        satisfaction_score=0.9,
        topic="code"
    )
    
    # Get stats
    stats = service.get_stats()
    print(f"\n📊 Learning Service Stats:")
    print(f"   Total interactions: {stats['total_interactions']}")
    print(f"   Total users: {stats['total_users']}")
    
    # Get recommendation
    rec = service.get_model_recommendation("allan", topic="code")
    print(f"\n💡 Recommended model for code: {rec}")


