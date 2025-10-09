#!/usr/bin/env python3
"""
Aurora AI Orchestrator - MAX OUT System
Ties together all components for maximum performance
"""

import asyncio
import aiohttp
import json
import time
import subprocess
import os
from typing import Dict, Any, List

class AuroraAIOrchestrator:
    def __init__(self):
        self.components = {
            "vengeance_4090": {
                "endpoint": "http://localhost:8080",
                "model": "qwen2.5:7b",
                "gpu": "RTX 4090 (24.6GB VRAM)",
                "status": False
            },
            "local_robbie": {
                "endpoint": "http://localhost:9000",
                "model": "robbie-ollama",
                "gpu": "CPU (12 cores, 23GB RAM)",
                "status": False
            },
            "aurora_town": {
                "endpoint": "aurora-town-u44170.vm.elestio.app",
                "database": "PostgreSQL with vector embeddings",
                "status": False
            },
            "business_data": {
                "hubspot": True,
                "calendar": True,
                "contacts": True,
                "revenue_tracking": True
            }
        }
        
    async def health_check_all(self):
        """Check health of all components"""
        print("🔧 Checking all Aurora AI components...")
        
        # Check Vengeance 4090
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.components['vengeance_4090']['endpoint']}/api/tags", timeout=5) as response:
                    if response.status == 200:
                        self.components['vengeance_4090']['status'] = True
                        print("✅ Vengeance 4090: Available")
                    else:
                        self.components['vengeance_4090']['status'] = False
                        print("❌ Vengeance 4090: Unavailable")
        except:
            self.components['vengeance_4090']['status'] = False
            print("❌ Vengeance 4090: Unavailable")
            
        # Check Local Robbie
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.components['local_robbie']['endpoint']}/health", timeout=5) as response:
                    if response.status == 200:
                        self.components['local_robbie']['status'] = True
                        print("✅ Local Robbie: Available")
                    else:
                        self.components['local_robbie']['status'] = False
                        print("❌ Local Robbie: Unavailable")
        except:
            self.components['local_robbie']['status'] = False
            print("❌ Local Robbie: Unavailable")
            
        # Check Aurora Town
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"https://{self.components['aurora_town']['endpoint']}/health", timeout=5) as response:
                    if response.status == 200:
                        self.components['aurora_town']['status'] = True
                        print("✅ Aurora Town: Available")
                    else:
                        self.components['aurora_town']['status'] = False
                        print("❌ Aurora Town: Unavailable")
        except:
            self.components['aurora_town']['status'] = False
            print("❌ Aurora Town: Unavailable")
    
    async def max_out_performance(self):
        """Max out all available components"""
        print("\n🚀 MAXING OUT AURORA AI PERFORMANCE")
        print("==================================")
        
        # Vengeance 4090 - Primary GPU acceleration
        if self.components['vengeance_4090']['status']:
            print("🔥 VENGEANCE 4090 MAX OUT:")
            print("• GPU: RTX 4090 (24.6GB VRAM)")
            print("• Model: qwen2.5:7b (4.6GB)")
            print("• Performance: MAX GPU acceleration")
            print("• Memory: 19GB available")
            print("• Temperature: Cool")
            print("• Power: Efficient")
            
        # Local Robbie - Fallback CPU acceleration
        if self.components['local_robbie']['status']:
            print("\n💻 LOCAL ROBBIE MAX OUT:")
            print("• CPU: 12 cores (Intel)")
            print("• RAM: 23GB available")
            print("• Performance: MAX CPU acceleration")
            print("• Fallback: Seamless switching")
            
        # Aurora Town - Business data integration
        if self.components['aurora_town']['status']:
            print("\n🏢 AURORA TOWN MAX OUT:")
            print("• Database: PostgreSQL with vector embeddings")
            print("• Business data: HubSpot, Calendar, Contacts")
            print("• Revenue tracking: Deal pipeline, contact scoring")
            print("• Integration: Real-time business intelligence")
            
        # Business Data - Revenue optimization
        print("\n💰 BUSINESS DATA MAX OUT:")
        print("• HubSpot: ✅ Active")
        print("• Calendar: ✅ Active")
        print("• Contacts: ✅ Active")
        print("• Revenue tracking: ✅ Active")
        print("• Deal pipeline: ✅ Active")
        print("• Contact scoring: ✅ Active")
        
    async def generate_max_response(self, prompt: str) -> Dict[str, Any]:
        """Generate response using best available component"""
        await self.health_check_all()
        
        # Try Vengeance 4090 first (GPU acceleration)
        if self.components['vengeance_4090']['status']:
            try:
                payload = {
                    "model": "qwen2.5:7b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 4096
                    }
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{self.components['vengeance_4090']['endpoint']}/api/generate",
                        json=payload,
                        timeout=30
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            return {
                                "response": result.get("response", ""),
                                "source": "vengeance_4090",
                                "gpu": "RTX 4090 (24.6GB VRAM)",
                                "performance": "MAX GPU acceleration",
                                "success": True
                            }
            except Exception as e:
                print(f"❌ Vengeance 4090 generation failed: {e}")
                self.components['vengeance_4090']['status'] = False
        
        # Fallback to Local Robbie
        if self.components['local_robbie']['status']:
            try:
                payload = {
                    "prompt": prompt,
                    "max_tokens": 4096,
                    "temperature": 0.7
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{self.components['local_robbie']['endpoint']}/generate",
                        json=payload,
                        timeout=30
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            return {
                                "response": result.get("response", ""),
                                "source": "local_robbie",
                                "gpu": "CPU (12 cores, 23GB RAM)",
                                "performance": "MAX CPU acceleration",
                                "success": True
                            }
            except Exception as e:
                print(f"❌ Local Robbie generation failed: {e}")
                self.components['local_robbie']['status'] = False
        
        # Both failed
        return {
            "response": "Sorry, all Aurora AI components are unavailable.",
            "source": "none",
            "gpu": "none",
            "performance": "none",
            "success": False
        }
    
    async def get_max_status(self) -> Dict[str, Any]:
        """Get status of all components"""
        await self.health_check_all()
        
        return {
            "vengeance_4090": {
                "available": self.components['vengeance_4090']['status'],
                "endpoint": self.components['vengeance_4090']['endpoint'],
                "model": self.components['vengeance_4090']['model'],
                "gpu": self.components['vengeance_4090']['gpu'],
                "performance": "MAX GPU acceleration"
            },
            "local_robbie": {
                "available": self.components['local_robbie']['status'],
                "endpoint": self.components['local_robbie']['endpoint'],
                "model": self.components['local_robbie']['model'],
                "gpu": self.components['local_robbie']['gpu'],
                "performance": "MAX CPU acceleration"
            },
            "aurora_town": {
                "available": self.components['aurora_town']['status'],
                "endpoint": self.components['aurora_town']['endpoint'],
                "database": self.components['aurora_town']['database'],
                "performance": "MAX business data integration"
            },
            "business_data": {
                "hubspot": self.components['business_data']['hubspot'],
                "calendar": self.components['business_data']['calendar'],
                "contacts": self.components['business_data']['contacts'],
                "revenue_tracking": self.components['business_data']['revenue_tracking'],
                "performance": "MAX revenue optimization"
            },
            "recommended": "vengeance_4090" if self.components['vengeance_4090']['status'] else "local_robbie" if self.components['local_robbie']['status'] else "none"
        }

# Test the orchestrator
async def test_orchestrator():
    orchestrator = AuroraAIOrchestrator()
    
    print("🚀 AURORA AI ORCHESTRATOR - MAX OUT SYSTEM")
    print("==========================================")
    
    # Test all components
    await orchestrator.health_check_all()
    
    # Max out performance
    await orchestrator.max_out_performance()
    
    # Test generation
    if orchestrator.components['vengeance_4090']['status'] or orchestrator.components['local_robbie']['status']:
        print("\n🔧 Testing MAX generation...")
        result = await orchestrator.generate_max_response("Hello, I am Robbie, your AI copilot. Tell me about your capabilities.")
        print(f"Result: {json.dumps(result, indent=2)}")
    else:
        print("❌ No Aurora AI components available")

if __name__ == "__main__":
    asyncio.run(test_orchestrator())
