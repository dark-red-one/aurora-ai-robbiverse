"""
HubSpot Sync Service - Deep Integration 💋
Automatically syncs landing page visitors to HubSpot CRM
Creates contacts, deals, and engagement timeline
"""

import os
import requests
from typing import Dict, Optional, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class HubSpotSync:
    """HubSpot API integration for landing page tracking"""
    
    def __init__(self):
        self.api_key = os.getenv('HUBSPOT_API_KEY')
        self.base_url = 'https://api.hubapi.com'
        
        if not self.api_key:
            logger.warning('⚠️ HUBSPOT_API_KEY not set - sync disabled')
            self.enabled = False
        else:
            self.enabled = True
            
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_or_update_contact(self, email: str, properties: Dict) -> Optional[str]:
        """
        Create or update HubSpot contact
        Returns contact ID
        """
        if not self.enabled:
            logger.debug('HubSpot sync disabled - skipping contact creation')
            return None
            
        try:
            # Search for existing contact
            search_url = f'{self.base_url}/crm/v3/objects/contacts/search'
            search_payload = {
                'filterGroups': [{
                    'filters': [{'propertyName': 'email', 'operator': 'EQ', 'value': email}]
                }]
            }
            
            response = requests.post(search_url, headers=self.headers, json=search_payload, timeout=10)
            
            if response.status_code == 200:
                existing = response.json().get('results', [])
                
                if existing:
                    # Update existing contact
                    contact_id = existing[0]['id']
                    update_url = f'{self.base_url}/crm/v3/objects/contacts/{contact_id}'
                    response = requests.patch(update_url, headers=self.headers, json={'properties': properties}, timeout=10)
                    
                    if response.status_code == 200:
                        logger.info(f'✅ Updated HubSpot contact {contact_id} for {email}')
                        return contact_id
                    else:
                        logger.error(f'Failed to update contact: {response.status_code} - {response.text}')
                        return contact_id  # Return ID even if update fails
                else:
                    # Create new contact
                    properties['email'] = email
                    create_url = f'{self.base_url}/crm/v3/objects/contacts'
                    response = requests.post(create_url, headers=self.headers, json={'properties': properties}, timeout=10)
                    
                    if response.status_code == 201:
                        contact_id = response.json()['id']
                        logger.info(f'✅ Created HubSpot contact {contact_id} for {email}')
                        return contact_id
                    else:
                        logger.error(f'Failed to create contact: {response.status_code} - {response.text}')
                        return None
            else:
                logger.error(f'Contact search failed: {response.status_code}')
                return None
                
        except Exception as e:
            logger.error(f'❌ Error creating/updating HubSpot contact: {e}')
            return None
    
    def create_deal(self, contact_id: str, deal_name: str, amount: float, pipeline: str = 'default', stage: str = 'appointmentscheduled') -> Optional[str]:
        """
        Create HubSpot deal and associate with contact
        Returns deal ID
        """
        if not self.enabled:
            return None
            
        try:
            # Create deal
            deal_url = f'{self.base_url}/crm/v3/objects/deals'
            deal_data = {
                'properties': {
                    'dealname': deal_name,
                    'amount': str(amount),
                    'pipeline': pipeline,
                    'dealstage': stage,
                    'closedate': None
                }
            }
            
            response = requests.post(deal_url, headers=self.headers, json=deal_data, timeout=10)
            
            if response.status_code == 201:
                deal_id = response.json()['id']
                logger.info(f'✅ Created HubSpot deal {deal_id}: {deal_name}')
                
                # Associate deal with contact
                try:
                    assoc_url = f'{self.base_url}/crm/v4/objects/deals/{deal_id}/associations/contacts/{contact_id}'
                    assoc_data = [{
                        'associationCategory': 'HUBSPOT_DEFINED',
                        'associationTypeId': 3  # deal_to_contact
                    }]
                    response = requests.put(assoc_url, headers=self.headers, json=assoc_data, timeout=10)
                    
                    if response.status_code in [200, 201]:
                        logger.info(f'✅ Associated deal {deal_id} with contact {contact_id}')
                    else:
                        logger.warning(f'Deal created but association failed: {response.status_code}')
                        
                except Exception as e:
                    logger.error(f'Error associating deal with contact: {e}')
                
                return deal_id
            else:
                logger.error(f'Failed to create deal: {response.status_code} - {response.text}')
                return None
                
        except Exception as e:
            logger.error(f'❌ Error creating HubSpot deal: {e}')
            return None
    
    def log_engagement(self, contact_id: str, engagement_type: str, metadata: Dict) -> Optional[str]:
        """
        Log engagement activity to HubSpot timeline
        engagement_type: 'NOTE', 'EMAIL', 'TASK', 'MEETING', 'CALL'
        """
        if not self.enabled:
            return None
            
        try:
            engagement_url = f'{self.base_url}/engagements/v1/engagements'
            
            engagement_data = {
                'engagement': {
                    'active': True,
                    'type': engagement_type,
                    'timestamp': metadata.get('timestamp', int(datetime.now().timestamp() * 1000))
                },
                'associations': {
                    'contactIds': [int(contact_id)]
                },
                'metadata': metadata
            }
            
            response = requests.post(engagement_url, headers=self.headers, json=engagement_data, timeout=10)
            
            if response.status_code == 200:
                engagement_id = response.json()['engagement']['id']
                logger.info(f'✅ Logged engagement {engagement_id} for contact {contact_id}')
                return str(engagement_id)
            else:
                logger.error(f'Failed to log engagement: {response.status_code} - {response.text}')
                return None
                
        except Exception as e:
            logger.error(f'❌ Error logging HubSpot engagement: {e}')
            return None
    
    def create_task(self, contact_id: str, subject: str, notes: str, due_date: Optional[datetime] = None) -> Optional[str]:
        """Create a task in HubSpot for sales follow-up"""
        if not self.enabled:
            return None
            
        try:
            task_url = f'{self.base_url}/engagements/v1/engagements'
            
            metadata = {
                'subject': subject,
                'body': notes,
                'status': 'NOT_STARTED',
                'forObjectType': 'CONTACT'
            }
            
            if due_date:
                metadata['timestamp'] = int(due_date.timestamp() * 1000)
            
            task_data = {
                'engagement': {
                    'active': True,
                    'type': 'TASK'
                },
                'associations': {
                    'contactIds': [int(contact_id)]
                },
                'metadata': metadata
            }
            
            response = requests.post(task_url, headers=self.headers, json=task_data, timeout=10)
            
            if response.status_code == 200:
                task_id = response.json()['engagement']['id']
                logger.info(f'✅ Created task {task_id} for contact {contact_id}')
                return str(task_id)
            else:
                logger.error(f'Failed to create task: {response.status_code} - {response.text}')
                return None
                
        except Exception as e:
            logger.error(f'❌ Error creating HubSpot task: {e}')
            return None
    
    def add_to_workflow(self, contact_id: str, workflow_id: str) -> bool:
        """Add contact to HubSpot workflow"""
        if not self.enabled:
            return False
            
        try:
            workflow_url = f'{self.base_url}/automation/v2/workflows/{workflow_id}/enrollments/contacts/{contact_id}'
            
            response = requests.post(workflow_url, headers=self.headers, timeout=10)
            
            if response.status_code in [200, 204]:
                logger.info(f'✅ Added contact {contact_id} to workflow {workflow_id}')
                return True
            else:
                logger.error(f'Failed to add to workflow: {response.status_code} - {response.text}')
                return False
                
        except Exception as e:
            logger.error(f'❌ Error adding contact to workflow: {e}')
            return False


# Global instance
hubspot_sync = HubSpotSync()

