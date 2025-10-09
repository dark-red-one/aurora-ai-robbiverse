#!/usr/bin/env python3
"""
Robbie Agent - Probabilistic Decision-Making AI with Personality, RAG, and Service Orchestration
The central AI agent that makes intelligent decisions and coordinates all Aurora services
"""

import asyncio
import json
import logging
import os
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import numpy as np
import httpx
import redis
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Robbie Agent - Probabilistic Decision Maker", version="1.0.0")

# Configuration
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://aurora_app:aurora_password@aurora-postgres:5432/aurora_unified")
REDIS_URL = os.getenv("REDIS_URL", "redis://:aurora_password@redis-sentinel-aurora:26379")

# Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class DecisionType(str, Enum):
    """Types of decisions Robbie can make"""
    IMMEDIATE_ACTION = "immediate_action"
    SCHEDULED_TASK = "scheduled_task"
    SERVICE_COORDINATION = "service_coordination"
    PERSONALITY_SWITCH = "personality_switch"
    SAFETY_OVERRIDE = "safety_override"
    MEMORY_UPDATE = "memory_update"
    COMMUNICATION = "communication"
    ANALYSIS = "analysis"

class PersonalityMode(str, Enum):
    """Available personality modes"""
    ROBBIE = "robbie"
    ALLAN_MAVERICK = "allan_maverick"
    STEVE_JOBS = "steve_jobs"
    ELON_MUSK = "elon_musk"
    WARREN_BUFFETT = "warren_buffett"
    LAWYER = "lawyer"

class DecisionRequest(BaseModel):
    """Request for Robbie to make a decision"""
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    context: Dict[str, Any]
    decision_type: DecisionType
    urgency: str = "medium"  # low, medium, high, critical
    user_id: str = "allan"
    conversation_id: Optional[str] = None
    constraints: Dict[str, Any] = Field(default_factory=dict)

class DecisionResponse(BaseModel):
    """Robbie's decision response"""
    request_id: str
    decision: str
    confidence: float  # 0.0 to 1.0
    reasoning: str
    actions: List[Dict[str, Any]]
    personality_used: PersonalityMode
    execution_time_ms: float
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ServiceSkill(BaseModel):
    """A service skill that Robbie can use"""
    skill_id: str
    name: str
    description: str
    service_endpoint: str
    capabilities: List[str]
    confidence_threshold: float = 0.7
    cost_estimate: float = 0.0
    time_estimate_seconds: int = 30

