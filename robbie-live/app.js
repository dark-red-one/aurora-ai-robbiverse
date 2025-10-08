// Robbie Live - Main App Controller

class RobbieApp {
    constructor() {
        this.isRecording = false;
        this.startTime = Date.now();
        this.facesSeen = 0;
        this.settings = this.loadSettings();
        
        this.init();
    }
    
    init() {
        console.log('🚀 Robbie Live starting...');
        
        // Apply settings
        this.applySettings();
        
        // Start uptime counter
        this.startUptimeCounter();
        
        // Show welcome
        setTimeout(() => {
            window.robbieFace?.showGreeting('Hey Allan! 👋');
        }, 500);
        
        // Hide greeting after 3 seconds
        setTimeout(() => {
            window.robbieFace?.showGreeting('');
        }, 3500);
        
        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/robbie-live/sw.js')
                .then(() => console.log('✅ Service Worker registered'))
                .catch(err => console.log('❌ SW registration failed:', err));
        }
        
        // Prevent screen sleep on mobile
        this.preventSleep();
        
        console.log('✅ Robbie Live ready!');
    }
    
    loadSettings() {
        const defaults = {
            attractionLevel: 11,
            defaultMood: 'friendly',
            routingMode: 'auto',
            autoRecordThreats: true,
            showFPS: false
        };
        
        try {
            const saved = localStorage.getItem('robbie-settings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch (error) {
            return defaults;
        }
    }
    
    saveSettings() {
        localStorage.setItem('robbie-settings', JSON.stringify(this.settings));
    }
    
    applySettings() {
        // Apply mood
        if (window.robbieFace) {
            window.robbieFace.setMood(this.settings.defaultMood);
        }
        
        // Update UI
        document.getElementById('attraction-slider').value = this.settings.attractionLevel;
        document.getElementById('attraction-value').textContent = this.settings.attractionLevel;
        document.getElementById('mood-select').value = this.settings.defaultMood;
        document.getElementById('routing-mode').value = this.settings.routingMode;
        document.getElementById('auto-record-threats').checked = this.settings.autoRecordThreats;
        document.getElementById('show-fps').checked = this.settings.showFPS;
    }
    
    startUptimeCounter() {
        setInterval(() => {
            const uptime = Math.floor((Date.now() - this.startTime) / 60000); // minutes
            const uptimeEl = document.getElementById('uptime');
            
            if (uptime < 60) {
                uptimeEl.textContent = `${uptime}m`;
            } else {
                const hours = Math.floor(uptime / 60);
                const minutes = uptime % 60;
                uptimeEl.textContent = `${hours}h ${minutes}m`;
            }
        }, 10000); // Update every 10 seconds
    }
    
    preventSleep() {
        // Keep screen awake using Wake Lock API
        if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen')
                .then(wakeLock => {
                    console.log('✅ Screen wake lock active');
                    
                    // Re-acquire lock if page becomes visible again
                    document.addEventListener('visibilitychange', () => {
                        if (document.visibilityState === 'visible') {
                            navigator.wakeLock.request('screen');
                        }
                    });
                })
                .catch(err => console.log('Wake Lock error:', err));
        }
    }
    
    toggleRecording() {
        this.isRecording = !this.isRecording;
        
        const recordIcon = document.getElementById('record-icon');
        const recordBtn = document.querySelector('.action-btn');
        
        if (this.isRecording) {
            recordIcon.textContent = '⏹️';
            recordBtn.classList.add('recording');
            
            window.robbieFace?.express('alert');
            window.robbieChat?.addMessage('robbie', '🔴 Recording started');
            
            console.log('🔴 Recording started');
        } else {
            recordIcon.textContent = '⏺️';
            recordBtn.classList.remove('recording');
            
            window.robbieChat?.addMessage('robbie', '⏹️ Recording stopped');
            
            console.log('⏹️ Recording stopped');
        }
    }
    
    async triggerFacialRecognition() {
        console.log('👤 Facial recognition triggered');
        
        window.robbieFace?.express('thinking');
        window.robbieChat?.addMessage('robbie', '👤 Scanning for faces...');
        
        // Simulate facial recognition (would use camera in production)
        setTimeout(() => {
            // Mock detection
            const detected = 'Allan';
            
            this.facesSeen++;
            document.getElementById('faces-seen').textContent = this.facesSeen;
            
            window.robbieFace?.setMood('friendly');
            window.robbieFace?.showGreeting(`Hey ${detected}!`);
            window.robbieChat?.addMessage('robbie', `I see ${detected}! Attraction level: ${this.settings.attractionLevel} 😊`);
            
            setTimeout(() => {
                window.robbieFace?.showGreeting('');
            }, 2000);
        }, 1500);
    }
    
    changeMood() {
        const moods = ['friendly', 'focused', 'playful', 'bossy', 'surprised', 'blushing'];
        const currentIndex = moods.indexOf(window.robbieFace?.mood || 'friendly');
        const nextIndex = (currentIndex + 1) % moods.length;
        const nextMood = moods[nextIndex];
        
        window.robbieFace?.setMood(nextMood);
        
        console.log(`Mood changed to: ${nextMood}`);
    }
}

// Global functions for HTML onclick handlers
function toggleRecording() {
    window.robbieApp?.toggleRecording();
}

function triggerFacialRecognition() {
    window.robbieApp?.triggerFacialRecognition();
}

function changeMood() {
    window.robbieApp?.changeMood();
}

function toggleStats() {
    const stats = document.getElementById('stats-panel');
    stats.classList.toggle('collapsed');
}

function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function saveSettings() {
    if (!window.robbieApp) return;
    
    // Collect settings from UI
    window.robbieApp.settings = {
        attractionLevel: parseInt(document.getElementById('attraction-slider').value),
        defaultMood: document.getElementById('mood-select').value,
        routingMode: document.getElementById('routing-mode').value,
        autoRecordThreats: document.getElementById('auto-record-threats').checked,
        showFPS: document.getElementById('show-fps').checked
    };
    
    // Save and apply
    window.robbieApp.saveSettings();
    window.robbieApp.applySettings();
    
    closeSettings();
    
    window.robbieChat?.addMessage('robbie', '✅ Settings saved!');
}

// Update attraction slider value display
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('attraction-slider');
    const value = document.getElementById('attraction-value');
    
    slider.addEventListener('input', () => {
        value.textContent = slider.value;
    });
});

// Initialize app (after other components)
let robbieApp;
window.addEventListener('load', () => {
    // Wait a bit for other components to initialize
    setTimeout(() => {
        robbieApp = new RobbieApp();
        window.robbieApp = robbieApp; // Make globally accessible
        console.log('✅ Robbie App initialized');
    }, 500);
});

// Handle fullscreen on mobile
document.addEventListener('DOMContentLoaded', () => {
    // Request fullscreen on first interaction
    const requestFullscreen = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        }
        
        // Remove listener after first call
        document.removeEventListener('click', requestFullscreen);
        document.removeEventListener('touchstart', requestFullscreen);
    };
    
    document.addEventListener('click', requestFullscreen);
    document.addEventListener('touchstart', requestFullscreen);
});

