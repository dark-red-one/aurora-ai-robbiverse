"""
User Lookup Service
===================
Maps email addresses to user IDs and personality settings.

Critical for email integration:
- allan@testpilot.ai → user_id: allan, attraction: 11
- joe@testpilot.ai → user_id: joe, attraction: 3
- unknown@example.com → user_id: guest, attraction: 2 (professional)

This ensures Robbie responds with the RIGHT personality for each sender.
"""

import os
import asyncpg
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class UserLookupService:
    """Look up users by email for personality mapping"""
    
    def __init__(self, db_url: str = None):
        self.db_url = db_url or os.getenv(
            "DATABASE_URL",
            "postgresql://allan:fun2Gus!!!@localhost:5432/robbieverse"
        )
        self.pool = None
        
        # Default personality for unknown senders
        self.default_settings = {
            'user_id': 'guest',
            'attraction_level': 2,
            'gandhi_genghis_level': 5,
            'name': 'Guest'
        }
    
    async def connect(self):
        """Connect to database"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(self.db_url, min_size=2, max_size=10)
            logger.info("✅ User lookup service connected to database")
    
    async def lookup_user_by_email(self, email: str) -> Dict[str, Any]:
        """
        Look up user by email address
        
        Args:
            email: Email address of sender
            
        Returns:
            {
                'user_id': str,
                'name': str,
                'attraction_level': int,
                'gandhi_genghis_level': int,
                'email': str
            }
        """
        if not self.pool:
            await self.connect()
        
        # Normalize email
        email = email.lower().strip()
        
        async with self.pool.acquire() as conn:
            # Try to find user by email
            row = await conn.fetchrow("""
                SELECT 
                    u.id as user_id,
                    u.full_name as name,
                    u.email,
                    ps.state_metadata
                FROM users u
                LEFT JOIN ai_personality_state ps ON ps.personality_id = 'robbie'
                WHERE LOWER(u.email) = $1
                LIMIT 1
            """, email)
            
            if not row:
                # Check known email mappings (hardcoded for now)
                known_users = {
                    'allan@testpilot.ai': {
                        'user_id': 'allan',
                        'name': 'Allan',
                        'attraction_level': 11,  # Full flirt mode
                        'gandhi_genghis_level': 7
                    },
                    'joe@testpilot.ai': {
                        'user_id': 'joe',
                        'name': 'Joe',
                        'attraction_level': 3,  # Professional
                        'gandhi_genghis_level': 6
                    }
                }
                
                if email in known_users:
                    user = known_users[email]
                    user['email'] = email
                    logger.info(f"✅ Found known user: {user['name']} ({email}) - attraction: {user['attraction_level']}")
                    return user
                
                # Unknown sender - use defaults
                logger.warning(f"Unknown sender: {email}, using guest defaults (attraction: 2)")
                return {
                    **self.default_settings,
                    'email': email
                }
            
            # Parse user settings from state_metadata
            metadata = row['state_metadata'] or {}
            user_settings = metadata.get('user_settings', {})
            user_id = row['user_id']
            
            # Get per-user settings or use defaults
            user_data = user_settings.get(user_id, {})
            
            result = {
                'user_id': user_id,
                'name': row['name'] or user_id,
                'email': row['email'],
                'attraction_level': user_data.get('attraction_level', 5),
                'gandhi_genghis_level': user_data.get('gandhi_genghis_level', 5)
            }
            
            logger.info(f"✅ Found user: {result['name']} ({email}) - attraction: {result['attraction_level']}")
            return result
    
    async def set_user_personality(
        self,
        email: str,
        attraction_level: int = None,
        gandhi_genghis_level: int = None
    ):
        """
        Set personality preferences for a user
        
        Args:
            email: User's email
            attraction_level: Attraction level (1-11)
            gandhi_genghis_level: Gandhi-Genghis level (1-10)
        """
        if not self.pool:
            await self.connect()
        
        user = await self.lookup_user_by_email(email)
        user_id = user['user_id']
        
        async with self.pool.acquire() as conn:
            # Update user settings in state_metadata
            if attraction_level is not None:
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
                """, user_id, attraction_level)
                
                logger.info(f"✅ Set attraction level for {email}: {attraction_level}/11")
            
            if gandhi_genghis_level is not None:
                await conn.execute("""
                    UPDATE ai_personality_state
                    SET 
                        state_metadata = jsonb_set(
                            COALESCE(state_metadata, '{}'::jsonb),
                            ARRAY['user_settings', $1, 'gandhi_genghis_level'],
                            to_jsonb($2),
                            true
                        ),
                        updated_at = NOW()
                    WHERE personality_id = 'robbie'
                """, user_id, gandhi_genghis_level)
                
                logger.info(f"✅ Set gandhi-genghis level for {email}: {gandhi_genghis_level}/10")
    
    async def close(self):
        """Close database connection"""
        if self.pool:
            await self.pool.close()
            logger.info("User lookup service disconnected from database")


# Global instance
user_lookup_service = UserLookupService()

