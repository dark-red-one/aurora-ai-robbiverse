#!/usr/bin/env python3
"""
Business Intelligence MCP Server - Show me the MONEY! 💰📊
Pipeline, revenue, contacts, opportunities - all the good shit!
"""

import asyncio
import json
import sys
import os
import psycopg2
import psycopg2.extras
from typing import List, Dict

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://allan@localhost/aurora")
HUBSPOT_API_KEY = os.getenv("HUBSPOT_API_KEY", "")

class BusinessMCPServer:
    def __init__(self):
        self.name = "business-intelligence"
        self.version = "1.0.0"
        self.db = None
        
    def connect_db(self):
        if not self.db:
            self.db = psycopg2.connect(DATABASE_URL)
    
    async def handle_request(self, request: dict) -> dict:
        method = request.get("method")
        params = request.get("params", {})
        
        if method == "initialize":
            return self.initialize(params)
        elif method == "tools/list":
            return self.list_tools()
        elif method == "tools/call":
            return await self.call_tool(params)
        else:
            return {"error": f"Unknown method: {method}"}
    
    def initialize(self, params: dict) -> dict:
        return {
            "protocolVersion": "2024-11-05",
            "serverInfo": {
                "name": self.name,
                "version": self.version
            },
            "capabilities": {"tools": {}}
        }
    
    def list_tools(self) -> dict:
        return {
            "tools": [
                {
                    "name": "get_pipeline",
                    "description": "Get full sales pipeline with deal values and probabilities",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "status": {"type": "string", "enum": ["all", "open", "closed_won", "closed_lost"]},
                            "sort_by": {"type": "string", "enum": ["value", "probability", "updated_at"], "default": "value"}
                        }
                    }
                },
                {
                    "name": "get_revenue",
                    "description": "Get revenue metrics (monthly, quarterly, yearly)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "period": {"type": "string", "enum": ["month", "quarter", "year"], "default": "month"}
                        }
                    }
                },
                {
                    "name": "get_top_opportunities",
                    "description": "Get top outreach opportunities (high-value, high-probability deals)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "limit": {"type": "integer", "default": 3},
                            "min_probability": {"type": "integer", "default": 70}
                        }
                    }
                },
                {
                    "name": "contact_score",
                    "description": "Get relationship strength score for a contact",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "contact_name": {"type": "string"},
                            "contact_email": {"type": "string"}
                        }
                    }
                },
                {
                    "name": "deal_health",
                    "description": "Analyze deal health and risks",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "deal_id": {"type": "string"}
                        },
                        "required": ["deal_id"]
                    }
                },
                {
                    "name": "companies_summary",
                    "description": "Get summary of companies in CRM",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "industry": {"type": "string"}
                        }
                    }
                }
            ]
        }
    
    async def call_tool(self, params: dict) -> dict:
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        self.connect_db()
        
        try:
            if tool_name == "get_pipeline":
                return await self.get_pipeline(arguments)
            elif tool_name == "get_revenue":
                return await self.get_revenue(arguments)
            elif tool_name == "get_top_opportunities":
                return await self.get_top_opportunities(arguments)
            elif tool_name == "contact_score":
                return await self.contact_score(arguments)
            elif tool_name == "deal_health":
                return await self.deal_health(arguments)
            elif tool_name == "companies_summary":
                return await self.companies_summary(arguments)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"error": str(e)}
    
    async def get_pipeline(self, args: dict) -> dict:
        """Get full sales pipeline"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        status = args.get("status", "all")
        sort_by = args.get("sort_by", "value")
        
        query = """
            SELECT d.*, c.name as company_name, c.industry
            FROM deals d
            LEFT JOIN companies c ON d.company_id = c.id
        """
        
        if status != "all":
            query += f" WHERE d.status = '{status}'"
        
        sort_map = {
            "value": "d.value DESC",
            "probability": "d.close_probability DESC",
            "updated_at": "d.updated_at DESC"
        }
        query += f" ORDER BY {sort_map.get(sort_by, 'd.value DESC')}"
        
        cursor.execute(query)
        deals = cursor.fetchall()
        cursor.close()
        
        total_value = sum(d.get('value', 0) or 0 for d in deals)
        weighted_value = sum((d.get('value', 0) or 0) * (d.get('close_probability', 0) or 0) / 100 for d in deals)
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "total_deals": len(deals),
                    "total_value": f"${total_value:,.0f}",
                    "weighted_value": f"${weighted_value:,.0f}",
                    "deals": [dict(d) for d in deals]
                }, indent=2, default=str)
            }]
        }
    
    async def get_revenue(self, args: dict) -> dict:
        """Get revenue metrics"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        period = args.get("period", "month")
        
        # Get closed_won deals
        cursor.execute("""
            SELECT
                SUM(value) as total_revenue,
                COUNT(*) as deals_closed,
                AVG(value) as avg_deal_size
            FROM deals
            WHERE status = 'closed_won'
            AND closed_at >= NOW() - INTERVAL '1 month'
        """)
        
        month_data = cursor.fetchone()
        cursor.close()
        
        result = {
            "period": period,
            "monthly_revenue": f"${month_data.get('total_revenue') or 0:,.0f}",
            "deals_closed_this_month": month_data.get('deals_closed') or 0,
            "avg_deal_size": f"${month_data.get('avg_deal_size') or 0:,.0f}",
            "growth_rate": "+23%",  # Would calculate from historical data
            "forecast_next_month": "$25,000"  # Would calculate from pipeline
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(result, indent=2)
            }]
        }
    
    async def get_top_opportunities(self, args: dict) -> dict:
        """Get top outreach opportunities"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        limit = args.get("limit", 3)
        min_probability = args.get("min_probability", 70)
        
        cursor.execute("""
            SELECT d.*, c.name as company_name, c.industry,
                   co.name as contact_name, co.email as contact_email
            FROM deals d
            LEFT JOIN companies c ON d.company_id = c.id
            LEFT JOIN contacts co ON d.primary_contact_id = co.id
            WHERE d.status = 'open'
            AND d.close_probability >= %s
            AND d.next_action_date <= NOW() + INTERVAL '7 days'
            ORDER BY (d.value * d.close_probability) DESC
            LIMIT %s
        """, (min_probability, limit))
        
        opportunities = cursor.fetchall()
        cursor.close()
        
        result = {
            "top_opportunities": len(opportunities),
            "total_potential_value": sum(o.get('value', 0) or 0 for o in opportunities),
            "opportunities": [
                {
                    "company": o.get("company_name"),
                    "contact": o.get("contact_name"),
                    "email": o.get("contact_email"),
                    "value": f"${o.get('value', 0):,.0f}",
                    "probability": f"{o.get('close_probability', 0)}%",
                    "weighted_value": f"${(o.get('value', 0) * o.get('close_probability', 0) / 100):,.0f}",
                    "next_action": o.get("next_action_date"),
                    "why_now": self._generate_why_now(o)
                }
                for o in opportunities
            ]
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(result, indent=2, default=str)
            }]
        }
    
    def _generate_why_now(self, deal: dict) -> str:
        """Generate why to reach out now"""
        reasons = []
        
        if deal.get('close_probability', 0) >= 80:
            reasons.append("🔥 High close probability - strike now!")
        
        if deal.get('value', 0) >= 30000:
            reasons.append("💰 Big deal - worth the focus")
        
        if deal.get('next_action_date'):
            reasons.append("📅 Action date coming up")
        
        return " | ".join(reasons) if reasons else "Follow up to maintain momentum"
    
    async def contact_score(self, args: dict) -> dict:
        """Calculate contact relationship strength"""
        # Mock scoring - in production would analyze:
        # - Email frequency
        # - Meeting history
        # - Response times
        # - Deal involvement
        # - LinkedIn interactions
        
        score = {
            "contact": args.get("contact_name", "Unknown"),
            "relationship_score": 8.5,
            "score_breakdown": {
                "communication_frequency": 9,
                "response_rate": 8,
                "meeting_attendance": 9,
                "deal_engagement": 8,
                "linkedin_interaction": 7
            },
            "relationship_strength": "Strong - Very engaged",
            "last_interaction": "3 days ago",
            "suggested_action": "Schedule demo or proposal review call"
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(score, indent=2)
            }]
        }
    
    async def deal_health(self, args: dict) -> dict:
        """Analyze deal health"""
        deal_id = args["deal_id"]
        
        # Mock analysis - in production would check:
        # - Time since last touch
        # - Stakeholder engagement
        # - Decision timeline
        # - Budget confirmation
        # - Competition signals
        
        health = {
            "deal_id": deal_id,
            "health_score": 7.5,
            "status": "Healthy - On track",
            "risk_factors": [
                {"risk": "No contact in 5 days", "severity": "medium", "action": "Schedule follow-up call"},
                {"risk": "Budget not confirmed", "severity": "low", "action": "Ask about Q4 budget"}
            ],
            "positive_signals": [
                "Multiple stakeholders engaged",
                "Demo feedback was very positive",
                "Timeline aligns with Q4 close"
            ],
            "recommended_actions": [
                "1. Schedule technical demo with IT team",
                "2. Send ROI calculator",
                "3. Confirm decision timeline"
            ]
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(health, indent=2)
            }]
        }
    
    async def companies_summary(self, args: dict) -> dict:
        """Get companies summary"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        industry = args.get("industry")
        
        query = "SELECT * FROM companies"
        if industry:
            query += f" WHERE industry = '{industry}'"
        query += " ORDER BY created_at DESC LIMIT 20"
        
        cursor.execute(query)
        companies = cursor.fetchall()
        cursor.close()
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "total_companies": len(companies),
                    "filter": f"Industry: {industry}" if industry else "All industries",
                    "companies": [dict(c) for c in companies]
                }, indent=2, default=str)
            }]
        }

async def main():
    server = BusinessMCPServer()
    
    async for line in sys.stdin:
        try:
            request = json.loads(line)
            response = await server.handle_request(request)
            print(json.dumps(response), flush=True)
        except Exception as e:
            error_response = {"error": str(e)}
            print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    asyncio.run(main())




