#!/usr/bin/env python3
"""
Test API Connectors - Generate Sample Data
"""
import json
import random
from datetime import datetime, timedelta
import os

def generate_sample_companies(count=20):
    """Generate sample companies"""
    companies = []
    industries = ["Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education", "Consulting", "Real Estate"]
    
    for i in range(count):
        company = {
            "id": f"company_{i+1}",
            "name": f"Sample Company {i+1}",
            "domain": f"company{i+1}.com",
            "industry": random.choice(industries),
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            "total_deal_value": random.randint(10000, 500000),
            "num_deals": random.randint(1, 15)
        }
        companies.append(company)
    
    return companies

def generate_sample_contacts(count=50):
    """Generate sample contacts"""
    contacts = []
    titles = ["CEO", "CTO", "VP Sales", "Marketing Director", "Product Manager", "Sales Rep", "Account Manager"]
    
    for i in range(count):
        contact = {
            "id": f"contact_{i+1}",
            "name": f"Contact {i+1}",
            "email": f"contact{i+1}@company{random.randint(1, 20)}.com",
            "title": random.choice(titles),
            "company_id": f"company_{random.randint(1, 20)}",
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat()
        }
        contacts.append(contact)
    
    return contacts

def generate_sample_deals(count=30):
    """Generate sample deals"""
    deals = []
    stages = ["appointmentscheduled", "qualifiedtobuy", "presentationscheduled", "decisionmakerboughtin", "contractsent", "closedwon", "closedlost"]
    
    for i in range(count):
        deal = {
            "id": f"deal_{i+1}",
            "name": f"Deal {i+1}",
            "amount": random.randint(5000, 200000),
            "stage": random.choice(stages),
            "company_id": f"company_{random.randint(1, 20)}",
            "contact_id": f"contact_{random.randint(1, 50)}",
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat()
        }
        deals.append(deal)
    
    return deals

def generate_sample_meetings(count=25):
    """Generate sample meetings"""
    meetings = []
    
    for i in range(count):
        meeting = {
            "id": f"meeting_{i+1}",
            "title": f"Meeting {i+1}",
            "date": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
            "duration": random.randint(30, 120),
            "participants": random.randint(2, 8),
            "transcript": f"Sample transcript for meeting {i+1}",
            "action_items": [f"Action item {j+1}" for j in range(random.randint(1, 5))]
        }
        meetings.append(meeting)
    
    return meetings

def generate_sample_emails(count=100):
    """Generate sample emails"""
    emails = []
    
    for i in range(count):
        email = {
            "id": f"email_{i+1}",
            "subject": f"Email Subject {i+1}",
            "from": f"sender{i+1}@company.com",
            "to": f"recipient{i+1}@company.com",
            "date": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
            "body": f"Sample email body {i+1}",
            "thread_id": f"thread_{random.randint(1, 20)}"
        }
        emails.append(email)
    
    return emails

def main():
    """Generate all sample data"""
    print("🚀 Generating Sample Data for API Connectors")
    print("=" * 50)
    
    # Generate data
    companies = generate_sample_companies(20)
    contacts = generate_sample_contacts(50)
    deals = generate_sample_deals(30)
    meetings = generate_sample_meetings(25)
    emails = generate_sample_emails(100)
    
    # Save to files
    with open("sample_companies.json", "w") as f:
        json.dump(companies, f, indent=2)
    
    with open("sample_contacts.json", "w") as f:
        json.dump(contacts, f, indent=2)
    
    with open("sample_deals.json", "w") as f:
        json.dump(deals, f, indent=2)
    
    with open("sample_meetings.json", "w") as f:
        json.dump(meetings, f, indent=2)
    
    with open("sample_emails.json", "w") as f:
        json.dump(emails, f, indent=2)
    
    print(f"✅ Generated sample data:")
    print(f"   • {len(companies)} companies")
    print(f"   • {len(contacts)} contacts")
    print(f"   • {len(deals)} deals")
    print(f"   • {len(meetings)} meetings")
    print(f"   • {len(emails)} emails")
    
    # Calculate totals
    total_deal_value = sum(deal["amount"] for deal in deals)
    print(f"\n💰 Total deal value: ${total_deal_value:,}")
    
    # Show some sample data
    print(f"\n📊 Sample Company: {companies[0]['name']} ({companies[0]['industry']})")
    print(f"📊 Sample Contact: {contacts[0]['name']} ({contacts[0]['title']})")
    print(f"📊 Sample Deal: {deals[0]['name']} (${deals[0]['amount']:,})")

if __name__ == "__main__":
    main()
