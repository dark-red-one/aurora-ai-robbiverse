#!/usr/bin/env python3
"""
Integration Test for Aurora Services
Tests all major services and integrations
"""

import requests
import json
import time
from datetime import datetime

def test_service(service_name, url, expected_status=200):
    """Test a service endpoint"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == expected_status:
            print(f"✅ {service_name}: OK")
            return True
        else:
            print(f"❌ {service_name}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {service_name}: {str(e)}")
        return False

def test_presidential_privilege():
    """Test Presidential Privilege system"""
    print("\n👑 Testing Presidential Privilege System...")
    
    # Test health
    if not test_service("Presidential Privilege Health", "http://localhost:8021/health"):
        return False
    
    # Test privilege request
    try:
        response = requests.post("http://localhost:8021/api/privilege/request", 
                               json={
                                   "pin": "2106",
                                   "user_id": "allan",
                                   "reason": "Integration test",
                                   "requested_actions": ["test"],
                                   "duration_minutes": 5
                               })
        if response.status_code == 200:
            data = response.json()
            session_id = data["session"]["session_id"]
            print(f"✅ Presidential Privilege Request: OK (Session: {session_id[:8]}...)")
            return True
        else:
            print("❌ Presidential Privilege Request: Failed")
            return False
    except Exception as e:
        print(f"❌ Presidential Privilege: {str(e)}")
        return False

def test_mayor_governance():
    """Test Mayor Governance system"""
    print("\n🏛️ Testing Mayor Governance System...")
    
    # Test health
    if not test_service("Mayor Governance Health", "http://localhost:8022/health"):
        return False
    
    # Test town governance
    try:
        response = requests.get("http://localhost:8022/api/towns/aurora/governance")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Town Governance: OK ({data['total_citizens']} citizens, {data['mayors']} mayors)")
            return True
        else:
            print("❌ Town Governance: Failed")
            return False
    except Exception as e:
        print(f"❌ Mayor Governance: {str(e)}")
        return False

def test_web_interface():
    """Test Web Interface"""
    print("\n🌐 Testing Web Interface...")
    
    # Test main interface
    if not test_service("Web Interface", "http://localhost:8000/robbie-unified-interface.html"):
        return False
    
    # Test if it's the right page
    try:
        response = requests.get("http://localhost:8000/robbie-unified-interface.html")
        if "Robbie Command Center" in response.text:
            print("✅ Web Interface Content: OK")
            return True
        else:
            print("❌ Web Interface Content: Wrong page")
            return False
    except Exception as e:
        print(f"❌ Web Interface: {str(e)}")
        return False

def main():
    """Run all integration tests"""
    print("🚀 Aurora Integration Test Suite")
    print("=" * 50)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Test core services
    results.append(("Presidential Privilege", test_presidential_privilege()))
    results.append(("Mayor Governance", test_mayor_governance()))
    results.append(("Web Interface", test_web_interface()))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for service, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{service:25} {status}")
        if result:
            passed += 1
    
    print("=" * 50)
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Aurora is ready!")
        return True
    else:
        print("⚠️  Some tests failed. Check the logs above.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
