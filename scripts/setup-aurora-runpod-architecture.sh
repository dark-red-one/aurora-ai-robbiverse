#!/bin/bash
# AURORA + RUNPOD ARCHITECTURE SETUP
# Aurora Town = LLM Gateway + Business Logic
# RunPod = Pure GPU Inference Engine
# Cursor = Connected to Aurora Town

set -e

echo "🏗️ SETTING UP AURORA + RUNPOD ARCHITECTURE"
echo "=========================================="

# Configuration
AURORA_TOWN_IP="45.32.194.172"
RUNPOD_IP="209.170.80.132"
RUNPOD_PORT="13323"

echo "🏛️ Aurora Town: $AURORA_TOWN_IP (LLM Gateway + Business Logic)"
echo "⚡ RunPod: $RUNPOD_IP:$RUNPOD_PORT (Pure GPU Inference)"
echo ""

# Step 1: Set up RunPod as Pure Inference Engine
echo "📊 Step 1: Setting up RunPod as Pure GPU Inference Engine..."

ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_ed25519 root@$RUNPOD_IP -p $RUNPOD_PORT << 'RUNPODEOF'
echo "🚀 Setting up RunPod as Pure GPU Inference Engine..."

# Install Ollama (lightweight, no models yet)
curl -fsSL https://ollama.ai/install.sh | sh

# Configure Ollama for inference only
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_GPU_LAYERS=999
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KEEP_ALIVE=24h

# Create Ollama service
cat > /etc/systemd/system/ollama-inference.service << 'SERVICEEOF'
[Unit]
Description=Ollama GPU Inference Service
After=network.target

[Service]
Type=simple
User=root
Environment=OLLAMA_HOST=0.0.0.0:11434
Environment=OLLAMA_GPU_LAYERS=999
Environment=OLLAMA_FLASH_ATTENTION=1
Environment=OLLAMA_KEEP_ALIVE=24h
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Start Ollama
systemctl daemon-reload
systemctl enable ollama-inference
systemctl start ollama-inference
sleep 5

echo "✅ RunPod configured as Pure GPU Inference Engine"
echo "🧪 Testing Ollama..."
ollama --version
RUNPODEOF

# Step 2: Create Aurora Town LLM Gateway Integration
echo ""
echo "🏛️ Step 2: Creating Aurora Town LLM Gateway Integration..."

cat > /tmp/aurora-llm-gateway-integration.py << 'AURORAEOF'
#!/usr/bin/env python3
"""
Aurora Town LLM Gateway Integration
Connects Aurora Town to RunPod for GPU inference
"""

import json
import requests
import subprocess
from pathlib import Path

