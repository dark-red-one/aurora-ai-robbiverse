"""
Intelligent Model Router for Robbie
Routes requests to the optimal model based on task complexity and type
"""
import re
from typing import Dict, Optional, Tuple
from enum import Enum

class ModelType(Enum):
    """Available Robbie model types"""
    FAST = "robbie:fast"          # qwen2.5-coder:7b - Quick responses
    SMART = "robbie:smart"        # qwen2.5-coder:32k - Deep analysis
    VISION = "robbie:vision"      # llama3.2-vision:11b - Image analysis

class ModelRouter:
    """
    Smart routing logic to select the best model for each task
    
    Revenue Impact:
    - Fast model for quick questions → Better demo experience
    - Smart model for complex analysis → Better solutions
    - Vision model for UI review → Ship polished products
    """
    
    def __init__(self):
        # Routing thresholds
        self.short_message_threshold = 100  # chars
        self.complex_message_threshold = 500  # chars
        
        # Keywords that trigger specific models
        self.vision_keywords = [
            'screenshot', 'image', 'picture', 'see this', 'look at',
            'ui', 'design', 'visual', 'mockup', 'diagram', 'chart'
        ]
        
        self.complex_keywords = [
            'architecture', 'refactor', 'optimize', 'analyze',
            'debug complex', 'entire codebase', 'system design',
            'migration', 'performance review', 'security audit'
        ]
        
        # Code indicators that need deep analysis
        self.code_patterns = [
            r'```[\s\S]{500,}```',  # Large code blocks
            r'class\s+\w+.*:\s*\n(?:\s+.*\n){10,}',  # Large classes
            r'def\s+\w+.*:\s*\n(?:\s+.*\n){10,}',    # Large functions
        ]
    
    def route(
        self,
        message: str,
        context: Optional[Dict] = None,
        has_image: bool = False,
        user_preference: Optional[str] = None
    ) -> Tuple[ModelType, str]:
        """
        Route request to optimal model
        
        Args:
            message: User's message text
            context: Optional context dict with metadata
            has_image: Whether request includes an image
            user_preference: Optional explicit model preference
            
        Returns:
            Tuple of (ModelType, reasoning)
        """
        # Explicit user preference overrides
        if user_preference:
            if 'fast' in user_preference.lower():
                return ModelType.FAST, "User requested fast model"
            elif 'smart' in user_preference.lower():
                return ModelType.SMART, "User requested smart model"
            elif 'vision' in user_preference.lower():
                return ModelType.VISION, "User requested vision model"
        
        # Image detection → Vision model
        if has_image or self._has_vision_keywords(message):
            return ModelType.VISION, "Request includes image or visual analysis"
        
        # Complex task detection → Smart model
        if self._is_complex_task(message, context):
            return ModelType.SMART, "Complex task requiring deep analysis"
        
        # Default: Fast model for quick responses
        return ModelType.FAST, "Quick query suitable for fast model"
    
    def _has_vision_keywords(self, message: str) -> bool:
        """Check if message contains vision-related keywords"""
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in self.vision_keywords)
    
    def _is_complex_task(self, message: str, context: Optional[Dict]) -> bool:
        """Determine if task requires smart model's larger context"""
        
        # Long messages need smart model
        if len(message) > self.complex_message_threshold:
            return True
        
        # Complex keywords detected
        message_lower = message.lower()
        if any(keyword in message_lower for keyword in self.complex_keywords):
            return True
        
        # Large code blocks detected
        for pattern in self.code_patterns:
            if re.search(pattern, message, re.MULTILINE):
                return True
        
        # Context indicates complexity
        if context:
            # Multiple files being analyzed
            if context.get('file_count', 0) > 3:
                return True
            
            # Large file being analyzed
            if context.get('file_size', 0) > 1000:  # lines
                return True
            
            # Conversation history is long (need to remember more)
            if context.get('conversation_length', 0) > 10:
                return True
        
        return False
    
    def get_model_config(self, model_type: ModelType) -> Dict:
        """Get configuration for specific model type"""
        configs = {
            ModelType.FAST: {
                "model": "qwen2.5-coder:7b",
                "temperature": 0.7,
                "num_ctx": 8192,
                "top_p": 0.9,
                "description": "Fast 7B model for quick responses"
            },
            ModelType.SMART: {
                "model": "qwen2.5-coder:32k",
                "temperature": 0.7,
                "num_ctx": 32768,
                "top_p": 0.9,
                "description": "Smart 32k context model for deep analysis"
            },
            ModelType.VISION: {
                "model": "llama3.2-vision:11b",
                "temperature": 0.6,
                "num_ctx": 8192,
                "top_p": 0.85,
                "description": "Vision model for image analysis"
            }
        }
        return configs[model_type]
    
    def explain_routing(
        self,
        message: str,
        selected_model: ModelType,
        reasoning: str
    ) -> str:
        """Generate explanation of routing decision (for debugging)"""
        config = self.get_model_config(selected_model)
        
        return f"""
🎯 Model Selection: {selected_model.value}
📝 Reasoning: {reasoning}
🔧 Config: {config['description']}
📊 Context Window: {config['num_ctx']} tokens
⚡ Temperature: {config['temperature']}
        """.strip()

# Global router instance
router = ModelRouter()

def route_message(
    message: str,
    context: Optional[Dict] = None,
    has_image: bool = False,
    user_preference: Optional[str] = None,
    explain: bool = False
) -> Dict:
    """
    Main routing function - use this everywhere
    
    Returns dict with:
    - model_type: ModelType enum
    - model_name: str (actual model name for Ollama)
    - config: dict (temperature, context, etc)
    - reasoning: str (why this model was chosen)
    - explanation: str (detailed explanation if explain=True)
    """
    model_type, reasoning = router.route(
        message=message,
        context=context,
        has_image=has_image,
        user_preference=user_preference
    )
    
    config = router.get_model_config(model_type)
    
    result = {
        "model_type": model_type,
        "model_name": config["model"],
        "config": config,
        "reasoning": reasoning
    }
    
    if explain:
        result["explanation"] = router.explain_routing(message, model_type, reasoning)
    
    return result


# Example usage and tests
if __name__ == "__main__":
    # Test routing logic
    test_cases = [
        ("Hey Robbie, what's 2+2?", None, False),
        ("Can you analyze this entire codebase architecture and suggest improvements?", None, False),
        ("What's wrong with this UI screenshot?", None, True),
        ("Refactor these 500 lines of code", {"file_size": 500}, False),
        ("Quick question about Python", None, False),
    ]
    
    print("🧪 Model Router Test Cases\n")
    for message, context, has_image in test_cases:
        result = route_message(message, context, has_image, explain=True)
        print(f"Message: {message[:60]}...")
        print(result["explanation"])
        print("-" * 60)


