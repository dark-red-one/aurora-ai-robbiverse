#!/usr/bin/env python3
"""
Aurora RobbieVerse - Advanced Features Test
Tests collaborative templates, personality learning, and semantic search
"""
import asyncio
import json
import uuid
from datetime import datetime, timedelta
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.database import database
from app.services.collaborative_templates import collaborative_template_manager, TemplateVisibility
from app.services.ai.personality_learning import personality_learning_manager
from app.services.semantic_search import semantic_search_manager
from app.services.conversation_templates import template_manager

async def test_collaborative_templates():
    """Test collaborative template features"""
    print("\n🤝 Testing Collaborative Templates")
    print("=" * 50)
    
    # Create test users
    user1_id = str(uuid.uuid4())
    user2_id = str(uuid.uuid4())
    
    for user_id, username in [(user1_id, f"creator_{user1_id[:8]}"), (user2_id, f"user_{user2_id[:8]}")]:
        await database.execute("""
            INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
            VALUES (:id, :username, :email, :password_hash, :created_at, :updated_at)
        """, {
            "id": user_id,
            "username": username,
            "email": f"{username}@example.com",
            "password_hash": "test_hash",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    
    print(f"👤 Created users: {user1_id[:8]} (creator), {user2_id[:8]} (user)")
    
    # Create a custom template
    template_result = await template_manager.create_custom_template(
        user_id=user1_id,
        name="Advanced Python Debugging",
        description="Deep dive into Python debugging techniques",
        category="technical",
        personality="analyst",
        initial_messages=[
            {"role": "system", "content": "Welcome to advanced Python debugging! Let's solve complex issues together."}
        ],
        suggested_topics=["debugging", "python", "troubleshooting", "performance"],
        context_settings={"context_window_size": 20, "enable_rollback": True}
    )
    
    template_id = template_result["template_id"]
    print(f"📋 Created custom template: {template_id}")
    
    # Share the template publicly
    share_result = await collaborative_template_manager.share_template(
        template_id=template_id,
        owner_user_id=user1_id,
        visibility=TemplateVisibility.PUBLIC,
        allow_forking=True,
        allow_editing=False
    )
    
    print(f"🌐 Shared template publicly: {share_result['share_id']}")
    
    # Fork the template as user2
    fork_result = await collaborative_template_manager.fork_template(
        template_id=template_id,
        user_id=user2_id,
        new_name="My Python Debugging Approach",
        new_description="Personalized Python debugging template"
    )
    
    print(f"🍴 Forked template: {fork_result['fork_id']}")
    
    # Rate the original template
    rating_result = await collaborative_template_manager.rate_template(
        template_id=template_id,
        user_id=user2_id,
        rating=5,
        review="Excellent template for debugging complex Python issues!"
    )
    
    print(f"⭐ Rated template: {rating_result['rating']} stars")
    
    # Get community templates
    community_templates = await collaborative_template_manager.get_community_templates(
        category="technical",
        sort_by="popular",
        limit=5
    )
    
    print(f"🏘️  Found {len(community_templates)} community templates")
    for template in community_templates:
        print(f"   - {template['name']}: {template['avg_rating']:.1f}⭐ ({template['usage_count']} uses)")

async def test_personality_learning():
    """Test personality learning features"""
    print("\n🧠 Testing Personality Learning")
    print("=" * 50)
    
    # Create test user
    user_id = str(uuid.uuid4())
    await database.execute("""
        INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
        VALUES (:id, :username, :email, :password_hash, :created_at, :updated_at)
    """, {
        "id": user_id,
        "username": f"learning_{user_id[:8]}",
        "email": f"learning_{user_id[:8]}@example.com",
        "password_hash": "test_hash",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    print(f"👤 Created learning user: {user_id[:8]}")
    
    # Create a conversation
    conversation_id = str(uuid.uuid4())
    await database.execute("""
        INSERT INTO conversations (id, user_id, title, context_window_size, created_at, updated_at)
        VALUES (:id, :user_id, :title, :context_window_size, :created_at, :updated_at)
    """, {
        "id": conversation_id,
        "user_id": user_id,
        "title": "Learning Conversation",
        "context_window_size": 10,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    # Add some messages and record interactions
    messages_and_interactions = [
        ("How do I debug Python code?", "positive", "robbie"),
        ("This explanation is very helpful!", "positive", "robbie"),
        ("Can you explain async programming?", "positive", "robbie"),
        ("I don't understand this concept", "negative", "robbie"),
        ("Let me try a different approach", "neutral", "creative"),
        ("This creative explanation works better!", "positive", "creative"),
    ]
    
    print(f"💬 Recording learning interactions...")
    for content, interaction_type, personality_id in messages_and_interactions:
        # Add message
        message_id = str(uuid.uuid4())
        await database.execute("""
            INSERT INTO messages (
                id, conversation_id, role, content, created_at, context_importance
            ) VALUES (
                :id, :conversation_id, :role, :content, :created_at, :importance
            )
        """, {
            "id": message_id,
            "conversation_id": conversation_id,
            "role": "user" if "?" in content else "assistant",
            "content": content,
            "created_at": datetime.utcnow(),
            "importance": 7
        })
        
        # Record interaction
        await personality_learning_manager.record_user_interaction(
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
            personality_id=personality_id,
            interaction_type=interaction_type,
            context_data={"test_scenario": True}
        )
    
    print(f"   Recorded {len(messages_and_interactions)} interactions")
    
    # Get personalized personality recommendation
    personalized = await personality_learning_manager.get_personalized_personality_for_user(
        user_id=user_id
    )
    
    recommended = personalized["recommended_personality"]
    print(f"🎯 Recommended personality: {recommended['personality']['name']} (score: {recommended['fit_score']:.2f})")
    
    # Get learning insights
    insights = await personality_learning_manager.get_learning_insights(
        user_id=user_id,
        days=30
    )
    
    print(f"📊 Learning insights:")
    print(f"   - Total interactions: {insights['total_interactions']}")
    print(f"   - Learning maturity: {insights['learning_maturity']}")
    print(f"   - Top personality preferences:")
    for pref in insights['personality_preferences'][:3]:
        print(f"     • {pref['personality_name']}: {pref['positive_ratio']:.2f} positive ratio")

async def test_semantic_search():
    """Test semantic search features"""
    print("\n🔍 Testing Semantic Search")
    print("=" * 50)
    
    # Create test user
    user_id = str(uuid.uuid4())
    await database.execute("""
        INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
        VALUES (:id, :username, :email, :password_hash, :created_at, :updated_at)
    """, {
        "id": user_id,
        "username": f"search_{user_id[:8]}",
        "email": f"search_{user_id[:8]}@example.com",
        "password_hash": "test_hash",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    print(f"👤 Created search user: {user_id[:8]}")
    
    # Create test conversations with rich content
    conversations_data = [
        {
            "title": "Python Web Development with FastAPI",
            "messages": [
                "How do I create a REST API with FastAPI?",
                "FastAPI is a modern Python web framework for building APIs quickly and efficiently.",
                "Can you show me how to handle database connections?",
                "Here's how to set up SQLAlchemy with FastAPI for database operations."
            ]
        },
        {
            "title": "Machine Learning Data Analysis",
            "messages": [
                "What's the best approach for data preprocessing?",
                "Data preprocessing involves cleaning, transforming, and preparing your dataset.",
                "How do I handle missing values in my dataset?",
                "There are several strategies: imputation, deletion, or interpolation."
            ]
        },
        {
            "title": "JavaScript Frontend Debugging",
            "messages": [
                "My React app is running slowly, how can I debug performance issues?",
                "Use React DevTools Profiler to identify performance bottlenecks.",
                "What about memory leaks in JavaScript applications?",
                "Memory leaks often occur due to closures, event listeners, or circular references."
            ]
        }
    ]
    
    print(f"📚 Creating test conversations with searchable content...")
    conversation_ids = []
    
    for conv_data in conversations_data:
        # Create conversation
        conversation_id = str(uuid.uuid4())
        await database.execute("""
            INSERT INTO conversations (id, user_id, title, context_window_size, created_at, updated_at)
            VALUES (:id, :user_id, :title, :context_window_size, :created_at, :updated_at)
        """, {
            "id": conversation_id,
            "user_id": user_id,
            "title": conv_data["title"],
            "context_window_size": 10,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        conversation_ids.append(conversation_id)
        
        # Add messages
        for i, content in enumerate(conv_data["messages"]):
            message_id = str(uuid.uuid4())
            role = "user" if i % 2 == 0 else "assistant"
            await database.execute("""
                INSERT INTO messages (
                    id, conversation_id, role, content, created_at, context_importance
                ) VALUES (
                    :id, :conversation_id, :role, :content, :created_at, :importance
                )
            """, {
                "id": message_id,
                "conversation_id": conversation_id,
                "role": role,
                "content": content,
                "created_at": datetime.utcnow(),
                "importance": 7
            })
    
    print(f"   Created {len(conversations_data)} conversations")
    
    # Test conversation search
    search_queries = [
        "FastAPI database connections",
        "React performance debugging",
        "data preprocessing missing values",
        "Python API development"
    ]
    
    print(f"🔍 Testing conversation search:")
    for query in search_queries:
        results = await semantic_search_manager.search_conversations(
            user_id=user_id,
            query=query,
            limit=5
        )
        
        print(f"   Query: '{query}' -> {len(results['results'])} results")
        for result in results['results'][:2]:  # Show top 2
            print(f"     • {result['title']} (score: {result['relevance_score']:.2f})")
    
    # Test message search
    print(f"\n🔍 Testing message search:")
    message_results = await semantic_search_manager.search_messages(
        user_id=user_id,
        query="performance debugging React",
        limit=10
    )
    
    print(f"   Message search results: {len(message_results['results'])}")
    for result in message_results['results'][:3]:
        print(f"     • [{result['role']}]: {result['snippet'][:80]}... (score: {result['relevance_score']:.2f})")
    
    # Test search suggestions
    print(f"\n💡 Testing search suggestions:")
    suggestions = await semantic_search_manager.get_search_suggestions(
        user_id=user_id,
        partial_query="debug",
        limit=5
    )
    
    print(f"   Suggestions for 'debug': {len(suggestions)}")
    for suggestion in suggestions:
        print(f"     • {suggestion['text']} ({suggestion['type']}, confidence: {suggestion['confidence']})")
    
    # Build search index
    print(f"\n🗂️  Building search index...")
    index_result = await semantic_search_manager.create_search_index(user_id=user_id)
    print(f"   Created index with {index_result['conversation_terms']} conversation terms")
    print(f"   and {index_result['message_terms']} message terms")

async def test_integration():
    """Test integration between all advanced features"""
    print("\n🔗 Testing Feature Integration")
    print("=" * 50)
    
    # Create user
    user_id = str(uuid.uuid4())
    await database.execute("""
        INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
        VALUES (:id, :username, :email, :password_hash, :created_at, :updated_at)
    """, {
        "id": user_id,
        "username": f"integration_{user_id[:8]}",
        "email": f"integration_{user_id[:8]}@example.com",
        "password_hash": "test_hash",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    print(f"👤 Created integration user: {user_id[:8]}")
    
    # 1. Create template from popular community template
    community_templates = await collaborative_template_manager.get_community_templates(limit=1)
    if community_templates:
        template = community_templates[0]
        print(f"📋 Using community template: {template['name']}")
        
        # Track template usage
        await collaborative_template_manager.track_template_usage(
            template_id=template['template_id'],
            user_id=user_id,
            conversation_id=str(uuid.uuid4())
        )
        print(f"📊 Tracked template usage")
    
    # 2. Get personalized recommendations based on learning
    personalized = await personality_learning_manager.get_personalized_personality_for_user(user_id)
    if personalized["recommended_personality"]:
        personality = personalized["recommended_personality"]["personality"]
        print(f"🎯 Recommended personality: {personality['name']}")
    
    # 3. Search for templates based on learned preferences
    template_search = await semantic_search_manager.search_templates(
        query="python debugging technical",
        user_id=user_id,
        include_community=True
    )
    
    print(f"🔍 Found {len(template_search['results'])} matching templates")
    
    # 4. Get trending templates (based on recent usage)
    trending = await collaborative_template_manager.get_trending_templates(days=7, limit=5)
    print(f"📈 Trending templates: {len(trending)}")
    for template in trending:
        print(f"   - {template['name']}: {template['recent_usage']} recent uses")
    
    print(f"\n✅ Integration test completed successfully!")

async def main():
    """Run all advanced feature tests"""
    print("🚀 Aurora RobbieVerse - Advanced Features Test")
    print("=" * 60)
    
    try:
        await database.connect()
        print("✅ Connected to Aurora database")
        
        # Run all tests
        await test_collaborative_templates()
        await test_personality_learning() 
        await test_semantic_search()
        await test_integration()
        
        print(f"\n🎉 All Advanced Features Tests Completed!")
        print("=" * 60)
        print("✅ Collaborative Templates: Sharing, forking, rating")
        print("✅ Personality Learning: User interaction analysis")
        print("✅ Semantic Search: Intelligent content discovery")
        print("✅ Feature Integration: Cross-system functionality")
        
    except Exception as e:
        print(f"❌ Test error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await database.disconnect()
        print("✅ Disconnected from database")

if __name__ == "__main__":
    asyncio.run(main())
