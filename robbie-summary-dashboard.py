#!/usr/bin/env python3
"""
ROBBIE SUMMARY DASHBOARD
Shows RobbieSummaries for Top 10 emails in a readable format
"""

import psycopg2
from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging

# Configuration
CREDS_FILE = '/Users/allanperetz/aurora-ai-robbiverse/api-connectors/google-credentials.json'
ADMIN_EMAIL = 'allan@testpilotcpg.com'
SCOPES = ['https://mail.google.com/']

DB_CONFIG = {
    'host': 'aurora-postgres-u44170.vm.elestio.app',
    'port': 25432,
    'dbname': 'aurora_unified',
    'user': 'aurora_app',
    'password': 'TestPilot2025_Aurora!',
    'sslmode': 'require'
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def create_summary_dashboard():
    """Create HTML dashboard showing RobbieSummaries for Top 10 emails"""
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Get Top 10 emails with their summaries
        cursor.execute("""
            SELECT 
                i.interaction_id,
                i.subject,
                i.from_user,
                i.importance_score,
                i.urgency_score,
                i.ai_reasoning,
                pq.task_description as robbie_summary
            FROM interactions i
            LEFT JOIN priorities_queue pq ON pq.source_id = i.interaction_id 
                AND pq.task_type = 'robbie_summary'
            WHERE i.interaction_type = 'email'
            AND i.interaction_date > NOW() - INTERVAL '3 days'
            AND (i.importance_score > 0 OR i.urgency_score > 0)
            ORDER BY i.importance_score DESC, i.urgency_score DESC
            LIMIT 10
        """)
        
        emails = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Generate HTML dashboard
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Robbie's Top 10 Email Summaries</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }}
        .email-card {{ background: white; margin: 15px 0; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .email-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }}
        .email-title {{ font-size: 18px; font-weight: bold; color: #333; }}
        .email-scores {{ display: flex; gap: 15px; }}
        .score {{ padding: 5px 10px; border-radius: 15px; font-weight: bold; }}
        .importance {{ background: #e3f2fd; color: #1976d2; }}
        .urgency {{ background: #fff3e0; color: #f57c00; }}
        .robbie-summary {{ background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 10px 0; font-family: monospace; white-space: pre-wrap; }}
        .priority-badge {{ padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }}
        .top7 {{ background: #e8f5e8; color: #2e7d32; }}
        .top3 {{ background: #fff3e0; color: #f57c00; }}
        .refresh-btn {{ background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Robbie's Top 10 Email Summaries</h1>
            <p>Why Allan should care about these emails</p>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
        </div>
"""
        
        for i, (interaction_id, subject, from_user, importance, urgency, ai_reasoning, robbie_summary) in enumerate(emails, 1):
            # Determine priority badge
            if i <= 7:
                priority_class = "top7"
                priority_text = "⭐ TOP 7 - MOST IMPORTANT"
            else:
                priority_class = "top3"
                priority_text = "🔥 TOP 3 - MOST URGENT"
            
            # Use AI reasoning if no Robbie summary
            summary_text = robbie_summary or ai_reasoning or "No summary available"
            
            html_content += f"""
        <div class="email-card">
            <div class="email-header">
                <div class="email-title">{subject[:80]}{'...' if len(subject) > 80 else ''}</div>
                <div class="email-scores">
                    <div class="score importance">Importance: {importance:.0f}</div>
                    <div class="score urgency">Urgency: {urgency:.0f}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 10px;">
                <strong>From:</strong> {from_user[:60]}{'...' if len(from_user) > 60 else ''}
            </div>
            
            <div class="priority-badge {priority_class}">{priority_text}</div>
            
            <div class="robbie-summary">{summary_text}</div>
        </div>
"""
        
        html_content += """
    </div>
</body>
</html>
"""
        
        # Save dashboard
        with open('/Users/allanperetz/aurora-ai-robbiverse/robbie-summary-dashboard.html', 'w') as f:
            f.write(html_content)
        
        logging.info(f"✅ Created summary dashboard with {len(emails)} emails")
        logging.info("📊 Dashboard saved to: robbie-summary-dashboard.html")
        
        return len(emails)
        
    except Exception as e:
        logging.error(f"❌ Error creating dashboard: {e}")
        return 0

if __name__ == "__main__":
    create_summary_dashboard()
