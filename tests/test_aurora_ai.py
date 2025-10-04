#!/usr/bin/env python3
import asyncio
import sys
sys.path.append("/workspace/aurora/backend")

from app.services.ai.dual_llm_coordinator import DualLLMCoordinator

async def test_aurora_ai():
    print("🤖 Aurora RobbieVerse - Dual LLM System Test")
    print("=" * 50)
    
    dual_llm = DualLLMCoordinator()
    print("✅ Dual LLM system initialized")
    
    test_messages = [
        "Hello, who are you?",
        "What can you help me with?", 
        "Tell me about Aurora",
        "password=secret123",
        "How does the safety system work?"
    ]
    
    print("\n🧪 Testing AI Responses:")
    print("-" * 30)
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n[Test {i}] User: {message}")
        
        try:
            result = await dual_llm.process_user_message(message, "test_user")
            print(f"🤖 {result[source]}: {result[response]}")
            print(f"   Status: {result[safety_status]}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n📊 System Status:")
    print("-" * 20)
    status = await dual_llm.get_system_status()
    print(f"System: {status[system]}")
    print(f"Status: {status[status]}")
    print(f"Safety Mode: {status[safety_mode]}")
    
    print("\n🎉 Aurora AI System Test Complete!")
    return True

if __name__ == "__main__":
    asyncio.run(test_aurora_ai())
