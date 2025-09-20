#!/usr/bin/env python3
"""
HubSpot API Connector for TestPilot Simulations
Pulls fresh data from HubSpot APIs into Aurora-Postgres
"""

import os
import requests
import psycopg2
import json
from datetime import datetime
from typing import Dict, List, Optional

class HubSpotConnector:
    def __init__(self, api_key: str, db_config: Dict):
        self.api_key = api_key
        self.base_url = "https://api.hubapi.com"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        self.db_config = db_config
        
    def get_db_connection(self):
        return psycopg2.connect(**self.db_config)
    
    def fetch_companies(self, limit: int = 1000) -> List[Dict]:
        """Fetch companies from HubSpot"""
        url = f"{self.base_url}/crm/v3/objects/companies"
        params = {
            "limit": limit,
            "properties": [
                "name", "domain", "industry", "hs_createdate", 
                "hs_lastmodifieddate", "hubspot_owner_id",
                "linkedin_company_page", "total_deal_value",
                "num_associated_deals"
            ]
        }
        
        companies = []
        after = None
        
        while True:
            if after:
                params["after"] = after
                
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            companies.extend(data.get("results", []))
            
            if not data.get("paging", {}).get("next"):
                break
            after = data["paging"]["next"]["after"]
            
        return companies
    
    def fetch_contacts(self, limit: int = 1000) -> List[Dict]:
        """Fetch contacts from HubSpot"""
        url = f"{self.base_url}/crm/v3/objects/contacts"
        params = {
            "limit": limit,
            "properties": [
                "firstname", "lastname", "email", "phone", "mobilephone",
                "jobtitle", "company", "hubspot_owner_id", "hs_createdate",
                "hs_lastmodifieddate", "linkedinbio", "hs_lead_status",
                "num_associated_deals", "total_deal_value"
            ]
        }
        
        contacts = []
        after = None
        
        while True:
            if after:
                params["after"] = after
                
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            contacts.extend(data.get("results", []))
            
            if not data.get("paging", {}).get("next"):
                break
            after = data["paging"]["next"]["after"]
            
        return contacts
    
    def fetch_deals(self, limit: int = 1000) -> List[Dict]:
        """Fetch deals from HubSpot"""
        url = f"{self.base_url}/crm/v3/objects/deals"
        params = {
            "limit": limit,
            "properties": [
                "dealname", "amount", "pipeline", "dealstage", "closedate",
                "createdate", "hs_lastmodifieddate", "dealtype",
                "hs_forecast_category", "hs_forecast_probability",
                "hubspot_owner_id", "hs_deal_score"
            ]
        }
        
        deals = []
        after = None
        
        while True:
            if after:
                params["after"] = after
                
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            deals.extend(data.get("results", []))
            
            if not data.get("paging", {}).get("next"):
                break
            after = data["paging"]["next"]["after"]
            
        return deals
    
    def import_companies(self, companies: List[Dict]) -> int:
        """Import companies into Aurora-Postgres"""
        conn = self.get_db_connection()
        imported = 0
        
        try:
            with conn.cursor() as cur:
                for company in companies:
                    props = company.get("properties", {})
                    
                    # Map HubSpot data to our schema
                    company_data = {
                        "hubspot_id": company["id"],
                        "name": props.get("name"),
                        "domain": props.get("domain"),
                        "industry": props.get("industry"),
                        "created_at": props.get("hs_createdate"),
                        "updated_at": props.get("hs_lastmodifieddate"),
                        "owner_id": "aurora",  # All TestPilot data goes to Aurora
                        "linkedin_url": props.get("linkedin_company_page"),
                        "total_deal_value": props.get("total_deal_value", 0),
                        "total_deal_count": props.get("num_associated_deals", 0),
                        "last_sync": datetime.utcnow()
                    }
                    
                    # Insert with conflict resolution
                    cur.execute("""
                        INSERT INTO companies (
                            hubspot_id, name, domain, industry, created_at, 
                            updated_at, owner_id, linkedin_url, total_deal_value,
                            total_deal_count, last_sync
                        ) VALUES (
                            %(hubspot_id)s, %(name)s, %(domain)s, %(industry)s,
                            %(created_at)s, %(updated_at)s, %(owner_id)s,
                            %(linkedin_url)s, %(total_deal_value)s,
                            %(total_deal_count)s, %(last_sync)s
                        ) ON CONFLICT (hubspot_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            domain = EXCLUDED.domain,
                            industry = EXCLUDED.industry,
                            updated_at = EXCLUDED.updated_at,
                            total_deal_value = EXCLUDED.total_deal_value,
                            total_deal_count = EXCLUDED.total_deal_count,
                            last_sync = EXCLUDED.last_sync
                    """, company_data)
                    imported += 1
                    
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
            
        return imported
    
    def import_contacts(self, contacts: List[Dict]) -> int:
        """Import contacts into Aurora-Postgres"""
        conn = self.get_db_connection()
        imported = 0
        
        try:
            with conn.cursor() as cur:
                for contact in contacts:
                    props = contact.get("properties", {})
                    
                    contact_data = {
                        "hubspot_id": contact["id"],
                        "first_name": props.get("firstname"),
                        "last_name": props.get("lastname"),
                        "email": props.get("email"),
                        "phone": props.get("phone"),
                        "mobile_phone": props.get("mobilephone"),
                        "job_title": props.get("jobtitle"),
                        "owner_id": "aurora",
                        "linkedin_bio": props.get("linkedinbio"),
                        "total_deal_count": props.get("num_associated_deals", 0),
                        "total_deal_value": props.get("total_deal_value", 0),
                        "last_sync": datetime.utcnow()
                    }
                    
                    cur.execute("""
                        INSERT INTO contacts (
                            hubspot_id, first_name, last_name, email, phone,
                            mobile_phone, job_title, owner_id, linkedin_bio,
                            total_deal_count, total_deal_value, last_sync
                        ) VALUES (
                            %(hubspot_id)s, %(first_name)s, %(last_name)s,
                            %(email)s, %(phone)s, %(mobile_phone)s,
                            %(job_title)s, %(owner_id)s, %(linkedin_bio)s,
                            %(total_deal_count)s, %(total_deal_value)s, %(last_sync)s
                        ) ON CONFLICT (hubspot_id) DO UPDATE SET
                            first_name = EXCLUDED.first_name,
                            last_name = EXCLUDED.last_name,
                            email = EXCLUDED.email,
                            phone = EXCLUDED.phone,
                            mobile_phone = EXCLUDED.mobile_phone,
                            job_title = EXCLUDED.job_title,
                            linkedin_bio = EXCLUDED.linkedin_bio,
                            total_deal_count = EXCLUDED.total_deal_count,
                            total_deal_value = EXCLUDED.total_deal_value,
                            last_sync = EXCLUDED.last_sync
                    """, contact_data)
                    imported += 1
                    
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
            
        return imported
    
    def import_deals(self, deals: List[Dict]) -> int:
        """Import deals into Aurora-Postgres"""
        conn = self.get_db_connection()
        imported = 0
        
        try:
            with conn.cursor() as cur:
                for deal in deals:
                    props = deal.get("properties", {})
                    
                    deal_data = {
                        "hubspot_id": deal["id"],
                        "deal_name": props.get("dealname"),
                        "amount": props.get("amount"),
                        "pipeline": props.get("pipeline"),
                        "dealstage": props.get("dealstage"),
                        "close_date": props.get("closedate"),
                        "create_date": props.get("createdate"),
                        "hs_lastmodifieddate": props.get("hs_lastmodifieddate"),
                        "dealtype": props.get("dealtype"),
                        "hs_forecast_category": props.get("hs_forecast_category"),
                        "hs_forecast_probability": props.get("hs_forecast_probability"),
                        "owner_id": "aurora",
                        "hs_deal_score": props.get("hs_deal_score"),
                        "last_sync": datetime.utcnow()
                    }
                    
                    cur.execute("""
                        INSERT INTO deals (
                            hubspot_id, deal_name, amount, pipeline, dealstage,
                            close_date, create_date, hs_lastmodifieddate,
                            dealtype, hs_forecast_category, hs_forecast_probability,
                            owner_id, hs_deal_score, last_sync
                        ) VALUES (
                            %(hubspot_id)s, %(deal_name)s, %(amount)s,
                            %(pipeline)s, %(dealstage)s, %(close_date)s,
                            %(create_date)s, %(hs_lastmodifieddate)s,
                            %(dealtype)s, %(hs_forecast_category)s,
                            %(hs_forecast_probability)s, %(owner_id)s,
                            %(hs_deal_score)s, %(last_sync)s
                        ) ON CONFLICT (hubspot_id) DO UPDATE SET
                            deal_name = EXCLUDED.deal_name,
                            amount = EXCLUDED.amount,
                            pipeline = EXCLUDED.pipeline,
                            dealstage = EXCLUDED.dealstage,
                            close_date = EXCLUDED.close_date,
                            hs_lastmodifieddate = EXCLUDED.hs_lastmodifieddate,
                            hs_forecast_category = EXCLUDED.hs_forecast_category,
                            hs_forecast_probability = EXCLUDED.hs_forecast_probability,
                            hs_deal_score = EXCLUDED.hs_deal_score,
                            last_sync = EXCLUDED.last_sync
                    """, deal_data)
                    imported += 1
                    
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
            
        return imported

