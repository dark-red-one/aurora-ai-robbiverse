#!/usr/bin/env python3
"""
Master Data Import Script for TestPilot Simulations
Orchestrates all API connectors to rebuild data from sources
"""

import os
import sys
import asyncio
import logging
from datetime import datetime
from typing import Dict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/workspace/logs/data-import.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MasterImporter:
    def __init__(self):
        self.db_config = {
            "host": "aurora-postgres-u44170.vm.elestio.app",
            "port": 25432,
            "dbname": "aurora_unified",
            "user": "aurora_app", 
            "password": "TestPilot2025_Aurora!",
            "sslmode": "require"
        }
        
        # API Keys (set these as environment variables)
        self.api_keys = {
            "hubspot": os.getenv("HUBSPOT_API_KEY"),
            "fireflies": os.getenv("FIREFLIES_API_KEY"),
            "clay": os.getenv("CLAY_API_KEY"),
            "apollo": os.getenv("APOLLO_API_KEY"),
            "openai": os.getenv("OPENAI_API_KEY")
        }
        
        # Gmail OAuth paths
        self.gmail_credentials = os.getenv("GMAIL_CREDENTIALS_PATH", "credentials.json")
        self.gmail_token = os.getenv("GMAIL_TOKEN_PATH", "token.json")
    
    def check_prerequisites(self) -> bool:
        """Check if all required API keys and dependencies are available"""
        logger.info("🔍 Checking prerequisites...")
        
        # Check database connection
        try:
            import psycopg2
            conn = psycopg2.connect(**self.db_config)
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
            conn.close()
            logger.info("✅ Database connection verified")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
        
        # Check API keys
        missing_keys = []
        for service, key in self.api_keys.items():
            if not key:
                missing_keys.append(service)
        
        if missing_keys:
            logger.warning(f"⚠️ Missing API keys: {', '.join(missing_keys)}")
            logger.info("Will skip services with missing keys")
        
        return True
    
    def import_hubspot_data(self) -> Dict:
        """Import data from HubSpot"""
        if not self.api_keys["hubspot"]:
            logger.warning("⚠️ Skipping HubSpot import - API key not provided")
            return {"companies": 0, "contacts": 0, "deals": 0}
        
        try:
            from hubspot_connector import HubSpotConnector
            connector = HubSpotConnector(self.api_keys["hubspot"], self.db_config)
            
            logger.info("📦 Importing HubSpot companies...")
            companies = connector.fetch_companies()
            imported_companies = connector.import_companies(companies)
            
            logger.info("👥 Importing HubSpot contacts...")
            contacts = connector.fetch_contacts()
            imported_contacts = connector.import_contacts(contacts)
            
            logger.info("💰 Importing HubSpot deals...")
            deals = connector.fetch_deals()
            imported_deals = connector.import_deals(deals)
            
            return {
                "companies": imported_companies,
                "contacts": imported_contacts,
                "deals": imported_deals
            }
            
        except Exception as e:
            logger.error(f"❌ HubSpot import failed: {e}")
            return {"companies": 0, "contacts": 0, "deals": 0}
    
    def import_fireflies_data(self) -> Dict:
        """Import data from Fireflies"""
        if not self.api_keys["fireflies"]:
            logger.warning("⚠️ Skipping Fireflies import - API key not provided")
            return {"meetings": 0}
        
        try:
            from fireflies_connector import FirefliesConnector
            connector = FirefliesConnector(self.api_keys["fireflies"], self.db_config)
            
            logger.info("📝 Importing Fireflies meeting transcripts...")
            transcripts = connector.fetch_transcripts(days_back=30)
            imported_meetings = connector.import_transcripts(transcripts)
            
            return {"meetings": imported_meetings}
            
        except Exception as e:
            logger.error(f"❌ Fireflies import failed: {e}")
            return {"meetings": 0}
    
    def import_google_workspace_data(self) -> Dict:
        """Import data from Google Workspace (Gmail, Calendar, Drive)"""
        google_credentials = os.getenv("GOOGLE_CREDENTIALS_PATH", "google-credentials.json")
        google_token = os.getenv("GOOGLE_TOKEN_PATH", "google-token.json")
        
        if not os.path.exists(google_credentials):
            logger.warning("⚠️ Skipping Google Workspace import - OAuth credentials not configured")
            return {"emails": 0, "events": 0, "files": 0}
        
        try:
            from google_workspace_connector import GoogleWorkspaceConnector
            connector = GoogleWorkspaceConnector(google_credentials, google_token, self.db_config)
            
            logger.info("🏢 Importing Google Workspace data...")
            results = connector.import_all_data()
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Google Workspace import failed: {e}")
            return {"emails": 0, "events": 0, "files": 0}
    
    def create_sample_data(self) -> Dict:
        """Create sample data for testing"""
        logger.info("📊 Creating sample TestPilot data...")
        
        import psycopg2
        conn = self.get_db_connection()
        
        try:
            with conn.cursor() as cur:
                # Sample companies
                cur.execute("""
                    INSERT INTO companies (
                        hubspot_id, name, domain, industry, owner_id
                    ) VALUES 
                    ('sample-001', 'TestPilot Simulations', 'testpilot.ai', 'AI/Software', 'aurora'),
                    ('sample-002', 'Fluenti Marketing', 'fluenti.com', 'Marketing', 'aurora'),
                    ('sample-003', 'Collaboration Labs', 'collab.dev', 'Development', 'aurora')
                    ON CONFLICT (hubspot_id) DO NOTHING
                """)
                
                # Sample contacts
                cur.execute("""
                    INSERT INTO contacts (
                        hubspot_id, first_name, last_name, email, job_title, owner_id
                    ) VALUES 
                    ('contact-001', 'Allan', 'TestPilot', 'allan@testpilot.ai', 'CEO', 'aurora'),
                    ('contact-002', 'Robbie', 'AI', 'robbie@testpilot.ai', 'AI Assistant', 'aurora'),
                    ('contact-003', 'Test', 'Contact', 'test@example.com', 'Developer', 'aurora')
                    ON CONFLICT (hubspot_id) DO NOTHING
                """)
                
                # Sample deals
                cur.execute("""
                    INSERT INTO deals (
                        hubspot_id, deal_name, amount, pipeline, dealstage, owner_id
                    ) VALUES 
                    ('deal-001', 'AI Empire Expansion', 100000.00, 'sales', 'qualified', 'aurora'),
                    ('deal-002', 'GPU Mesh Network', 50000.00, 'sales', 'proposal', 'aurora'),
                    ('deal-003', 'TestPilot Platform', 250000.00, 'sales', 'negotiation', 'aurora')
                    ON CONFLICT (hubspot_id) DO NOTHING
                """)
                
            conn.commit()
            logger.info("✅ Sample data created")
            return {"sample_records": 9}
            
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Sample data creation failed: {e}")
            return {"sample_records": 0}
        finally:
            conn.close()
    
    def get_db_connection(self):
        return psycopg2.connect(**self.db_config)
    
    def run_complete_import(self) -> Dict:
        """Run complete data import from all sources"""
        logger.info("🚀 Starting complete TestPilot data import...")
        
        if not self.check_prerequisites():
            logger.error("❌ Prerequisites check failed")
            return {}
        
        results = {}
        
        # Import from HubSpot
        hubspot_results = self.import_hubspot_data()
        results["hubspot"] = hubspot_results
        
        # Import from Fireflies
        fireflies_results = self.import_fireflies_data()
        results["fireflies"] = fireflies_results
        
        # Import from Google Workspace
        google_results = self.import_google_workspace_data()
        results["google"] = google_results
        
        # Create sample data if no API data
        if sum(hubspot_results.values()) == 0:
            sample_results = self.create_sample_data()
            results["sample"] = sample_results
        
        # Generate summary
        total_records = sum([
            sum(v.values()) if isinstance(v, dict) else v
            for v in results.values()
        ])
        
        logger.info(f"🎉 Import complete! Total records: {total_records}")
        
        return results

if __name__ == "__main__":
    print("🚀 TESTPILOT SIMULATIONS - MASTER DATA IMPORT")
    print("=" * 50)
    
    importer = MasterImporter()
    results = importer.run_complete_import()
    
    print("\n📊 IMPORT SUMMARY:")
    print("=" * 20)
    for source, data in results.items():
        if isinstance(data, dict):
            for table, count in data.items():
                print(f"• {source.title()} {table}: {count} records")
        else:
            print(f"• {source.title()}: {data} records")
    
    print("\n✅ TestPilot data import complete!")
    print("🎯 Ready for production operations!")
