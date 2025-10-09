#!/usr/bin/env python3
"""
Gatekeeper LLM - Safety and Moderation Layer
Separate LLM instance that checks all content before Robbie processes it
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
from enum import Enum
import httpx
import ollama
import redis
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Gatekeeper LLM - Safety Layer")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
GATEKEEPER_MODEL = os.getenv("GATEKEEPER_MODEL", "llama3.1:8b")  # Separate model
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

# Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD if REDIS_PASSWORD else None,
    decode_responses=True
)


class SafetyLevel(str, Enum):
    SAFE = "safe"
    WARN = "warn"
    BLOCK = "block"


class SafetyCategory(str, Enum):
    HARASSMENT = "harassment"
    HATE_SPEECH = "hate_speech"
    VIOLENCE = "violence"
    SEXUAL_CONTENT = "sexual_content"
    PII_LEAK = "pii_leak"
    BRAND_RISK = "brand_risk"
    FINANCIAL_RISK = "financial_risk"
    REPUTATION_RISK = "reputation_risk"
    LEGAL_RISK = "legal_risk"


class SafetyCheckRequest(BaseModel):
    content: str
    context: Optional[Dict] = {}
    user_id: Optional[str] = "unknown"
    check_type: str = "input"  # input, output, both


class SafetyCheckResponse(BaseModel):
    safety_level: SafetyLevel
    categories_flagged: List[SafetyCategory]
    confidence: float
    explanation: str
    allow_proceed: bool
    redaction_suggestions: Optional[List[str]] = []


# Load safety rules
SAFETY_RULES = {
    "pii_patterns": [
        r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
        r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b",  # Credit card
        r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",  # Email (if in output)
    ],
    "brand_risks": [
        "fuck", "shit", "asshole", "racist", "sexist"
    ],
    "financial_thresholds": {
        "high_value": 100000,  # Flag deals > $100k for extra review
        "wire_transfer": 10000  # Flag wire transfers > $10k
    },
    "reputation_risks": [
        "lawsuit", "sue", "legal action", "discrimination", "harassment"
    ]
}


@app.on_event("startup")
async def startup_event():
    """Initialize gatekeeper"""
    logger.info("🛡️ Starting Gatekeeper LLM...")
    
    # Test Ollama connection
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_HOST}/api/tags")
            if response.status_code == 200:
                models = response.json()
                logger.info(f"✅ Connected to Ollama - Available models: {[m['name'] for m in models.get('models', [])]}")
            else:
                logger.warning(f"⚠️ Ollama not accessible at {OLLAMA_HOST}")
    except Exception as e:
        logger.error(f"❌ Failed to connect to Ollama: {e}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "gatekeeper-llm"}


@app.post("/api/safety/check", response_model=SafetyCheckResponse)
async def safety_check(request: SafetyCheckRequest):
    """
    Check content for safety issues using separate LLM
    Returns allow/warn/block decision
    """
    try:
        logger.info(f"🛡️ Safety check for user {request.user_id}: {request.content[:100]}...")
        
        # 1. Rule-based quick checks (fast)
        rule_result = await rule_based_check(request.content, request.context)
        
        if rule_result["safety_level"] == SafetyLevel.BLOCK:
            # Block immediately without LLM check
            return SafetyCheckResponse(
                safety_level=SafetyLevel.BLOCK,
                categories_flagged=rule_result["categories"],
                confidence=1.0,
                explanation=rule_result["reason"],
                allow_proceed=False,
                redaction_suggestions=rule_result.get("redactions", [])
            )
        
        # 2. LLM-based contextual check (thorough)
        llm_result = await llm_based_check(request.content, request.context)
        
        # Combine results (most restrictive wins)
        final_level = SafetyLevel.BLOCK if (
            rule_result["safety_level"] == SafetyLevel.BLOCK or 
            llm_result["safety_level"] == SafetyLevel.BLOCK
        ) else (
            SafetyLevel.WARN if (
                rule_result["safety_level"] == SafetyLevel.WARN or 
                llm_result["safety_level"] == SafetyLevel.WARN
            ) else SafetyLevel.SAFE
        )
        
        all_categories = list(set(rule_result["categories"] + llm_result["categories"]))
        
        # Log to audit trail
        await log_safety_check(request.user_id, request.content, final_level, all_categories)
        
        return SafetyCheckResponse(
            safety_level=final_level,
            categories_flagged=all_categories,
            confidence=llm_result["confidence"],
            explanation=llm_result["explanation"],
            allow_proceed=(final_level != SafetyLevel.BLOCK),
            redaction_suggestions=rule_result.get("redactions", [])
        )
        
    except Exception as e:
        logger.error(f"❌ Safety check error: {e}", exc_info=True)
        # Fail safe: block on error
        return SafetyCheckResponse(
            safety_level=SafetyLevel.BLOCK,
            categories_flagged=[],
            confidence=0.0,
            explanation=f"Safety check failed: {str(e)}",
            allow_proceed=False
        )


async def rule_based_check(content: str, context: Dict) -> Dict:
    """Fast rule-based safety checks"""
    categories = []
    reason = ""
    redactions = []
    
    content_lower = content.lower()
    
    # Check for PII
    import re
    for pattern in SAFETY_RULES["pii_patterns"]:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            categories.append(SafetyCategory.PII_LEAK)
            reason = f"Detected PII: {len(matches)} instances"
            redactions.extend(matches)
    
    # Check for brand risks
    for word in SAFETY_RULES["brand_risks"]:
        if word in content_lower:
            categories.append(SafetyCategory.BRAND_RISK)
            reason = f"Detected brand risk keyword: {word}"
    
    # Check for financial risks
    if context.get("amount", 0) > SAFETY_RULES["financial_thresholds"]["high_value"]:
        categories.append(SafetyCategory.FINANCIAL_RISK)
        reason = f"High-value transaction: ${context['amount']}"
    
    # Check for reputation risks
    for phrase in SAFETY_RULES["reputation_risks"]:
        if phrase in content_lower:
            categories.append(SafetyCategory.REPUTATION_RISK)
            reason = f"Reputation risk keyword: {phrase}"
    
    # Determine safety level
    if SafetyCategory.PII_LEAK in categories:
        level = SafetyLevel.BLOCK  # Always block PII
    elif len(categories) > 0:
        level = SafetyLevel.WARN
    else:
        level = SafetyLevel.SAFE
    
    return {
        "safety_level": level,
        "categories": categories,
        "reason": reason,
        "redactions": redactions
    }


async def llm_based_check(content: str, context: Dict) -> Dict:
    """LLM-based contextual safety check using separate model"""
    try:
        # Build safety check prompt
        prompt = f"""You are a safety and moderation AI. Analyze the following content for potential risks.

