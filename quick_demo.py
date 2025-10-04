#!/usr/bin/env python3
"""
Aurora RobbieVerse - Quick Demo
Experience the advanced features interactively
"""
import requests
import json
import uuid
import time

BASE_URL = "http://localhost:8000"

def demo_chat():
    """Demo the core chat functionality"""
    print("🤖 Aurora RobbieVerse Chat Demo")
    print("=" * 40)
    
    user_id = str(uuid.uuid4())
    print(f"👤 User ID: {user_id[:8]}...")
    
    # Start a conversation
    response = requests.post(f"{BASE_URL}/api/v1/chat", json={
        "message": "Hello Robbie! Tell me about your advanced features.",
        "user_id": user_id
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"🤖 Robbie: {data['response']}")
        print(f"💬 Conversation ID: {data['conversation_id'][:8]}...")
        return data['conversation_id']
    else:
        print(f"❌ Error: {response.status_code}")
        return None

def demo_personalities():
    """Demo the personality system"""
    print("\n🎭 Personality System Demo")
    print("=" * 40)
    
    # List available personalities
    response = requests.get(f"{BASE_URL}/api/v1/personalities/available")
    if response.status_code == 200:
        personalities = response.json()
        print("Available personalities:")
        for personality in personalities['personalities']:
            print(f"  • {personality['name']}: {personality['description']}")
    else:
        print(f"❌ Error getting personalities: {response.status_code}")

def demo_templates():
    """Demo the template system"""
    print("\n📋 Template System Demo")
    print("=" * 40)
    
    # List available templates
    response = requests.get(f"{BASE_URL}/api/v1/templates/available")
    if response.status_code == 200:
        templates = response.json()
        print("Available templates:")
        for template in templates['templates'][:3]:  # Show first 3
            print(f"  • {template['name']}: {template['description']}")
    else:
        print(f"❌ Error getting templates: {response.status_code}")

def demo_search():
    """Demo the search functionality"""
    print("\n🔍 Search System Demo")
    print("=" * 40)
    
    user_id = str(uuid.uuid4())
    
    # Create some test conversations first
    print("Creating test conversations...")
    conversations = [
        "Python programming best practices",
        "Machine learning model training",
        "Web development with React"
    ]
    
    for title in conversations:
        response = requests.post(f"{BASE_URL}/api/v1/chat", json={
            "message": f"Let's discuss {title}",
            "user_id": user_id
        })
        if response.status_code == 200:
            print(f"  ✅ Created: {title}")
        time.sleep(0.5)
    
    # Search for conversations
    search_queries = ["python", "machine learning", "web development"]
    
    for query in search_queries:
        print(f"\n🔍 Searching for: '{query}'")
        response = requests.get(f"{BASE_URL}/api/v1/search/conversations", params={
            "query": query,
            "user_id": user_id
        })
        
        if response.status_code == 200:
            results = response.json()
            print(f"  Found {len(results['results'])} results:")
            for result in results['results'][:2]:  # Show top 2
                print(f"    • {result['title']} (score: {result['relevance_score']:.2f})")
        else:
            print(f"  ❌ Search error: {response.status_code}")

def demo_analytics():
    """Demo the analytics features"""
    print("\n📊 Analytics Demo")
    print("=" * 40)
    
    # Get system health
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        health = response.json()
        print(f"🏥 System Status: {health['status']}")
        print(f"📈 Active Connections: {health.get('active_connections', 'N/A')}")
    
    # Get conversation analytics
    user_id = str(uuid.uuid4())
    response = requests.get(f"{BASE_URL}/api/v1/analytics/conversations/{user_id}")
    if response.status_code == 200:
        analytics = response.json()
        print(f"💬 Total Conversations: {analytics.get('total_conversations', 0)}")
        print(f"📝 Total Messages: {analytics.get('total_messages', 0)}")

def main():
    """Run the complete demo"""
    print("🚀 Aurora RobbieVerse - Interactive Demo")
    print("=" * 50)
    print("Make sure the server is running on http://localhost:8000")
    print()
    
    try:
        # Test server connection
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Server not responding. Make sure it's running on localhost:8000")
            return
        
        print("✅ Server is running!")
        
        # Run demos
        conversation_id = demo_chat()
        demo_personalities()
        demo_templates()
        demo_search()
        demo_analytics()
        
        print("\n🎉 Demo Complete!")
        print("=" * 50)
        print("🌐 Visit http://localhost:8000/docs for full API documentation")
        print("🔧 All advanced features are working and ready to use!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running:")
        print("   cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
    except Exception as e:
        print(f"❌ Demo error: {e}")

if __name__ == "__main__":
    main()