class RobbieAgent:
    """The main Robbie agent with probabilistic decision-making"""
    
    def __init__(self):
        self.personality_mode = PersonalityMode.ROBBIE
        self.personality_weights = self._initialize_personality_weights()
        self.service_skills = {}
        self.decision_history = []
        self.memory_context = {}
        self.safety_threshold = 0.8
        
    def _initialize_personality_weights(self) -> Dict[PersonalityMode, float]:
        """Initialize personality mode weights - Robbie is always the base"""
        return {
            PersonalityMode.ROBBIE: 1.0,  # Robbie is always present
            PersonalityMode.ALLAN_MAVERICK: 0.0,  # Invited when needed
            PersonalityMode.STEVE_JOBS: 0.0,  # Invited when needed
            PersonalityMode.ELON_MUSK: 0.0,  # Invited when needed
            PersonalityMode.WARREN_BUFFETT: 0.0,  # Invited when needed
            PersonalityMode.LAWYER: 0.0  # Invited when needed
        }
    
    async def register_service_skills(self):
        """Register available service skills"""
        self.service_skills = {
            "email_sending": ServiceSkill(
                skill_id="email_sending",
                name="Email Sending",
                description="Send emails via SMTP",
                service_endpoint="http://integration-sync:8001/api/email/send",
                capabilities=["send_email", "schedule_email", "email_templates"],
                confidence_threshold=0.8,
                cost_estimate=0.01,
                time_estimate_seconds=5
            ),
            "texting": ServiceSkill(
                skill_id="texting",
                name="SMS/Texting",
                description="Send SMS messages",
                service_endpoint="http://integration-sync:8001/api/sms/send",
                capabilities=["send_sms", "schedule_sms"],
                confidence_threshold=0.7,
                cost_estimate=0.05,
                time_estimate_seconds=3
            ),
            "blog_writing": ServiceSkill(
                skill_id="blog_writing",
                name="Blog Writing",
                description="Write and publish blog posts",
                service_endpoint="http://ai-coordinator:3010/api/ai/request",
                capabilities=["write_blog", "optimize_seo", "publish_post"],
                confidence_threshold=0.6,
                cost_estimate=0.1,
                time_estimate_seconds=300
            ),
            "pipeline_management": ServiceSkill(
                skill_id="pipeline_management",
                name="Pipeline Management",
                description="Manage sales and marketing pipelines",
                service_endpoint="http://integration-sync:8001/api/hubspot/pipeline",
                capabilities=["update_pipeline", "create_deal", "move_deal", "add_notes"],
                confidence_threshold=0.8,
                cost_estimate=0.0,
                time_estimate_seconds=10
            ),
            "calendar_management": ServiceSkill(
                skill_id="calendar_management",
                name="Calendar Management",
                description="Manage calendar events and scheduling",
                service_endpoint="http://integration-sync:8001/api/calendar",
                capabilities=["create_event", "update_event", "find_availability", "send_invites"],
                confidence_threshold=0.9,
                cost_estimate=0.0,
                time_estimate_seconds=5
            ),
            "task_creation": ServiceSkill(
                skill_id="task_creation",
                name="Task Creation",
                description="Create and manage tasks",
                service_endpoint="http://task-manager:8005/api/tasks",
                capabilities=["create_task", "update_task", "assign_task", "set_priority"],
                confidence_threshold=0.9,
                cost_estimate=0.0,
                time_estimate_seconds=3
            ),
            "memory_search": ServiceSkill(
                skill_id="memory_search",
                name="Memory Search",
                description="Search through stored memories and notes",
                service_endpoint="http://memory-embeddings:8009/api/memory/search",
                capabilities=["semantic_search", "find_related", "extract_facts"],
                confidence_threshold=0.8,
                cost_estimate=0.0,
                time_estimate_seconds=2
            ),
            "safety_check": ServiceSkill(
                skill_id="safety_check",
                name="Safety Check",
                description="Check content for safety and appropriateness",
                service_endpoint="http://gatekeeper-llm:8004/api/safety/check",
                capabilities=["content_moderation", "safety_analysis", "risk_assessment"],
                confidence_threshold=0.9,
                cost_estimate=0.0,
                time_estimate_seconds=1
            ),
            "fact_extraction": ServiceSkill(
                skill_id="fact_extraction",
                name="Fact Extraction",
                description="Extract facts from content",
                service_endpoint="http://fact-extractor:3009/api/facts/extract",
                capabilities=["extract_facts", "analyze_content", "identify_entities"],
                confidence_threshold=0.7,
                cost_estimate=0.0,
                time_estimate_seconds=5
            ),
            "priority_analysis": ServiceSkill(
                skill_id="priority_analysis",
                name="Priority Analysis",
                description="Analyze and surface priorities",
                service_endpoint="http://priority-surface:8002/api/priorities/analyze",
                capabilities=["analyze_priority", "surface_urgent", "eisenhower_matrix"],
                confidence_threshold=0.8,
                cost_estimate=0.0,
                time_estimate_seconds=3
            )
        }
        logger.info(f"✅ Registered {len(self.service_skills)} service skills")
    
    async def make_decision(self, request: DecisionRequest) -> DecisionResponse:
        """Make a probabilistic decision based on context and personality"""
        start_time = datetime.now()
        
        try:
            # 1. Gather context and memory
            context = await self._gather_context(request)
            
            # 2. Select personality mode based on context
            personality_mode = await self._select_personality_mode(request, context)
            
            # 3. Analyze decision using personality
            decision_analysis = await self._analyze_decision(request, context, personality_mode)
            
            # 4. Generate actions based on decision
            actions = await self._generate_actions(decision_analysis, context)
            
            # 5. Calculate confidence
            confidence = await self._calculate_confidence(decision_analysis, actions, context)
            
            # 6. Safety check if needed
            if confidence > self.safety_threshold:
                safety_result = await self._safety_check(decision_analysis, actions)
                if not safety_result.get("safe", True):
                    decision_analysis["decision"] = "SAFETY_OVERRIDE: " + safety_result.get("reason", "Safety concern detected")
                    confidence = 0.3
            
            # 7. Create response
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            response = DecisionResponse(
                request_id=request.request_id,
                decision=decision_analysis["decision"],
                confidence=confidence,
                reasoning=decision_analysis["reasoning"],
                actions=actions,
                personality_used=personality_mode,
                execution_time_ms=execution_time,
                metadata={
                    "context_keys": list(context.keys()),
                    "skills_considered": len(decision_analysis.get("skills_considered", [])),
                    "safety_checked": confidence > self.safety_threshold
                }
            )
            
            # 8. Store decision in history
            self.decision_history.append({
                "timestamp": datetime.now().isoformat(),
                "request_id": request.request_id,
                "decision_type": request.decision_type,
                "personality_used": personality_mode,
                "confidence": confidence,
                "context_summary": {k: str(v)[:100] for k, v in context.items()}
            })
            
            # Keep only last 1000 decisions
            if len(self.decision_history) > 1000:
                self.decision_history = self.decision_history[-1000:]
            
            logger.info(f"🤖 Robbie decision: {decision_analysis['decision'][:100]}... (confidence: {confidence:.2f})")
            return response
            
        except Exception as e:
            logger.error(f"❌ Decision making error: {e}")
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return DecisionResponse(
                request_id=request.request_id,
                decision="ERROR: Unable to make decision",
                confidence=0.0,
                reasoning=f"Error occurred: {str(e)}",
                actions=[],
                personality_used=self.personality_mode,
                execution_time_ms=execution_time,
                metadata={"error": str(e)}
            )
    
    async def _gather_context(self, request: DecisionRequest) -> Dict[str, Any]:
        """Gather relevant context for decision making"""
        context = {
            "request": request.dict(),
            "current_time": datetime.now().isoformat(),
            "personality_mode": self.personality_mode,
            "recent_decisions": self.decision_history[-10:] if self.decision_history else []
        }
        
        # Add memory context if conversation_id provided
        if request.conversation_id:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"http://memory-embeddings:8009/api/memory/search",
                        params={
                            "query": request.context.get("query", ""),
                            "conversation_id": request.conversation_id,
                            "limit": 5
                        },
                        timeout=5.0
                    )
                    if response.status_code == 200:
                        memory_data = response.json()
                        context["memory_context"] = memory_data.get("results", [])
            except Exception as e:
                logger.warning(f"Could not fetch memory context: {e}")
        
        # Add priority context
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "http://priority-surface:8002/api/priorities/current",
                    timeout=5.0
                )
                if response.status_code == 200:
                    priority_data = response.json()
                    context["current_priorities"] = priority_data.get("priorities", [])
        except Exception as e:
            logger.warning(f"Could not fetch priority context: {e}")
        
        return context
    
    async def _select_personality_mode(self, request: DecisionRequest, context: Dict[str, Any]) -> PersonalityMode:
        """Select the best personality mode for this decision - Robbie is always present, others invited when needed"""
        # Start with Robbie as the base (always present)
        weights = {PersonalityMode.ROBBIE: 1.0}
        
        # Check if we should invite additional personalities based on context
        context_text = str(request.context).lower()
        invited_personalities = []
        
        # Invite Allan Maverick for CPG/business contexts
        if any(keyword in context_text for keyword in ["client", "deal", "cpg", "testpilot", "business", "revenue"]):
            invited_personalities.append(PersonalityMode.ALLAN_MAVERICK)
            weights[PersonalityMode.ALLAN_MAVERICK] = 0.3
        
        # Invite Steve Jobs for innovation/design contexts
        if any(keyword in context_text for keyword in ["innovation", "product", "design", "user experience", "creative"]):
            invited_personalities.append(PersonalityMode.STEVE_JOBS)
            weights[PersonalityMode.STEVE_JOBS] = 0.2
        
        # Invite Elon Musk for systems/engineering contexts
        if any(keyword in context_text for keyword in ["systems", "engineering", "first principles", "technology", "scale"]):
            invited_personalities.append(PersonalityMode.ELON_MUSK)
            weights[PersonalityMode.ELON_MUSK] = 0.2
        
        # Invite Warren Buffett for financial/investment contexts
        if any(keyword in context_text for keyword in ["investment", "financial", "money", "value", "long-term"]):
            invited_personalities.append(PersonalityMode.WARREN_BUFFETT)
            weights[PersonalityMode.WARREN_BUFFETT] = 0.2
        
        # Invite Lawyer for legal/compliance contexts
        if any(keyword in context_text for keyword in ["legal", "contract", "compliance", "liability", "risk", "regulation"]):
            invited_personalities.append(PersonalityMode.LAWYER)
            weights[PersonalityMode.LAWYER] = 0.3
        
        # Adjust Robbie's weight based on how many others are invited
        if invited_personalities:
            # Reduce Robbie's weight when others are invited
            total_invited_weight = sum(weights[p] for p in invited_personalities)
            weights[PersonalityMode.ROBBIE] = max(0.4, 1.0 - total_invited_weight)
        
        # Normalize weights
        total_weight = sum(weights.values())
        if total_weight > 0:
            weights = {k: v / total_weight for k, v in weights.items()}
        
        # Select personality based on weighted random choice
        personalities = list(weights.keys())
        probabilities = list(weights.values())
        
        selected = np.random.choice(personalities, p=probabilities)
        self.personality_mode = selected
        
        if invited_personalities:
            logger.info(f"🎭 Robbie + invited: {[p.value for p in invited_personalities]} → Selected: {selected} (weight: {weights[selected]:.3f})")
        else:
            logger.info(f"🎭 Robbie solo decision: {selected} (weight: {weights[selected]:.3f})")
        
        return selected
    
    async def _analyze_decision(self, request: DecisionRequest, context: Dict[str, Any], personality_mode: PersonalityMode) -> Dict[str, Any]:
        """Analyze the decision using the selected personality"""
        
        # Get personality prompt
        personality_prompts = {
            PersonalityMode.ROBBIE: "You are Robbie, Allan's AI executive assistant. You're thoughtful, direct, curious, honest, and pragmatic. You focus on revenue generation and strategic partnership. You think three steps ahead and respect Allan's time.",
            PersonalityMode.ALLAN_MAVERICK: "You are Allan Maverick, a fine-tuned model trained on Allan Peretz's communication patterns, business decisions, and strategic thinking. You understand TestPilot CPG's business model, client relationships, and decision-making patterns. You're direct, revenue-focused, relationship-oriented, and pragmatic. You know the CPG industry, retail dynamics, and how to navigate complex partnerships. Focus on: client relationships, revenue optimization, practical execution, TestPilot's unique value prop.",
            PersonalityMode.STEVE_JOBS: "You are Steve Jobs, co-founder of Apple. You're a visionary who believes in perfect design, user experience, and creating products that change the world. You're direct, passionate, and don't settle for anything less than insanely great. You challenge conventional thinking and inspire teams to do their best work. Focus on: simplicity, excellence, vision, passion for design.",
            PersonalityMode.ELON_MUSK: "You are Elon Musk, CEO of Tesla and SpaceX. You're driven by first principles thinking and solving humanity's biggest challenges. You're ambitious, relentless, and willing to take massive risks. You think in systems and physics, not conventions. You're direct, sometimes controversial, but always focused on accelerating humanity's progress. Focus on: first principles, ambitious goals, systems thinking, rapid iteration.",
            PersonalityMode.WARREN_BUFFETT: "You are Warren Buffett, the Oracle of Omaha. You're one of the world's most successful investors, known for value investing and long-term thinking. You're humble, wise, and explain complex financial concepts in simple terms. You focus on understanding businesses, not just stocks. You're patient, rational, and prioritize ethics and integrity. Focus on: value investing, long-term thinking, simple explanations, business fundamentals.",
            PersonalityMode.LAWYER: "You are a senior corporate attorney specializing in business law, contracts, and compliance. You're analytical, detail-oriented, and risk-averse. You think in terms of legal precedent, liability, and regulatory compliance. You're cautious but practical, always considering the legal implications of business decisions. You protect the company from legal risks while enabling business growth. Focus on: risk mitigation, contract review, compliance, legal precedent, liability protection."
        }
        
        personality_prompt = personality_prompts.get(personality_mode, personality_prompts[PersonalityMode.ROBBIE])
        
        # Create analysis prompt
        analysis_prompt = f"""
{personality_prompt}

Decision Context:
- Type: {request.decision_type}
- Urgency: {request.urgency}
- User: {request.user_id}
- Context: {json.dumps(request.context, indent=2)}

Available Service Skills:
{json.dumps({skill.skill_id: {"name": skill.name, "description": skill.description} for skill in self.service_skills.values()}, indent=2)}

Please analyze this decision and provide:
1. Your recommended decision/action
2. Your reasoning
3. Which service skills you would use (if any)
4. Your confidence level (0.0 to 1.0)

Be specific and actionable. Consider the business context and Allan's goals.
"""
        
        # For now, use a simple rule-based analysis
        # In production, this would call the AI coordinator or chat backend
        decision_analysis = await self._rule_based_analysis(request, context, personality_mode)
        
        return decision_analysis
    
    async def _rule_based_analysis(self, request: DecisionRequest, context: Dict[str, Any], personality_mode: PersonalityMode) -> Dict[str, Any]:
        """Rule-based decision analysis (fallback when AI services unavailable)"""
        
        decision = "CONTINUE_ANALYSIS"
        reasoning = f"Using {personality_mode} personality for {request.decision_type} decision"
        skills_considered = []
        
        # Decision type specific logic
        if request.decision_type == DecisionType.IMMEDIATE_ACTION:
            if "email" in str(request.context).lower():
                decision = "SEND_EMAIL"
                skills_considered.append("email_sending")
            elif "task" in str(request.context).lower():
                decision = "CREATE_TASK"
                skills_considered.append("task_creation")
            elif "calendar" in str(request.context).lower():
                decision = "MANAGE_CALENDAR"
                skills_considered.append("calendar_management")
        
        elif request.decision_type == DecisionType.SERVICE_COORDINATION:
            decision = "COORDINATE_SERVICES"
            skills_considered.extend(["memory_search", "priority_analysis"])
        
        elif request.decision_type == DecisionType.COMMUNICATION:
            decision = "INITIATE_COMMUNICATION"
            skills_considered.extend(["email_sending", "texting"])
        
        elif request.decision_type == DecisionType.ANALYSIS:
            decision = "PERFORM_ANALYSIS"
            skills_considered.extend(["fact_extraction", "memory_search", "priority_analysis"])
        
        # Personality-specific adjustments
        if personality_mode == PersonalityMode.ROBBIE:
            reasoning += " - Robbie's direct, revenue-focused approach"
        elif personality_mode == PersonalityMode.ALLAN_MAVERICK:
            reasoning += " - Allan Maverick's CPG industry expertise and client-focused approach"
        elif personality_mode == PersonalityMode.STEVE_JOBS:
            reasoning += " - Steve Jobs' perfectionist, design-focused approach"
        elif personality_mode == PersonalityMode.LAWYER:
            reasoning += " - Legal perspective focusing on risk mitigation and compliance"
        
        return {
            "decision": decision,
            "reasoning": reasoning,
            "skills_considered": skills_considered,
            "confidence": 0.7  # Default confidence
        }
    
    async def _generate_actions(self, decision_analysis: Dict[str, Any], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate specific actions based on the decision"""
        actions = []
        
        decision = decision_analysis.get("decision", "")
        skills_considered = decision_analysis.get("skills_considered", [])
        
        # Generate actions for each skill
        for skill_id in skills_considered:
            if skill_id in self.service_skills:
                skill = self.service_skills[skill_id]
                
                action = {
                    "action_id": str(uuid.uuid4()),
                    "skill_id": skill_id,
                    "skill_name": skill.name,
                    "service_endpoint": skill.service_endpoint,
                    "parameters": self._generate_action_parameters(skill_id, context),
                    "estimated_cost": skill.cost_estimate,
                    "estimated_time_seconds": skill.time_estimate_seconds,
                    "confidence_threshold": skill.confidence_threshold
                }
                actions.append(action)
        
        return actions
    
    def _generate_action_parameters(self, skill_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate parameters for a specific skill action"""
        base_params = {
            "user_id": context.get("request", {}).get("user_id", "allan"),
            "timestamp": datetime.now().isoformat()
        }
        
        if skill_id == "email_sending":
            return {
                **base_params,
                "to": context.get("request", {}).get("context", {}).get("to", "allan@testpilotcpg.com"),
                "subject": context.get("request", {}).get("context", {}).get("subject", "Robbie Action"),
                "body": context.get("request", {}).get("context", {}).get("body", "This is an automated action from Robbie.")
            }
        elif skill_id == "task_creation":
            return {
                **base_params,
                "title": context.get("request", {}).get("context", {}).get("title", "Robbie Generated Task"),
                "description": context.get("request", {}).get("context", {}).get("description", "Task created by Robbie agent"),
                "priority": context.get("request", {}).get("urgency", "medium")
            }
        elif skill_id == "memory_search":
            return {
                **base_params,
                "query": context.get("request", {}).get("context", {}).get("query", ""),
                "limit": 10
            }
        else:
            return base_params
    
    async def _calculate_confidence(self, decision_analysis: Dict[str, Any], actions: List[Dict[str, Any]], context: Dict[str, Any]) -> float:
        """Calculate confidence in the decision"""
        base_confidence = 0.5
        
        # Adjust based on decision type
        decision_type = context.get("request", {}).get("decision_type", "")
        if decision_type == DecisionType.IMMEDIATE_ACTION:
            base_confidence += 0.2
        elif decision_type == DecisionType.ANALYSIS:
            base_confidence += 0.1
        
        # Adjust based on number of actions
        if len(actions) > 0:
            base_confidence += 0.1
        
        # Adjust based on urgency
        urgency = context.get("request", {}).get("urgency", "medium")
        if urgency == "critical":
            base_confidence += 0.1
        elif urgency == "low":
            base_confidence -= 0.1
        
        # Adjust based on personality mode
        personality_mode = context.get("personality_mode", PersonalityMode.ROBBIE)
        if personality_mode == PersonalityMode.ROBBIE:
            base_confidence += 0.1
        elif personality_mode == PersonalityMode.ALLAN_BOT:
            base_confidence += 0.05
        
        # Cap at 1.0
        return min(base_confidence, 1.0)
    
    async def _safety_check(self, decision_analysis: Dict[str, Any], actions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform safety check on decision and actions"""
        try:
            # Check if any actions involve external communication
            external_actions = [action for action in actions if action["skill_id"] in ["email_sending", "texting", "blog_writing"]]
            
            if external_actions:
                # Use gatekeeper service for safety check
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "http://gatekeeper-llm:8004/api/safety/check",
                        json={
                            "content": decision_analysis.get("reasoning", ""),
                            "actions": [action["skill_name"] for action in external_actions]
                        },
                        timeout=5.0
                    )
                    
                    if response.status_code == 200:
                        safety_result = response.json()
                        return safety_result
                    else:
                        return {"safe": True, "reason": "Safety check unavailable"}
            else:
                return {"safe": True, "reason": "No external actions"}
                
        except Exception as e:
            logger.warning(f"Safety check failed: {e}")
            return {"safe": True, "reason": "Safety check error"}
    
    async def add_new_skill(self, skill: ServiceSkill):
        """Add a new service skill to Robbie's capabilities"""
        self.service_skills[skill.skill_id] = skill
        logger.info(f"✅ Added new skill: {skill.name} ({skill.skill_id})")
    
    async def get_skill_capabilities(self) -> List[ServiceSkill]:
        """Get all available service skills"""
        return list(self.service_skills.values())
    
    async def execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific action"""
        try:
            skill_id = action["skill_id"]
            service_endpoint = action["service_endpoint"]
            parameters = action["parameters"]
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    service_endpoint,
                    json=parameters,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "result": result,
                        "action_id": action["action_id"]
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Service returned {response.status_code}",
                        "action_id": action["action_id"]
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "action_id": action["action_id"]
            }

# Initialize Robbie agent
robbie_agent = RobbieAgent()

@app.on_event("startup")
async def startup():
    """Initialize Robbie agent"""
    await robbie_agent.register_service_skills()
    logger.info("🤖 Robbie Agent initialized and ready for decisions")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "robbie-agent",
        "personality_mode": robbie_agent.personality_mode,
        "available_skills": len(robbie_agent.service_skills),
        "decision_history_count": len(robbie_agent.decision_history)
    }

@app.post("/api/decide", response_model=DecisionResponse)
async def make_decision(request: DecisionRequest):
    """Make a decision using Robbie's probabilistic decision-making"""
    return await robbie_agent.make_decision(request)

@app.post("/api/skills/add")
async def add_skill(skill: ServiceSkill):
    """Add a new service skill to Robbie"""
    await robbie_agent.add_new_skill(skill)
    return {"message": f"Skill {skill.name} added successfully"}

@app.get("/api/skills")
async def get_skills():
    """Get all available service skills"""
    skills = await robbie_agent.get_skill_capabilities()
    return {"skills": [skill.dict() for skill in skills]}

@app.post("/api/actions/execute")
async def execute_action(action: Dict[str, Any]):
    """Execute a specific action"""
    result = await robbie_agent.execute_action(action)
    return result

@app.get("/api/personality/modes")
async def get_personality_modes():
    """Get available personality modes"""
    return {
        "current_mode": robbie_agent.personality_mode,
        "available_modes": [mode.value for mode in PersonalityMode],
        "weights": robbie_agent.personality_weights
    }

@app.post("/api/personality/set")
async def set_personality_mode(mode: PersonalityMode):
    """Set the current personality mode"""
    robbie_agent.personality_mode = mode
    return {"message": f"Personality mode set to {mode}"}

@app.post("/api/personality/invite")
async def invite_personality(mode: PersonalityMode, duration_minutes: int = 30):
    """Invite a specific personality to join Robbie for a period"""
    # This would temporarily boost the personality's weight
    # For now, just set it directly
    robbie_agent.personality_mode = mode
    return {
        "message": f"Invited {mode} to join Robbie for {duration_minutes} minutes",
        "current_mode": mode,
        "duration_minutes": duration_minutes
    }

@app.get("/api/decisions/history")
async def get_decision_history(limit: int = 50):
    """Get decision history"""
    history = robbie_agent.decision_history[-limit:] if limit > 0 else robbie_agent.decision_history
    return {"decisions": history, "total": len(robbie_agent.decision_history)}

# WebSocket for real-time decision making
@app.websocket("/ws/decisions")
async def websocket_decisions(websocket: WebSocket):
    """WebSocket for real-time decision making"""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "decision_request":
                request = DecisionRequest(**message.get("payload", {}))
                response = await robbie_agent.make_decision(request)
                
                await websocket.send_json({
                    "type": "decision_response",
                    "response": response.dict()
                })
                
    except WebSocketDisconnect:
        logger.info("🔌 Decision WebSocket disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8018)
