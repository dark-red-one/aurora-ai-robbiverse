#!/usr/bin/env python3
"""
ROBBIE SIMPLE ATTENTION
One job: Find the most important email from each thread and surface it
"""

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

def get_threads():
    """Get all email threads from last 3 days"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT interaction_id, thread_id, subject, from_user, snippet, 
               interaction_date, importance_score, urgency_score
        FROM interactions
        WHERE interaction_type = 'email'
        AND interaction_date > NOW() - INTERVAL '3 days'
        ORDER BY thread_id, interaction_date DESC
    """)
    
    emails = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Group by thread
    threads = defaultdict(list)
    for email in emails:
        thread_id = email[1] or email[0]  # Use interaction_id if no thread_id
        threads[thread_id].append({
            'interaction_id': email[0],
            'thread_id': email[1],
            'subject': email[2],
            'from_user': email[3],
            'snippet': email[4],
            'date': email[5],
            'importance': email[6] or 0,
            'urgency': email[7] or 0
        })
    
    return threads

def analyze_thread(thread_emails):
    """Find the most important email in a thread"""
    if not thread_emails:
        return None
    
    # Sort by urgency first (escalations), then importance
    thread_emails.sort(key=lambda x: (x['urgency'], x['importance']), reverse=True)
    
    best_email = thread_emails[0]
    
    # Add thread context
    thread_count = len(thread_emails)
    if thread_count > 1:
        best_email['thread_context'] = f"Thread: {thread_count} emails"
    
    return best_email

def main():
    """Main function"""
    logging.info("🚀 Starting simple attention system...")
    
    # Get all threads
    threads = get_threads()
    logging.info(f"📧 Found {len(threads)} threads")
    
    # Analyze each thread
    top_emails = []
    for thread_id, thread_emails in threads.items():
        best_email = analyze_thread(thread_emails)
        if best_email:
            top_emails.append(best_email)
    
    # Sort by urgency + importance
    top_emails.sort(key=lambda x: (x['urgency'], x['importance']), reverse=True)
    
    # Deduplicate by similar subjects
    deduplicated = []
    seen_subjects = set()
    
    for email in top_emails:
        # Normalize subject for comparison
        subject_normalized = email['subject'].lower().strip()
        subject_normalized = subject_normalized.replace('re:', '').replace('fwd:', '').strip()
        
        # Check if we've seen a similar subject
        is_duplicate = False
        for seen_subject in seen_subjects:
            # Simple similarity check - if 80% of words match
            words1 = set(subject_normalized.split())
            words2 = set(seen_subject.split())
            if len(words1) > 0 and len(words2) > 0:
                similarity = len(words1.intersection(words2)) / max(len(words1), len(words2))
                if similarity > 0.8:  # 80% similar
                    is_duplicate = True
                    break
        
        if not is_duplicate:
            deduplicated.append(email)
            seen_subjects.add(subject_normalized)
    
    # Only surface Top 10 (7 Important + 3 Urgent) from deduplicated
    top_10 = deduplicated[:10]
    top_7 = top_10[:7]
    top_3 = top_10[7:10]
    
    logging.info("🏆 TOP 7 MOST IMPORTANT:")
    for i, email in enumerate(top_7, 1):
        context = email.get('thread_context', '')
        logging.info(f"{i}. ⭐ {email['subject'][:50]}")
        logging.info(f"   Score: I={email['importance']:.0f}, U={email['urgency']:.0f} {context}")
    
    logging.info("⚡ TOP 3 MOST URGENT:")
    for i, email in enumerate(top_3, 1):
        context = email.get('thread_context', '')
        logging.info(f"{i}. 🔥 {email['subject'][:50]}")
        logging.info(f"   Score: I={email['importance']:.0f}, U={email['urgency']:.0f} {context}")
    
    logging.info(f"✅ Surfacing {len(top_10)} emails (7 Important + 3 Urgent)")
    logging.info(f"📧 Submerging {len(top_emails) - len(top_10)} other emails")

if __name__ == "__main__":
    main()
