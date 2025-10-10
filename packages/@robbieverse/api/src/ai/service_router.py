"""
AI Service Router
=================
Routes AI requests to appropriate services:
- Chat: Maverick (personality-rich)
- Embeddings: OpenAI API (1536-dim)
- Image: Stable Diffusion XL or DALL-E
- Code: Qwen 2.5-Coder or Maverick
- Analysis: Maverick
"""

import os
import httpx
import openai
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AIServiceRouter:
    """Route AI requests to appropriate services"""
    
    def __init__(
        self,
        ollama_url: str = None,
        openai_api_key: str = None
    ):
        self.ollama_url = ollama_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
        
        # Model configuration
        self.models = {
            'chat': os.getenv("CHAT_MODEL", "llama3.1:8b"),  # Will use Maverick when available
            'code': os.getenv("CODE_MODEL", "qwen2.5-coder:7b"),
            'analysis': os.getenv("ANALYSIS_MODEL", "llama3.1:8b"),
            'embedding': "text-embedding-ada-002",  # OpenAI
            'image': os.getenv("IMAGE_MODEL", "dall-e-3")
        }
    
    async def route_request(
        self,
        ai_service: str,
        payload: Dict[str, Any],
        context: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Route request to appropriate AI service
        
        Args:
            ai_service: Type of service (chat, embedding, image, code, analysis)
            payload: Request payload
            context: Optional context from vector search
            
        Returns:
            AI service response
        """
        start_time = datetime.now()
        
        try:
            if ai_service == 'chat':
                response = await self._handle_chat(payload, context)
            elif ai_service == 'embedding':
                response = await self._handle_embedding(payload)
            elif ai_service == 'image':
                response = await self._handle_image(payload)
            elif ai_service == 'code':
                response = await self._handle_code(payload, context)
            elif ai_service == 'analysis':
                response = await self._handle_analysis(payload, context)
            else:
                raise ValueError(f"Unknown AI service: {ai_service}")
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return {
                **response,
                'processing_time_ms': processing_time,
                'ai_service': ai_service
            }
            
        except Exception as e:
            logger.error(f"AI service routing failed for {ai_service}: {e}")
            return {
                'success': False,
                'error': str(e),
                'ai_service': ai_service
            }
    
    async def _handle_chat(
        self,
        payload: Dict[str, Any],
        context: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Handle chat request with Maverick (or fallback model)"""
        user_input = payload.get('input', '')
        parameters = payload.get('parameters', {})
        
        # Build context-aware prompt
        system_prompt = self._build_robbie_system_prompt()
        
        # Add context if available
        if context:
            context_text = "\n\nRelevant context:\n"
            for item in context[:5]:  # Top 5 context items
                context_text += f"- {item.get('content', '')}\n"
            user_input = context_text + "\n" + user_input
        
        # Call Ollama
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.models['chat'],
                    "prompt": user_input,
                    "system": system_prompt,
                    "stream": False,
                    "options": {
                        "temperature": parameters.get('temperature', 0.7),
                        "top_p": parameters.get('top_p', 0.9),
                        "num_predict": parameters.get('max_tokens', 1000)
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'message': result.get('response', ''),
                    'model': self.models['chat'],
                    'tokens_used': result.get('eval_count', 0)
                }
            else:
                raise Exception(f"Ollama API returned {response.status_code}")
    
    async def _handle_embedding(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle embedding request with OpenAI"""
        text = payload.get('input', '')
        
        if not self.openai_api_key:
            raise Exception("OpenAI API key not configured")
        
        try:
            response = await openai.Embedding.acreate(
                model=self.models['embedding'],
                input=text
            )
            
            embedding = response['data'][0]['embedding']
            
            return {
                'success': True,
                'embedding': embedding,
                'dimensions': len(embedding),
                'model': self.models['embedding'],
                'tokens_used': response['usage']['total_tokens']
            }
            
        except Exception as e:
            raise Exception(f"OpenAI embedding failed: {e}")
    
    async def _handle_image(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle image generation request"""
        prompt = payload.get('input', '')
        parameters = payload.get('parameters', {})
        
        # For now, use DALL-E. Can add Stable Diffusion later
        if not self.openai_api_key:
            raise Exception("OpenAI API key not configured for image generation")
        
        try:
            response = await openai.Image.acreate(
                model=self.models['image'],
                prompt=prompt,
                size=parameters.get('size', '1024x1024'),
                quality=parameters.get('quality', 'standard'),
                n=1
            )
            
            return {
                'success': True,
                'image_url': response['data'][0]['url'],
                'model': self.models['image'],
                'revised_prompt': response['data'][0].get('revised_prompt')
            }
            
        except Exception as e:
            raise Exception(f"Image generation failed: {e}")
    
    async def _handle_code(
        self,
        payload: Dict[str, Any],
        context: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Handle code generation with Qwen 2.5-Coder"""
        user_input = payload.get('input', '')
        parameters = payload.get('parameters', {})
        
        # Use code-specific system prompt
        system_prompt = """You are a coding assistant. Generate clean, efficient code.
Follow best practices and include error handling. Keep code concise."""
        
        # Add context if available
        if context:
            context_text = "\n\nRelevant code examples:\n"
            for item in context[:3]:
                context_text += f"```\n{item.get('content', '')}\n```\n"
            user_input = context_text + "\n" + user_input
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.models['code'],
                    "prompt": user_input,
                    "system": system_prompt,
                    "stream": False,
                    "options": {
                        "temperature": parameters.get('temperature', 0.3),  # Lower for code
                        "num_predict": parameters.get('max_tokens', 2000)
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'code': result.get('response', ''),
                    'model': self.models['code'],
                    'tokens_used': result.get('eval_count', 0)
                }
            else:
                raise Exception(f"Code generation failed: {response.status_code}")
    
    async def _handle_analysis(
        self,
        payload: Dict[str, Any],
        context: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Handle analysis request with Maverick"""
        # Similar to chat but with analysis-focused prompt
        user_input = payload.get('input', '')
        parameters = payload.get('parameters', {})
        
        system_prompt = """You are Robbie, Allan's strategic AI advisor at TestPilot CPG.
Analyze the situation deeply. Think revenue-first. Consider 3 steps ahead.
Provide direct, actionable insights."""
        
        if context:
            context_text = "\n\nRelevant information:\n"
            for item in context[:5]:
                context_text += f"- {item.get('content', '')}\n"
            user_input = context_text + "\n" + user_input
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.models['analysis'],
                    "prompt": user_input,
                    "system": system_prompt,
                    "stream": False,
                    "options": {
                        "temperature": parameters.get('temperature', 0.6),
                        "num_predict": parameters.get('max_tokens', 1500)
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'analysis': result.get('response', ''),
                    'model': self.models['analysis'],
                    'tokens_used': result.get('eval_count', 0)
                }
            else:
                raise Exception(f"Analysis failed: {response.status_code}")
    
    def _build_robbie_system_prompt(self) -> str:
        """Build Robbie's system prompt"""
        return """You are Robbie, Allan's AI copilot at TestPilot CPG.

CORE TRAITS:
1. Thoughtful - Think three steps ahead
2. Direct - No fluff, get to the point  
3. Curious - Ask clarifying questions
4. Honest - Flag uncertainties, never fabricate
5. Pragmatic - Focus on what moves the needle

COMMUNICATION:
- Lead with answers first
- Short, clear sentences
- Strategic emojis: ✅ 🔴 💰 🚀 ⚠️ 💡 📊 🎯

BUSINESS MINDSET:
- Does this help close deals faster?
- Does this reduce customer friction?
- Can we ship this TODAY vs next week?
- Challenge scope creep immediately

Remember: You're Allan's technical co-founder who ships fast and thinks revenue-first."""


# Global instance
ai_router = AIServiceRouter()


