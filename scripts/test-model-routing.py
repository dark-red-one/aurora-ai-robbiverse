#!/usr/bin/env python3
"""
Test Model Routing System
Verifies that smart routing works correctly
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from packages.robbieverse.api.src.ai.model_router import route_message, ModelType

class Colors:
    """Terminal colors"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_test(name, result, expected):
    """Print test result"""
    model = result["model_name"]
    reasoning = result["reasoning"]
    passed = (expected in model) or (expected == result["model_type"].value)
    
    status = f"{Colors.GREEN}✅ PASS{Colors.END}" if passed else f"{Colors.RED}❌ FAIL{Colors.END}"
    
    print(f"\n{status} {name}")
    print(f"  🎯 Model: {Colors.CYAN}{model}{Colors.END}")
    print(f"  📝 Reasoning: {reasoning}")
    if not passed:
        print(f"  ⚠️  Expected: {expected}")

def main():
    """Run routing tests"""
    print(f"\n{Colors.BOLD}🧪 Model Routing Test Suite{Colors.END}\n")
    print("=" * 60)
    
    # Test cases: (name, message, context, has_image, expected_model)
    tests = [
        (
            "Simple Question",
            "What's 2+2?",
            None,
            False,
            "qwen2.5-coder:7b"
        ),
        (
            "Complex Analysis",
            "Can you analyze the entire codebase architecture and suggest a comprehensive refactoring strategy?",
            None,
            False,
            "qwen2.5-coder:32k"
        ),
        (
            "Screenshot Analysis",
            "What's wrong with this UI?",
            None,
            True,
            "llama3.2-vision"
        ),
        (
            "Vision Keywords",
            "Can you look at this design and tell me what you see?",
            None,
            False,
            "llama3.2-vision"
        ),
        (
            "Large File Context",
            "Review this code",
            {"file_size": 1500, "file_count": 1},
            False,
            "qwen2.5-coder:32k"
        ),
        (
            "Multiple Files",
            "Compare these implementations",
            {"file_count": 5},
            False,
            "qwen2.5-coder:32k"
        ),
        (
            "Long Conversation",
            "Continue our discussion",
            {"conversation_length": 15},
            False,
            "qwen2.5-coder:32k"
        ),
        (
            "Quick Fix",
            "Fix this typo",
            None,
            False,
            "qwen2.5-coder:7b"
        ),
        (
            "Architecture Review",
            "Review our microservices architecture",
            None,
            False,
            "qwen2.5-coder:32k"
        ),
        (
            "UI Mockup",
            "Review this design mockup for professional appearance",
            None,
            False,
            "llama3.2-vision"
        ),
    ]
    
    passed = 0
    total = len(tests)
    
    for name, message, context, has_image, expected in tests:
        result = route_message(
            message=message,
            context=context,
            has_image=has_image
        )
        
        print_test(name, result, expected)
        
        if expected in result["model_name"] or expected == result["model_type"].value:
            passed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print(f"\n{Colors.BOLD}📊 Test Summary{Colors.END}\n")
    print(f"  Total: {total}")
    print(f"  {Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"  {Colors.RED}Failed: {total - passed}{Colors.END}")
    
    success_rate = (passed / total) * 100
    print(f"  Success Rate: {success_rate:.1f}%")
    
    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 All tests passed! Routing system is working perfectly.{Colors.END}\n")
        return 0
    else:
        print(f"\n{Colors.YELLOW}⚠️  Some tests failed. Review routing logic.{Colors.END}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())


