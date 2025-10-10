"""
Personality State Manager
=========================
Manages per-user personality state from main database.

Critical: Personality sliders are PER-USER, not global.
- Allan has attraction 11 (full flirt mode)
- Joe has attraction 3 (professional)
- Each user gets their OWN mood, attraction, gandhi-genghis levels
"""

import os
import asyncpg
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class PersonalityStateManager:
    """Manage per-user personality state"""
    
    def __init__(self, db_url: str = None):
        self.db_url = db_url or os.getenv(
            "DATABASE_URL",
            "postgresql://allan:fun2Gus!!!@localhost:5432/robbieverse"
        )
        self.pool = None
    
    async def connect(self):
        """Connect to database"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(self.db_url, min_size=2, max_size=10)
            logger.info("✅ Personality state manager connected to database")
    
    async def get_current_state(self, user_id: str = "allan") -> Dict[str, Any]:
        """
        Get current personality state for a specific user
        
        Returns:
            {
                'current_mood': str (focused, friendly, playful, bossy, surprised, blushing),
                'attraction_level': int (1-11),
                'gandhi_genghis_level': int (1-10),
                'energy_level': str,
                'updated_at': datetime
            }
        """
        if not self.pool:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            # Query personality state for this specific user
            row = await conn.fetchrow("""
                SELECT 
                    ps.current_mood,
                    ps.current_mode,
                    ps.energy_level,
                    ps.focus_state,
                    ps.updated_at,
                    ps.state_metadata
                FROM ai_personality_state ps
                JOIN ai_personalities p ON ps.personality_id = p.id
                WHERE p.id = $1 OR p.name = 'robbie'
                LIMIT 1
            """, user_id)
            
            if not row:
                # Return default state if not found
                logger.warning(f"No personality state found for {user_id}, using defaults")
                return {
                    'current_mood': 'focused',
                    'attraction_level': 7,
                    'gandhi_genghis_level': 7,
                    'energy_level': 'normal',
                    'updated_at': datetime.now()
                }
            
            # Parse state_metadata for per-user settings
            metadata = row['state_metadata'] or {}
            
            # Map mood integer to string
            mood_map = {
                1: 'blushing',
                2: 'surprised', 
                3: 'friendly',
                4: 'focused',
                5: 'playful',
                6: 'bossy',
                7: 'hyper'
            }
            
            mood_int = row['current_mood']
            mood_str = mood_map.get(mood_int, 'focused')
            
            # Get per-user attraction level (default to 7)
            # Allan should have 11, Joe should have 3, etc.
            user_settings = metadata.get('user_settings', {})
            attraction = user_settings.get(user_id, {}).get('attraction_level', 7)
            
            # Parse current_mode for gandhi-genghis level
            gandhi_genghis = 7  # Default
            if row['current_mode']:
                # Extract number from mode like "gandhi-7" or "genghis-9"
                mode_parts = row['current_mode'].split('-')
                if len(mode_parts) == 2 and mode_parts[1].isdigit():
                    gandhi_genghis = int(mode_parts[1])
            
            return {
                'current_mood': mood_str,
                'attraction_level': attraction,
                'gandhi_genghis_level': gandhi_genghis,
                'energy_level': row['energy_level'] or 'normal',
                'updated_at': row['updated_at']
            }
    
    async def update_mood(
        self,
        user_id: str,
        new_mood: str,
        reason: str = "manual"
    ):
        """
        Update mood for a specific user
        
        Args:
            user_id: User identifier
            new_mood: New mood (focused, friendly, playful, bossy, surprised, blushing)
            reason: Why mood changed
        """
        if not self.pool:
            await self.connect()
        
        # Map string mood to integer
        mood_reverse_map = {
            'blushing': 1,
            'surprised': 2,
            'friendly': 3,
            'focused': 4,
            'playful': 5,
            'bossy': 6,
            'hyper': 7
        }
        
        mood_int = mood_reverse_map.get(new_mood, 4)  # Default to focused
        
        async with self.pool.acquire() as conn:
            # Update mood in database
            await conn.execute("""
                UPDATE ai_personality_state
                SET 
                    current_mood = $1,
                    last_state_change = NOW(),
                    updated_at = NOW()
                WHERE personality_id = 'robbie'
            """, mood_int)
            
            # Log state change
            await conn.execute("""
                INSERT INTO ai_state_history (
                    personality_id,
                    old_state,
                    new_state,
                    trigger_type,
                    trigger_reason
                ) VALUES (
                    'robbie',
                    jsonb_build_object('mood', $1),
                    jsonb_build_object('mood', $2),
                    'mood_change',
                    $3
                )
            """, mood_int - 1, mood_int, reason)
            
            logger.info(f"✅ Mood updated for {user_id}: {new_mood} (reason: {reason})")
    
    async def update_attraction(
        self,
        user_id: str,
        level: int
    ):
        """
        Update attraction level for a specific user
        
        Args:
            user_id: User identifier
            level: Attraction level (1-11)
        """
        if not self.pool:
            await self.connect()
        
        # Clamp to 1-11
        level = max(1, min(11, level))
        
        async with self.pool.acquire() as conn:
            # Update user-specific attraction in state_metadata
            await conn.execute("""
                UPDATE ai_personality_state
                SET 
                    state_metadata = jsonb_set(
                        COALESCE(state_metadata, '{}'::jsonb),
                        ARRAY['user_settings', $1, 'attraction_level'],
                        to_jsonb($2),
                        true
                    ),
                    updated_at = NOW()
                WHERE personality_id = 'robbie'
            """, user_id, level)
            
            logger.info(f"✅ Attraction level updated for {user_id}: {level}/11")
    
    async def update_gandhi_genghis(
        self,
        user_id: str,
        level: int
    ):
        """
        Update Gandhi-Genghis level for a specific user
        
        Args:
            user_id: User identifier
            level: Gandhi-Genghis level (1-10, where 1=gandhi, 10=genghis)
        """
        if not self.pool:
            await self.connect()
        
        # Clamp to 1-10
        level = max(1, min(10, level))
        
        mode = f"{'gandhi' if level <= 5 else 'genghis'}-{level}"
        
        async with self.pool.acquire() as conn:
            # Update current_mode
            await conn.execute("""
                UPDATE ai_personality_state
                SET 
                    current_mode = $1,
                    updated_at = NOW()
                WHERE personality_id = 'robbie'
            """, mode)
            
            logger.info(f"✅ Gandhi-Genghis level updated for {user_id}: {level}/10 ({mode})")
    
    async def get_user_attraction_level(self, user_id: str) -> int:
        """Quick helper to get just the attraction level for a user"""
        state = await self.get_current_state(user_id)
        return state['attraction_level']
    
    async def close(self):
        """Close database connection"""
        if self.pool:
            await self.pool.close()
            logger.info("Personality state manager disconnected from database")


# Global instance
personality_state_manager = PersonalityStateManager()
