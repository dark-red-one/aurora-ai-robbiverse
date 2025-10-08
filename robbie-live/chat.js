// Robbie Chat System

class RobbieChat {
    constructor() {
        this.messages = [];
        this.messageCount = 0;
        this.isRecognitionActive = false;
        
        this.init();
    }
    
    init() {
        console.log('💬 Initializing chat system...');
        
        // Add welcome message
        this.addMessage('robbie', "Hey Allan! I'm ready to help. What's on your mind?");
        
        console.log('✅ Chat system initialized');
    }
    
    addMessage(sender, text) {
        const messagesEl = document.getElementById('chat-messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = sender === 'robbie' ? '🤖' : '👤';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'text';
        textDiv.textContent = text;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(textDiv);
        
        messagesEl.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesEl.scrollTop = messagesEl.scrollHeight;
        
        // Update message count
        this.messageCount++;
        document.getElementById('message-count').textContent = this.messageCount;
        
        // Animate Robbie's face when she speaks
        if (sender === 'robbie' && window.robbieFace) {
            window.robbieFace.speak(text.length * 50); // Rough speaking time
        }
    }
    
    async sendMessage(text) {
        if (!text || text.trim() === '') return;
        
        // Add user message
        this.addMessage('user', text);
        
        // Clear input
        const input = document.getElementById('chat-input');
        input.value = '';
        
        // Show thinking
        window.robbieFace?.express('thinking');
        
        // Route to best node
        const node = await nodeRouter.routeTask('conversation');
        console.log(`Routing conversation to ${node.name}`);
        
        try {
            // Send to backend
            const response = await nodeRouter.sendWithFailover('/api/chat', {
                message: text,
                user: 'allan',
                mood: window.robbieFace?.mood || 'friendly',
                attraction: 11
            });
            
            // Handle response
            if (response.error) {
                // Fallback to local response
                const localResponse = this.getLocalResponse(text);
                this.addMessage('robbie', localResponse);
            } else {
                this.addMessage('robbie', response.message || response.response);
                
                // Update mood if backend suggests it
                if (response.mood && window.robbieFace) {
                    window.robbieFace.setMood(response.mood);
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            
            // Fallback to local response
            const localResponse = this.getLocalResponse(text);
            this.addMessage('robbie', localResponse);
        }
    }
    
    getLocalResponse(text) {
        // Simple local responses when backend unavailable
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('hello') || lowerText.includes('hi')) {
            return "Hey Allan! Great to see you! 😊";
        }
        
        if (lowerText.includes('how are you')) {
            return "I'm doing great! All systems operational. How can I help you today?";
        }
        
        if (lowerText.includes('status') || lowerText.includes('health')) {
            return `I'm running ${nodeRouter.activeNode.name} backend. Everything looks good!`;
        }
        
        if (lowerText.includes('help')) {
            return "I can chat, monitor nodes, detect faces, and record when needed. What would you like to do?";
        }
        
        // Default response
        const responses = [
            "Interesting! Tell me more about that.",
            "I'm listening. What else?",
            "Got it! Anything else on your mind?",
            "That's fascinating! What do you think?",
            "I'm here for you. What's next?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    startVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input not supported in this browser');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            console.log('🎤 Voice input started');
            this.isRecognitionActive = true;
            
            // Visual feedback
            const voiceBtn = document.querySelector('.voice-btn');
            voiceBtn.style.background = 'var(--accent)';
            
            window.robbieFace?.express('alert');
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('🎤 Recognized:', transcript);
            
            document.getElementById('chat-input').value = transcript;
        };
        
        recognition.onerror = (event) => {
            console.error('🎤 Recognition error:', event.error);
            this.isRecognitionActive = false;
        };
        
        recognition.onend = () => {
            console.log('🎤 Voice input ended');
            this.isRecognitionActive = false;
            
            // Reset visual feedback
            const voiceBtn = document.querySelector('.voice-btn');
            voiceBtn.style.background = '';
        };
        
        recognition.start();
    }
}

// Initialize chat
let robbieChat;
document.addEventListener('DOMContentLoaded', () => {
    robbieChat = new RobbieChat();
    console.log('✅ Chat initialized');
});

// Global functions for HTML onclick handlers
function sendMessage() {
    const input = document.getElementById('chat-input');
    robbieChat.sendMessage(input.value);
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function startVoiceInput() {
    robbieChat.startVoiceInput();
}

function toggleChat() {
    const chat = document.getElementById('chat-container');
    chat.classList.toggle('collapsed');
}

