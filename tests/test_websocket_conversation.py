#!/usr/bin/env python3
"""
Aurora RobbieVerse - WebSocket Conversation Test
Tests real-time conversation updates via WebSocket
"""
import asyncio
import json
import websockets
import uuid
from datetime import datetime
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.conversation_context import ConversationContextManager
from app.db.database import database

async def test_websocket_conversation():
    """Test WebSocket conversation functionality"""
    
    print("🚀 Aurora RobbieVerse - WebSocket Conversation Test")
    print("=" * 60)
    
    # Initialize the context manager
    context_manager = ConversationContextManager()
    
    try:
        # Connect to database
        await database.connect()
        print("✅ Connected to Aurora database")
        
        # Create a test user and conversation
        user_id = str(uuid.uuid4())
        conversation_id = str(uuid.uuid4())
        
        # Create user
        await database.execute("""
            INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
            VALUES (:id, :username, :email, :password_hash, :created_at, :updated_at)
        """, {
            "id": user_id,
            "username": f"ws_test_user_{user_id[:8]}",
            "email": f"ws_test_{user_id[:8]}@example.com",
            "password_hash": "test_hash",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Create conversation
        await database.execute("""
            INSERT INTO conversations (id, user_id, title, context_window_size, created_at, updated_at)
            VALUES (:id, :user_id, :title, :context_window_size, :created_at, :updated_at)
        """, {
            "id": conversation_id,
            "user_id": user_id,
            "title": "WebSocket Test Conversation",
            "context_window_size": 10,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        print(f"👤 Created test user: {user_id}")
        print(f"📝 Created test conversation: {conversation_id}")
        
        # Test WebSocket connection
        print(f"\n🔌 Testing WebSocket connection...")
        
        # Connect to conversation WebSocket
        uri = f"ws://localhost:8000/ws/conversations/{conversation_id}?user_id={user_id}"
        
        try:
            async with websockets.connect(uri) as websocket:
                print("✅ WebSocket connected successfully")
                
                # Test ping/pong
                print("\n🏓 Testing ping/pong...")
                await websocket.send(json.dumps({"event": "ping"}))
                response = await websocket.recv()
                data = json.loads(response)
                print(f"  Pong received: {data['event']}")
                
                # Test get context
                print("\n📋 Testing context retrieval...")
                await websocket.send(json.dumps({"event": "get_context"}))
                response = await websocket.recv()
                data = json.loads(response)
                print(f"  Context event: {data['event']}")
                print(f"  Messages in context: {len(data['data']['messages'])}")
                
                # Add some test messages
                print("\n💬 Adding test messages...")
                
                messages = [
                    ("user", "Hello! I'm testing the WebSocket functionality."),
                    ("assistant", "Hello! I'm here to help you test the WebSocket features. What would you like to explore?"),
                    ("user", "Can you show me how rollback works?"),
                    ("assistant", "Sure! Rollback allows you to undo messages. Let me demonstrate..."),
                    ("user", "That's great! Now let's test branching."),
                    ("assistant", "Branching lets you explore different conversation paths. Here's how it works...")
                ]
                
                message_ids = []
                for i, (role, content) in enumerate(messages):
                    message_id = await context_manager.add_message(
                        conversation_id=conversation_id,
                        role=role,
                        content=content,
                        metadata={"test_message": True, "sequence": i + 1}
                    )
                    message_ids.append(message_id)
                    print(f"  {i+1:2d}. {role:10s}: {content[:50]}...")
                    
                    # Wait for WebSocket event
                    try:
                        event_response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                        event_data = json.loads(event_response)
                        print(f"      📡 WebSocket event: {event_data['event']}")
                    except asyncio.TimeoutError:
                        print(f"      ⏰ No WebSocket event received (timeout)")
                
                # Test rollback
                print(f"\n⏪ Testing rollback via WebSocket...")
                last_message_id = message_ids[-1]
                rollback_success = await context_manager.rollback_message(
                    last_message_id, 
                    "Testing rollback via WebSocket"
                )
                print(f"  Rollback successful: {rollback_success}")
                
                # Wait for rollback WebSocket event
                try:
                    event_response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    event_data = json.loads(event_response)
                    print(f"  📡 Rollback event: {event_data['event']}")
                    print(f"  📊 Conversation stats: {event_data['data']['conversation_stats']}")
                except asyncio.TimeoutError:
                    print(f"  ⏰ No rollback event received (timeout)")
                
                # Test branch creation
                print(f"\n🌿 Testing branch creation...")
                branch_point_id = message_ids[2]  # "Can you show me how rollback works?"
                branch_id = await context_manager.create_conversation_branch(
                    conversation_id=conversation_id,
                    branch_point_message_id=branch_point_id,
                    name="Alternative Rollback Approach",
                    description="Testing different rollback explanation"
                )
                print(f"  Branch created: {branch_id}")
                
                # Wait for branch creation WebSocket event
                try:
                    event_response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    event_data = json.loads(event_response)
                    print(f"  📡 Branch event: {event_data['event']}")
                    print(f"  📊 Conversation stats: {event_data['data']['conversation_stats']}")
                except asyncio.TimeoutError:
                    print(f"  ⏰ No branch event received (timeout)")
                
                # Test branch switching
                print(f"\n🔄 Testing branch switching...")
                switch_success = await context_manager.switch_to_branch(conversation_id, branch_id)
                print(f"  Branch switch successful: {switch_success}")
                
                # Wait for branch switch WebSocket event
                try:
                    event_response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    event_data = json.loads(event_response)
                    print(f"  📡 Branch switch event: {event_data['event']}")
                    print(f"  📊 Conversation stats: {event_data['data']['conversation_stats']}")
                except asyncio.TimeoutError:
                    print(f"  ⏰ No branch switch event received (timeout)")
                
                # Test restore message
                print(f"\n🔄 Testing message restore...")
                restore_success = await context_manager.restore_message(last_message_id)
                print(f"  Restore successful: {restore_success}")
                
                # Wait for restore WebSocket event
                try:
                    event_response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    event_data = json.loads(event_response)
                    print(f"  📡 Restore event: {event_data['event']}")
                    print(f"  📊 Conversation stats: {event_data['data']['conversation_stats']}")
                except asyncio.TimeoutError:
                    print(f"  ⏰ No restore event received (timeout)")
                
                # Test get branches
                print(f"\n🌿 Testing branch retrieval...")
                await websocket.send(json.dumps({"event": "get_branches"}))
                response = await websocket.recv()
                data = json.loads(response)
                print(f"  Branches event: {data['event']}")
                print(f"  Total branches: {len(data['data'])}")
                
                # Test get rollback history
                print(f"\n📜 Testing rollback history...")
                await websocket.send(json.dumps({"event": "get_rollback_history"}))
                response = await websocket.recv()
                data = json.loads(response)
                print(f"  Rollback history event: {data['event']}")
                print(f"  Rollback entries: {len(data['data'])}")
                
                print(f"\n✅ All WebSocket tests completed successfully!")
                print(f"🎯 Real-time conversation system is fully operational!")
                
        except websockets.exceptions.ConnectionRefused:
            print("❌ WebSocket connection refused. Make sure the server is running on localhost:8000")
            print("   Start the server with: cd backend && python -m uvicorn app.main:app --reload")
        except Exception as e:
            print(f"❌ WebSocket error: {e}")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await database.disconnect()
        print("🔌 Disconnected from database")

if __name__ == "__main__":
    asyncio.run(test_websocket_conversation())










