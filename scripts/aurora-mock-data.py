#!/usr/bin/env python3
"""
Aurora Mock Data System
Simulates real database data for testing and development
"""

import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any

class AuroraMockData:
    def __init__(self):
        self.data = self._generate_mock_data()
    
    def _generate_mock_data(self) -> Dict[str, Any]:
        """Generate realistic mock data for Aurora AI Empire"""
        
        # Users
        users = [
            {
                "id": "user-1",
                "email": "allan@testpilotcpg.com",
                "name": "Allan Peretz",
                "role": "ceo",
                "company": "TestPilot CPG",
                "created_at": "2024-01-15T10:00:00Z"
            }
        ]
        
        # AI Personalities
        personalities = [
            {
                "id": "personality-1",
                "name": "Robbie",
                "role": "Executive Assistant & Strategic Partner",
                "personality_traits": ["thoughtful", "direct", "curious", "honest", "pragmatic"],
                "system_prompt": "You are Robbie, Allan's AI executive assistant and strategic partner at TestPilot CPG.",
                "emotional_level": 5,
                "is_active": True
            },
            {
                "id": "personality-2", 
                "name": "AllanBot",
                "role": "Digital Twin",
                "personality_traits": ["strategic", "decisive", "visionary", "pragmatic"],
                "system_prompt": "You are AllanBot, Allan's digital twin for business decisions.",
                "emotional_level": 7,
                "is_active": True
            }
        ]
        
        # Deals (Real TestPilot CPG data)
        deals = [
            {
                "id": "deal-1",
                "company": "Simply Good Foods",
                "contact_name": "John Smith",
                "contact_email": "john@simplygoodfoods.com",
                "deal_value": 12740.00,
                "probability": 100,
                "stage": "closed",
                "source": "linkedin",
                "created_at": "2024-09-15T10:00:00Z",
                "closed_at": "2024-10-01T14:30:00Z"
            },
            {
                "id": "deal-2",
                "company": "Quest Nutrition",
                "contact_name": "Sarah Johnson", 
                "contact_email": "sarah@questnutrition.com",
                "deal_value": 25000.00,
                "probability": 100,
                "stage": "closed",
                "source": "referral",
                "created_at": "2024-08-20T09:15:00Z",
                "closed_at": "2024-09-30T16:45:00Z"
            },
            {
                "id": "deal-3",
                "company": "Cholula",
                "contact_name": "Mike Rodriguez",
                "contact_email": "mike@cholula.com", 
                "deal_value": 15000.00,
                "probability": 100,
                "stage": "closed",
                "source": "cold_call",
                "created_at": "2024-07-10T11:20:00Z",
                "closed_at": "2024-08-15T13:15:00Z"
            },
            {
                "id": "deal-4",
                "company": "New Prospect",
                "contact_name": "Jane Doe",
                "contact_email": "jane@newprospect.com",
                "deal_value": 50000.00,
                "probability": 75,
                "stage": "qualified",
                "source": "website",
                "created_at": "2024-10-01T08:30:00Z",
                "closed_at": None
            }
        ]
        
        # Revenue records
        revenue = [
            {"deal_id": "deal-1", "amount": 12740.00, "description": "Simply Good Foods - Strategy Consulting"},
            {"deal_id": "deal-2", "amount": 25000.00, "description": "Quest Nutrition - Market Analysis"},
            {"deal_id": "deal-3", "amount": 15000.00, "description": "Cholula - Brand Positioning"}
        ]
        
        # Widgets (RobbieBlocks catalog)
        widgets = [
            {"id": "widget-1", "name": "Vista Hero", "category": "Foundation", "implementation_status": "completed", "priority": 1},
            {"id": "widget-2", "name": "Chat Widget", "category": "Foundation", "implementation_status": "completed", "priority": 1},
            {"id": "widget-3", "name": "Specsheet", "category": "Foundation", "implementation_status": "completed", "priority": 1},
            {"id": "widget-4", "name": "Smart Cart", "category": "Commerce", "implementation_status": "completed", "priority": 2},
            {"id": "widget-5", "name": "Doc Prism", "category": "Content", "implementation_status": "in_progress", "priority": 2},
            {"id": "widget-6", "name": "Spotlight", "category": "Content", "implementation_status": "pending", "priority": 2},
            {"id": "widget-7", "name": "Pricing Table", "category": "Commerce", "implementation_status": "pending", "priority": 2},
            {"id": "widget-8", "name": "ROI Calculator", "category": "Tools", "implementation_status": "pending", "priority": 3},
            {"id": "widget-9", "name": "Sentinel Gate", "category": "Security", "implementation_status": "completed", "priority": 1},
            {"id": "widget-10", "name": "Workflow Runner", "category": "Tools", "implementation_status": "completed", "priority": 1}
        ]
        
        # Sites
        sites = [
            {"id": "site-1", "name": "AskRobbie.ai", "domain": "askrobbie.ai", "status": "development"},
            {"id": "site-2", "name": "RobbieBlocks.com", "domain": "robbieblocks.com", "status": "development"},
            {"id": "site-3", "name": "LeadershipQuotes.com", "domain": "leadershipquotes.com", "status": "development"},
            {"id": "site-4", "name": "TestPilot.ai", "domain": "testpilot.ai", "status": "development"},
            {"id": "site-5", "name": "HeyShopper.com", "domain": "heyshopper.com", "status": "development"}
        ]
        
        # GPU Nodes
        gpu_nodes = [
            {"id": "gpu-1", "name": "aurora", "host": "localhost", "port": 8000, "gpu_count": 2, "vram_total_gb": 48, "status": "active"},
            {"id": "gpu-2", "name": "collaboration", "host": "collaboration.runpod.io", "port": 8000, "gpu_count": 1, "vram_total_gb": 24, "status": "offline"},
            {"id": "gpu-3", "name": "fluenti", "host": "fluenti.runpod.io", "port": 8000, "gpu_count": 1, "vram_total_gb": 24, "status": "offline"},
            {"id": "gpu-4", "name": "vengeance", "host": "vengeance.runpod.io", "port": 8000, "gpu_count": 1, "vram_total_gb": 24, "status": "offline"},
            {"id": "gpu-5", "name": "runpod-gpu", "host": "209.170.80.132", "port": 11434, "gpu_count": 1, "vram_total_gb": 24, "status": "active"}
        ]
        
        # Conversations (recent)
        conversations = [
            {
                "id": "conv-1",
                "user_id": "user-1",
                "personality_id": "personality-1",
                "message": "What's our revenue status?",
                "response": "We have $52,740 in closed deals with 4 active prospects in the pipeline.",
                "created_at": "2024-10-06T20:30:00Z"
            },
            {
                "id": "conv-2", 
                "user_id": "user-1",
                "personality_id": "personality-1",
                "message": "How many widgets are completed?",
                "response": "We have 6 out of 26 widgets completed (23% progress).",
                "created_at": "2024-10-06T20:25:00Z"
            }
        ]
        
        return {
            "users": users,
            "personalities": personalities,
            "deals": deals,
            "revenue": revenue,
            "widgets": widgets,
            "sites": sites,
            "gpu_nodes": gpu_nodes,
            "conversations": conversations,
            "last_updated": datetime.now().isoformat()
        }
    
    def get_conversations(self, limit: int = 10) -> List[Dict]:
        """Get recent conversations"""
        return self.data["conversations"][:limit]
    
    def get_deals(self) -> List[Dict]:
        """Get all deals"""
        return self.data["deals"]
    
    def get_widgets(self) -> List[Dict]:
        """Get widget catalog"""
        return self.data["widgets"]
    
    def get_gpu_nodes(self) -> List[Dict]:
        """Get GPU mesh status"""
        return self.data["gpu_nodes"]
    
    def get_revenue_summary(self) -> Dict:
        """Get revenue summary"""
        total_revenue = sum(r["amount"] for r in self.data["revenue"])
        closed_deals = len([d for d in self.data["deals"] if d["stage"] == "closed"])
        pipeline_value = sum(d["deal_value"] for d in self.data["deals"] if d["stage"] != "closed")
        
        return {
            "total_revenue": total_revenue,
            "closed_deals": closed_deals,
            "total_pipeline_value": pipeline_value,
            "total_deals": len(self.data["deals"]),
            "average_deal_size": total_revenue / closed_deals if closed_deals > 0 else 0
        }
    
    def get_widget_status(self) -> List[Dict]:
        """Get widget status by category"""
        categories = {}
        for widget in self.data["widgets"]:
            cat = widget["category"]
            if cat not in categories:
                categories[cat] = {"total": 0, "completed": 0, "in_progress": 0, "pending": 0}
            
            categories[cat]["total"] += 1
            status = widget["implementation_status"]
            if status == "completed":
                categories[cat]["completed"] += 1
            elif status == "in_progress":
                categories[cat]["in_progress"] += 1
            else:
                categories[cat]["pending"] += 1
        
        return [{"category": cat, **stats} for cat, stats in categories.items()]
    
    def get_gpu_mesh_status(self) -> Dict:
        """Get GPU mesh status summary"""
        total_nodes = len(self.data["gpu_nodes"])
        active_nodes = len([n for n in self.data["gpu_nodes"] if n["status"] == "active"])
        total_gpus = sum(n["gpu_count"] for n in self.data["gpu_nodes"])
        total_vram = sum(n["vram_total_gb"] for n in self.data["gpu_nodes"])
        
        return {
            "total_nodes": total_nodes,
            "active_nodes": active_nodes,
            "total_gpus": total_gpus,
            "total_vram_gb": total_vram
        }
    
    def get_business_summary(self) -> Dict:
        """Get comprehensive business summary"""
        return {
            "revenue": self.get_revenue_summary(),
            "widgets": self.get_widget_status(),
            "gpu_mesh": self.get_gpu_mesh_status(),
            "last_sync": self.data["last_updated"]
        }
    
    def add_conversation(self, user_message: str, response: str, personality_id: str = "personality-1"):
        """Add new conversation"""
        conv = {
            "id": f"conv-{len(self.data['conversations']) + 1}",
            "user_id": "user-1",
            "personality_id": personality_id,
            "message": user_message,
            "response": response,
            "created_at": datetime.now().isoformat()
        }
        self.data["conversations"].insert(0, conv)
        return conv

# Global instance
mock_data = AuroraMockData()

if __name__ == "__main__":
    print("🗄️ AURORA MOCK DATA SYSTEM")
    print("==========================")
    
    print(f"✅ Users: {len(mock_data.data['users'])}")
    print(f"✅ Deals: {len(mock_data.data['deals'])}")
    print(f"✅ Widgets: {len(mock_data.data['widgets'])}")
    print(f"✅ GPU Nodes: {len(mock_data.data['gpu_nodes'])}")
    print(f"✅ Conversations: {len(mock_data.data['conversations'])}")
    
    revenue = mock_data.get_revenue_summary()
    print(f"💰 Revenue: ${revenue['total_revenue']:,.2f}")
    print(f"📊 Pipeline: ${revenue['total_pipeline_value']:,.2f}")
    
    print("\n🎉 Mock data system ready!")
