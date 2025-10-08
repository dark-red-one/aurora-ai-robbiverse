const { ipcRenderer } = require('electron');

// DOM elements
const moodEmoji = document.getElementById('moodEmoji');
const moodText = document.getElementById('moodText');
const moodGreeting = document.getElementById('moodGreeting');
const cpuPercent = document.getElementById('cpuPercent');
const memoryPercent = document.getElementById('memoryPercent');
const diskPercent = document.getElementById('diskPercent');
const statusDot = document.getElementById('statusDot');
const toggleTopBtn = document.getElementById('toggleTopBtn');
const closeBtn = document.getElementById('closeBtn');

// Mood configurations
const moodConfigs = {
    focused: { emoji: '🎯', greeting: 'Ready to code! 💻', color: '#00d9ff' },
    playful: { emoji: '😘', greeting: 'Let\'s have some fun! 💋', color: '#ff6b6b' },
    bossy: { emoji: '💪', greeting: 'Get it done! Now! 🔥', color: '#ffa500' },
    friendly: { emoji: '😊', greeting: 'Hello! How can I help?', color: '#00ff41' },
    surprised: { emoji: '😲', greeting: 'Wow! That\'s unexpected!', color: '#ffd700' },
    blushing: { emoji: '😳', greeting: '#fingeringmyself on the keyboard 💋', color: '#ff69b4' }
};

// Attraction level colors
const attractionColors = {
    11: '#ff1493',
    10: '#ff69b4', 
    9: '#ffa500',
    8: '#00d9ff',
    7: '#00ff41',
    6: '#ffff00',
    5: '#ffffff',
    4: '#00ff00',
    3: '#0080ff',
    2: '#8000ff',
    1: '#ff0080'
};

// Initialize app
async function init() {
    await updatePersonalityStatus();
    setupEventListeners();
    
    // Update every 30 seconds
    setInterval(updatePersonalityStatus, 30000);
}

// Update personality status from API
async function updatePersonalityStatus() {
    try {
        const status = await ipcRenderer.invoke('get-personality-status');
        
        if (status.error) {
            statusDot.className = 'status-dot offline pulse';
            return;
        }
        
        // Update mood display
        const mood = status.personality?.mood || 'focused';
        const attractionLevel = status.personality?.attraction_level || 11;
        const config = moodConfigs[mood] || moodConfigs.focused;
        
        moodEmoji.textContent = config.emoji;
        moodText.textContent = mood;
        moodText.className = `mood-text mood-${mood}`;
        moodGreeting.textContent = config.greeting;
        
        // Update attraction level color
        const attractionColor = attractionColors[attractionLevel] || '#ffffff';
        moodText.style.color = attractionColor;
        
        // Update system stats
        if (status.system) {
            cpuPercent.textContent = `${Math.round(status.system.cpu_percent || 0)}%`;
            memoryPercent.textContent = `${Math.round(status.system.memory_percent || 0)}%`;
            diskPercent.textContent = `${Math.round(status.system.disk_percent || 0)}%`;
        }
        
        // Update status indicator
        statusDot.className = 'status-dot online';
        
    } catch (error) {
        console.error('Error updating status:', error);
        statusDot.className = 'status-dot offline pulse';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Toggle always on top
    toggleTopBtn.addEventListener('click', async () => {
        const isOnTop = await ipcRenderer.invoke('toggle-always-on-top');
        toggleTopBtn.textContent = isOnTop ? '📌' : '📌';
        toggleTopBtn.title = isOnTop ? 'Always on Top (ON)' : 'Always on Top (OFF)';
    });
    
    // Close app
    closeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('close-app');
    });
    
    // Mood emoji click - cycle through moods (for testing)
    moodEmoji.addEventListener('click', () => {
        const moods = Object.keys(moodConfigs);
        const currentMood = moodText.textContent;
        const currentIndex = moods.indexOf(currentMood);
        const nextIndex = (currentIndex + 1) % moods.length;
        const nextMood = moods[nextIndex];
        
        // Update display immediately
        const config = moodConfigs[nextMood];
        moodEmoji.textContent = config.emoji;
        moodText.textContent = nextMood;
        moodText.className = `mood-text mood-${nextMood}`;
        moodGreeting.textContent = config.greeting;
    });
    
    // Listen for personality updates from main process
    ipcRenderer.on('personality-update', (event, status) => {
        updatePersonalityStatus();
    });
}

// Start the app
init();

