// Robbie Face Animation Controller

class RobbieFace {
    constructor() {
        this.container = document.querySelector('.face-container');
        this.mood = 'friendly';
        this.isBlinking = false;
        this.isSpeaking = false;
        this.eyeTrackingEnabled = true;
        
        this.init();
    }
    
    init() {
        // Start blink interval
        setInterval(() => this.blink(), 3000 + Math.random() * 2000);
        
        // Eye tracking (follows mouse/touch)
        if (this.eyeTrackingEnabled) {
            document.addEventListener('mousemove', (e) => this.trackEyes(e.clientX, e.clientY));
            document.addEventListener('touchmove', (e) => {
                const touch = e.touches[0];
                this.trackEyes(touch.clientX, touch.clientY);
            });
        }
    }
    
    setMood(mood) {
        // Remove all mood classes
        this.container.classList.remove(
            'mood-friendly', 'mood-focused', 'mood-playful', 
            'mood-bossy', 'mood-surprised', 'mood-blushing'
        );
        
        // Add new mood class
        this.container.classList.add(`mood-${mood}`);
        this.mood = mood;
        
        // Update mood badge
        const badges = {
            'friendly': '😊 Friendly',
            'focused': '🎯 Focused',
            'playful': '😘 Playful',
            'bossy': '💪 Bossy',
            'surprised': '😲 Surprised',
            'blushing': '😳 Blushing'
        };
        
        document.getElementById('mood-badge').textContent = badges[mood];
        
        console.log(`Robbie mood: ${mood}`);
    }
    
    blink() {
        if (this.isBlinking) return;
        
        this.isBlinking = true;
        this.container.classList.add('blinking');
        
        setTimeout(() => {
            this.container.classList.remove('blinking');
            this.isBlinking = false;
        }, 200);
    }
    
    trackEyes(x, y) {
        const pupils = document.querySelectorAll('.pupil');
        const faceRect = this.container.getBoundingClientRect();
        const faceCenterX = faceRect.left + faceRect.width / 2;
        const faceCenterY = faceRect.top + faceRect.height / 2;
        
        // Calculate angle from face center to cursor
        const angle = Math.atan2(y - faceCenterY, x - faceCenterX);
        
        // Maximum pupil movement (in pixels)
        const maxMove = 10;
        
        // Calculate pupil offset
        const offsetX = Math.cos(angle) * maxMove;
        const offsetY = Math.sin(angle) * maxMove;
        
        pupils.forEach(pupil => {
            pupil.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
        });
    }
    
    speak(duration = 1000) {
        this.isSpeaking = true;
        this.container.classList.add('speaking');
        
        setTimeout(() => {
            this.container.classList.remove('speaking');
            this.isSpeaking = false;
        }, duration);
    }
    
    showGreeting(text) {
        const greeting = document.getElementById('greeting');
        greeting.textContent = text;
        greeting.style.animation = 'none';
        
        // Trigger reflow
        setTimeout(() => {
            greeting.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }
    
    express(emotion) {
        // Quick emotion expressions
        const originalMood = this.mood;
        
        switch(emotion) {
            case 'happy':
                this.setMood('playful');
                break;
            case 'thinking':
                this.setMood('focused');
                break;
            case 'alert':
                this.setMood('surprised');
                break;
            case 'serious':
                this.setMood('bossy');
                break;
        }
        
        // Return to original mood after 2 seconds
        setTimeout(() => {
            this.setMood(originalMood);
        }, 2000);
    }
}

// Initialize face
let robbieFace;
document.addEventListener('DOMContentLoaded', () => {
    robbieFace = new RobbieFace();
    console.log('✅ Robbie face initialized');
});

