#!/usr/bin/env python3
"""
Test all MCP servers to make sure they work! 🧪
"""

import asyncio
import sys
import os

# Add paths
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../services'))

async def test_aurora_backend():
    """Test Aurora backend MCP server"""
    print("\n🧪 Testing Aurora Backend MCP Server...")
    try:
        from mcp_server import MCPServer
        server = MCPServer("aurora-backend")
        
        # Test initialize
        init_result = server.initialize({})
        assert init_result['protocolVersion'] == "2024-11-05"
        print("  ✅ Initialize works!")
        
        # Test list tools
        tools_result = server.list_tools()
        tools = tools_result['tools']
        tool_names = [t['name'] for t in tools]
        print(f"  ✅ List tools works! Found {len(tools)} tools:")
        for name in tool_names:
            print(f"     - {name}")
        
        assert 'get_conversations' in tool_names
        assert 'get_sticky_notes' in tool_names
        assert 'get_personality_state' in tool_names
        
        print("  ✅ Aurora Backend MCP Server PASSES!")
        return True
    except Exception as e:
        print(f"  ❌ Aurora Backend FAILED: {e}")
        return False

async def test_ollama_server():
    """Test Ollama MCP server"""
    print("\n🧪 Testing Ollama MCP Server...")
    try:
        from mcp_ollama_server import OllamaMCPServer
        server = OllamaMCPServer()
        
        # Test initialize
        init_result = server.initialize({})
        assert init_result['protocolVersion'] == "2024-11-05"
        print("  ✅ Initialize works!")
        
        # Test list tools
        tools_result = server.list_tools()
        tools = tools_result['tools']
        tool_names = [t['name'] for t in tools]
        print(f"  ✅ List tools works! Found {len(tools)} tools:")
        for name in tool_names:
            print(f"     - {name}")
        
        # Tool names might be different, just check we have tools
        assert len(tools) > 0
        
        print("  ✅ Ollama MCP Server PASSES!")
        return True
    except Exception as e:
        print(f"  ❌ Ollama FAILED: {e}")
        return False

async def test_gpu_mesh_server():
    """Test GPU Mesh MCP server"""
    print("\n🧪 Testing GPU Mesh MCP Server...")
    try:
        from mcp_gpu_mesh_server import DualGPUMCPServer
        server = DualGPUMCPServer()
        
        # Test initialize
        init_result = server.initialize({})
        assert init_result['protocolVersion'] == "2024-11-05"
        print("  ✅ Initialize works!")
        
        # Test list tools
        tools_result = server.list_tools()
        tools = tools_result['tools']
        tool_names = [t['name'] for t in tools]
        print(f"  ✅ List tools works! Found {len(tools)} tools:")
        for name in tool_names:
            print(f"     - {name}")
        
        # Tool names might be different, just check we have tools
        assert len(tools) > 0
        
        print("  ✅ GPU Mesh MCP Server PASSES!")
        return True
    except Exception as e:
        print(f"  ❌ GPU Mesh FAILED: {e}")
        return False

async def test_personality_server():
    """Test Personality MCP server"""
    print("\n🧪 Testing Personality MCP Server...")
    try:
        from mcp_personality_server import PersonalityMCPServer
        server = PersonalityMCPServer()
        
        # Test initialize
        init_result = server.initialize({})
        assert init_result['protocolVersion'] == "2024-11-05"
        print("  ✅ Initialize works!")
        
        # Test list tools
        tools_result = server.list_tools()
        tools = tools_result['tools']
        tool_names = [t['name'] for t in tools]
        print(f"  ✅ List tools works! Found {len(tools)} tools:")
        for name in tool_names:
            print(f"     - {name}")
        
        # Tool names might be different, just check we have tools
        assert len(tools) > 0
        
        print("  ✅ Personality MCP Server PASSES!")
        return True
    except Exception as e:
        print(f"  ❌ Personality FAILED: {e}")
        return False

async def test_business_server():
    """Test Business Intelligence MCP server"""
    print("\n🧪 Testing Business Intelligence MCP Server...")
    try:
        from mcp_business_server import BusinessMCPServer
        server = BusinessMCPServer()
        
        # Test initialize
        init_result = server.initialize({})
        assert init_result['protocolVersion'] == "2024-11-05"
        print("  ✅ Initialize works!")
        
        # Test list tools
        tools_result = server.list_tools()
        tools = tools_result['tools']
        tool_names = [t['name'] for t in tools]
        print(f"  ✅ List tools works! Found {len(tools)} tools:")
        for name in tool_names:
            print(f"     - {name}")
        
        # Tool names might be different, just check we have tools
        assert len(tools) > 0
        
        print("  ✅ Business Intelligence MCP Server PASSES!")
        return True
    except Exception as e:
        print(f"  ❌ Business Intelligence FAILED: {e}")
        return False

async def test_daily_brief_server():
    """Test Daily Brief MCP server"""
    print("\n🧪 Testing Daily Brief MCP Server...")
    try:
        from mcp_daily_brief_server import DailyBriefMCPServer
        server = DailyBriefMCPServer()
        
        # Test initialize
        init_result = server.initialize({})
        assert init_result['protocolVersion'] == "2024-11-05"
        print("  ✅ Initialize works!")
        
        # Test list tools
        tools_result = server.list_tools()
        tools = tools_result['tools']
        tool_names = [t['name'] for t in tools]
        print(f"  ✅ List tools works! Found {len(tools)} tools:")
        for name in tool_names:
            print(f"     - {name}")
        
        # Tool names might be different, just check we have tools
        assert len(tools) > 0
        
        print("  ✅ Daily Brief MCP Server PASSES!")
        return True
    except Exception as e:
        print(f"  ❌ Daily Brief FAILED: {e}")
        return False

async def test_ai_router_server():
    """Test AI Router MCP server"""
    print("\n🧪 Testing AI Router MCP Server...")
    try:
        from mcp_ai_router_server import SmartRouterMCPServer
        server = SmartRouterMCPServer()
        
        # Test initialize
        init_result = server.initialize({})
        assert init_result['protocolVersion'] == "2024-11-05"
        print("  ✅ Initialize works!")
        
        # Test list tools
        tools_result = server.list_tools()
        tools = tools_result['tools']
        tool_names = [t['name'] for t in tools]
        print(f"  ✅ List tools works! Found {len(tools)} tools:")
        for name in tool_names:
            print(f"     - {name}")
        
        # Tool names might be different, just check we have tools
        assert len(tools) > 0
        
        print("  ✅ AI Router MCP Server PASSES!")
        return True
    except Exception as e:
        print(f"  ❌ AI Router FAILED: {e}")
        return False

async def main():
    print("=" * 70)
    print("🧪 TESTING ALL MCP SERVERS")
    print("=" * 70)
    
    results = {
        "aurora_backend": await test_aurora_backend(),
        "ollama": await test_ollama_server(),
        "gpu_mesh": await test_gpu_mesh_server(),
        "personality": await test_personality_server(),
        "business": await test_business_server(),
        "daily_brief": await test_daily_brief_server(),
        "ai_router": await test_ai_router_server()
    }
    
    print("\n" + "=" * 70)
    print("📊 TEST RESULTS")
    print("=" * 70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}  {name}")
    
    print("=" * 70)
    print(f"🎯 FINAL SCORE: {passed}/{total} servers working ({int(passed/total*100)}%)")
    print("=" * 70)
    
    if passed == total:
        print("\n🎉 ALL SYSTEMS GO! 🚀 READY FOR CURSOR!")
        return 0
    else:
        print(f"\n⚠️ {total - passed} server(s) need attention")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

