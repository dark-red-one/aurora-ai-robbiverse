#!/usr/bin/env python3
"""
Integration Test - Full Ollama Upgrade
Tests all components working together
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

async def test_model_router():
    """Test model router"""
    print("🧪 Testing Model Router...")
    try:
        # Import using relative path
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../packages/@robbieverse/api/src/ai'))
        import model_router
        
        result = model_router.route_message("Quick test", {}, False)
        assert "model_name" in result
        assert "reasoning" in result
        print("   ✅ Model router working")
        return True
    except Exception as e:
        print(f"   ❌ Model router failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_vision_handler():
    """Test vision handler"""
    print("🧪 Testing Vision Handler...")
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../packages/@robbieverse/api/src/ai'))
        import vision_handler
        
        handler = vision_handler.VisionHandler()
        assert handler.vision_model == "llama3.2-vision:11b"
        print("   ✅ Vision handler initialized")
        return True
    except Exception as e:
        print(f"   ❌ Vision handler failed: {e}")
        return False

async def test_performance_cache():
    """Test performance cache"""
    print("🧪 Testing Performance Cache...")
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../packages/@robbieverse/api/src/ai'))
        import performance_cache
        
        cache = performance_cache.ResponseCache()
        cache.set("test", "model", {"response": "test"})
        result = cache.get("test", "model")
        assert result is not None
        print("   ✅ Performance cache working")
        return True
    except Exception as e:
        print(f"   ❌ Performance cache failed: {e}")
        return False

async def test_robbie_ai():
    """Test RobbieAI integration"""
    print("🧪 Testing RobbieAI Integration...")
    try:
        # Check that files exist
        ai_path = os.path.join(os.path.dirname(__file__), '../packages/@robbieverse/api/src/ai')
        required_files = ['model_router.py', 'vision_handler.py', 'performance_cache.py']
        
        for filename in required_files:
            filepath = os.path.join(ai_path, filename)
            if not os.path.exists(filepath):
                print(f"   ⚠️  Missing file: {filename}")
                return False
        
        print("   ✅ All integration files present")
        print("   ✅ model_router.py")
        print("   ✅ vision_handler.py")
        print("   ✅ performance_cache.py")
        return True
    except Exception as e:
        print(f"   ❌ Integration check failed: {e}")
        return False

async def main():
    """Run all integration tests"""
    print("\n" + "="*60)
    print("🔬 Ollama Upgrade Integration Test")
    print("="*60 + "\n")
    
    tests = [
        ("Model Router", test_model_router),
        ("Vision Handler", test_vision_handler),
        ("Performance Cache", test_performance_cache),
        ("RobbieAI Integration", test_robbie_ai),
    ]
    
    results = []
    for name, test_func in tests:
        result = await test_func()
        results.append((name, result))
        print()
    
    # Summary
    print("="*60)
    print("📊 Test Summary")
    print("="*60 + "\n")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {name}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All integration tests passed!")
        print("🚀 System ready to use!")
        print("\nNext steps:")
        print("  1. Run ./scripts/setup-ollama-models.sh to install models")
        print("  2. Run python3 scripts/test-model-routing.py to verify routing")
        print("  3. Start using Robbie with smart routing!\n")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        print("Check error messages above for details\n")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

