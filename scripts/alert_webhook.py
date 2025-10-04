#!/usr/bin/env python3
"""
Aurora Alert Webhook System
Sends alerts to Discord, Slack, or custom webhooks
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class AuroraAlertWebhook:
    def __init__(self):
        self.webhook_urls = {
            "discord": "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN",
            "slack": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
            "custom": "https://your-custom-webhook.com/aurora-alerts"
        }
        
        self.alert_colors = {
            "healthy": 0x00ff00,    # Green
            "degraded": 0xffaa00,   # Orange
            "down": 0xff0000,       # Red
            "warning": 0xffff00     # Yellow
        }
    
    async def send_discord_alert(self, title: str, message: str, severity: str = "warning"):
        """Send alert to Discord webhook"""
        try:
            embed = {
                "title": f"🚨 Aurora Alert: {title}",
                "description": message,
                "color": self.alert_colors.get(severity, 0xffff00),
                "timestamp": datetime.now().isoformat(),
                "footer": {
                    "text": "Aurora AI Empire Health Monitor"
                },
                "fields": [
                    {
                        "name": "Severity",
                        "value": severity.upper(),
                        "inline": True
                    },
                    {
                        "name": "Time",
                        "value": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
                        "inline": True
                    }
                ]
            }
            
            payload = {
                "embeds": [embed],
                "username": "Aurora Health Monitor",
                "avatar_url": "https://your-avatar-url.com/aurora.png"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.webhook_urls["discord"],
                    json=payload,
                    timeout=10
                ) as response:
                    if response.status == 204:
                        logger.info("✅ Discord alert sent successfully")
                    else:
                        logger.error(f"❌ Discord webhook failed: {response.status}")
                        
        except Exception as e:
            logger.error(f"❌ Discord alert error: {e}")
    
    async def send_slack_alert(self, title: str, message: str, severity: str = "warning"):
        """Send alert to Slack webhook"""
        try:
            color = {
                "healthy": "good",
                "degraded": "warning", 
                "down": "danger",
                "warning": "warning"
            }.get(severity, "warning")
            
            payload = {
                "attachments": [
                    {
                        "color": color,
                        "title": f"🚨 Aurora Alert: {title}",
                        "text": message,
                        "fields": [
                            {
                                "title": "Severity",
                                "value": severity.upper(),
                                "short": True
                            },
                            {
                                "title": "Time",
                                "value": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
                                "short": True
                            }
                        ],
                        "footer": "Aurora AI Empire Health Monitor",
                        "ts": int(datetime.now().timestamp())
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.webhook_urls["slack"],
                    json=payload,
                    timeout=10
                ) as response:
                    if response.status == 200:
                        logger.info("✅ Slack alert sent successfully")
                    else:
                        logger.error(f"❌ Slack webhook failed: {response.status}")
                        
        except Exception as e:
            logger.error(f"❌ Slack alert error: {e}")
    
    async def send_custom_webhook(self, title: str, message: str, severity: str = "warning"):
        """Send alert to custom webhook"""
        try:
            payload = {
                "source": "aurora-health-monitor",
                "timestamp": datetime.now().isoformat(),
                "title": title,
                "message": message,
                "severity": severity,
                "system": "aurora-ai-empire"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.webhook_urls["custom"],
                    json=payload,
                    timeout=10
                ) as response:
                    if response.status in [200, 201, 204]:
                        logger.info("✅ Custom webhook alert sent successfully")
                    else:
                        logger.error(f"❌ Custom webhook failed: {response.status}")
                        
        except Exception as e:
            logger.error(f"❌ Custom webhook error: {e}")
    
    async def send_all_alerts(self, title: str, message: str, severity: str = "warning"):
        """Send alert to all configured webhooks"""
        tasks = [
            self.send_discord_alert(title, message, severity),
            self.send_slack_alert(title, message, severity),
            self.send_custom_webhook(title, message, severity)
        ]
        
        await asyncio.gather(*tasks, return_exceptions=True)

# Example usage
async def main():
    webhook = AuroraAlertWebhook()
    await webhook.send_all_alerts(
        "Test Alert",
        "This is a test alert from Aurora Health Monitor",
        "warning"
    )

if __name__ == "__main__":
    asyncio.run(main())