if __name__ == "__main__":
    # Configuration
    HUBSPOT_API_KEY = os.getenv("HUBSPOT_API_KEY")
    
    db_config = {
        "host": "aurora-postgres-u44170.vm.elestio.app",
        "port": 25432,
        "dbname": "aurora_unified",
        "user": "aurora_app", 
        "password": "TestPilot2025_Aurora!",
        "sslmode": "require"
    }
    
    if not HUBSPOT_API_KEY:
        print("❌ HUBSPOT_API_KEY environment variable required")
        exit(1)
    
    connector = HubSpotConnector(HUBSPOT_API_KEY, db_config)
    
    print("🚀 Starting HubSpot data import...")
    
    # Import companies
    print("📦 Fetching companies...")
    companies = connector.fetch_companies()
    imported_companies = connector.import_companies(companies)
    print(f"✅ Imported {imported_companies} companies")
    
    # Import contacts
    print("👥 Fetching contacts...")
    contacts = connector.fetch_contacts()
    imported_contacts = connector.import_contacts(contacts)
    print(f"✅ Imported {imported_contacts} contacts")
    
    # Import deals
    print("💰 Fetching deals...")
    deals = connector.fetch_deals()
    imported_deals = connector.import_deals(deals)
    print(f"✅ Imported {imported_deals} deals")
    
    print(f"🎉 HubSpot import complete! Total: {imported_companies + imported_contacts + imported_deals} records")
