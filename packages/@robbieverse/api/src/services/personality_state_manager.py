"""
Personality State Manager
==========================
Manages Robbie's dynamic personality state (mood, attraction, gandhi-genghis).

This is DIFFERENT from personality_manager.py which switches between personas.
This manages Robbie's SLIDERS and MOOD within her personality.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
import asyncpg

logger = logging.getLogger(__name__)

class PersonalityStateManager:
    """
    Manages Robbie's personality state from robbie_personality_state table.
    
    Three sliders:
    - attraction: 1-11 (Allan can go to 11, others max 7)
    - gandhi_genghis: 1-10 (communication aggression)
    - mood: focused, friendly, playful, bossy, surprised, blushing
    """
    
    def __init__(self, database_url: str = None):
        self.database_url = database_url or "postgresql://robbie:password@localhost:5432/robbieverse"
        self.pool = None
    
    async def initialize(self):
        """Initialize database connection pool"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(self.database_url)
            logger.info("✅ Personality state manager initialized")
    
    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            self.pool = None
    
    async def get_current_state(self, user_id: str = 'allan') -> Dict[str, Any]:
        """
        Get current personality state from database
        
        Returns:
        {
            'user_id': 'allan',
            'current_mood': 'focused',
            'attraction_level': 11,
            'gandhi_genghis_level': 7,
            'context': {},
            'updated_at': '2025-10-10T12:00:00Z'
        }
        """
        try:
            if not self.pool:
                await self.initialize()
            
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT 
                        user_id,
                        current_mood,
                        attraction_level,
                        gandhi_genghis_level,
                        context,
                        updated_at
                    FROM robbie_personality_state
                    WHERE user_id = $1
                    LIMIT 1
                """, user_id)
                
                if row:
                    return {
                        'user_id': row['user_id'],
                        'current_mood': row['current_mood'],
                        'attraction_level': row['attraction_level'],
                        'gandhi_genghis_level': row['gandhi_genghis_level'],
                        'context': row['context'] if row['context'] else {},
                        'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None
                    }
                else:
                    # Return defaults if no state found
                    logger.warning(f"No personality state found for {user_id}, using defaults")
                    return {
                        'user_id': user_id,
                        'current_mood': 'focused',
                        'attraction_level': 7,
                        'gandhi_genghis_level': 7,
                        'context': {},
                        'updated_at': datetime.now().isoformat()
                    }
                    
        except Exception as e:
            logger.error(f"Failed to get personality state: {e}")
            # Return safe defaults on error
            return {
                'user_id': user_id,
                'current_mood': 'focused',
                'attraction_level': 7,
                'gandhi_genghis_level': 7,
                'context': {},
                'updated_at': datetime.now().isoformat()
            }
    
    async def update_mood(
        self,
        user_id: str,
        new_mood: str,
        reason: str = None
    ) -> bool:
        """
        Update user's mood in database
        
        Args:
            user_id: User identifier
            new_mood: New mood (focused, friendly, playful, bossy, surprised, blushing)
            reason: Reason for mood change (for logging)
        
        Returns:
            True if updated successfully
        """
        valid_moods = ['focused', 'friendly', 'playful', 'bossy', 'surprised', 'blushing']
        
        if new_mood not in valid_moods:
            logger.warning(f"Invalid mood: {new_mood}")
            return False
        
        try:
            if not self.pool:
                await self.initialize()
            
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    UPDATE robbie_personality_state
                    SET current_mood = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $1
                """, user_id, new_mood)
                
                logger.info(f"🎭 Mood updated for {user_id}: {new_mood} (reason: {reason})")
                return True
                
        except Exception as e:
            logger.error(f"Failed to update mood: {e}")
            return False
    
    async def update_attraction(
        self,
        user_id: str,
        new_level: int
    ) -> bool:
        """
        Update attraction level
        
        Args:
            user_id: User identifier
            new_level: New attraction level (1-11 for Allan, 1-7 for others)
        
        Returns:
            True if updated successfully
        """
        # Validate level
        max_level = 11 if user_id == 'allan' else 7
        
        if not (1 <= new_level <= max_level):
            logger.warning(f"Invalid attraction level {new_level} for {user_id} (max: {max_level})")
            return False
        
        try:
            if not self.pool:
                await self.initialize()
            
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    UPDATE robbie_personality_state
                    SET attraction_level = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $1
                """, user_id, new_level)
                
                logger.info(f"💕 Attraction updated for {user_id}: {new_level}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to update attraction: {e}")
            return False
    
    async def update_gandhi_genghis(
        self,
        user_id: str,
        new_level: int
    ) -> bool:
        """
        Update Gandhi-Genghis communication level
        
        Args:
            user_id: User identifier
            new_level: New level (1=gentle, 10=aggressive)
        
        Returns:
            True if updated successfully
        """
        if not (1 <= new_level <= 10):
            logger.warning(f"Invalid gandhi-genghis level: {new_level}")
            return False
        
        try:
            if not self.pool:
                await self.initialize()
            
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    UPDATE robbie_personality_state
                    SET gandhi_genghis_level = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $1
                """, user_id, new_level)
                
                logger.info(f"⚔️ Gandhi-Genghis updated for {user_id}: {new_level}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to update gandhi-genghis: {e}")
            return False
    
    async def update_full_state(
        self,
        user_id: str,
        mood: Optional[str] = None,
        attraction: Optional[int] = None,
        gandhi_genghis: Optional[int] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Update multiple personality state fields at once
        
        Returns:
            True if updated successfully
        """
        try:
            if not self.pool:
                await self.initialize()
            
            # Build update query dynamically
            updates = []
            params = [user_id]
            param_count = 2
            
            if mood:
                updates.append(f"current_mood = ${param_count}")
                params.append(mood)
                param_count += 1
            
            if attraction is not None:
                updates.append(f"attraction_level = ${param_count}")
                params.append(attraction)
                param_count += 1
            
            if gandhi_genghis is not None:
                updates.append(f"gandhi_genghis_level = ${param_count}")
                params.append(gandhi_genghis)
                param_count += 1
            
            if context is not None:
                updates.append(f"context = ${param_count}")
                params.append(context)
                param_count += 1
            
            if not updates:
                return True  # Nothing to update
            
            updates.append("updated_at = CURRENT_TIMESTAMP")
            
            query = f"""
                UPDATE robbie_personality_state
                SET {', '.join(updates)}
                WHERE user_id = $1
            """
            
            async with self.pool.acquire() as conn:
                await conn.execute(query, *params)
                
                logger.info(f"✅ Personality state updated for {user_id}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to update personality state: {e}")
            return False


# Global instance
personality_state_manager = PersonalityStateManager()

