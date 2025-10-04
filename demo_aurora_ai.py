#!/usr/bin/env python3
"""
Aurora AI Robbiverse - Complete Demo Script
Demonstrates all conversation context, rollback, branching, and real-time features
"""
import asyncio
import json
import uuid
from datetime import datetime
import sys
import os
import requests
import websockets

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.conversation_context import ConversationContextManager
from app.db.database import database

class AuroraAIDemo:
    """Complete demo of Aurora AI conversation system"""
    
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.context_manager = ConversationContextManager()
        self.conversation_id = None
        self.user_id = None
        
    async def setup(self):
        """Setup demo environment"""
        print("🚀 Aurora AI Robbiverse - Complete Demo")
        print("=" * 60)
        
        # Connect to database
        await database.connect()
        print("✅ Connected to Aurora database")
        
        # Create demo user
        self.user_id = str(uuid.uuid4())
        await database.execute("""
            INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
            VALUES (:id, :username, :email, :password_hash, :created_at, :updated_at)
        """, {
            "id": self.user_id,
            "username": f"demo_user_{self.user_id[:8]}",
            "email": f"demo_{self.user_id[:8]}@example.com",
            "password_hash": "demo_hash",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        print(f"👤 Created demo user: {self.user_id}")
        
    async def demo_conversation_creation(self):
        """Demo conversation creation and basic chat"""
        print(f"\n📝 Demo 1: Conversation Creation & Basic Chat")
        print("-" * 50)
        
        # Create conversation via API
        response = requests.post(f"{self.base_url}/api/v1/conversations", json={
            "title": "Aurora AI Demo Conversation",
            "user_id": self.user_id,
            "context_window_size": 10
        })
        
        if response.status_code == 200:
            data = response.json()
            self.conversation_id = data["conversation_id"]
            print(f"✅ Created conversation: {self.conversation_id}")
        else:
            print(f"❌ Failed to create conversation: {response.text}")
            return
        
        # Add some demo messages
        demo_messages = [
            ("user", "Hello! I'm testing the Aurora AI system. Can you help me understand how conversation context works?"),
            ("assistant", "Hello! I'd be happy to help you understand conversation context in Aurora AI. The system intelligently manages conversation history by selecting the most important messages for context."),
            ("user", "That's interesting! How does the importance scoring work?"),
            ("assistant", "Great question! The system uses a weighted scoring algorithm that combines recency (70%) and content importance (30%). Messages with questions, longer content, or from system roles get higher importance scores."),
            ("user", "What about rollback functionality? Can I undo messages?"),
            ("assistant", "Absolutely! Aurora AI has a sophisticated rollback system. You can soft-delete any message, track rollback history, and even restore previously rolled back messages. It's perfect for exploring different conversation paths."),
            ("user", "That sounds amazing! What about branching?"),
            ("assistant", "Branching is one of our most powerful features! You can create alternative conversation paths from any message, switch between branches, and explore different AI responses to the same question. It's like having multiple parallel conversations."),
            ("user", "This is incredible! How do I get started with these features?"),
            ("assistant", "You're already using them! The system automatically manages context, and you can use the API endpoints or WebSocket connections to access rollback and branching features. Let me show you some examples...")
        ]
        
        print(f"\n💬 Adding {len(demo_messages)} demo messages...")
        message_ids = []
        
        for i, (role, content) in enumerate(demo_messages):
            message_id = await self.context_manager.add_message(
                conversation_id=self.conversation_id,
                role=role,
                content=content,
                metadata={"demo_message": True, "sequence": i + 1}
            )
            message_ids.append(message_id)
            print(f"  {i+1:2d}. {role:10s}: {content[:60]}...")
        
        print(f"✅ Added {len(message_ids)} messages successfully")
        return message_ids
    
    async def demo_context_management(self):
        """Demo intelligent context management"""
        print(f"\n🧠 Demo 2: Intelligent Context Management")
        print("-" * 50)
        
        # Get conversation context
        context = await self.context_manager.get_conversation_context(
            self.conversation_id, 
            context_window=5
        )
        
        print(f"📊 Context Statistics:")
        print(f"   - Total messages: {context['total_messages']}")
        print(f"   - Context window: {context['context_window']}")
        print(f"   - Context compressed: {context['context_compressed']}")
        print(f"   - Messages in context: {len(context['messages'])}")
        
        print(f"\n📋 Selected Context Messages (by importance):")
        for i, msg in enumerate(context['messages']):
            importance = msg.get('context_importance', 'N/A')
            tokens = msg.get('token_count', 0)
            print(f"  {i+1:2d}. {msg['role']:10s}: {msg['content'][:50]}...")
            print(f"      Importance: {importance}, Tokens: {tokens}")
        
        # Test context compression
        print(f"\n🗜️  Testing Context Compression...")
        compression_result = await self.context_manager.compress_conversation_context(
            self.conversation_id
        )
        print(f"   Compression result: {compression_result}")
    
    async def demo_rollback_system(self):
        """Demo rollback and restore functionality"""
        print(f"\n⏪ Demo 3: Rollback & Restore System")
        print("-" * 50)
        
        # Get all messages first
        context = await self.context_manager.get_conversation_context(
            self.conversation_id, 
            include_deleted=True
        )
        
        if not context['messages']:
            print("❌ No messages to rollback")
            return
        
        # Rollback the last message
        last_message = context['messages'][-1]
        message_id = last_message['id']
        
        print(f"🔄 Rolling back message: {last_message['content'][:50]}...")
        rollback_success = await self.context_manager.rollback_message(
            message_id, 
            "Demo rollback - testing functionality"
        )
        print(f"   Rollback successful: {rollback_success}")
        
        # Get rollback history
        rollback_history = await self.context_manager.get_rollback_history(
            self.conversation_id
        )
        print(f"📜 Rollback History:")
        for i, msg in enumerate(rollback_history):
            print(f"   {i+1}. {msg['role']}: {msg['content'][:40]}...")
            print(f"      Deleted: {msg['deleted_at']} - Reason: {msg['deleted_reason']}")
        
        # Restore the message
        print(f"\n🔄 Restoring message...")
        restore_success = await self.context_manager.restore_message(message_id)
        print(f"   Restore successful: {restore_success}")
    
    async def demo_conversation_branching(self):
        """Demo conversation branching"""
        print(f"\n🌿 Demo 4: Conversation Branching")
        print("-" * 50)
        
        # Get messages to find a good branch point
        context = await self.context_manager.get_conversation_context(
            self.conversation_id, 
            context_window=10
        )
        
        # Find a message about rollback to branch from
        branch_point_message = None
        for msg in context['messages']:
            if 'rollback' in msg['content'].lower():
                branch_point_message = msg
                break
        
        if not branch_point_message:
            print("❌ No suitable branch point found")
            return
        
        print(f"📍 Branching from: {branch_point_message['content'][:60]}...")
        
        # Create a branch
        branch_id = await self.context_manager.create_conversation_branch(
            conversation_id=self.conversation_id,
            branch_point_message_id=branch_point_message['id'],
            name="Alternative Rollback Explanation",
            description="Exploring a different approach to explaining rollback functionality"
        )
        print(f"✅ Created branch: {branch_id}")
        
        # Add alternative messages to the branch
        alternative_messages = [
            ("assistant", "Actually, let me explain rollback differently. Think of it like an 'undo' button in a text editor, but for conversations. You can step back to any point and try a different approach."),
            ("user", "That's a much clearer analogy! How does it work technically?"),
            ("assistant", "Great question! Technically, we use 'soft deletes' - messages are marked as deleted but not actually removed. This allows for restoration and maintains a complete audit trail of all changes."),
            ("user", "Fascinating! Can I see both conversation paths side by side?"),
            ("assistant", "Absolutely! That's the beauty of branching. You can switch between branches, compare different approaches, and even merge insights from different paths. It's like having multiple parallel conversations.")
        ]
        
        print(f"\n💬 Adding alternative messages to branch...")
        for role, content in alternative_messages:
            await self.context_manager.add_message(
                conversation_id=self.conversation_id,
                role=role,
                content=content,
                branch_id=branch_id,
                metadata={"branch_message": True, "alternative_approach": True}
            )
            print(f"   {role}: {content[:50]}...")
        
        # Get all branches
        branches = await self.context_manager.get_conversation_branches(self.conversation_id)
        print(f"\n🌿 All Branches:")
        for branch in branches:
            print(f"   - {branch['name']}: {branch['description']}")
            print(f"     Created: {branch['created_at']}, Active: {branch['is_active']}")
        
        # Switch to the branch
        print(f"\n🔄 Switching to alternative branch...")
        switch_success = await self.context_manager.switch_to_branch(
            self.conversation_id, 
            branch_id
        )
        print(f"   Switch successful: {switch_success}")
    
    async def demo_websocket_realtime(self):
        """Demo WebSocket real-time functionality"""
        print(f"\n🔌 Demo 5: WebSocket Real-time Updates")
        print("-" * 50)
        
        try:
            # Connect to WebSocket
            uri = f"ws://localhost:8000/ws/conversations/{self.conversation_id}?user_id={self.user_id}"
            print(f"🔌 Connecting to WebSocket: {uri}")
            
            async with websockets.connect(uri) as websocket:
                print("✅ WebSocket connected successfully")
                
                # Test ping/pong
                print("🏓 Testing ping/pong...")
                await websocket.send(json.dumps({"event": "ping"}))
                response = await websocket.recv()
                data = json.loads(response)
                print(f"   Pong received: {data['event']}")
                
                # Test context retrieval
                print("📋 Testing context retrieval...")
                await websocket.send(json.dumps({"event": "get_context"}))
                response = await websocket.recv()
                data = json.loads(response)
                print(f"   Context event: {data['event']}")
                print(f"   Messages in context: {len(data['data']['messages'])}")
                
                # Test real-time message addition
                print("💬 Testing real-time message addition...")
                test_message_id = await self.context_manager.add_message(
                    conversation_id=self.conversation_id,
                    role="user",
                    content="This is a real-time WebSocket test message!",
                    metadata={"websocket_test": True}
                )
                
                # Wait for WebSocket event
                try:
                    event_response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    event_data = json.loads(event_response)
                    print(f"   📡 Real-time event: {event_data['event']}")
                    print(f"   📊 Conversation stats: {event_data['data']['conversation_stats']}")
                except asyncio.TimeoutError:
                    print("   ⏰ No real-time event received (timeout)")
                
                print("✅ WebSocket demo completed successfully")
                
        except websockets.exceptions.ConnectionRefused:
            print("❌ WebSocket connection refused. Make sure the server is running:")
            print("   cd backend && python -m uvicorn app.main:app --reload")
        except Exception as e:
            print(f"❌ WebSocket error: {e}")
    
    async def demo_analytics(self):
        """Demo analytics and monitoring"""
        print(f"\n📊 Demo 6: Analytics & Monitoring")
        print("-" * 50)
        
        try:
            # Test system health
            response = requests.get(f"{self.base_url}/api/v1/analytics/system/health")
            if response.status_code == 200:
                health = response.json()
                print(f"🏥 System Health:")
                print(f"   Status: {health['status']}")
                print(f"   Database: {health['database']['status']} ({health['database']['response_time_ms']}ms)")
                print(f"   WebSocket connections: {health['websockets']['total_conversations']} conversations")
                print(f"   Messages last hour: {health['activity']['messages_last_hour']}")
                print(f"   Rollback rate: {health['quality']['rollback_rate_percent']}%")
            
            # Test conversation stats
            response = requests.get(f"{self.base_url}/api/v1/analytics/conversations/stats?user_id={self.user_id}")
            if response.status_code == 200:
                stats = response.json()
                print(f"\n📈 Conversation Statistics:")
                print(f"   Total conversations: {stats['conversation_stats']['total_conversations']}")
                print(f"   Total messages: {stats['message_stats']['total_messages']}")
                print(f"   Total tokens: {stats['message_stats']['total_tokens']}")
                print(f"   Rollback count: {stats['message_stats']['rolled_back_messages']}")
                print(f"   Branch count: {stats['branch_stats']['total_branches']}")
            
            # Test conversation analytics
            if self.conversation_id:
                response = requests.get(f"{self.base_url}/api/v1/analytics/conversations/{self.conversation_id}/analytics")
                if response.status_code == 200:
                    analytics = response.json()
                    print(f"\n🔍 Detailed Conversation Analytics:")
                    print(f"   Message count: {analytics['conversation']['message_count']}")
                    print(f"   Duration: {analytics['conversation']['duration_hours']:.2f} hours")
                    print(f"   Total tokens: {analytics['conversation']['total_tokens']}")
                    print(f"   Branches: {analytics['conversation']['branch_count']}")
                    print(f"   Rollbacks: {analytics['conversation']['rollback_count']}")
                    print(f"   Timeline points: {len(analytics['timeline'])}")
                    print(f"   Rollback reasons: {len(analytics['rollbacks'])}")
            
            print("✅ Analytics demo completed successfully")
            
        except Exception as e:
            print(f"❌ Analytics error: {e}")
    
    async def demo_api_endpoints(self):
        """Demo API endpoints"""
        print(f"\n🌐 Demo 7: API Endpoints")
        print("-" * 50)
        
        try:
            # Test system status
            response = requests.get(f"{self.base_url}/system/status")
            if response.status_code == 200:
                status = response.json()
                print(f"🏥 System Status:")
                print(f"   Version: {status['version']}")
                print(f"   Database: {status['database']['status']}")
                print(f"   AI System: {status['ai_system']}")
            
            # Test conversation endpoints
            if self.conversation_id:
                # Get conversation
                response = requests.get(f"{self.base_url}/api/v1/conversations/{self.conversation_id}")
                if response.status_code == 200:
                    conv = response.json()
                    print(f"\n📝 Conversation Details:")
                    print(f"   Title: {conv['conversation']['title']}")
                    print(f"   Messages: {len(conv['messages'])}")
                    print(f"   Context window: {conv['context_window']}")
                
                # Test context summary
                response = requests.get(f"{self.base_url}/api/v1/conversations/{self.conversation_id}/context?window_size=5")
                if response.status_code == 200:
                    context = response.json()
                    print(f"\n📋 Context Summary:")
                    print(f"   Message count: {context['message_count']}")
                    print(f"   Total tokens: {context['total_tokens']}")
                    print(f"   Context compressed: {context['context_compressed']}")
            
            print("✅ API endpoints demo completed successfully")
            
        except Exception as e:
            print(f"❌ API error: {e}")
    
    async def cleanup(self):
        """Cleanup demo data"""
        print(f"\n🧹 Cleanup")
        print("-" * 50)
        
        if self.conversation_id:
            # Archive conversation instead of deleting
            await database.execute("""
                UPDATE conversations 
                SET is_archived = true 
                WHERE id = :conversation_id
            """, {"conversation_id": self.conversation_id})
            print(f"✅ Archived conversation: {self.conversation_id}")
        
        await database.disconnect()
        print("✅ Disconnected from database")
    
    async def run_complete_demo(self):
        """Run the complete demo"""
        try:
            await self.setup()
            
            # Run all demos
            message_ids = await self.demo_conversation_creation()
            await self.demo_context_management()
            await self.demo_rollback_system()
            await self.demo_conversation_branching()
            await self.demo_websocket_realtime()
            await self.demo_analytics()
            await self.demo_api_endpoints()
            
            print(f"\n🎉 Aurora AI Robbiverse Demo Complete!")
            print(f"🎯 All features demonstrated successfully!")
            print(f"📚 Check API_DOCUMENTATION.md for full API reference")
            print(f"🔧 Use the test scripts to explore individual features")
            
        except Exception as e:
            print(f"❌ Demo error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await self.cleanup()

async def main():
    """Main demo function"""
    demo = AuroraAIDemo()
    await demo.run_complete_demo()

if __name__ == "__main__":
    asyncio.run(main())










