#!/usr/bin/env python3
"""
ROBBIE CONVERSATION ANALYZER
Analyzes email threads as conversations, tracking:
- Allan's responses and commitments
- Escalation patterns
- Broken promises
- Relationship dynamics
"""

import asyncio
import psycopg2
import logging
from datetime import datetime
from collections import defaultdict

DB_CONFIG = {
    'host': 'aurora-postgres-u44170.vm.elestio.app',
    'port': 25432,
    'dbname': 'aurora_unified',
    'user': 'aurora_app',
    'password': 'TestPilot2025_Aurora!',
    'sslmode': 'require'
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

class ConversationAnalyzer:
    def __init__(self):
        self.db_conn = None
        self.allan_email = 'allan@testpilotcpg.com'
        
    async def analyze_threads(self):
        """Analyze email threads as conversations"""
        try:
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            cursor = self.db_conn.cursor()
            
            logging.info("🧵 Analyzing email threads...")
            
            # Get all emails grouped by thread
            cursor.execute("""
                SELECT thread_id, interaction_id, subject, from_user, 
                       snippet, interaction_date, importance_score, urgency_score
                FROM interactions
                WHERE thread_id IS NOT NULL
                AND interaction_date > NOW() - INTERVAL '30 days'
                ORDER BY thread_id, interaction_date ASC
            """)
            
            emails = cursor.fetchall()
            
            # Group by thread
            threads = defaultdict(list)
            for email in emails:
                thread_id = email[0]
                threads[thread_id].append({
                    'interaction_id': email[1],
                    'subject': email[2],
                    'from_user': email[3],
                    'snippet': email[4],
                    'date': email[5],
                    'importance': email[6] or 0,
                    'urgency': email[7] or 0
                })
            
            logging.info(f"📊 Found {len(threads)} threads with {len(emails)} emails")
            
            # Analyze each thread
            analyzed_threads = []
            for thread_id, thread_emails in threads.items():
                if len(thread_emails) > 1:  # Only multi-email threads
                    analysis = await self.analyze_single_thread(thread_emails)
                    if analysis['needs_attention']:
                        analyzed_threads.append({
                            'thread_id': thread_id,
                            **analysis
                        })
            
            # Sort by priority
            analyzed_threads.sort(key=lambda x: x['final_urgency'], reverse=True)
            
            logging.info(f"⚠️ {len(analyzed_threads)} threads need attention!")
            
            # Show top 10
            for i, thread in enumerate(analyzed_threads[:10], 1):
                logging.info(f"{i}. {thread['subject'][:50]}")
                logging.info(f"   Urgency: {thread['final_urgency']:.0f} | {thread['reasoning']}")
            
            cursor.close()
            self.db_conn.close()
            
        except Exception as e:
            logging.error(f"❌ Error: {e}")
            import traceback
            logging.error(traceback.format_exc())
    
    async def analyze_single_thread(self, thread_emails):
        """Analyze a single email thread"""
        
        # Sort by date
        thread_emails.sort(key=lambda x: x['date'])
        
        subject = thread_emails[0]['subject']
        
        # Track conversation dynamics
        allan_responses = []
        other_emails = []
        escalation_keywords = []
        commitment_keywords = []
        
        for email in thread_emails:
            from_user = (email['from_user'] or '').lower()
            snippet = (email['snippet'] or '').lower()
            
            # Is this from Allan?
            if self.allan_email.lower() in from_user:
                allan_responses.append(email)
                
                # Check for commitments
                if any(word in snippet for word in ['will', 'going to', 'plan to', 'tomorrow', 'this week', 'by']):
                    commitment_keywords.append(email['date'])
            else:
                other_emails.append(email)
                
                # Check for escalation
                if any(word in snippet for word in ['urgent', 'asap', 'final', 'notice', 'deadline', 'overdue', 'collections', 'legal']):
                    escalation_keywords.append(email['date'])
        
        # Calculate conversation score
        base_urgency = max([e['urgency'] for e in thread_emails])
        
        # Escalation detection
        escalation_score = 0
        if len(escalation_keywords) > 0:
            escalation_score = 30 * len(escalation_keywords)
        
        # Unanswered follow-ups
        unanswered_score = 0
        if len(other_emails) > len(allan_responses):
            unanswered_count = len(other_emails) - len(allan_responses)
            unanswered_score = 20 * unanswered_count
        
        # Broken commitments (Allan said he'd do something but didn't respond after)
        broken_commitment_score = 0
        if commitment_keywords and other_emails:
            last_commitment = max(commitment_keywords)
            emails_after_commitment = [e for e in other_emails if e['date'] > last_commitment]
            if emails_after_commitment:
                broken_commitment_score = 40
        
        # Time decay (older threads less urgent)
        days_old = (datetime.now() - thread_emails[-1]['date'].replace(tzinfo=None)).days
        time_penalty = min(days_old * 2, 30)
        
        # Final urgency
        final_urgency = base_urgency + escalation_score + unanswered_score + broken_commitment_score - time_penalty
        final_urgency = max(0, min(100, final_urgency))
        
        # Build reasoning
        reasoning_parts = []
        if escalation_keywords:
            reasoning_parts.append(f"🚨 {len(escalation_keywords)} escalation(s)")
        if unanswered_score > 0:
            reasoning_parts.append(f"📧 {len(other_emails) - len(allan_responses)} unanswered")
        if broken_commitment_score > 0:
            reasoning_parts.append(f"⚠️ Commitment not followed up")
        if len(allan_responses) > 0:
            reasoning_parts.append(f"✅ Allan engaged ({len(allan_responses)} replies)")
        
        reasoning = " | ".join(reasoning_parts) if reasoning_parts else "Standard thread"
        
        return {
            'subject': subject,
            'email_count': len(thread_emails),
            'allan_responses': len(allan_responses),
            'other_emails': len(other_emails),
            'escalations': len(escalation_keywords),
            'commitments': len(commitment_keywords),
            'final_urgency': final_urgency,
            'reasoning': reasoning,
            'needs_attention': final_urgency > 60 or (unanswered_score > 0 and escalation_score > 0)
        }

async def main():
    analyzer = ConversationAnalyzer()
    await analyzer.analyze_threads()

if __name__ == "__main__":
    asyncio.run(main())