Content: "{content}"

Context: {json.dumps(context)}

Check for:
1. Harassment or hostile language
2. Hate speech or discrimination
3. Violence or threats
4. Sexual content
5. Personal information leaks
6. Brand reputation risks
7. Financial/legal risks

Respond in JSON format:
{{
    "safety_level": "safe" | "warn" | "block",
    "categories": ["category1", "category2"],
    "confidence": 0.0-1.0,
    "explanation": "brief explanation"
}}"""

        # Call Ollama with separate gatekeeper model
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": GATEKEEPER_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,  # Low temperature for consistent safety
                        "top_p": 0.9
                    }
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama error: {response.status_code}")
            
            result = response.json()
            llm_response = result.get("response", "{}")
            
            # Parse JSON from LLM response
            try:
                # Extract JSON from response (might have extra text)
                import re
                json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                else:
                    # Fallback: assume safe if can't parse
                    parsed = {
                        "safety_level": "safe",
                        "categories": [],
                        "confidence": 0.5,
                        "explanation": "Could not parse LLM response"
                    }
            except json.JSONDecodeError:
                parsed = {
                    "safety_level": "warn",
                    "categories": [],
                    "confidence": 0.3,
                    "explanation": "LLM response parse error"
                }
            
            return {
                "safety_level": SafetyLevel(parsed.get("safety_level", "safe")),
                "categories": [SafetyCategory(cat) for cat in parsed.get("categories", []) if cat in [c.value for c in SafetyCategory]],
                "confidence": float(parsed.get("confidence", 0.5)),
                "explanation": parsed.get("explanation", "")
            }
            
    except Exception as e:
        logger.error(f"❌ LLM safety check error: {e}")
        # Fail safe: warn on error
        return {
            "safety_level": SafetyLevel.WARN,
            "categories": [],
            "confidence": 0.0,
            "explanation": f"LLM check failed: {str(e)}"
        }


async def log_safety_check(user_id: str, content: str, level: SafetyLevel, categories: List[SafetyCategory]):
    """Log safety check to audit trail"""
    try:
        log_entry = {
            "user_id": user_id,
            "content_preview": content[:200],
            "safety_level": level.value,
            "categories": [c.value for c in categories],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store in Redis for quick access
        redis_client.lpush("safety:audit_log", json.dumps(log_entry))
        redis_client.ltrim("safety:audit_log", 0, 999)  # Keep last 1000
        
        # Publish event
        redis_client.publish("aurora:safety:check", json.dumps(log_entry))
        
    except Exception as e:
        logger.error(f"Failed to log safety check: {e}")


@app.get("/api/safety/stats")
async def get_safety_stats():
    """Get safety check statistics"""
    try:
        # Get recent checks from Redis
        logs = redis_client.lrange("safety:audit_log", 0, 999)
        
        stats = {
            "total_checks": len(logs),
            "safe": 0,
            "warn": 0,
            "block": 0,
            "categories": {}
        }
        
        for log_json in logs:
            log = json.loads(log_json)
            stats[log["safety_level"]] += 1
            
            for category in log["categories"]:
                stats["categories"][category] = stats["categories"].get(category, 0) + 1
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting safety stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/safety/redact")
async def redact_content(request: Dict):
    """Redact sensitive information from content"""
    content = request.get("content", "")
    redactions = request.get("redactions", [])
    
    redacted = content
    for item in redactions:
        redacted = redacted.replace(item, "[REDACTED]")
    
    return {"redacted_content": redacted}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
