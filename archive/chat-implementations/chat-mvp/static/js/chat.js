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
        if (data.type === 'chunk') {
            // Streaming: add chunk to current message
            this.appendToStreamingMessage(data.content);
        } else if (data.type === 'stream_complete') {
            // Streaming complete
            this.finalizeStreamingMessage();
        } else if (data.type === 'message') {
            // Full message (fallback)
            this.hideTypingIndicator();
            this.addMessage('assistant', data.content, 'Robbie');
        } else if (data.type === 'system') {
            this.hideTypingIndicator();
            this.addMessage('system', data.content, 'System');
        }
    }

    appendToStreamingMessage(chunk) {
        let streamingMsg = document.getElementById('streaming-message');

        if (!streamingMsg) {
            // First chunk - create streaming message and hide typing indicator
            this.hideTypingIndicator();

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message assistant';
            messageDiv.id = 'streaming-message';

            const timestamp = new Date().toLocaleTimeString();
            const robbieAvatar = '/static/images/robbie-focused.png'; // Start focused during streaming

            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <img src="${robbieAvatar}" alt="Robbie" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">Robbie</span>
                        <span class="message-timestamp">${timestamp}</span>
                    </div>
                    <div class="message-text" id="streaming-text"></div>
                </div>
            `;

            this.messageContainer.appendChild(messageDiv);
            streamingMsg = messageDiv;
        }

        // Append chunk to streaming text
        const streamingText = document.getElementById('streaming-text');
        if (streamingText) {
            streamingText.textContent += chunk;
            this.scrollToBottom();
        }
    }

    finalizeStreamingMessage() {
        const streamingMsg = document.getElementById('streaming-message');
        if (streamingMsg) {
            // Update avatar based on final content - THE 6 MOODS
            const streamingText = document.getElementById('streaming-text');
            const content = streamingText ? streamingText.textContent : '';
            const lowerContent = content.toLowerCase();

            // Default is FRIENDLY (~60% of responses)
            let robbieAvatar = '/static/images/robbie-friendly.png';

            // Bossy - direct commands, instructions, "do this"
            if (lowerContent.includes('need to') || lowerContent.includes('must ') || lowerContent.includes('should ') ||
                lowerContent.includes('you have to') || lowerContent.includes('get this done')) {
                robbieAvatar = '/static/images/robbie-bossy.png';
            }
            // Playful - fun, jokes, lighthearted
            else if (lowerContent.includes('haha') || lowerContent.includes('lol') || lowerContent.includes('fun') ||
                lowerContent.includes('play') || lowerContent.includes('silly')) {
                robbieAvatar = '/static/images/robbie-playful.png';
            }
            // Blushing - compliments, thanks, appreciation
            else if (lowerContent.includes('thank') || lowerContent.includes('appreciate') || lowerContent.includes('love you') ||
                lowerContent.includes('you\'re amazing') || lowerContent.includes('brilliant')) {
                robbieAvatar = '/static/images/robbie-blushing.png';
            }
            // Surprised - errors, unexpected, problems
            else if (lowerContent.includes('error') || lowerContent.includes('problem') || lowerContent.includes('down') ||
                lowerContent.includes('failed') || lowerContent.includes('issue')) {
                robbieAvatar = '/static/images/robbie-surprised.png';
            }
            // Focused - working, analyzing, strategic
            else if (lowerContent.includes('analyzing') || lowerContent.includes('working on') || lowerContent.includes('reviewing') ||
                lowerContent.includes('let me check')) {
                robbieAvatar = '/static/images/robbie-focused.png';
            }
            // Friendly is default (most common ~60%)

            // Update avatar
            const avatarImg = streamingMsg.querySelector('.message-avatar img');
            if (avatarImg) {
                avatarImg.src = robbieAvatar;
            }

            // Format the final message
            if (streamingText) {
                streamingText.innerHTML = this.formatMessage(content);
            }

            // Remove streaming ID
            streamingMsg.removeAttribute('id');
            document.getElementById('streaming-text')?.removeAttribute('id');
        }
    }

    addMessage(type, content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const timestamp = new Date().toLocaleTimeString();

        // THE 6 MOODS - Default is Friendly (~60%)
        const lowerContent = content.toLowerCase();
        let robbieAvatar = '/static/images/robbie-friendly.png'; // default

        if (lowerContent.includes('need to') || lowerContent.includes('must ') || lowerContent.includes('should ')) {
            robbieAvatar = '/static/images/robbie-bossy.png';
        } else if (lowerContent.includes('haha') || lowerContent.includes('fun') || lowerContent.includes('play')) {
            robbieAvatar = '/static/images/robbie-playful.png';
        } else if (lowerContent.includes('thank') || lowerContent.includes('appreciate') || lowerContent.includes('love you')) {
            robbieAvatar = '/static/images/robbie-blushing.png';
        } else if (lowerContent.includes('error') || lowerContent.includes('problem') || lowerContent.includes('down')) {
            robbieAvatar = '/static/images/robbie-surprised.png';
        } else if (lowerContent.includes('analyzing') || lowerContent.includes('working on') || lowerContent.includes('reviewing')) {
            robbieAvatar = '/static/images/robbie-focused.png';
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
                <img src="/static/images/robbie-focused.png" alt="Robbie" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
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



