#!/usr/bin/env python3
"""
Google OAuth Setup Helper for TestPilot Simulations
Guides through setting up Google Workspace API access
"""

import os
import json
import webbrowser
from typing import Dict

def create_google_cloud_project_guide():
    """Print guide for setting up Google Cloud Project"""
    print("🚀 GOOGLE WORKSPACE API SETUP GUIDE")
    print("=" * 50)
    print()
    print("📋 Step 1: Create Google Cloud Project")
    print("1. Go to: https://console.cloud.google.com/")
    print("2. Click 'Select a project' → 'New Project'")
    print("3. Name: 'TestPilot Aurora Integration'")
    print("4. Click 'Create'")
    print()
    
    print("📋 Step 2: Enable APIs")
    print("1. Go to: https://console.cloud.google.com/apis/library")
    print("2. Enable these APIs:")
    print("   • Gmail API")
    print("   • Google Calendar API") 
    print("   • Google Drive API")
    print("   • People API (Google Contacts)")
    print("   • Admin SDK API (optional - for user management)")
    print()
    
    print("📋 Step 3: Create OAuth 2.0 Credentials")
    print("1. Go to: https://console.cloud.google.com/apis/credentials")
    print("2. Click '+ CREATE CREDENTIALS' → 'OAuth client ID'")
    print("3. Configure consent screen first if prompted:")
    print("   • User Type: External (for testing)")
    print("   • App name: TestPilot Aurora")
    print("   • User support email: your-email@company.com")
    print("   • Developer contact: your-email@company.com")
    print("4. Application type: Desktop application")
    print("5. Name: TestPilot Aurora Desktop")
    print("6. Click 'Create'")
    print("7. Download the JSON file")
    print("8. Rename to 'google-credentials.json'")
    print()
    
    print("📋 Step 4: Test Scopes")
    print("The connector needs these OAuth scopes:")
    print("• https://www.googleapis.com/auth/gmail.readonly")
    print("• https://www.googleapis.com/auth/calendar.readonly") 
    print("• https://www.googleapis.com/auth/drive.readonly")
    print("• https://www.googleapis.com/auth/contacts.readonly")
    print()
    
    print("📋 Step 5: Place Credentials File")
    creds_path = os.path.join(os.getcwd(), "google-credentials.json")
    print(f"Place your downloaded JSON file here:")
    print(f"📁 {creds_path}")
    print()

def validate_credentials_file(creds_path: str) -> bool:
    """Validate Google credentials file"""
    if not os.path.exists(creds_path):
        print(f"❌ Credentials file not found: {creds_path}")
        return False
    
    try:
        with open(creds_path, 'r') as f:
            creds = json.load(f)
        
        # Check for required fields
        required_fields = ['client_id', 'client_secret', 'auth_uri', 'token_uri']
        
        if 'installed' in creds:
            client_info = creds['installed']
        elif 'web' in creds:
            client_info = creds['web']
        else:
            print("❌ Invalid credentials format - missing 'installed' or 'web' section")
            return False
        
        missing_fields = [field for field in required_fields if field not in client_info]
        if missing_fields:
            print(f"❌ Missing required fields: {', '.join(missing_fields)}")
            return False
        
        print("✅ Credentials file is valid")
        print(f"📧 Client ID: {client_info['client_id'][:20]}...")
        return True
        
    except json.JSONDecodeError:
        print("❌ Invalid JSON format in credentials file")
        return False
    except Exception as e:
        print(f"❌ Error validating credentials: {e}")
        return False

def test_oauth_flow():
    """Test the OAuth flow"""
    creds_path = "google-credentials.json"
    token_path = "google-token.json"
    
    if not validate_credentials_file(creds_path):
        return False
    
    try:
        from google_workspace_connector import GoogleWorkspaceConnector
        
        # Test database config (won't actually connect during OAuth)
        db_config = {
            "host": "localhost",
            "port": 5432,
            "dbname": "test",
            "user": "test",
            "password": "test"
        }
        
        print("🔐 Testing OAuth flow...")
        print("📱 Your browser will open for authentication")
        print("🔑 Sign in with your Google account")
        print("✅ Grant the requested permissions")
        
        connector = GoogleWorkspaceConnector(creds_path, token_path, db_config)
        
        # Test basic API access
        print("📧 Testing Gmail API access...")
        emails = connector.fetch_emails(query="newer_than:7d", max_results=1)
        print(f"✅ Gmail: Found {len(emails)} recent emails")
        
        print("📅 Testing Calendar API access...")
        events = connector.fetch_calendar_events(days_back=7, days_forward=7)
        print(f"✅ Calendar: Found {len(events)} events")
        
        print("📁 Testing Drive API access...")
        files = connector.fetch_drive_activity(days_back=7)
        print(f"✅ Drive: Found {len(files)} recent files")
        
        print("\n🎉 OAuth setup successful!")
        print(f"🔑 Token saved to: {token_path}")
        return True
        
    except ImportError:
        print("❌ Google Workspace connector not available")
        print("💡 Make sure you've installed the requirements:")
        print("   pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"❌ OAuth test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🏢 TESTPILOT GOOGLE WORKSPACE SETUP")
    print("=" * 40)
    print()
    
    creds_path = "google-credentials.json"
    
    if os.path.exists(creds_path):
        print("✅ Found existing credentials file")
        if validate_credentials_file(creds_path):
            print()
            choice = input("🔄 Test OAuth flow? (y/n): ").lower().strip()
            if choice == 'y':
                test_oauth_flow()
        else:
            print("❌ Please fix credentials file or get a new one")
            create_google_cloud_project_guide()
    else:
        print("📋 No credentials file found - showing setup guide")
        create_google_cloud_project_guide()
        
        input("📥 Press Enter after you've placed google-credentials.json here...")
        
        if os.path.exists(creds_path):
            if validate_credentials_file(creds_path):
                print()
                choice = input("🔄 Test OAuth flow now? (y/n): ").lower().strip()
                if choice == 'y':
                    test_oauth_flow()
            else:
                print("❌ Please check your credentials file")
        else:
            print("❌ Still no credentials file found")

if __name__ == "__main__":
    main()
