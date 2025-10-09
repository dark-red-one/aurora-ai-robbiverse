#!/usr/bin/env python3
"""
Mock Ollama Service for Aurora Chat
Provides immediate chat functionality without requiring Ollama installation
"""

from flask import Flask, request, jsonify
import json
import time
import random

app = Flask(__name__)

# Mock responses for different personalities
MOCK_RESPONSES = {
    "robbie": [
        "Hey Allan! I'm here and ready to help you build this empire! 🚀",
        "I can see you're working on the Aurora chat system - let's get this working! 💡",
        "The frontend looks amazing! Now let's make sure the AI backend is solid. ✅",
        "I'm excited to be your strategic partner in this venture! What's our next move? 🎯",
        "Revenue first, everything else second. That's how we build something that matters! 💰"
    ],
    "allanbot": [
        "Based on my analysis, we should focus on the core functionality first.",
        "I recommend prioritizing the chat interface over advanced features.",
        "The technical debt is manageable - let's ship this iteration.",
        "From a business perspective, this has strong market potential.",
        "I'm confident this approach will yield positive ROI."
    ],
    "kristina": [
        "As a VA expert, I'd suggest streamlining the user experience first.",
        "Let me help you organize the workflow for maximum efficiency.",
        "I've seen this pattern before - we can definitely optimize this process.",
        "The client will appreciate the clean, professional interface.",
        "I'll make sure everything runs smoothly on the operational side."
    ],
    "marketing": [
        "This is going to be a game-changer for our marketing efforts!",
        "I can already see the viral potential of this chat interface.",
        "Let's position this as the premium AI copilot experience.",
        "The branding is on point - Robbie's personality really shines through.",
        "We're going to dominate the AI copilot market with this! 🎯"
    ],
    "tech": [
        "The architecture is solid - we're using the right tech stack.",
        "I can optimize the performance once we get the core working.",
        "The microservices approach will scale beautifully.",
        "Let me review the code and suggest some improvements.",
        "This is exactly the kind of innovative tech that changes everything."
    ]
}

@app.route('/api/generate', methods=['POST'])
def generate():
    """Mock Ollama generate endpoint"""
    try:
        data = request.get_json()
        model = data.get('model', 'qwen2.5:7b')
        prompt = data.get('prompt', '')
        
        # Extract personality from prompt or use default
        personality = 'robbie'
        for p in MOCK_RESPONSES.keys():
            if p.lower() in prompt.lower():
                personality = p
                break
        
        # Get a random response for the personality
        response_text = random.choice(MOCK_RESPONSES[personality])
        
        # Simulate some processing time
        time.sleep(0.5)
        
        return jsonify({
            "model": model,
            "created_at": int(time.time()),
            "response": response_text,
            "done": True
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tags', methods=['GET'])
def tags():
    """Mock Ollama tags endpoint"""
    return jsonify({
        "models": [
            {
                "name": "qwen2.5:7b",
                "modified_at": "2025-10-07T03:30:00.000Z",
                "size": 4294967296,
                "digest": "sha256:abc123...",
                "details": {
                    "parent_model": "",
                    "format": "gguf",
                    "family": "qwen",
                    "families": ["qwen"],
                    "parameter_size": "7B",
                    "quantization_level": "Q4_0"
                }
            }
        ]
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "mock-ollama"})

if __name__ == '__main__':
    print("🚀 Starting Mock Ollama Service on port 11434...")
    print("✅ This will make Aurora chat work immediately!")
    app.run(host='0.0.0.0', port=11434, debug=False)


