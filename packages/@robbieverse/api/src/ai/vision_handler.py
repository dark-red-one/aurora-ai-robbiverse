"""
Vision Handler for Robbie - Image Analysis with Personality
Handles screenshots, UI mockups, diagrams, and visual analysis
"""
import base64
import httpx
import json
from typing import Dict, Optional, Union
from pathlib import Path
import structlog

logger = structlog.get_logger()

class VisionHandler:
    """
    Handle image analysis with Robbie's personality
    
    Revenue Impact:
    - Fast UI review → Ship polished products → Better demos
    - Screenshot debugging → Fix issues faster → Less customer friction
    - Design feedback → Professional appearance → Higher close rate
    """
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.vision_model = "llama3.2-vision:11b"
        
        # Robbie's vision personality
        self.system_prompt = """You are Robbie analyzing visual content.

**Analysis Framework:**
1. **What I See** - Describe the image clearly
2. **Issues** - Call out problems immediately (UX, design, bugs)
3. **Quick Wins** - Easy improvements that ship TODAY
4. **Revenue Impact** - How this affects deals

**Your Style:**
- Direct and specific ("Button is 8px, needs 16px" not "Consider spacing")
- Revenue-focused (does this UI close deals?)
- Actionable (what to change, not theory)
- Use emojis: ✅🔴💰🚀⚠️💡📊🎯👀

Remember: Every pixel either helps close deals or doesn't. Ship fast."""
    
    async def analyze_image(
        self,
        image: Union[str, bytes, Path],
        prompt: str = "Analyze this image from a UX and business perspective",
        context: Optional[Dict] = None
    ) -> Dict:
        """
        Analyze an image with Robbie's personality
        
        Args:
            image: Base64 string, bytes, or file path
            prompt: Analysis instructions
            context: Optional context about the image
            
        Returns:
            Dict with analysis, issues, recommendations
        """
        try:
            # Convert image to base64 if needed
            image_b64 = await self._prepare_image(image)
            
            # Build full prompt with context
            full_prompt = self._build_prompt(prompt, context)
            
            # Call vision model
            analysis = await self._call_vision_model(image_b64, full_prompt)
            
            # Structure the response
            structured = self._structure_response(analysis)
            
            return {
                "success": True,
                "analysis": structured,
                "raw": analysis,
                "model": self.vision_model
            }
            
        except Exception as e:
            logger.error("Vision analysis error", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "model": self.vision_model
            }
    
    async def analyze_ui_screenshot(
        self,
        image: Union[str, bytes, Path],
        context: Optional[Dict] = None
    ) -> Dict:
        """Specialized analysis for UI screenshots"""
        prompt = """Analyze this UI screenshot as Robbie:

**Focus on:**
- Visual hierarchy and clarity
- Button/link prominence
- Color contrast and accessibility
- Professional appearance
- Mobile responsiveness indicators
- Call-to-action effectiveness

**Revenue Lens:**
- Does this UI inspire confidence?
- Is the value proposition clear?
- Are CTAs compelling?
- Does it look like a premium product?

Be direct and specific with pixel-level feedback."""
        
        return await self.analyze_image(image, prompt, context)
    
    async def analyze_design_mockup(
        self,
        image: Union[str, bytes, Path],
        context: Optional[Dict] = None
    ) -> Dict:
        """Specialized analysis for design mockups"""
        prompt = """Review this design mockup as Robbie:

**Evaluate:**
- Design system consistency
- Spacing and alignment
- Typography choices
- Color palette effectiveness
- Brand alignment
- Modern vs dated feel

**Business Impact:**
- Premium positioning
- Target audience fit
- Competitive advantage
- Conversion potential

Give actionable feedback for the designer."""
        
        return await self.analyze_image(image, prompt, context)
    
    async def debug_error_screenshot(
        self,
        image: Union[str, bytes, Path],
        context: Optional[Dict] = None
    ) -> Dict:
        """Specialized analysis for error/bug screenshots"""
        prompt = """Debug this screenshot as Robbie:

**Identify:**
- Error messages and their causes
- Console errors if visible
- Network failures if shown
- State/data issues
- UI breakage

**Provide:**
- Root cause hypothesis
- Likely fix location
- Quick debugging steps
- Prevention strategy

Be specific about the error and solution."""
        
        return await self.analyze_image(image, prompt, context)
    
    async def _prepare_image(self, image: Union[str, bytes, Path]) -> str:
        """Convert image to base64 string"""
        if isinstance(image, str):
            # Already base64 or will try to read as file
            if image.startswith('data:image'):
                # Extract base64 from data URL
                return image.split(',')[1]
            elif image.startswith('/') or Path(image).exists():
                # File path
                with open(image, 'rb') as f:
                    return base64.b64encode(f.read()).decode('utf-8')
            else:
                # Assume it's already base64
                return image
        
        elif isinstance(image, bytes):
            return base64.b64encode(image).decode('utf-8')
        
        elif isinstance(image, Path):
            with open(image, 'rb') as f:
                return base64.b64encode(f.read()).decode('utf-8')
        
        else:
            raise ValueError(f"Unsupported image type: {type(image)}")
    
    def _build_prompt(self, prompt: str, context: Optional[Dict]) -> str:
        """Build full prompt with system instructions and context"""
        parts = [self.system_prompt]
        
        if context:
            parts.append("\n**Context:**")
            if context.get('filename'):
                parts.append(f"- File: {context['filename']}")
            if context.get('page_url'):
                parts.append(f"- Page: {context['page_url']}")
            if context.get('user_note'):
                parts.append(f"- Note: {context['user_note']}")
        
        parts.append(f"\n**Your Task:**\n{prompt}")
        
        return "\n".join(parts)
    
    async def _call_vision_model(self, image_b64: str, prompt: str) -> str:
        """Call Ollama vision model with image"""
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.vision_model,
                    "prompt": prompt,
                    "images": [image_b64],
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "")
            else:
                raise Exception(f"Ollama returned {response.status_code}: {response.text}")
    
    def _structure_response(self, analysis: str) -> Dict:
        """Structure the raw analysis into sections"""
        # Try to parse Robbie's structured format
        sections = {
            "what_i_see": "",
            "issues": [],
            "quick_wins": [],
            "revenue_impact": "",
            "full_analysis": analysis
        }
        
        # Simple parsing - look for headers
        lines = analysis.split('\n')
        current_section = None
        
        for line in lines:
            line_lower = line.lower()
            
            if 'what i see' in line_lower:
                current_section = 'what_i_see'
            elif 'issue' in line_lower:
                current_section = 'issues'
            elif 'quick win' in line_lower or 'improvement' in line_lower:
                current_section = 'quick_wins'
            elif 'revenue' in line_lower or 'business' in line_lower:
                current_section = 'revenue_impact'
            elif line.strip().startswith('-') or line.strip().startswith('•'):
                # Bullet point
                if current_section in ['issues', 'quick_wins']:
                    sections[current_section].append(line.strip()[1:].strip())
            elif line.strip() and current_section:
                # Regular line content
                if current_section in ['what_i_see', 'revenue_impact']:
                    sections[current_section] += line + "\n"
        
        return sections


