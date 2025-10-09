#!/usr/bin/env python3
"""
Skill Manager Service
Manages the creation and deployment of new service skills for Robbie Agent
Provides templates and automation for adding new capabilities
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import httpx
import redis
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from jinja2 import Template
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Skill Manager", version="1.0.0")

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://:aurora_password@redis-sentinel-aurora:26379")
ROBBIE_AGENT_URL = os.getenv("ROBBIE_AGENT_URL", "http://robbie-agent:8018")

# Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class SkillTemplate(BaseModel):
    """Template for creating new skills"""
    template_id: str
    name: str
    description: str
    category: str  # communication, analysis, automation, integration, etc.
    template_code: str
    required_parameters: List[str]
    optional_parameters: List[str]
    dependencies: List[str] = Field(default_factory=list)
    estimated_development_time: int = 60  # minutes

class NewSkillRequest(BaseModel):
    """Request to create a new skill"""
    skill_id: str
    name: str
    description: str
    category: str
    service_endpoint: str
    capabilities: List[str]
    parameters: Dict[str, Any]
    template_id: Optional[str] = None
    auto_deploy: bool = True

class SkillDeployment(BaseModel):
    """Skill deployment status"""
    skill_id: str
    status: str  # pending, deploying, deployed, failed
    deployment_id: str
    created_at: datetime
    deployed_at: Optional[datetime] = None
    error_message: Optional[str] = None

class SkillManager:
    """Manages skill creation and deployment"""
    
    def __init__(self):
        self.skill_templates = {}
        self.deployments = {}
        self._load_skill_templates()
    
    def _load_skill_templates(self):
        """Load available skill templates"""
        self.skill_templates = {
            "email_service": SkillTemplate(
                template_id="email_service",
                name="Email Service",
                description="Template for email-related services",
                category="communication",
                template_code=self._get_email_template(),
                required_parameters=["to", "subject", "body"],
                optional_parameters=["cc", "bcc", "attachments", "priority"],
                dependencies=["smtp"],
                estimated_development_time=30
            ),
            "sms_service": SkillTemplate(
                template_id="sms_service",
                name="SMS Service",
                description="Template for SMS/texting services",
                category="communication",
                template_code=self._get_sms_template(),
                required_parameters=["to", "message"],
                optional_parameters=["media_url", "schedule_time"],
                dependencies=["twilio", "sms_gateway"],
                estimated_development_time=45
            ),
            "blog_writer": SkillTemplate(
                template_id="blog_writer",
                name="Blog Writer",
                description="Template for blog writing and publishing",
                category="content",
                template_code=self._get_blog_template(),
                required_parameters=["topic", "length", "style"],
                optional_parameters=["keywords", "target_audience", "publish_immediately"],
                dependencies=["ai_writer", "cms_api"],
                estimated_development_time=90
            ),
            "pipeline_manager": SkillTemplate(
                template_id="pipeline_manager",
                name="Pipeline Manager",
                description="Template for sales/marketing pipeline management",
                category="automation",
                template_code=self._get_pipeline_template(),
                required_parameters=["action", "deal_id"],
                optional_parameters=["stage", "notes", "value", "close_date"],
                dependencies=["crm_api"],
                estimated_development_time=60
            ),
            "calendar_automation": SkillTemplate(
                template_id="calendar_automation",
                name="Calendar Automation",
                description="Template for calendar management and scheduling",
                category="automation",
                template_code=self._get_calendar_template(),
                required_parameters=["action", "title"],
                optional_parameters=["start_time", "end_time", "attendees", "location", "description"],
                dependencies=["calendar_api"],
                estimated_development_time=45
            ),
            "data_analyzer": SkillTemplate(
                template_id="data_analyzer",
                name="Data Analyzer",
                description="Template for data analysis and reporting",
                category="analysis",
                template_code=self._get_analyzer_template(),
                required_parameters=["data_source", "analysis_type"],
                optional_parameters=["filters", "group_by", "time_range"],
                dependencies=["database", "analytics_api"],
                estimated_development_time=75
            ),
            "webhook_handler": SkillTemplate(
                template_id="webhook_handler",
                name="Webhook Handler",
                description="Template for handling webhook integrations",
                category="integration",
                template_code=self._get_webhook_template(),
                required_parameters=["webhook_url", "event_type"],
                optional_parameters=["authentication", "retry_policy", "filtering"],
                dependencies=["webhook_service"],
                estimated_development_time=60
            )
        }
        logger.info(f"✅ Loaded {len(self.skill_templates)} skill templates")
    
    def _get_email_template(self) -> str:
        """Email service template"""
        return """
