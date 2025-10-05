// Robbie Simple Chat - Tabbed Interface
// Just Robbie + 6 Moods + Chat/Notes/Comms tabs

class RobbieSimpleChat {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.currentMood = 'friendly';

        // 6 MOODS - THE CORRECT ONES
        this.moods = {
            friendly: { file: 'robbie-friendly.png', name: 'Friendly', percent: 60 },
            bossy: { file: 'robbie-bossy.png', name: 'Bossy', percent: 10 },
            playful: { file: 'robbie-playful.png', name: 'Playful', percent: 10 },
            blushing: { file: 'robbie-blushing.png', name: 'Blushing', percent: 5 },
            surprised: { file: 'robbie-surprised.png', name: 'Surprised', percent: 10 },
            focused: { file: 'robbie-focused.png', name: 'Focused', percent: 5 }
        };

        this.init();
    }

    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.loadMoodFromBackend();
    }

    setupEventListeners() {
        // Send message
        document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Mood control
        document.getElementById('moodControl').addEventListener('click', () => {
            this.cycleMood();
        });
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('✅ WebSocket connected');
            this.isConnected = true;
            this.updateConnectionStatus('connected');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('❌ WebSocket disconnected');
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('error');
        };
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message || !this.isConnected) return;

        // Add user message
        this.addMessage('user', message, 'You');
        input.value = '';

        // Send to server
        this.ws.send(JSON.stringify({
            type: 'message',
            content: message
        }));

        // Show typing indicator
        this.showTypingIndicator();
    }

    handleMessage(data) {
        if (data.type === 'chunk') {
            this.appendToStreamingMessage(data.content);
        } else if (data.type === 'stream_complete') {
            this.finalizeStreamingMessage();
        } else if (data.type === 'system') {
            this.hideTypingIndicator();
            this.addSystemMessage(data.content);
        }
    }

    appendToStreamingMessage(chunk) {
        let streamingMsg = document.getElementById('streaming-message');

        if (!streamingMsg) {
            this.hideTypingIndicator();

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message assistant';
            messageDiv.id = 'streaming-message';

            const timestamp = new Date().toLocaleTimeString();

            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <img src="/static/images/robbie-focused.png" alt="Robbie">
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">Robbie</span>
                        <span class="message-timestamp">${timestamp}</span>
                    </div>
                    <div class="message-text" id="streaming-text"></div>
                </div>
            `;

            document.getElementById('messagesContainer').appendChild(messageDiv);
            streamingMsg = messageDiv;
        }

        const streamingText = document.getElementById('streaming-text');
        if (streamingText) {
            streamingText.textContent += chunk;
            this.scrollToBottom();
        }
    }

    finalizeStreamingMessage() {
        const streamingMsg = document.getElementById('streaming-message');
        if (!streamingMsg) return;

        const streamingText = document.getElementById('streaming-text');
        const content = streamingText ? streamingText.textContent : '';

        // Detect mood from content
        const mood = this.detectMood(content);

        // Update avatar
        const avatarImg = streamingMsg.querySelector('.message-avatar img');
        if (avatarImg) {
            avatarImg.src = `/static/images/${this.moods[mood].file}`;
        }

        // Format message
        if (streamingText) {
            streamingText.innerHTML = this.formatMessage(content);
        }

        // Remove IDs
        streamingMsg.removeAttribute('id');
        streamingText.removeAttribute('id');

        this.scrollToBottom();
    }

    detectMood(content) {
        const lower = content.toLowerCase();

        if (lower.includes('need to') || lower.includes('must ') || lower.includes('should ') || lower.includes('have to')) {
            return 'bossy';
        } else if (lower.includes('haha') || lower.includes('fun') || lower.includes('play') || lower.includes('silly')) {
            return 'playful';
        } else if (lower.includes('thank') || lower.includes('appreciate') || lower.includes('love you') || lower.includes('brilliant')) {
            return 'blushing';
        } else if (lower.includes('error') || lower.includes('problem') || lower.includes('down') || lower.includes('failed')) {
            return 'surprised';
        } else if (lower.includes('analyzing') || lower.includes('working on') || lower.includes('reviewing') || lower.includes('let me check')) {
            return 'focused';
        }

        return 'friendly'; // Default ~60%
    }

    addMessage(type, content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const timestamp = new Date().toLocaleTimeString();
        const mood = type === 'assistant' ? this.detectMood(content) : null;
        const avatarSrc = mood ? `/static/images/${this.moods[mood].file}` : '/static/images/robbie-friendly.png';

        messageDiv.innerHTML = `
            ${type === 'assistant' ? `
                <div class="message-avatar">
                    <img src="${avatarSrc}" alt="Robbie">
                </div>
            ` : ''}
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${sender}</span>
                    <span class="message-timestamp">${timestamp}</span>
                </div>
                <div class="message-text">${this.formatMessage(content)}</div>
            </div>
        `;

        document.getElementById('messagesContainer').appendChild(messageDiv);
        this.scrollToBottom();
    }

    addSystemMessage(content) {
        const div = document.createElement('div');
        div.style.cssText = 'text-align:center;color:var(--text-muted);font-size:12px;margin:10px 0;';
        div.textContent = content;
        document.getElementById('messagesContainer').appendChild(div);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-indicator';
        typingDiv.id = 'typing-indicator';

        typingDiv.innerHTML = `
            <div class="message-avatar">
                <img src="/static/images/robbie-focused.png" alt="Robbie">
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">Robbie</span>
                    <span class="message-timestamp">typing...</span>
                </div>
                <div class="message-text"><div class="loading"></div></div>
            </div>
        `;

        document.getElementById('messagesContainer').appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    formatMessage(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }

    switchTab(tabName) {
        // Update tab UI
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
    }

    cycleMood() {
        const moodKeys = Object.keys(this.moods);
        const currentIndex = moodKeys.indexOf(this.currentMood);
        const nextIndex = (currentIndex + 1) % moodKeys.length;
        this.currentMood = moodKeys[nextIndex];

        // Update UI
        const moodData = this.moods[this.currentMood];
        document.getElementById('moodAvatar').src = `/static/images/${moodData.file}`;
        document.getElementById('moodText').textContent = moodData.name;

        // Save to backend
        this.saveMoodToBackend();
    }

    async loadMoodFromBackend() {
        try {
            const response = await fetch('/api/mood');
            const data = await response.json();
            // Map mood number to our 6 moods
            const moodMap = {
                1: 'friendly', 2: 'friendly', 3: 'friendly', 4: 'friendly',
                5: 'focused', 6: 'bossy', 7: 'bossy'
            };
            this.currentMood = moodMap[data.current_mood] || 'friendly';

            const moodData = this.moods[this.currentMood];
            document.getElementById('moodAvatar').src = `/static/images/${moodData.file}`;
            document.getElementById('moodText').textContent = moodData.name;
        } catch (e) {
            console.error('Failed to load mood:', e);
        }
    }

    async saveMoodToBackend() {
        try {
            await fetch('/api/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mood: this.getMoodNumber()
                })
            });
        } catch (e) {
            console.error('Failed to save mood:', e);
        }
    }

    getMoodNumber() {
        // Map moods to 1-7 scale
        const moodMap = {
            friendly: 3,
            focused: 5,
            bossy: 6,
            playful: 4,
            blushing: 2,
            surprised: 5
        };
        return moodMap[this.currentMood] || 3;
    }

    updateConnectionStatus(status) {
        const statusText = document.getElementById('connectionStatus');
        if (statusText) {
            statusText.textContent = status;
            statusText.style.color = status === 'connected' ? 'var(--accent-green)' : 'var(--accent-red)';
        }
    }
}

// Notes functions
function addNote() {
    const content = prompt('Enter your note:');
    if (content) {
        const notesList = document.getElementById('notesList');
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-item';
        noteDiv.innerHTML = `
            <div class="note-content">${content}</div>
            <div class="note-actions">
                <button onclick="editNote(this)">Edit</button>
                <button onclick="deleteNote(this)">Delete</button>
            </div>
        `;
        notesList.appendChild(noteDiv);
    }
}

function editNote(button) {
    const noteItem = button.closest('.note-item');
    const contentDiv = noteItem.querySelector('.note-content');
    const newContent = prompt('Edit your note:', contentDiv.textContent);
    if (newContent !== null) {
        contentDiv.textContent = newContent;
    }
}

function deleteNote(button) {
    if (confirm('Delete this note?')) {
        button.closest('.note-item').remove();
    }
}

// Comms functions
function filterComms(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // TODO: Implement filtering logic
    console.log('Filter:', filter);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🤖 Robbie Simple Chat initializing...');
    window.chat = new RobbieSimpleChat();

    // Weather status updates
    function updateWeather() {
        const temps = [65, 67, 68, 70, 72];
        const icons = ['☀️', '⛅', '🌤️'];
        const temp = temps[Math.floor(Math.random() * temps.length)];
        const icon = icons[Math.floor(Math.random() * icons.length)];

        const weatherIcon = document.querySelector('.weather-icon');
        const weatherTemp = document.getElementById('weather-temp');

        if (weatherIcon) weatherIcon.textContent = icon;
        if (weatherTemp) weatherTemp.textContent = `${temp}°F`;
    }

    // Update weather every 5 minutes
    updateWeather();
    setInterval(updateWeather, 300000);
});
