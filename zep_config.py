#!/usr/bin/env python3
"""
Aurora AI Empire - Zep Memory System Configuration
"""

import os
from zep_python import ZepClient
from zep_python.models import CreateUserRequest, CreateSessionRequest, Message, Role

class ZepMemorySystem:
    def __init__(self):
        self.zep_base_url = "http://localhost:8000"  # Zep server URL
        self.client = ZepClient(base_url=self.zep_base_url)
        
    def setup_user(self, user_id: str, metadata: dict = None):
        """Set up a user in Zep"""
        try:
            user_request = CreateUserRequest(
                user_id=user_id,
                metadata=metadata or {}
            )
            self.client.user.add(user_request)
            print(f"✅ User {user_id} created in Zep")
            return True
        except Exception as e:
            print(f"❌ Error creating user: {e}")
            return False
    
    def create_session(self, user_id: str, session_id: str):
        """Create a chat session"""
        try:
            session_request = CreateSessionRequest(
                user_id=user_id,
                session_id=session_id
            )
            self.client.memory.add_session(session_request)
            print(f"✅ Session {session_id} created for user {user_id}")
            return True
        except Exception as e:
            print(f"❌ Error creating session: {e}")
            return False
    
    def add_message(self, session_id: str, content: str, role: str = "user"):
        """Add a message to the session"""
        try:
            message = Message(
                role=Role.USER if role == "user" else Role.ASSISTANT,
                content=content
            )
            self.client.memory.add_memory(session_id, [message])
            print(f"✅ Message added to session {session_id}")
            return True
        except Exception as e:
            print(f"❌ Error adding message: {e}")
            return False
    
    def get_memory(self, session_id: str, limit: int = 10):
        """Get recent memory from session"""
        try:
            memory = self.client.memory.get_memory(session_id, limit=limit)
            return memory
        except Exception as e:
            print(f"❌ Error getting memory: {e}")
            return None
    
    def search_memory(self, session_id: str, query: str, limit: int = 5):
        """Search memory for relevant context"""
        try:
            search_results = self.client.memory.search_memory(
                session_id=session_id,
                query=query,
                limit=limit
            )
            return search_results
        except Exception as e:
            print(f"❌ Error searching memory: {e}")
            return None

if __name__ == "__main__":
    zep = ZepMemorySystem()
    print("🧠 Zep Memory System initialized!")