async def send_email(parameters: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Send email using SMTP\"\"\"
    try:
        # Extract parameters
        to = parameters.get('to')
        subject = parameters.get('subject')
        body = parameters.get('body')
        cc = parameters.get('cc', [])
        bcc = parameters.get('bcc', [])
        
        # Call email service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://integration-sync:8001/api/email/send",
                json={
                    "to": to,
                    "subject": subject,
                    "body": body,
                    "cc": cc,
                    "bcc": bcc
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {"success": True, "message_id": response.json().get("message_id")}
            else:
                return {"success": False, "error": f"Email service error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}
"""
    
    def _get_sms_template(self) -> str:
        """SMS service template"""
        return """
async def send_sms(parameters: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Send SMS using Twilio or similar service\"\"\"
    try:
        # Extract parameters
        to = parameters.get('to')
        message = parameters.get('message')
        media_url = parameters.get('media_url')
        
        # Call SMS service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://integration-sync:8001/api/sms/send",
                json={
                    "to": to,
                    "message": message,
                    "media_url": media_url
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {"success": True, "message_id": response.json().get("message_id")}
            else:
                return {"success": False, "error": f"SMS service error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}
"""
    
    def _get_blog_template(self) -> str:
        """Blog writing template"""
        return """
async def write_blog(parameters: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Write and publish blog post\"\"\"
    try:
        # Extract parameters
        topic = parameters.get('topic')
        length = parameters.get('length', 'medium')
        style = parameters.get('style', 'professional')
        keywords = parameters.get('keywords', [])
        
        # Call AI writing service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://ai-coordinator:3010/api/ai/request",
                json={
                    "task_type": "custom_write",
                    "payload": {
                        "writing_task": f"Write a {length} blog post about {topic}",
                        "style": style,
                        "keywords": keywords,
                        "requirements": f"SEO optimized, engaging, {length} length"
                    }
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                content = response.json().get("written_content", "")
                
                # Publish if requested
                if parameters.get('publish_immediately', False):
                    publish_response = await client.post(
                        "http://integration-sync:8001/api/cms/publish",
                        json={
                            "title": topic,
                            "content": content,
                            "status": "published"
                        }
                    )
                    return {
                        "success": True, 
                        "content": content,
                        "published": publish_response.status_code == 200
                    }
                else:
                    return {"success": True, "content": content, "published": False}
            else:
                return {"success": False, "error": f"Writing service error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}
"""
    
    def _get_pipeline_template(self) -> str:
        """Pipeline management template"""
        return """
async def manage_pipeline(parameters: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Manage sales/marketing pipeline\"\"\"
    try:
        # Extract parameters
        action = parameters.get('action')
        deal_id = parameters.get('deal_id')
        stage = parameters.get('stage')
        notes = parameters.get('notes')
        
        # Call CRM service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://integration-sync:8001/api/hubspot/pipeline",
                json={
                    "action": action,
                    "deal_id": deal_id,
                    "stage": stage,
                    "notes": notes
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {"success": True, "result": response.json()}
            else:
                return {"success": False, "error": f"Pipeline service error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}
"""
    
    def _get_calendar_template(self) -> str:
        """Calendar automation template"""
        return """
async def manage_calendar(parameters: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Manage calendar events\"\"\"
    try:
        # Extract parameters
        action = parameters.get('action')
        title = parameters.get('title')
        start_time = parameters.get('start_time')
        end_time = parameters.get('end_time')
        attendees = parameters.get('attendees', [])
        
        # Call calendar service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://integration-sync:8001/api/calendar",
                json={
                    "action": action,
                    "title": title,
                    "start_time": start_time,
                    "end_time": end_time,
                    "attendees": attendees
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {"success": True, "event_id": response.json().get("event_id")}
            else:
                return {"success": False, "error": f"Calendar service error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}
"""
    
    def _get_analyzer_template(self) -> str:
        """Data analyzer template"""
        return """
async def analyze_data(parameters: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Analyze data and generate insights\"\"\"
    try:
        # Extract parameters
        data_source = parameters.get('data_source')
        analysis_type = parameters.get('analysis_type')
        filters = parameters.get('filters', {})
        
        # Call analytics service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://fact-extractor:3009/api/analyze",
                json={
                    "data_source": data_source,
                    "analysis_type": analysis_type,
                    "filters": filters
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                return {"success": True, "analysis": response.json()}
            else:
                return {"success": False, "error": f"Analysis service error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}
"""
    
    def _get_webhook_template(self) -> str:
        """Webhook handler template"""
        return """
async def handle_webhook(parameters: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Handle webhook events\"\"\"
    try:
        # Extract parameters
        webhook_url = parameters.get('webhook_url')
        event_type = parameters.get('event_type')
        payload = parameters.get('payload', {})
        
        # Process webhook
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json={
                    "event_type": event_type,
                    "payload": payload,
                    "timestamp": datetime.now().isoformat()
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {"success": True, "response": response.json()}
            else:
                return {"success": False, "error": f"Webhook error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}
"""
    
    async def create_skill(self, request: NewSkillRequest) -> Dict[str, Any]:
        """Create a new skill using templates"""
        try:
            # Generate skill code using template
            if request.template_id and request.template_id in self.skill_templates:
                template = self.skill_templates[request.template_id]
                skill_code = self._generate_skill_code(template, request)
            else:
                skill_code = self._generate_custom_skill_code(request)
            
            # Create skill definition
            skill_definition = {
                "skill_id": request.skill_id,
                "name": request.name,
                "description": request.description,
                "category": request.category,
                "service_endpoint": request.service_endpoint,
                "capabilities": request.capabilities,
                "parameters": request.parameters,
                "code": skill_code,
                "created_at": datetime.now().isoformat(),
                "status": "created"
            }
            
            # Store in Redis
            redis_client.hset(
                f"skill:{request.skill_id}",
                mapping=skill_definition
            )
            
            # Deploy to Robbie Agent if requested
            if request.auto_deploy:
                deployment_result = await self._deploy_skill_to_robbie(request)
                skill_definition["deployment"] = deployment_result
            
            logger.info(f"✅ Created skill: {request.name} ({request.skill_id})")
            return {
                "success": True,
                "skill_id": request.skill_id,
                "skill_definition": skill_definition
            }
            
        except Exception as e:
            logger.error(f"❌ Error creating skill: {e}")
            return {"success": False, "error": str(e)}
    
    def _generate_skill_code(self, template: SkillTemplate, request: NewSkillRequest) -> str:
        """Generate skill code from template"""
        # Use Jinja2 to render template with parameters
        template_obj = Template(template.template_code)
        
        # Prepare template variables
        template_vars = {
            "skill_id": request.skill_id,
            "skill_name": request.name,
            "parameters": request.parameters,
            "capabilities": request.capabilities,
            "service_endpoint": request.service_endpoint
        }
        
        return template_obj.render(**template_vars)
    
    def _generate_custom_skill_code(self, request: NewSkillRequest) -> str:
        """Generate custom skill code without template"""
        return f"""
async def {request.skill_id.replace('-', '_')}(parameters: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"{request.description}\"\"\"
    try:
        # Custom implementation for {request.name}
        # Parameters: {request.parameters}
        
        # Call service endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "{request.service_endpoint}",
                json=parameters,
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {{"success": True, "result": response.json()}}
            else:
                return {{"success": False, "error": f"Service error: {{response.status_code}}"}}
                
    except Exception as e:
        return {{"success": False, "error": str(e)}}
"""
    
    async def _deploy_skill_to_robbie(self, request: NewSkillRequest) -> Dict[str, Any]:
        """Deploy skill to Robbie Agent"""
        try:
            # Create ServiceSkill object
            from robbie_agent import ServiceSkill
            
            skill = ServiceSkill(
                skill_id=request.skill_id,
                name=request.name,
                description=request.description,
                service_endpoint=request.service_endpoint,
                capabilities=request.capabilities,
                confidence_threshold=0.7,
                cost_estimate=0.0,
                time_estimate_seconds=30
            )
            
            # Send to Robbie Agent
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ROBBIE_AGENT_URL}/api/skills/add",
                    json=skill.dict(),
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return {"deployed": True, "robbie_response": response.json()}
                else:
                    return {"deployed": False, "error": f"Robbie Agent error: {response.status_code}"}
                    
        except Exception as e:
            return {"deployed": False, "error": str(e)}
    
    async def get_skill_templates(self) -> List[SkillTemplate]:
        """Get available skill templates"""
        return list(self.skill_templates.values())
    
    async def get_skill(self, skill_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific skill"""
        skill_data = redis_client.hgetall(f"skill:{skill_id}")
        return skill_data if skill_data else None
    
    async def list_skills(self) -> List[Dict[str, Any]]:
        """List all created skills"""
        skills = []
        for key in redis_client.scan_iter("skill:*"):
            skill_data = redis_client.hgetall(key)
            if skill_data:
                skills.append(skill_data)
        return skills
    
    async def delete_skill(self, skill_id: str) -> bool:
        """Delete a skill"""
        try:
            redis_client.delete(f"skill:{skill_id}")
            logger.info(f"✅ Deleted skill: {skill_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error deleting skill: {e}")
            return False

# Initialize skill manager
skill_manager = SkillManager()

@app.on_event("startup")
async def startup():
    """Initialize skill manager"""
    logger.info("🔧 Skill Manager initialized")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "skill-manager",
        "templates_available": len(skill_manager.skill_templates)
    }

@app.get("/api/templates")
async def get_templates():
    """Get available skill templates"""
    templates = await skill_manager.get_skill_templates()
    return {"templates": [template.dict() for template in templates]}

@app.post("/api/skills/create")
async def create_skill(request: NewSkillRequest):
    """Create a new skill"""
    result = await skill_manager.create_skill(request)
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=500, detail=result["error"])

@app.get("/api/skills")
async def list_skills():
    """List all created skills"""
    skills = await skill_manager.list_skills()
    return {"skills": skills}

@app.get("/api/skills/{skill_id}")
async def get_skill(skill_id: str):
    """Get a specific skill"""
    skill = await skill_manager.get_skill(skill_id)
    if skill:
        return skill
    else:
        raise HTTPException(status_code=404, detail="Skill not found")

@app.delete("/api/skills/{skill_id}")
async def delete_skill(skill_id: str):
    """Delete a skill"""
    success = await skill_manager.delete_skill(skill_id)
    if success:
        return {"message": f"Skill {skill_id} deleted successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete skill")

@app.post("/api/skills/{skill_id}/deploy")
async def deploy_skill(skill_id: str):
    """Deploy a skill to Robbie Agent"""
    skill = await skill_manager.get_skill(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # Create deployment request
    from robbie_agent import ServiceSkill
    
    skill_obj = ServiceSkill(
        skill_id=skill["skill_id"],
        name=skill["name"],
        description=skill["description"],
        service_endpoint=skill["service_endpoint"],
        capabilities=skill["capabilities"],
        confidence_threshold=0.7,
        cost_estimate=0.0,
        time_estimate_seconds=30
    )
    
    result = await skill_manager._deploy_skill_to_robbie(skill_obj)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8019)