# Convenience functions
async def analyze_screenshot(
    image: Union[str, bytes, Path],
    prompt: Optional[str] = None,
    context: Optional[Dict] = None
) -> Dict:
    """Quick screenshot analysis"""
    handler = VisionHandler()
    if prompt:
        return await handler.analyze_image(image, prompt, context)
    else:
        return await handler.analyze_ui_screenshot(image, context)


async def debug_screenshot(
    image: Union[str, bytes, Path],
    context: Optional[Dict] = None
) -> Dict:
    """Quick error screenshot debugging"""
    handler = VisionHandler()
    return await handler.debug_error_screenshot(image, context)


# Test if run directly
if __name__ == "__main__":
    import asyncio
    
    async def test_vision():
        """Test vision handler"""
        handler = VisionHandler()
        
        # Mock test (would need actual image)
        print("🧪 Vision Handler Initialized")
        print(f"📹 Model: {handler.vision_model}")
        print(f"🔗 Ollama URL: {handler.ollama_url}")
        print("\n✅ Ready to analyze images!")
        print("\nUsage:")
        print("  result = await handler.analyze_ui_screenshot('path/to/screenshot.png')")
        print("  result = await handler.debug_error_screenshot('error.png')")
        print("  result = await handler.analyze_design_mockup('mockup.png')")
    
    asyncio.run(test_vision())