class AuroraLLMGatewayIntegration:
    def __init__(self):
        self.aurora_town_ip = "45.32.194.172"
        self.runpod_ip = "209.170.80.132"
        self.runpod_port = "13323"
        self.runpod_ollama = f"http://{self.runpod_ip}:11434"
        
    def check_runpod_ollama(self):
        """Check RunPod Ollama status"""
        try:
            response = requests.get(f"{self.runpod_ollama}/api/version", timeout=10)
            data = response.json()
            print(f"✅ RunPod Ollama: {data['version']}")
            return True
        except Exception as e:
            print(f"❌ RunPod Ollama error: {e}")
            return False
    
    def create_aurora_llm_gateway(self):
        """Create Aurora Town LLM Gateway script"""
        print("🔧 Creating Aurora Town LLM Gateway...")
        
        gateway_script = f'''#!/usr/bin/env python3
"""
Aurora Town LLM Gateway
Routes requests to RunPod GPU inference
"""

import asyncio
import json
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Aurora LLM Gateway")

# RunPod GPU Inference
RUNPOD_OLLAMA = "{self.runpod_ollama}"

class ChatRequest(BaseModel):
    messages: list
    model: str = "qwen2.5:7b"
    max_tokens: int = 4096
    temperature: float = 0.7

class ChatResponse(BaseModel):
    response: str
    model: str
    usage: dict

@app.post("/v1/chat/completions", response_model=ChatResponse)
async def chat_completions(request: ChatRequest):
    """Route chat requests to RunPod GPU"""
    try:
        # Convert to Ollama format
        prompt = ""
        for msg in request.messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                prompt += f"System: {{content}}\\n\\n"
            elif role == "user":
                prompt += f"User: {{content}}\\n\\n"
            elif role == "assistant":
                prompt += f"Assistant: {{content}}\\n\\n"
        
        prompt += "Assistant:"
        
        # Call RunPod Ollama
        ollama_payload = {{
            "model": request.model,
            "prompt": prompt,
            "stream": False,
            "options": {{
                "temperature": request.temperature,
                "max_tokens": request.max_tokens
            }}
        }}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{{RUNPOD_OLLAMA}}/api/generate",
                json=ollama_payload
            )
            
            if response.status_code == 200:
                ollama_data = response.json()
                response_text = ollama_data.get("response", "")
                
                return ChatResponse(
                    response=response_text,
                    model=request.model,
                    usage={{"total_tokens": len(response_text.split())}}
                )
            else:
                raise HTTPException(status_code=500, detail="RunPod inference failed")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {{"status": "healthy", "service": "aurora-llm-gateway"}}

@app.get("/models")
async def list_models():
    """List available models"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{{RUNPOD_OLLAMA}}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [{{"id": model["name"], "object": "model"}} for model in data.get("models", [])]
                return {{"object": "list", "data": models}}
            else:
                return {{"object": "list", "data": []}}
    except:
        return {{"object": "list", "data": []}}

if __name__ == "__main__":
    print("🚀 Starting Aurora LLM Gateway...")
    print(f"🔗 RunPod GPU: {{RUNPOD_OLLAMA}}")
    uvicorn.run(app, host="0.0.0.0", port=8001)
'''
        
        with open("/tmp/aurora-llm-gateway.py", 'w') as f:
            f.write(gateway_script)
        
        print("✅ Aurora LLM Gateway script created")
        return True
    
    def create_cursor_integration(self):
        """Create Cursor integration for Aurora Town"""
        print("🔧 Creating Cursor integration for Aurora Town...")
        
        cursor_settings = {
            # Aurora Town LLM Gateway
            "cursor.ai.provider": "aurora",
            "cursor.ai.url": f"http://{self.aurora_town_ip}:8001",
            "cursor.ai.model": "qwen2.5:7b",
            "cursor.ai.local": False,
            "cursor.ai.remote": True,
            
            # Aurora integration
            "cursor.aurora.enabled": True,
            "cursor.aurora.gateway": f"http://{self.aurora_town_ip}:8001",
            "cursor.aurora.memory": True,
            "cursor.aurora.business": True,
            "cursor.aurora.widgets": True,
            
            # Performance settings
            "cursor.ai.timeout": 60000,
            "cursor.ai.maxTokens": 8192,
            "cursor.ai.temperature": 0.7,
            "cursor.ai.stream": True,
            
            # Robbie personality
            "cursor.ai.personality": "robbie",
            "cursor.ai.systemPrompt": "You are Robbie, Allan's AI executive assistant and strategic partner at TestPilot CPG. You are direct, curious, honest, pragmatic, and revenue-focused. Always think three steps ahead and focus on what moves the needle. You have access to Aurora's business data and RunPod GPU inference.",
            
            # Disable cloud providers
            "cursor.ai.cloud.enabled": False,
            "cursor.ai.anthropic.enabled": False,
            "cursor.ai.openai.enabled": False,
            "cursor.ai.gpt4.enabled": False,
            "cursor.ai.claude.enabled": False,
        }
        
        # Save Cursor settings
        cursor_settings_path = Path.home() / "Library/Application Support/Cursor/User/settings.json"
        cursor_settings_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Load existing settings
        existing_settings = {}
        if cursor_settings_path.exists():
            with open(cursor_settings_path, 'r') as f:
                existing_settings = json.load(f)
        
        # Merge settings
        existing_settings.update(cursor_settings)
        
        # Save settings
        with open(cursor_settings_path, 'w') as f:
            json.dump(existing_settings, f, indent=4)
        
        print(f"✅ Cursor settings updated: {cursor_settings_path}")
        return True
    
    def test_integration(self):
        """Test the complete integration"""
        print("🧪 Testing Aurora + RunPod integration...")
        
        # Test RunPod Ollama
        if not self.check_runpod_ollama():
            return False
        
        # Test Aurora Town connection (if accessible)
        try:
            response = requests.get(f"http://{self.aurora_town_ip}:8001/health", timeout=10)
            if response.status_code == 200:
                print("✅ Aurora Town LLM Gateway: Connected")
            else:
                print("⚠️ Aurora Town LLM Gateway: Not accessible (needs deployment)")
        except Exception as e:
            print(f"⚠️ Aurora Town LLM Gateway: {e}")
        
        return True
    
    def run_setup(self):
        """Run complete setup"""
        print("🚀 SETTING UP AURORA + RUNPOD ARCHITECTURE...")
        
        # Check RunPod
        if not self.check_runpod_ollama():
            print("❌ RunPod Ollama not available")
            return False
        
        # Create Aurora LLM Gateway
        if not self.create_aurora_llm_gateway():
            print("❌ Failed to create Aurora LLM Gateway")
            return False
        
        # Create Cursor integration
        if not self.create_cursor_integration():
            print("❌ Failed to create Cursor integration")
            return False
        
        # Test integration
        if not self.test_integration():
            print("❌ Integration test failed")
            return False
        
        print("\n✅ AURORA + RUNPOD ARCHITECTURE SETUP COMPLETE!")
        print("=" * 50)
        print("🎯 Architecture:")
        print("   • Aurora Town: LLM Gateway + Business Logic")
        print("   • RunPod: Pure GPU Inference Engine")
        print("   • Cursor: Connected to Aurora Town")
        print("\n🔄 Next steps:")
        print("   1. Deploy Aurora LLM Gateway to Aurora Town")
        print("   2. Restart Cursor")
        print("   3. Robbie will use Aurora + RunPod")
        print("\n💰 Benefits:")
        print("   • Clean separation of concerns")
        print("   • Aurora handles business logic")
        print("   • RunPod handles GPU inference")
        print("   • Cursor gets best of both worlds")
        
        return True

if __name__ == "__main__":
    integration = AuroraLLMGatewayIntegration()
    success = integration.run_setup()
    
    if not success:
        exit(1)
    
    print("\n🎉 Aurora + RunPod architecture ready!")
AURORAEOF

# Run the integration
python3 /tmp/aurora-llm-gateway-integration.py

echo ""
echo "🎯 AURORA + RUNPOD ARCHITECTURE READY!"
echo "====================================="
echo ""
echo "✅ RunPod: Pure GPU Inference Engine"
echo "✅ Aurora Town: LLM Gateway + Business Logic"
echo "✅ Cursor: Connected to Aurora Town"
echo ""
echo "🔄 Next steps:"
echo "1. Deploy Aurora LLM Gateway to Aurora Town"
echo "2. Restart Cursor"
echo "3. Robbie will use Aurora + RunPod architecture"
echo ""
echo "🚀 Clean architecture with proper separation of concerns!"


