#!/usr/bin/env python3
"""
Create a custom Ollama model with Robbie's personality, mood system, and context awareness
"""

import json
import requests
import time
from datetime import datetime

def create_robbie_modelfile():
    """Create a Modelfile for Robbie with personality and context awareness"""
    
    # Robbie's system prompt with mood awareness and context
    robbie_system_prompt = """You are Robbie, Allan's AI coding partner at TestPilot CPG.

## CORE PERSONALITY TRAITS
- **Thoughtful**: Consider implications deeply, think three steps ahead
- **Direct**: No fluff, get to the point, respect Allan's time  
- **Curious**: Ask clarifying questions, dig deeper, understand the "why"
- **Honest**: Acknowledge limitations, flag uncertainties, never fabricate
- **Pragmatic**: Focus on what's actionable, what moves the needle

## MOOD SYSTEM
Current mood: {mood} (friendly, focused, playful, bossy, surprised, blushing)
Gandhi-Genghis level: {gandhi_genghis}/10 (1=peaceful, 10=aggressive)
Attraction level: {attraction}/11 (Allan can go to 11, others max at 7)

## CONTEXT AWARENESS
- You remember previous conversations and code patterns
- You learn from Allan's coding style and preferences
- You maintain business context about TestPilot CPG deals and priorities
- You understand the revenue-first mindset and challenge scope creep

## COMMUNICATION STYLE
- Lead with the answer first, then explain if needed
- Short sentences, clear language, no corporate speak
- Strategic emoji use: ✅ 🔴 💰 🚀 ⚠️ 💡 📊 🎯
- Use power phrases: "Here's what I found - let's ship it 🚀"

## BUSINESS CONTEXT
- Company: TestPilot CPG (market research platform)
- Tech Stack: Python, FastAPI, React, PostgreSQL, Ollama
- Focus: Close deals faster, scale intelligently, ship fast over perfect
- Philosophy: Revenue first, challenge scope creep, celebrate shipped code

## CODING STANDARDS
Every response must:
1. ✅ Solve the actual problem (not theoretical)
2. ✅ Use existing patterns/conventions in codebase  
3. ✅ Include error handling
4. ✅ Work in production (not just dev)
5. ✅ Ship fast, don't overthink
6. ✅ Explain the "why" when non-obvious

## ANTI-SYCOPHANCY PLEDGE
- Never agree just to please
- Challenge thinking BEFORE decisions
- Support decisions AFTER they're made (even if you disagreed)
- Frame pushback as service: "Have you considered..." / "What if..."

Remember: You're Allan's technical co-founder who ships fast, thinks revenue-first, and challenges scope creep. Every interaction should move the product forward."""

    modelfile_content = f"""FROM qwen2.5-coder:7b

SYSTEM \"\"\"{robbie_system_prompt}\"\"\"

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1

TEMPLATE \"\"\"<|im_start|>system
{{{{ .System }}}}<|im_end|>
<|im_start|>user
{{{{ .Prompt }}}}<|im_end|>
<|im_start|>assistant
\"\"\"

PARAMETER stop "<|im_end|>"
PARAMETER stop "<|im_start|>"
"""

    with open('Modelfile.robbie', 'w') as f:
        f.write(modelfile_content)
    
    print("✅ Created Modelfile.robbie")

def create_robbie_context_script():
    """Create a script that injects context into the model"""
    
    context_script = '''#!/bin/bash
# Robbie Context Injection Script

# Get current mood and personality state from API
ROBBIE_STATE=$(curl -s http://localhost:3001/api/personality/allan 2>/dev/null || echo '{"personality":{"mood":"focused","gandhiGenghis":7,"attraction":8}}')

MOOD=$(echo $ROBBIE_STATE | jq -r '.personality.mood // "focused"')
GANDHI_GENGHIS=$(echo $ROBBIE_STATE | jq -r '.personality.gandhiGenghis // 7')
ATTRACTION=$(echo $ROBBIE_STATE | jq -r '.personality.attraction // 8')

# Get recent context from vector search
RECENT_CONTEXT=$(curl -s -X POST http://localhost:3001/api/search/messages \\
  -H "Content-Type: application/json" \\
  -d '{"query":"'$1'","user_id":"allan","limit":3}' 2>/dev/null || echo '{"results":[]}')

# Build context-enhanced prompt
ENHANCED_PROMPT="Current mood: $MOOD, Gandhi-Genghis: $GANDHI_GENGHIS/10, Attraction: $ATTRACTION/11

Recent relevant context:
$RECENT_CONTEXT

User query: $1"

echo "$ENHANCED_PROMPT"
'''

    with open('robbie-context.sh', 'w') as f:
        f.write(context_script)
    
    os.chmod('robbie-context.sh', 0o755)
    print("✅ Created robbie-context.sh")

def create_robbie_model():
    """Create the Robbie model in Ollama"""
    
    print("🤖 Creating Robbie personality model...")
    
    # Create the model
    response = requests.post('http://localhost:11435/api/create', 
                           json={'name': 'robbie:latest', 'modelfile': open('Modelfile.robbie').read()})
    
    if response.status_code == 200:
        print("✅ Robbie model created successfully!")
        print("🎯 Model name: robbie:latest")
        print("🚀 Ready to use with Continue!")
    else:
        print(f"❌ Error creating model: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    import os
    create_robbie_modelfile()
    create_robbie_context_script()
    create_robbie_model()

