#!/usr/bin/env python3
"""
Quick test script for Aurora Dashboard
Tests database connectivity and basic functionality
"""

import sys
import psycopg2
import requests
import json
from datetime import datetime

# Database configuration
DB_CONFIG = {
    "host": "aurora-postgres-u44170.vm.elestio.app",
    "port": 25432,
    "dbname": "aurora_unified",
    "user": "aurora_app",
    "password": "TestPilot2025_Aurora!",
    "sslmode": "require"
}

def test_database():
    """Test database connectivity and sample data"""
    print("🔍 Testing database connectivity...")
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        with conn.cursor() as cur:
            # Test basic connectivity
            cur.execute("SELECT version()")
            version = cur.fetchone()[0]
            print(f"✅ PostgreSQL connected: {version[:50]}...")
            
            # Check for data
            cur.execute("SELECT COUNT(*) FROM companies WHERE owner_id = %s", ('aurora',))
            companies = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM contacts WHERE owner_id = %s", ('aurora',))
            contacts = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM deals WHERE owner_id = %s", ('aurora',))
            deals = cur.fetchone()[0]
            
            print(f"📊 Data found: {companies} companies, {contacts} contacts, {deals} deals")
            
            if companies == 0 and contacts == 0 and deals == 0:
                print("⚠️  No data found - running sample data import...")
                create_sample_data(cur)
                conn.commit()
            
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def create_sample_data(cur):
    """Create sample data for testing"""
    # Sample companies
    cur.execute("""
        INSERT INTO companies (
            hubspot_id, name, domain, industry, owner_id
        ) VALUES 
        ('test-001', 'TestPilot Simulations HQ', 'testpilot.ai', 'AI/Software', 'aurora'),
        ('test-002', 'Aurora Intelligence Corp', 'aurora-ai.com', 'AI/Analytics', 'aurora'),
        ('test-003', 'Robbie Ventures', 'robbie.ai', 'AI Assistant', 'aurora')
        ON CONFLICT (hubspot_id) DO NOTHING
    """)
    
    # Sample contacts
    cur.execute("""
        INSERT INTO contacts (
            hubspot_id, first_name, last_name, email, job_title, owner_id
        ) VALUES 
        ('contact-test-001', 'Allan', 'CEO', 'allan@testpilot.ai', 'Chief Executive', 'aurora'),
        ('contact-test-002', 'Robbie', 'AI', 'robbie@testpilot.ai', 'AI Assistant', 'aurora'),
        ('contact-test-003', 'Aurora', 'System', 'aurora@testpilot.ai', 'AI Empire', 'aurora')
        ON CONFLICT (hubspot_id) DO NOTHING
    """)
    
    # Sample deals
    cur.execute("""
        INSERT INTO deals (
            hubspot_id, deal_name, amount, pipeline, dealstage, owner_id
        ) VALUES 
        ('deal-test-001', 'AI Empire Expansion', 500000.00, 'sales', 'qualified', 'aurora'),
        ('deal-test-002', 'Robbie Physical Form', 1000000.00, 'sales', 'proposal', 'aurora'),
        ('deal-test-003', 'Aurora Global Rollout', 2500000.00, 'sales', 'negotiation', 'aurora')
        ON CONFLICT (hubspot_id) DO NOTHING
    """)
    
    print("✅ Sample data created")

def test_dashboard_api(base_url="http://localhost:5000"):
    """Test dashboard API endpoints"""
    print(f"🌐 Testing dashboard API at {base_url}...")
    
    endpoints = [
        "/api/overview",
        "/api/deals-pipeline", 
        "/api/recent-activity",
        "/api/companies"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {endpoint}: {len(data) if isinstance(data, list) else 'OK'}")
            else:
                print(f"❌ {endpoint}: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: {e}")

def main():
    print("🚀 AURORA DASHBOARD TEST SUITE")
    print("=" * 40)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test database
    if not test_database():
        print("❌ Database tests failed - cannot continue")
        sys.exit(1)
    
    print()
    
    # Test API (if dashboard is running)
    test_dashboard_api()
    
    print()
    print("🎉 Test suite complete!")
    print("📊 Dashboard should be ready at: http://localhost:5000")

if __name__ == "__main__":
    main()
