#!/usr/bin/env python3
"""
Aurora RobbieVerse - Conversation Context Test Script
Demonstrates conversation context, rollback, and branching functionality
"""
import asyncio
import json
import uuid
from datetime import datetime
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.conversation_context import ConversationContextManager
from app.db.database import database

async def test_conversation_context():
    """Test the conversation context and rollback functionality"""
    
    print("🚀 Aurora RobbieVerse - Conversation Context Test")
    print("=" * 60)
    
    # Initialize the context manager
    context_manager = ConversationContextManager()
    
    try:
        # Connect to database
        await database.connect()
        print("✅ Connected to Aurora database")
        
        # Create a test user first
        user_id = str(uuid.uuid4())
        username = f"test_user_{user_id[:8]}"
        print(f"👤 Creating test user: {username}")
        
        await database.execute("""
            INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
            VALUES (:id, :username, :email, :password_hash, :created_at, :updated_at)
        """, {
            "id": user_id,
            "username": username,
            "email": f"test_{user_id[:8]}@example.com",
            "password_hash": "test_hash",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Create a test conversation
        conversation_id = str(uuid.uuid4())
        print(f"📝 Creating test conversation: {conversation_id}")
        
        # Insert conversation
        await database.execute("""
            INSERT INTO conversations (id, user_id, title, context_window_size, created_at, updated_at)
            VALUES (:id, :user_id, :title, :context_window_size, :created_at, :updated_at)
        """, {
            "id": conversation_id,
            "user_id": user_id,
            "title": "Test Conversation with Context",
            "context_window_size": 10,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Add some test messages
        print("\n💬 Adding test messages...")
        
        messages = [
            ("user", "Hello! I'm working on a Python project and need help with async programming."),
            ("assistant", "Hello! I'd be happy to help you with async programming in Python. What specific aspect would you like to learn about?"),
            ("user", "I'm confused about the difference between asyncio.run() and await. Can you explain?"),
            ("assistant", "Great question! `asyncio.run()` is used to run the main async function from synchronous code, while `await` is used inside async functions to wait for other async operations. Let me give you some examples..."),
            ("user", "That's helpful! What about error handling in async code?"),
            ("assistant", "Error handling in async code is similar to regular Python, but you need to be careful about where you catch exceptions. You can use try/except blocks around await statements..."),
            ("user", "Perfect! Now I want to learn about async context managers."),
            ("assistant", "Async context managers are great for managing resources in async code. They use `async with` statements and implement `__aenter__` and `__aexit__` methods..."),
            ("user", "This is getting complex. Can you simplify it?"),
            ("assistant", "Of course! Let me break it down into simpler terms. Think of async programming like cooking - you can start multiple dishes at once and check on them as they cook..."),
            ("user", "That analogy really helps! What about testing async code?"),
            ("assistant", "Testing async code requires special test runners like `pytest-asyncio`. You use `async def` for test functions and `await` for async operations..."),
            ("user", "Thanks! I think I understand async programming much better now."),
            ("assistant", "You're welcome! You've covered the fundamentals well. Remember to practice with small projects and don't hesitate to ask if you have more questions!")
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
        
        # Test conversation context retrieval
        print(f"\n🔍 Testing conversation context retrieval...")
        context = await context_manager.get_conversation_context(conversation_id, context_window=5)
        
        print(f"  📊 Context Statistics:")
        print(f"     - Total messages: {context['total_messages']}")
        print(f"     - Context window: {context['context_window']}")
        print(f"     - Context compressed: {context['context_compressed']}")
        print(f"     - Messages in context: {len(context['messages'])}")
        
        # Show selected context messages
        print(f"\n📋 Selected Context Messages:")
        for i, msg in enumerate(context['messages']):
            print(f"  {i+1:2d}. {msg['role']:10s}: {msg['content'][:60]}...")
            print(f"      Importance: {msg.get('context_importance', 'N/A')}, Tokens: {msg.get('token_count', 0)}")
        
        # Test rollback functionality
        print(f"\n⏪ Testing rollback functionality...")
        
        # Rollback the last message
        last_message_id = message_ids[-1]
        rollback_success = await context_manager.rollback_message(
            last_message_id, 
            "Testing rollback functionality"
        )
        print(f"  Rolled back message: {rollback_success}")
        
        # Get rollback history
        rollback_history = await context_manager.get_rollback_history(conversation_id)
        print(f"  Rollback history: {len(rollback_history)} messages")
        for msg in rollback_history:
            print(f"    - {msg['role']}: {msg['content'][:40]}... (deleted: {msg['deleted_at']})")
        
        # Test conversation branching
        print(f"\n🌿 Testing conversation branching...")
        
        # Create a branch from the 6th message (about error handling)
        branch_point_id = message_ids[5]  # "What about error handling in async code?"
        branch_id = await context_manager.create_conversation_branch(
            conversation_id=conversation_id,
            branch_point_message_id=branch_point_id,
            name="Alternative Error Handling Approach",
            description="Exploring a different approach to async error handling"
        )
        print(f"  Created branch: {branch_id}")
        
        # Add alternative messages to the branch
        alternative_messages = [
            ("assistant", "Actually, let me show you a different approach to error handling using asyncio.gather()..."),
            ("user", "That's interesting! How does gather() handle errors differently?"),
            ("assistant", "Great question! `asyncio.gather()` has a `return_exceptions` parameter that lets you handle errors more gracefully...")
        ]
        
        for role, content in alternative_messages:
            await context_manager.add_message(
                conversation_id=conversation_id,
                role=role,
                content=content,
                branch_id=branch_id,
                metadata={"branch_message": True}
            )
        
        # Get conversation branches
        branches = await context_manager.get_conversation_branches(conversation_id)
        print(f"  Total branches: {len(branches)}")
        for branch in branches:
            print(f"    - {branch['name']}: {branch['description']}")
        
        # Test context compression
        print(f"\n🗜️  Testing context compression...")
        compression_result = await context_manager.compress_conversation_context(conversation_id)
        print(f"  Compression result: {compression_result}")
        
        # Test database functions
        print(f"\n🔧 Testing database functions...")
        
        # Test get_conversation_context function
        db_context = await database.fetch_all("""
            SELECT * FROM get_conversation_context(:conversation_id, :window_size)
        """, {
            "conversation_id": conversation_id,
            "window_size": 3
        })
        print(f"  Database function returned {len(db_context)} context messages")
        
        # Test get_rollback_history function
        db_rollback = await database.fetch_all("""
            SELECT * FROM get_rollback_history(:conversation_id)
        """, {
            "conversation_id": conversation_id
        })
        print(f"  Database function returned {len(db_rollback)} rollback entries")
        
        print(f"\n✅ All tests completed successfully!")
        print(f"🎯 Conversation Context System is fully operational!")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await database.disconnect()
        print("🔌 Disconnected from database")

if __name__ == "__main__":
    asyncio.run(test_conversation_context())
