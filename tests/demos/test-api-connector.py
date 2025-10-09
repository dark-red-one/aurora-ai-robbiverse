#!/usr/bin/env python3
"""
Test API Connector - Generates sample data for testing
"""
import json
import random
from datetime import datetime, timedelta

def generate_sample_companies():
    """Generate sample company data"""
    companies = []
    company_names = [
        "Acme Corp", "TechStart Inc", "Global Solutions", "Innovation Labs",
        "Future Systems", "Digital Dynamics", "Smart Solutions", "NextGen Tech",
        "Alpha Industries", "Beta Corp", "Gamma Systems", "Delta Solutions"
    ]
    
    for i, name in enumerate(company_names):
        company = {
            "id": f"company_{i+1}",
            "name": name,
            "domain": f"{name.lower().replace(' ', '')}.com",
            "industry": random.choice(["Technology", "Healthcare", "Finance", "Manufacturing", "Retail"]),
            "created_date": (datetime.now() - timedelta(days=random.randint(30, 365))).isoformat(),
            "total_deal_value": random.randint(10000, 500000),
            "num_deals": random.randint(1, 20)
        }
        companies.append(company)
    
    return companies

def generate_sample_contacts():
    """Generate sample contact data"""
    contacts = []
    first_names = ["John", "Jane", "Mike", "Sarah", "David", "Lisa", "Chris", "Amy", "Tom", "Kate"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    
    for i in range(20):
        contact = {
            "id": f"contact_{i+1}",
            "first_name": random.choice(first_names),
            "last_name": random.choice(last_names),
            "email": f"contact{i+1}@example.com",
            "company": f"company_{random.randint(1, 12)}",
            "created_date": (datetime.now() - timedelta(days=random.randint(1, 180))).isoformat(),
            "last_activity": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }
        contacts.append(contact)
    
    return contacts

def generate_sample_deals():
    """Generate sample deal data"""
    deals = []
    deal_names = [
        "Q1 Enterprise License", "Annual Support Contract", "Custom Development",
        "Integration Project", "Training Package", "Consulting Services",
        "Premium Support", "API Access", "White Label Solution", "Partnership Agreement"
    ]
    
    for i, name in enumerate(deal_names):
        deal = {
            "id": f"deal_{i+1}",
            "name": name,
            "amount": random.randint(5000, 100000),
            "stage": random.choice(["Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]),
            "close_date": (datetime.now() + timedelta(days=random.randint(-30, 90))).isoformat(),
            "company": f"company_{random.randint(1, 12)}",
            "contact": f"contact_{random.randint(1, 20)}"
        }
        deals.append(deal)
    
    return deals

def main():
    """Main function to generate and display sample data"""
    print("🚀 Generating sample API data...")
    
    companies = generate_sample_companies()
    contacts = generate_sample_contacts()
    deals = generate_sample_deals()
    
    print(f"✅ Generated {len(companies)} companies")
    print(f"✅ Generated {len(contacts)} contacts")
    print(f"✅ Generated {len(deals)} deals")
    
    # Save to JSON files
    with open('sample_companies.json', 'w') as f:
        json.dump(companies, f, indent=2)
    
    with open('sample_contacts.json', 'w') as f:
        json.dump(contacts, f, indent=2)
    
    with open('sample_deals.json', 'w') as f:
        json.dump(deals, f, indent=2)
    
    print("📊 Sample data saved to JSON files")
    print("🎯 Ready for API testing!")
    
    # Display summary
    total_deal_value = sum(deal['amount'] for deal in deals)
    print(f"\n📈 Summary:")
    print(f"   • Total deal value: ${total_deal_value:,}")
    print(f"   • Average deal size: ${total_deal_value // len(deals):,}")
    print(f"   • Companies with deals: {len(set(deal['company'] for deal in deals))}")

if __name__ == "__main__":
    main()
