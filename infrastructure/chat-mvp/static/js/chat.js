// TestPilot Chat MVP - WebSocket Client
// Techy dark theme with GitHub/databoxy aesthetic

class TestPilotChat {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.messageContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.wsStatus = document.getElementById('wsStatus');
        this.apiStatus = document.getElementById('apiStatus');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.connectWebSocket();
        this.updateStatus();
    }
    
    setupEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize input
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });
        
        // Focus input on load
        this.messageInput.focus();
    }
    
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('🚀 WebSocket connected');
                this.isConnected = true;
                this.updateConnectionStatus('connected');
                this.wsStatus.textContent = 'connected';
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('❌ WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.wsStatus.textContent = 'disconnected';
                
                // Attempt to reconnect after 3 seconds
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.connectWebSocket();
                    }
                }, 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('error');
            };
            
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.updateConnectionStatus('error');
        }
    }
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.isConnected) return;
        
        // Add user message to UI immediately
        this.addMessage('user', message, 'You');
        
        // Clear input
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        // Send to server
        this.ws.send(JSON.stringify({
            type: 'message',
            content: message,
            timestamp: new Date().toISOString()
        }));
        
        // Show typing indicator
        this.showTypingIndicator();
    }
    
    handleMessage(data) {
        this.hideTypingIndicator();
        
        if (data.type === 'message') {
            this.addMessage('assistant', data.content, 'Robbie');
        } else if (data.type === 'system') {
            this.addMessage('system', data.content, 'System');
        }
    }
    
    addMessage(type, content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        // Robbie avatar selection based on message content/mood
        let robbieAvatar = '/static/images/robbie-happy-1.png'; // default
        if (content.toLowerCase().includes('deal') || content.toLowerCase().includes('revenue')) {
            robbieAvatar = '/static/images/robbie-content-1.png'; // satisfied
        } else if (content.toLowerCase().includes('error') || content.toLowerCase().includes('problem')) {
            robbieAvatar = '/static/images/robbie-surprised-1.png'; // surprised
        } else if (content.toLowerCase().includes('think') || content.toLowerCase().includes('consider')) {
            robbieAvatar = '/static/images/robbie-thoughtful-1.png'; // thinking
        }
        
        const avatarContent = sender === 'Robbie' 
            ? `<img src="${robbieAvatar}" alt="Robbie" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` 
            : sender === 'You' 
                ? 'A' 
                : 'S';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${avatarContent}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${sender}</span>
                    <span class="message-timestamp">${timestamp}</span>
                </div>
                <div class="message-text">${this.formatMessage(content)}</div>
            </div>
        `;
        
        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatMessage(content) {
        // Convert markdown-style formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '• ');
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <img src="/static/images/robbie-thoughtful-1.png" alt="Robbie" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">Robbie</span>
                    <span class="message-timestamp">typing...</span>
                </div>
                <div class="message-text">
                    <div class="loading"></div>
                </div>
            </div>
        `;
        
        this.messageContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    updateConnectionStatus(status) {
        const statusDot = this.connectionStatus.querySelector('.status-dot');
        const statusText = this.connectionStatus.querySelector('span');
        
        switch (status) {
            case 'connected':
                statusDot.style.background = 'var(--accent-green)';
                statusText.textContent = 'Connected';
                this.connectionStatus.className = 'status-indicator connected';
                break;
            case 'disconnected':
                statusDot.style.background = 'var(--accent-orange)';
                statusText.textContent = 'Disconnected';
                this.connectionStatus.className = 'status-indicator';
                break;
            case 'error':
                statusDot.style.background = 'var(--accent-red)';
                statusText.textContent = 'Error';
                this.connectionStatus.className = 'status-indicator';
                break;
            default:
                statusDot.style.background = 'var(--accent-orange)';
                statusText.textContent = 'Connecting...';
                this.connectionStatus.className = 'status-indicator';
        }
    }
    
    updateStatus() {
        // Update API status
        fetch('/api/status')
            .then(response => response.json())
            .then(data => {
                this.apiStatus.textContent = data.status === 'online' ? 'Ready' : 'Error';
            })
            .catch(error => {
                console.error('API status check failed:', error);
                this.apiStatus.textContent = 'Error';
            });
    }
    
    scrollToBottom() {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }
    
    // Business context helpers
    getDealPipeline() {
        return [
            { name: "PepsiCo Clean Label", value: "$485K", probability: "78%" },
            { name: "Wondercide Extension", value: "$125K", probability: "90%" },
            { name: "FreshBrand Discovery", value: "$125K", probability: "45%" }
        ];
    }
    
    getPriorityTasks() {
        return [
            "Close PepsiCo deal by EOW",
            "Prepare Wondercide presentation",
            "Follow up on FreshBrand discovery call"
        ];
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 TestPilot Chat MVP initializing...');
    window.chat = new TestPilotChat();
    
    // Add some demo functionality
    console.log('💡 Demo features available:');
    console.log('  - Real-time WebSocket chat');
    console.log('  - Business context integration');
    console.log('  - Techy dark theme');
    console.log('  - Responsive design');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 Page hidden - maintaining connection');
    } else {
        console.log('📱 Page visible - checking connection');
        if (window.chat && !window.chat.isConnected) {
            window.chat.connectWebSocket();
        }
    }
});

// Handle beforeunload
window.addEventListener('beforeunload', () => {
    if (window.chat && window.chat.ws) {
        window.chat.ws.close();
    }
});



