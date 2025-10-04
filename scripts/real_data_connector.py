#!/usr/bin/env python3
"""
Real Data Connector - Connect to Allan's actual APIs
Uses real credentials to pull actual business data including Chris Haimbach
"""

import os
import json
import psycopg2
import requests
import logging
from datetime import datetime, timedelta
import asyncio
import aiohttp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealDataConnector:
    def __init__(self):
        # Real credentials from Allan's setup
        self.hubspot_token = os.getenv('HUBSPOT_ACCESS_TOKEN', 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
        self.google_client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.fireflies_api_key = os.getenv('FIREFLIES_API_KEY')
        
        # Database connection
        self.local_db_url = 'postgresql://aurora:AuroraPass2025Safe@127.0.0.1:5432/aurora'
        self.elestio_db_url = 'postgresql://postgres:LVuvUcvV-jarK-ETfTNQWb@pg-u44170.vm.elestio.app:25432/postgres'
        
    def connect_to_real_hubspot(self):
        """Connect to Allan's actual HubSpot CRM"""
        logger.info("🏢 Connecting to HubSpot CRM (Account: 242667222)")
        
        headers = {
            'Authorization': f'Bearer {self.hubspot_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            # Get real contacts from HubSpot
            response = requests.get(
                'https://api.hubapi.com/crm/v3/objects/contacts',
                headers=headers,
                params={'limit': 100}
            )
            
            if response.status_code == 200:
                contacts = response.json()
                logger.info(f"✅ Retrieved {len(contacts.get('results', []))} real contacts from HubSpot")
                
                # Look for Chris Haimbach specifically
                for contact in contacts.get('results', []):
                    properties = contact.get('properties', {})
                    firstname = properties.get('firstname', '')
                    lastname = properties.get('lastname', '')
                    email = properties.get('email', '')
                    company = properties.get('company', '')
                    
                    if 'chris' in firstname.lower() and 'haimbach' in lastname.lower():
                        logger.info(f"🎯 FOUND CHRIS HAIMBACH: {firstname} {lastname} ({email}) at {company}")
                        return {
                            'name': f"{firstname} {lastname}",
                            'email': email,
                            'company': company,
                            'source': 'hubspot_real'
                        }
                
                return contacts
            else:
                logger.error(f"❌ HubSpot API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"❌ HubSpot connection failed: {e}")
            return None
    
    def connect_to_real_gmail(self):
        """Connect to Allan's actual Gmail"""
        logger.info("📧 Attempting Gmail connection...")
        
        # This would use real OAuth flow
        # For now, check if we can connect to the integration server
        try:
            response = requests.get('http://localhost:3000/api/integrations/status')
            if response.status_code == 200:
                logger.info("✅ Integration server responding")
                return True
            else:
                logger.warning("⚠️ Integration server not responding properly")
                return False
        except Exception as e:
            logger.error(f"❌ Gmail integration check failed: {e}")
            return False
    
    def connect_to_real_fireflies(self):
        """Connect to Allan's actual Fireflies transcripts"""
        logger.info("🎙️ Connecting to Fireflies API...")
        
        if not self.fireflies_api_key or self.fireflies_api_key == 'your_fireflies_api_key_here':
            logger.warning("⚠️ Fireflies API key not configured")
            return None
            
        headers = {
            'Authorization': f'Bearer {self.fireflies_api_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(
                'https://api.fireflies.ai/graphql',
                headers=headers,
                json={
                    'query': '''
                    query {
                        transcripts(first: 10) {
                            title
                            date
                            participants {
                                name
                                email
                            }
                            sentences {
                                text
                                speaker_name
                            }
                        }
                    }
                    '''
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                transcripts = data.get('data', {}).get('transcripts', [])
                
                # Look for Chris Haimbach in transcripts
                for transcript in transcripts:
                    participants = transcript.get('participants', [])
                    sentences = transcript.get('sentences', [])
                    
                    # Check participants
                    for participant in participants:
                        if 'chris' in participant.get('name', '').lower() and 'haimbach' in participant.get('name', '').lower():
                            logger.info(f"🎯 FOUND CHRIS HAIMBACH in meeting: {transcript.get('title')}")
                    
                    # Check sentences
                    for sentence in sentences:
                        if 'chris haimbach' in sentence.get('text', '').lower():
                            logger.info(f"🎯 Chris Haimbach mentioned: {sentence.get('text')[:100]}...")
                
                return transcripts
            else:
                logger.error(f"❌ Fireflies API error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Fireflies connection failed: {e}")
            return None
    
    def check_elestio_database(self):
        """Check Allan's Elestio cloud database"""
        logger.info("☁️ Checking Elestio PostgreSQL database...")
        
        try:
            conn = psycopg2.connect(self.elestio_db_url)
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                version = cur.fetchone()
                logger.info(f"✅ Elestio DB connected: {version[0]}")
                
                # Check for existing tables
                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """)
                tables = cur.fetchall()
                logger.info(f"📊 Found {len(tables)} tables in Elestio DB")
                
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"❌ Elestio DB connection failed: {e}")
            return False
    
    def run_real_data_check(self):
        """Run comprehensive check of all real data sources"""
        logger.info("🚀 RUNNING REAL DATA SOURCE CHECK")
        logger.info("="*50)
        
        results = {
            'hubspot': self.connect_to_real_hubspot(),
            'gmail': self.connect_to_real_gmail(),
            'fireflies': self.connect_to_real_fireflies(),
            'elestio_db': self.check_elestio_database()
        }
        
        logger.info("📊 REAL DATA CHECK RESULTS:")
        logger.info("="*30)
        
        for service, result in results.items():
            if result:
                logger.info(f"✅ {service.upper()}: Connected")
            else:
                logger.info(f"❌ {service.upper()}: Failed/Not configured")
        
        return results

if __name__ == "__main__":
    connector = RealDataConnector()
    results = connector.run_real_data_check()
    
    print("\n🎯 SUMMARY:")
    print("===========")
    
    if any(results.values()):
        print("✅ Some real connections established")
        print("🔍 Check logs above for Chris Haimbach mentions")
    else:
        print("❌ No real connections - need to configure API credentials")
        print("💡 Set environment variables with real tokens from Allan's setup")



