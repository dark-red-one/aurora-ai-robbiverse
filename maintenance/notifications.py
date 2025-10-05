#!/usr/bin/env python3

"""
Aurora AI Empire - Automated Notification System
Keeps Allan informed about system status and maintenance activities
"""

import json
import smtplib
import requests
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from datetime import datetime, timezone
import os
import sys

class NotificationSystem:
    """Handles all system notifications and communications"""

    def __init__(self):
        self.config = self._load_notification_config()
        self.allan_email = "allan@testpilotcpg.com"
        self.slack_webhook = os.getenv('SLACK_WEBHOOK_URL')

    def _load_notification_config(self):
        """Load notification configuration"""
        config_file = "/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/config/notifications.json"

        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                return json.load(f)
        else:
            # Default configuration
            return {
                "email": {
                    "smtp_server": "smtp.gmail.com",
                    "smtp_port": 587,
                    "username": os.getenv('SMTP_USERNAME'),
                    "password": os.getenv('SMTP_PASSWORD')
                },
                "slack": {
                    "webhook_url": self.slack_webhook,
                    "channel": "#aurora-status"
                },
                "sms": {
                    "enabled": False,  # Enable when SMS provider is configured
                    "provider": "twilio",  # twilio, aws_sns, etc.
                    "phone_number": os.getenv('SMS_PHONE_NUMBER')
                }
            }

    def send_notification(self, notification_type, data):
        """Send notification based on type and urgency"""
        if notification_type == "daily_summary":
            self._send_daily_summary(data)
        elif notification_type == "critical_alert":
            self._send_critical_alert(data)
        elif notification_type == "weekly_report":
            self._send_weekly_report(data)
        elif notification_type == "monthly_report":
            self._send_monthly_report(data)
        elif notification_type == "sync_notification":
            self._send_sync_notification(data)

    def _send_daily_summary(self, data):
        """Send daily maintenance summary"""
        subject = f"📋 Aurora Daily Summary - {data.get('date', datetime.now().strftime('%Y-%m-%d'))}"

        body = f"""
Aurora AI Empire - Daily Maintenance Summary
{'='*50}

Date: {data.get('date', datetime.now().strftime('%Y-%m-%d'))}
Status: {data.get('status', 'All systems operational')}

Environments Checked:
• Aurora (Production) - {data.get('aurora_status', '✅ Healthy')}
• Vengeance (Development) - {data.get('vengeance_status', '✅ Healthy')}
• RobbieBook1 (Staging) - {data.get('robbiebook1_status', '✅ Healthy')}

Maintenance Activities Completed:
{chr(10).join(f'• {activity}' for activity in data.get('activities', []))}

Key Metrics:
• Response Time: {data.get('response_time', 'N/A')}
• Error Rate: {data.get('error_rate', 'N/A')}
• Active Users: {data.get('active_users', 'N/A')}

Next Scheduled Maintenance:
• Weekly Backup: {data.get('next_backup', 'Sunday 2:00 AM UTC')}
• Monthly Audit: {data.get('next_audit', '1st of next month 3:00 AM UTC')}

🔗 View detailed metrics: https://aurora.testpilot.ai/status

Aurora AI Empire - Automated Excellence
"""

        self._send_email(subject, body)
        self._send_slack_notification({
            "text": "📋 Daily Maintenance Summary",
            "blocks": [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": "📋 Daily Summary"}
                },
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*Status:* {data.get('status', 'All systems operational')}"}
                }
            ]
        })

    def _send_critical_alert(self, data):
        """Send critical system alert"""
        subject = f"🚨 CRITICAL: {data.get('title', 'System Alert')}"

        body = f"""
🚨 CRITICAL SYSTEM ALERT
{'='*50}

Alert: {data.get('title', 'Critical Issue')}
Severity: {data.get('severity', 'CRITICAL')}
Environment: {data.get('environment', 'Multiple')}
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}

Issue Description:
{data.get('description', 'No description provided')}

Affected Systems:
{chr(10).join(f'• {system}' for system in data.get('affected_systems', []))}

Immediate Actions:
{chr(10).join(f'• {action}' for action in data.get('immediate_actions', []))}

Current Status: {data.get('current_status', 'Investigating')}

For more details, check the system logs or contact the technical team.

This is an automated alert from the Aurora AI Empire monitoring system.
"""

        # Send immediate notifications
        self._send_email(subject, body, priority="high")

        if self.config.get('sms', {}).get('enabled'):
            self._send_sms(f"🚨 CRITICAL: {data.get('title', 'System Alert')} - {data.get('environment', 'Multiple')}")

        self._send_slack_notification({
            "text": f"🚨 CRITICAL ALERT: {data.get('title', 'System Issue')}",
            "blocks": [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": "🚨 CRITICAL ALERT"}
                },
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*{data.get('title', 'Critical Issue')}*"}
                }
            ]
        })

    def _send_weekly_report(self, data):
        """Send weekly performance report"""
        subject = f"📊 Aurora Weekly Report - Week of {data.get('week_start', 'Unknown')}"

        body = f"""
Aurora AI Empire - Weekly Performance Report
{'='*50}

Report Period: {data.get('week_start', 'Unknown')} to {data.get('week_end', 'Unknown')}

Executive Summary:
{data.get('executive_summary', 'System operating within normal parameters.')}

Performance Highlights:
• Average Response Time: {data.get('avg_response_time', 'N/A')}
• System Uptime: {data.get('uptime_percentage', 'N/A')}%
• Error Rate: {data.get('error_rate', 'N/A')}%
• Total API Calls: {data.get('total_api_calls', 'N/A')}

Environment Status:
• Aurora (Production): {data.get('aurora_status', '✅ Operational')}
• Vengeance (Development): {data.get('vengeance_status', '✅ Operational')}
• RobbieBook1 (Staging): {data.get('robbiebook1_status', '✅ Operational')}

Key Achievements:
{chr(10).join(f'• {achievement}' for achievement in data.get('achievements', []))}

Areas for Attention:
{chr(10).join(f'• {issue}' for issue in data.get('attention_items', []))}

Upcoming Maintenance:
• Next Backup: {data.get('next_backup', 'Sunday 2:00 AM UTC')}
• Next Audit: {data.get('next_audit', '1st of next month 3:00 AM UTC')}

🔗 View detailed analytics: https://aurora.testpilot.ai/analytics

Aurora AI Empire - Continuous Excellence
"""

        self._send_email(subject, body)

    def _send_monthly_report(self, data):
        """Send comprehensive monthly report"""
        subject = f"📈 Aurora Monthly Report - {data.get('month', datetime.now().strftime('%B %Y'))}"

        body = f"""
Aurora AI Empire - Monthly Strategic Report
{'='*50}

Report Month: {data.get('month', datetime.now().strftime('%B %Y'))}

Strategic Overview:
{data.get('strategic_overview', 'Continued system optimization and feature development.')}

Monthly Achievements:
{chr(10).join(f'• {achievement}' for achievement in data.get('achievements', []))}

System Performance:
• Average Uptime: {data.get('avg_uptime', 'N/A')}%
• Total Users: {data.get('total_users', 'N/A')}
• Total Conversations: {data.get('total_conversations', 'N/A')}
• API Reliability: {data.get('api_reliability', 'N/A')}%

Resource Utilization:
• CPU Usage: {data.get('cpu_usage', 'N/A')}% average
• Memory Usage: {data.get('memory_usage', 'N/A')}% average
• Storage Growth: {data.get('storage_growth', 'N/A')}

Development Velocity:
• Features Deployed: {data.get('features_deployed', 'N/A')}
• Bugs Fixed: {data.get('bugs_fixed', 'N/A')}
• Code Quality Score: {data.get('code_quality', 'N/A')}/100

Business Impact:
• Revenue Pipeline: {data.get('revenue_pipeline', 'N/A')}
• Customer Satisfaction: {data.get('customer_satisfaction', 'N/A')}/5
• System ROI: {data.get('system_roi', 'N/A')}x

🔗 View strategic dashboard: https://aurora.testpilot.ai/strategy

Aurora AI Empire - Building the Future
"""

        self._send_email(subject, body)

    def _send_sync_notification(self, data):
        """Send environment synchronization notification"""
        subject = f"🔄 Environment Sync Complete - {data.get('source_env', 'Unknown')}"

        body = f"""
Aurora AI Empire - Environment Synchronization
{'='*50}

Synchronization Details:
• Source Environment: {data.get('source_env', 'Unknown')}
• Target Environments: {', '.join(data.get('target_envs', []))}
• Sync Type: {data.get('sync_type', 'Full synchronization')}
• Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}

Components Synchronized:
• ✅ Code Repository
• ✅ Configuration Files
• ✅ Database Schemas
• ✅ AI Personality Data
• ✅ Environment Settings

Verification Results:
{chr(10).join(f'• {result}' for result in data.get('verification_results', []))}

Next Scheduled Sync:
{data.get('next_sync', 'On-demand or next code change')}

🔗 View sync status: https://aurora.testpilot.ai/sync-status

Aurora AI Empire - Perfect Synchronization
"""

        self._send_email(subject, body)

        self._send_slack_notification({
            "text": "🔄 Environment Synchronization Complete",
            "blocks": [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": "🔄 Sync Complete"}
                },
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*Source:* {data.get('source_env', 'Unknown')}\n*Status:* ✅ Successful"}
                }
            ]
        })

    def _send_email(self, subject, body, priority="normal"):
        """Send email notification"""
        try:
            msg = MimeText(body)
            msg['Subject'] = subject
            msg['From'] = "Aurora AI Empire <noreply@aurora.testpilot.ai>"
            msg['To'] = self.allan_email

            if priority == "high":
                msg['X-Priority'] = '1'
                msg['X-MSMail-Priority'] = 'High'

            # SMTP configuration would go here
            # For now, just log the email
            print(f"📧 EMAIL NOTIFICATION:\nSubject: {subject}\nBody:\n{body}\n")

        except Exception as e:
            print(f"Failed to send email: {e}")

    def _send_slack_notification(self, payload):
        """Send Slack notification"""
        try:
            if self.slack_webhook:
                response = requests.post(
                    self.slack_webhook,
                    json=payload,
                    headers={'Content-Type': 'application/json'}
                )
                if response.status_code != 200:
                    print(f"Failed to send Slack notification: {response.status_code}")
            else:
                print(f"📱 SLACK NOTIFICATION:\n{payload}\n")
        except Exception as e:
            print(f"Failed to send Slack notification: {e}")

    def _send_sms(self, message):
        """Send SMS notification"""
        try:
            # SMS provider integration would go here
            # For now, just log the SMS
            print(f"📱 SMS NOTIFICATION: {message}")
        except Exception as e:
            print(f"Failed to send SMS: {e}")

# Example usage
if __name__ == "__main__":
    notifier = NotificationSystem()

    # Example daily summary
    daily_data = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'status': 'All systems operational',
        'aurora_status': '✅ Healthy',
        'vengeance_status': '✅ Healthy',
        'robbiebook1_status': '✅ Healthy',
        'activities': ['Health checks', 'Database optimization', 'Log rotation'],
        'response_time': '120ms',
        'error_rate': '0.01%',
        'active_users': 47
    }

    notifier.send_notification('daily_summary', daily_data)
