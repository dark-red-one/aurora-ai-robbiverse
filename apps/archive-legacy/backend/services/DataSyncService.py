"""
Data Sync Service - Bridge between TestPilot CRM and Aurora
Syncs real business data: deals, contacts, companies, emails, calendar

Philosophy: Real data powers real decisions
Every hour, sync the latest from the business to keep Aurora current
"""

import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os
import json

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://allan@localhost/aurora")

class DataSyncService:
    """
    Automated sync of TestPilot business data to Aurora
    
    Syncs:
    - Deals pipeline (TestPilot → Aurora deals table)
    - Contacts/Companies (TestPilot → Aurora contacts/companies)
    - Gmail (Gmail API → Aurora messages table)
    - Calendar (Google Calendar → Aurora meeting prep notes)
    """
    
    def __init__(self):
        self.db = psycopg2.connect(DATABASE_URL)
        self.last_sync = {}
    
    def sync_all(self) -> Dict:
        """
        Run complete sync cycle
        Returns sync results for all sources
        """
        results = {
            "deals": self.sync_deals(),
            "contacts": self.sync_contacts(),
            "companies": self.sync_companies(),
            "gmail": self.sync_gmail(),
            "calendar": self.sync_calendar(),
            "sync_time": datetime.now().isoformat()
        }
        
        return results
    
    def sync_deals(self) -> Dict:
        """
        Sync TestPilot deal pipeline to Aurora
        
        Updates:
        - Deal status (active, closed, lost)
        - Deal value
        - Close probability
        - Last activity
        """
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # TODO: Connect to TestPilot API
        # For now, stub implementation
        
        deals_synced = 0
        deals_updated = 0
        
        # Example deal data structure
        testpilot_deals = self._fetch_testpilot_deals()
        
        for deal in testpilot_deals:
            cursor.execute("""
                INSERT INTO deals (
                    name, company_id, value, status, 
                    close_probability, expected_close_date,
                    last_activity, metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (external_id) DO UPDATE SET
                    value = EXCLUDED.value,
                    status = EXCLUDED.status,
                    close_probability = EXCLUDED.close_probability,
                    last_activity = EXCLUDED.last_activity,
                    updated_at = NOW()
                RETURNING (xmax = 0) AS inserted
            """, (
                deal['name'],
                deal.get('company_id'),
                deal['value'],
                deal['status'],
                deal.get('close_probability', 50),
                deal.get('expected_close_date'),
                deal.get('last_activity', datetime.now()),
                json.dumps(deal.get('metadata', {}))
            ))
            
            result = cursor.fetchone()
            if result['inserted']:
                deals_synced += 1
            else:
                deals_updated += 1
        
        self.db.commit()
        cursor.close()
        
        self.last_sync['deals'] = datetime.now()
        
        return {
            "synced": deals_synced,
            "updated": deals_updated,
            "total": deals_synced + deals_updated,
            "timestamp": datetime.now().isoformat()
        }
    
    def sync_contacts(self) -> Dict:
        """
        Sync TestPilot contacts to Aurora
        
        Updates:
        - Contact info (name, email, title)
        - VIP status
        - Last contacted date
        - Relationship notes
        """
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        contacts_synced = 0
        contacts_updated = 0
        
        testpilot_contacts = self._fetch_testpilot_contacts()
        
        for contact in testpilot_contacts:
            cursor.execute("""
                INSERT INTO contacts (
                    first_name, last_name, email, phone,
                    job_title, company_id, is_vip,
                    last_contacted_at, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE SET
                    job_title = EXCLUDED.job_title,
                    is_vip = EXCLUDED.is_vip,
                    last_contacted_at = EXCLUDED.last_contacted_at,
                    notes = EXCLUDED.notes,
                    updated_at = NOW()
                RETURNING (xmax = 0) AS inserted
            """, (
                contact['first_name'],
                contact['last_name'],
                contact['email'],
                contact.get('phone'),
                contact.get('job_title'),
                contact.get('company_id'),
                contact.get('is_vip', False),
                contact.get('last_contacted_at'),
                contact.get('notes')
            ))
            
            result = cursor.fetchone()
            if result['inserted']:
                contacts_synced += 1
            else:
                contacts_updated += 1
        
        self.db.commit()
        cursor.close()
        
        self.last_sync['contacts'] = datetime.now()
        
        return {
            "synced": contacts_synced,
            "updated": contacts_updated,
            "total": contacts_synced + contacts_updated,
            "timestamp": datetime.now().isoformat()
        }
    
    def sync_companies(self) -> Dict:
        """
        Sync TestPilot companies to Aurora
        
        Updates:
        - Company info (name, domain, industry)
        - Revenue range
        - Employee count
        - VIP status
        """
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        companies_synced = 0
        companies_updated = 0
        
        testpilot_companies = self._fetch_testpilot_companies()
        
        for company in testpilot_companies:
            cursor.execute("""
                INSERT INTO companies (
                    name, domain, industry, employee_count,
                    revenue_range, is_vip, description
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (domain) DO UPDATE SET
                    industry = EXCLUDED.industry,
                    employee_count = EXCLUDED.employee_count,
                    revenue_range = EXCLUDED.revenue_range,
                    is_vip = EXCLUDED.is_vip,
                    updated_at = NOW()
                RETURNING (xmax = 0) AS inserted
            """, (
                company['name'],
                company['domain'],
                company.get('industry'),
                company.get('employee_count'),
                company.get('revenue_range'),
                company.get('is_vip', False),
                company.get('description')
            ))
            
            result = cursor.fetchone()
            if result['inserted']:
                companies_synced += 1
            else:
                companies_updated += 1
        
        self.db.commit()
        cursor.close()
        
        self.last_sync['companies'] = datetime.now()
        
        return {
            "synced": companies_synced,
            "updated": companies_updated,
            "total": companies_synced + companies_updated,
            "timestamp": datetime.now().isoformat()
        }
    
    def sync_gmail(self) -> Dict:
        """
        Sync Gmail to Aurora messages table
        
        Syncs:
        - Unread emails from last 7 days
        - VIP sender detection
        - Auto-categorization (important/urgent)
        - Need-response flagging
        """
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # TODO: Connect to Gmail API
        # For now, stub implementation
        
        emails_synced = 0
        
        gmail_messages = self._fetch_gmail_messages()
        
        for email in gmail_messages:
            # Check if contact is VIP
            cursor.execute("""
                SELECT is_vip FROM contacts WHERE email = %s
            """, (email['from_email'],))
            
            contact = cursor.fetchone()
            from_vip = contact['is_vip'] if contact else False
            
            # Auto-categorize
            needs_response = self._detect_needs_response(email)
            tags = self._categorize_email(email)
            
            cursor.execute("""
                INSERT INTO messages (
                    subject, body, from_email, from_name,
                    from_vip, received_at, needs_response, tags
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (external_id) DO NOTHING
                RETURNING id
            """, (
                email['subject'],
                email['body'],
                email['from_email'],
                email['from_name'],
                from_vip,
                email['received_at'],
                needs_response,
                tags
            ))
            
            if cursor.fetchone():
                emails_synced += 1
        
        self.db.commit()
        cursor.close()
        
        self.last_sync['gmail'] = datetime.now()
        
        return {
            "synced": emails_synced,
            "timestamp": datetime.now().isoformat()
        }
    
    def sync_calendar(self) -> Dict:
        """
        Sync Google Calendar to Aurora
        Creates meeting prep sticky notes 30 minutes before meetings
        """
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # TODO: Connect to Google Calendar API
        # For now, stub implementation
        
        meetings_synced = 0
        
        upcoming_meetings = self._fetch_upcoming_meetings()
        
        for meeting in upcoming_meetings:
            # Create meeting prep note if meeting within next 30 minutes
            time_until = (meeting['start_time'] - datetime.now()).total_seconds() / 60
            
            if 0 < time_until <= 30:
                # Create or update meeting prep note
                cursor.execute("""
                    INSERT INTO sticky_notes (
                        title, content, category, created_by,
                        surface_status, surface_priority, surface_reason
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (external_id) DO UPDATE SET
                        surface_status = 'surfaced',
                        surface_priority = 15,
                        updated_at = NOW()
                    RETURNING id
                """, (
                    f"Meeting Prep: {meeting['title']}",
                    self._generate_meeting_prep(meeting),
                    'meeting_prep',
                    'robbie',
                    'surfaced',
                    15,
                    f"Meeting with {meeting['attendees']} in {int(time_until)} minutes"
                ))
                
                if cursor.fetchone():
                    meetings_synced += 1
        
        self.db.commit()
        cursor.close()
        
        self.last_sync['calendar'] = datetime.now()
        
        return {
            "prep_notes_created": meetings_synced,
            "timestamp": datetime.now().isoformat()
        }
    
    # Helper methods (stubs for now - connect to real APIs)
    
    def _fetch_testpilot_deals(self) -> List[Dict]:
        """Fetch deals from TestPilot CRM"""
        # TODO: Implement TestPilot API connection
        return []
    
    def _fetch_testpilot_contacts(self) -> List[Dict]:
        """Fetch contacts from TestPilot CRM"""
        # TODO: Implement TestPilot API connection
        return []
    
    def _fetch_testpilot_companies(self) -> List[Dict]:
        """Fetch companies from TestPilot CRM"""
        # TODO: Implement TestPilot API connection
        return []
    
    def _fetch_gmail_messages(self) -> List[Dict]:
        """Fetch recent Gmail messages"""
        # TODO: Implement Gmail API connection
        return []
    
    def _fetch_upcoming_meetings(self) -> List[Dict]:
        """Fetch upcoming calendar events"""
        # TODO: Implement Google Calendar API connection
        return []
    
    def _detect_needs_response(self, email: Dict) -> bool:
        """Detect if email needs a response"""
        subject = email['subject'].lower()
        body = email.get('body', '').lower()
        
        response_keywords = ['?', 'please', 'could you', 'can you', 'need', 'urgent']
        return any(keyword in subject or keyword in body for keyword in response_keywords)
    
    def _categorize_email(self, email: Dict) -> List[str]:
        """Auto-categorize email"""
        tags = []
        subject = email['subject'].lower()
        
        if 'deal' in subject or 'contract' in subject:
            tags.append('revenue')
        if 'urgent' in subject or 'asap' in subject:
            tags.append('urgent')
        if len(email.get('body', '')) < 500:
            tags.append('quick')
        
        return tags
    
    def _generate_meeting_prep(self, meeting: Dict) -> str:
        """Generate meeting prep content"""
        return f"""
Meeting: {meeting['title']}
Time: {meeting['start_time'].strftime('%I:%M %p')}
Attendees: {', '.join(meeting.get('attendees', []))}

Prep:
- Review previous meeting notes
- Check open action items
- Prepare discussion points
"""


# Convenience function
def sync_now() -> Dict:
    """Quick function to run full sync"""
    service = DataSyncService()
    return service.sync_all()


