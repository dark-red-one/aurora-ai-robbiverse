import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import structlog

from .robbie_ai import RobbieAI
from .gatekeeper_ai import GatekeeperAI

logger = structlog.get_logger()

class DualLLMCoordinator:
    def __init__(self):
        self.robbie = RobbieAI()
        self.gatekeeper = GatekeeperAI()
        self.conversation_logs = {}
        self.safety_mode = "strict"
        
    async def process_user_message(self, message: str, user_id: str = "default", context: Dict = None):
        logger.info("Dual LLM processing", user_id=user_id, message_length=len(message))
        start_time = datetime.now()
        
        safety_check = await self.gatekeeper.safety_check(message, user_id)
        
        if not safety_check["safe"]:
            logger.warning("Message blocked by Gatekeeper", user_id=user_id, issues=safety_check["issues"])
            return {
                "response": await self.gatekeeper.generate_safety_response("blocked_content"),
                "source": "gatekeeper",
                "safety_status": "blocked",
                "issues": safety_check["issues"],
                "timestamp": datetime.now().isoformat(),
                "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000
            }
        
        robbie_response = await self.robbie.process_message(message, user_id, context)
        response_filter = await self.gatekeeper.response_filter(robbie_response["content"], context)
        
        if not response_filter["approved"]:
            final_response = await self.gatekeeper.generate_safety_response("blocked_content")
            source = "gatekeeper_filtered"
        else:
            final_response = response_filter["filtered_response"]
            source = "robbie_approved"
        
        return {
            "response": final_response,
            "source": source,
            "safety_status": "approved" if response_filter["approved"] else "filtered",
            "robbie_confidence": robbie_response.get("confidence", 0.5),
            "gatekeeper_confidence": response_filter.get("confidence", 1.0),
            "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000,
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_system_status(self):
        robbie_status = self.robbie.get_status()
        gatekeeper_status = self.gatekeeper.get_security_status()
        
        return {
            "system": "Aurora Dual LLM",
            "status": "operational",
            "safety_mode": self.safety_mode,
            "components": {
                "robbie": robbie_status,
                "gatekeeper": gatekeeper_status
            },
            "conversation_logs": {
                "total_users": len(self.conversation_logs),
                "total_messages": sum(len(logs) for logs in self.conversation_logs.values())
            },
            "timestamp": datetime.now().isoformat()
        }
    
    async def audit_user_conversation(self, user_id: str):
        if user_id not in self.conversation_logs:
            return {"error": "No conversation found for user", "user_id": user_id}
        return {"user_id": user_id, "status": "no_issues"}
    
    def set_safety_mode(self, mode: str):
        if mode in ["strict", "moderate", "permissive"]:
            self.safety_mode = mode
            logger.info("Safety mode changed", new_mode=mode)
