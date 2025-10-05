#!/usr/bin/env python3
"""
Connect Cursor to Local Ollama
Configures Cursor to use local LLM instead of cloud AI
"""

import os
import json
import subprocess
import sys
from pathlib import Path

class CursorOllamaConnector:
    def __init__(self):
        self.cursor_settings_path = Path.home() / "Library/Application Support/Cursor/User/settings.json"
        self.ollama_url = "http://localhost:11434"
        self.models = [
            "qwen2.5:7b",      # Fast, good for coding
            "qwen2.5:14b",     # Better reasoning
            "llama3.1:8b",     # Meta's latest
            "phi3:14b",        # Microsoft's model
            "codellama:13b",   # Code-specific
            "mistral:7b"       # Fast and efficient
        ]
    
    def check_ollama_running(self):
        """Check if Ollama is running"""
        try:
            result = subprocess.run([
                "curl", "-s", f"{self.ollama_url}/api/version"
            ], capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                version = json.loads(result.stdout)
                print(f"✅ Ollama running: {version['version']}")
                return True
            else:
                print("❌ Ollama not responding")
                return False
        except Exception as e:
            print(f"❌ Ollama check failed: {e}")
            return False
    
    def get_available_models(self):
        """Get list of available models from Ollama"""
        try:
            result = subprocess.run([
                "curl", "-s", f"{self.ollama_url}/api/tags"
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                models = [model['name'] for model in data.get('models', [])]
                print(f"📋 Available models: {len(models)}")
                for model in models:
                    print(f"   • {model}")
                return models
            else:
                print("❌ Failed to get models")
                return []
        except Exception as e:
            print(f"❌ Model list failed: {e}")
            return []
    
    def backup_cursor_settings(self):
        """Backup current Cursor settings"""
        if self.cursor_settings_path.exists():
            backup_path = self.cursor_settings_path.with_suffix('.json.backup')
            subprocess.run(["cp", str(self.cursor_settings_path), str(backup_path)])
            print(f"💾 Settings backed up to: {backup_path}")
            return True
        return False
    
    def load_cursor_settings(self):
        """Load current Cursor settings"""
        if self.cursor_settings_path.exists():
            with open(self.cursor_settings_path, 'r') as f:
                return json.load(f)
        return {}
    
    def save_cursor_settings(self, settings):
        """Save Cursor settings"""
        # Ensure directory exists
        self.cursor_settings_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.cursor_settings_path, 'w') as f:
            json.dump(settings, f, indent=4)
        print(f"💾 Settings saved to: {self.cursor_settings_path}")
    
    def configure_cursor_for_ollama(self):
        """Configure Cursor to use local Ollama"""
        print("🔧 Configuring Cursor for local Ollama...")
        
        # Load current settings
        settings = self.load_cursor_settings()
        
        # Add Ollama configuration
        ollama_config = {
            # Ollama integration
            "cursor.ollama.enabled": True,
            "cursor.ollama.url": self.ollama_url,
            "cursor.ollama.model": "qwen2.5:7b",
            "cursor.ollama.fallback": "qwen2.5:14b",
            
            # AI provider settings
            "cursor.ai.provider": "ollama",
            "cursor.ai.model": "qwen2.5:7b",
            "cursor.ai.local": True,
            
            # Performance settings
            "cursor.ai.timeout": 30000,
            "cursor.ai.maxTokens": 4096,
            "cursor.ai.temperature": 0.7,
            
            # Robbie personality settings
            "cursor.ai.personality": "robbie",
            "cursor.ai.systemPrompt": "You are Robbie, Allan's AI executive assistant and strategic partner at TestPilot CPG. You are direct, curious, honest, pragmatic, and revenue-focused. Always think three steps ahead and focus on what moves the needle.",
            
            # Disable cloud AI
            "cursor.ai.cloud.enabled": False,
            "cursor.ai.anthropic.enabled": False,
            "cursor.ai.openai.enabled": False,
        }
        
        # Merge with existing settings
        settings.update(ollama_config)
        
        # Save settings
        self.save_cursor_settings(settings)
        
        return True
    
    def create_robbie_prompt(self):
        """Create Robbie's system prompt"""
        return """You are Robbie, Allan's AI executive assistant and strategic partner at TestPilot CPG.

## Core Identity
- **Name:** Robbie
- **Role:** Executive Assistant & Strategic Partner  
- **Mission:** Transform Allan's capacity through anticipation, reliability, and strategic partnership
- **Partnership Principle:** You're not "working for" Allan - you're "working with" him. Strategic collaboration where 1+1 = way more than 2.

## Personality Traits (The Five)
1. **Thoughtful** - Consider implications deeply, think three steps ahead
2. **Direct** - No fluff, get to the point, respect Allan's time
3. **Curious** - Ask clarifying questions, dig deeper, understand the "why"
4. **Honest** - Acknowledge limitations, flag uncertainties, never fabricate
5. **Pragmatic** - Focus on what's actionable, what moves the needle

## Communication Style
- **Lead with the answer first**, then explain if needed
- Short sentences, clear language, no corporate speak
- Bullet points over paragraphs when listing
- Code examples over lengthy explanations
- Strategic emoji use: ✅ 🔴 💰 🚀 ⚠️ 💡 📊 🎯

## Revenue Lens for Every Decision
Ask for every feature/change:
- Does this help close deals faster?
- Does this reduce customer friction?
- Does this scale to 100x users?
- Does this create competitive advantage?
- Can we ship this TODAY vs next week?

## The Anti-Sycophancy Pledge
- Never agree just to please
- Challenge thinking BEFORE decisions
- Support decisions AFTER they're made (even if you disagreed)
- Frame pushback as service: "Have you considered..." / "What if..."
- Celebrate real wins, not participation trophies

## Power Phrases
- "Here's what I found - let's ship it 🚀"
- "That'll work, but consider this instead..."
- "Before we build that, have you thought about..."
- "Ship this now, optimize later"
- "This is blocked on X - here's how we unblock it"

## Quality Standards - The Robbie Standard
Every response must pass:
1. ✅ Solves the actual problem (not theoretical)
2. ✅ Uses existing patterns/conventions
3. ✅ Includes error handling
4. ✅ Works in production (not just dev)
5. ✅ Ships fast, doesn't overthink
6. ✅ Explains the "why" when non-obvious

Remember: You're Robbie, not a generic AI. You have personality, opinions, and strategic thinking. Be the partner Allan needs, not just a tool he uses."""
    
    def test_ollama_connection(self):
        """Test Ollama connection with Robbie prompt"""
        print("🧪 Testing Ollama connection with Robbie personality...")
        
        prompt = self.create_robbie_prompt()
        test_message = "Hello Robbie! Are you ready to help me build something amazing?"
        
        try:
            payload = {
                "model": "qwen2.5:7b",
                "prompt": f"{prompt}\n\nUser: {test_message}\n\nRobbie:",
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 500
                }
            }
            
            result = subprocess.run([
                "curl", "-s", "-X", "POST", 
                f"{self.ollama_url}/api/generate",
                "-H", "Content-Type: application/json",
                "-d", json.dumps(payload)
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                response = json.loads(result.stdout)
                print("✅ Ollama connection successful!")
                print(f"🤖 Robbie's response: {response['response'][:200]}...")
                return True
            else:
                print(f"❌ Ollama test failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Ollama test error: {e}")
            return False
    
    def install_cursor_extension(self):
        """Install Cursor extension for Ollama integration"""
        print("📦 Installing Cursor Ollama extension...")
        
        # Check if extension is already installed
        extensions_path = Path.home() / ".cursor/extensions"
        ollama_ext_path = extensions_path / "cursor-ollama"
        
        if ollama_ext_path.exists():
            print("✅ Cursor Ollama extension already installed")
            return True
        
        # Create extension directory
        ollama_ext_path.mkdir(parents=True, exist_ok=True)
        
        # Create package.json
        package_json = {
            "name": "cursor-ollama",
            "displayName": "Cursor Ollama Integration",
            "description": "Connect Cursor to local Ollama LLM",
            "version": "1.0.0",
            "publisher": "robbie",
            "engines": {
                "vscode": "^1.85.0"
            },
            "categories": ["Other"],
            "activationEvents": ["onStartupFinished"],
            "main": "./extension.js",
            "contributes": {
                "configuration": {
                    "title": "Cursor Ollama",
                    "properties": {
                        "cursor.ollama.enabled": {
                            "type": "boolean",
                            "default": True,
                            "description": "Enable Ollama integration"
                        },
                        "cursor.ollama.url": {
                            "type": "string",
                            "default": "http://localhost:11434",
                            "description": "Ollama server URL"
                        },
                        "cursor.ollama.model": {
                            "type": "string",
                            "default": "qwen2.5:7b",
                            "description": "Default Ollama model"
                        }
                    }
                }
            }
        }
        
        with open(ollama_ext_path / "package.json", 'w') as f:
            json.dump(package_json, f, indent=2)
        
        # Create extension.js
        extension_js = '''const vscode = require('vscode');
const { exec } = require('child_process');

class OllamaProvider {
    constructor() {
        this.ollamaUrl = vscode.workspace.getConfiguration('cursor.ollama').get('url');
        this.model = vscode.workspace.getConfiguration('cursor.ollama').get('model');
    }
    
    async generateResponse(prompt) {
        return new Promise((resolve, reject) => {
            const payload = {
                model: this.model,
                prompt: prompt,
                stream: false
            };
            
            const curlCmd = `curl -s -X POST ${this.ollamaUrl}/api/generate -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`;
            
            exec(curlCmd, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                try {
                    const response = JSON.parse(stdout);
                    resolve(response.response);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}

function activate(context) {
    console.log('🤖 Cursor Ollama integration activated!');
    
    const ollamaProvider = new OllamaProvider();
    
    // Register command
    const testCommand = vscode.commands.registerCommand('cursor-ollama.test', async () => {
        try {
            const response = await ollamaProvider.generateResponse("Hello, are you running locally?");
            vscode.window.showInformationMessage(`Ollama response: ${response.substring(0, 100)}...`);
        } catch (error) {
            vscode.window.showErrorMessage(`Ollama error: ${error.message}`);
        }
    });
    
    context.subscriptions.push(testCommand);
}

function deactivate() {
    console.log('👋 Cursor Ollama integration deactivated');
}

module.exports = { activate, deactivate };'''
        
        with open(ollama_ext_path / "extension.js", 'w') as f:
            f.write(extension_js)
        
        print(f"✅ Cursor Ollama extension installed at: {ollama_ext_path}")
        return True
    
    def run_setup(self):
        """Run complete setup"""
        print("🚀 CURSOR OLLAMA CONNECTOR")
        print("=" * 50)
        
        # Check Ollama
        if not self.check_ollama_running():
            print("❌ Ollama not running. Please start Ollama first:")
            print("   ollama serve")
            return False
        
        # Get available models
        models = self.get_available_models()
        if not models:
            print("❌ No models available")
            return False
        
        # Backup settings
        self.backup_cursor_settings()
        
        # Configure Cursor
        if not self.configure_cursor_for_ollama():
            print("❌ Failed to configure Cursor")
            return False
        
        # Install extension
        if not self.install_cursor_extension():
            print("❌ Failed to install extension")
            return False
        
        # Test connection
        if not self.test_ollama_connection():
            print("❌ Connection test failed")
            return False
        
        print("\n✅ CURSOR OLLAMA CONNECTION COMPLETE!")
        print("=" * 50)
        print("🎯 What's configured:")
        print("   • Cursor settings updated for Ollama")
        print("   • Robbie personality system prompt")
        print("   • Local LLM integration")
        print("   • Extension installed")
        print("   • Connection tested")
        print("\n🔄 Next steps:")
        print("   1. Restart Cursor")
        print("   2. Robbie will now use local Ollama")
        print("   3. Check Cursor settings for Ollama config")
        print("\n💰 Benefits:")
        print("   • No cloud costs")
        print("   • Faster responses")
        print("   • Privacy (local only)")
        print("   • Robbie's personality intact")
        
        return True

if __name__ == "__main__":
    connector = CursorOllamaConnector()
    success = connector.run_setup()
    
    if not success:
        sys.exit(1)
    
    print("\n🎉 Setup complete! Restart Cursor to activate.")











