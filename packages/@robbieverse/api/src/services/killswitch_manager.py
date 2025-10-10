"""
Killswitch Manager
==================
Manages emergency internet blocking for Robbie.
Blocks email, webhooks, external APIs while allowing local chat.
"""

import os
import psycopg2
from datetime import datetime
from typing import Dict, Any, Optional
import logging
import subprocess

logger = logging.getLogger(__name__)


class KillswitchManager:
    """Emergency internet blocking system"""
    
    def __init__(self, db_connection_string: str = None):
        self.db_conn_string = db_connection_string or os.getenv(
            "DATABASE_URL",
            "postgresql://allan:fun2Gus!!!@localhost:5432/aurora"
        )
        self._is_active = False
        self._load_state()
    
    def _get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_conn_string)
    
    def _load_state(self):
        """Load killswitch state from database"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT is_active FROM killswitch_state 
                WHERE is_active = TRUE
                LIMIT 1
            """)
            
            result = cursor.fetchone()
            self._is_active = result[0] if result else False
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to load killswitch state: {e}")
            self._is_active = False
    
    def is_active(self) -> bool:
        """Check if killswitch is currently active"""
        # Refresh from database to ensure consistency
        self._load_state()
        return self._is_active
    
    def activate(
        self,
        reason: str,
        activated_by: str = "system",
        auto_trigger: str = None
    ) -> bool:
        """
        Activate killswitch - block internet access
        
        Args:
            reason: Why killswitch was activated
            activated_by: Who activated it (user or system)
            auto_trigger: What triggered it (rate_limit, suspicious_activity, etc.)
            
        Returns:
            True if successfully activated
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            # Call database function to activate
            cursor.execute("""
                SELECT activate_killswitch(%s, %s, %s)
            """, (reason, activated_by, auto_trigger))
            
            result = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            conn.close()
            
            if result:
                self._is_active = True
                logger.warning(
                    f"🔴 KILLSWITCH ACTIVATED by {activated_by}: {reason}"
                )
                
                # Block internet access (implementation depends on environment)
                self._block_internet()
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to activate killswitch: {e}")
            return False
    
    def deactivate(self, deactivated_by: str = "allan") -> bool:
        """
        Deactivate killswitch - restore internet access
        
        Args:
            deactivated_by: Who deactivated it
            
        Returns:
            True if successfully deactivated
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            # Call database function to deactivate
            cursor.execute("""
                SELECT deactivate_killswitch(%s)
            """, (deactivated_by,))
            
            result = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            conn.close()
            
            if result:
                self._is_active = False
                logger.info(f"🟢 Killswitch deactivated by {deactivated_by}")
                
                # Restore internet access
                self._restore_internet()
                
                # Restore Robbie's mood
                self._restore_mood()
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to deactivate killswitch: {e}")
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get detailed killswitch status
        
        Returns:
            Status information including active state, reason, timestamps
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    is_active, activated_at, activated_by, reason,
                    auto_trigger, block_internet, block_gpu_mesh,
                    block_email, block_webhooks, deactivated_at,
                    deactivated_by, updated_at
                FROM killswitch_state
                ORDER BY updated_at DESC
                LIMIT 1
            """)
            
            row = cursor.fetchone()
            
            if row:
                status = {
                    'is_active': row[0],
                    'activated_at': row[1].isoformat() if row[1] else None,
                    'activated_by': row[2],
                    'reason': row[3],
                    'auto_trigger': row[4],
                    'restrictions': {
                        'internet': row[5],
                        'gpu_mesh': row[6],
                        'email': row[7],
                        'webhooks': row[8]
                    },
                    'deactivated_at': row[9].isoformat() if row[9] else None,
                    'deactivated_by': row[10],
                    'updated_at': row[11].isoformat() if row[11] else None
                }
            else:
                status = {
                    'is_active': False,
                    'restrictions': {
                        'internet': False,
                        'gpu_mesh': False,
                        'email': False,
                        'webhooks': False
                    }
                }
            
            cursor.close()
            conn.close()
            
            return status
            
        except Exception as e:
            logger.error(f"Failed to get killswitch status: {e}")
            return {'is_active': False, 'error': str(e)}
    
    def _block_internet(self):
        """
        Block internet access for Robbie
        
        This is environment-specific. Options:
        1. Firewall rules (iptables/ufw)
        2. Network namespace isolation
        3. Environment variable flag
        
        For now, we use a simple flag that services check
        """
        # Set environment variable
        os.environ['ROBBIE_INTERNET_BLOCKED'] = 'true'
        
        logger.warning("⚠️ Internet access blocked for Robbie")
        
        # TODO: Implement actual firewall rules if needed
        # Example (requires root):
        # subprocess.run([
        #     'iptables', '-A', 'OUTPUT', 
        #     '-p', 'tcp', 
        #     '--dport', '80,443', 
        #     '-j', 'REJECT'
        # ])
    
    def _restore_internet(self):
        """Restore internet access"""
        # Remove environment variable
        if 'ROBBIE_INTERNET_BLOCKED' in os.environ:
            del os.environ['ROBBIE_INTERNET_BLOCKED']
        
        logger.info("✅ Internet access restored for Robbie")
        
        # TODO: Remove firewall rules if implemented
    
    def _restore_mood(self):
        """Restore Robbie's mood from blushing to previous state"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            # Set mood to focused (default after crisis)
            cursor.execute("""
                UPDATE ai_personality_state 
                SET current_mood = 'focused', updated_at = NOW()
                WHERE personality_id = 'robbie'
                AND current_mood = 'blushing'
            """)
            
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info("Robbie's mood restored from blushing to focused")
            
        except Exception as e:
            logger.error(f"Failed to restore mood: {e}")
    
    def check_action_allowed(self, action_type: str) -> bool:
        """
        Check if an action is allowed under current killswitch state
        
        Args:
            action_type: Type of action (email_send, webhook_call, api_request, etc.)
            
        Returns:
            True if action is allowed, False if blocked
        """
        if not self.is_active():
            return True  # Killswitch not active, all actions allowed
        
        # Check specific action types
        blocked_actions = [
            'email_send',
            'webhook_call',
            'api_request',
            'external_http',
            'sms_send'
        ]
        
        if action_type in blocked_actions:
            logger.warning(
                f"🔴 Action blocked by killswitch: {action_type}"
            )
            return False
        
        # Allow local actions
        allowed_actions = [
            'local_chat',
            'database_query',
            'gpu_mesh_request',
            'file_read',
            'file_write'
        ]
        
        return action_type in allowed_actions


# Global instance
killswitch_manager = KillswitchManager()


