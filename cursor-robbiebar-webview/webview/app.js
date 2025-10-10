// RobbieBar - Main JavaScript (VS Code Webview Version)
// Handles API calls, real-time updates, and matrix rain animation

// Configuration - Use VS Code webview configuration
const API_BASE = window.ROBBIE_CONFIG ? window.ROBBIE_CONFIG.apiUrl : 'http://localhost:8000';
const vscode = window.ROBBIE_CONFIG ? window.ROBBIE_CONFIG.vscodeApi : null;

const UPDATE_INTERVAL = 2000; // 2 seconds for stats
const PERSONALITY_INTERVAL = 30000; // 30 seconds for personality
const GIT_INTERVAL = 10000; // 10 seconds for git status

// State
let currentMood = 'focused';
let isCommitting = false;

// Mood emoji mapping
const MOOD_EMOJIS = {
    friendly: '😊',
    focused: '🎯',
    playful: '😘',
    bossy: '💪',
    surprised: '😲',
    blushing: '😊💕'
};

const MOOD_CYCLE = ['friendly', 'focused', 'playful', 'bossy', 'surprised', 'blushing'];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 RobbieBar initializing in VS Code webview...');
    logToExtension('RobbieBar initializing...');

    // Initialize matrix rain
    initMatrixRain();

    // Initial data fetch
    fetchPersonality();
    fetchSystemStats();
    fetchGitStatus();

    // Set up intervals
    setInterval(fetchSystemStats, UPDATE_INTERVAL);
    setInterval(fetchPersonality, PERSONALITY_INTERVAL);
    setInterval(fetchGitStatus, GIT_INTERVAL);

    // Set up git section hover for commits panel
    const gitSection = document.getElementById('git-section');
    const commitsPanel = document.getElementById('commits-panel');

    if (gitSection && commitsPanel) {
        gitSection.addEventListener('mouseenter', () => {
            fetchRecentCommits();
            commitsPanel.style.display = 'block';
        });

        gitSection.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!commitsPanel.matches(':hover')) {
                    commitsPanel.style.display = 'none';
                }
            }, 300);
        });

        commitsPanel.addEventListener('mouseleave', () => {
            commitsPanel.style.display = 'none';
        });
    }

    console.log('✅ RobbieBar initialized!');
    logToExtension('RobbieBar initialized successfully');
});

// ============================================
// VS CODE INTEGRATION
// ============================================

function logToExtension(text) {
    if (vscode) {
        vscode.postMessage({ command: 'log', text });
    }
}

function showInfo(text) {
    if (vscode) {
        vscode.postMessage({ command: 'showInfo', text });
    }
}

function showError(text) {
    if (vscode) {
        vscode.postMessage({ command: 'showError', text });
    }
}

// ============================================
// API CALLS
// ============================================

async function fetchPersonality() {
    try {
        const response = await fetch(`${API_BASE}/code/api/personality`);
        const data = await response.json();

        if (data.mood) {
            updatePersonalityUI(data);
            setStatus('online');
        }
    } catch (error) {
        console.error('Error fetching personality:', error);
        setStatus('offline');
    }
}

async function fetchSystemStats() {
    try {
        const response = await fetch(`${API_BASE}/code/api/system/stats`);
        const data = await response.json();

        updateStatsUI(data);
    } catch (error) {
        console.error('Error fetching system stats:', error);
    }
}

async function fetchGitStatus() {
    try {
        const response = await fetch(`${API_BASE}/code/api/git/status`);
        const data = await response.json();

        updateGitUI(data);
    } catch (error) {
        console.error('Error fetching git status:', error);
    }
}

async function fetchRecentCommits() {
    try {
        const response = await fetch(`${API_BASE}/code/api/git/recent`);
        const data = await response.json();

        updateCommitsUI(data.commits || []);
    } catch (error) {
        console.error('Error fetching commits:', error);
    }
}

// ============================================
// USER ACTIONS
// ============================================

async function cycleMood() {
    const currentIndex = MOOD_CYCLE.indexOf(currentMood);
    const nextIndex = (currentIndex + 1) % MOOD_CYCLE.length;
    const nextMood = MOOD_CYCLE[nextIndex];

    try {
        const response = await fetch(`${API_BASE}/code/api/personality/mood`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mood: nextMood })
        });

        const data = await response.json();

        if (data.success) {
            currentMood = nextMood;
            document.getElementById('mood-emoji').textContent = MOOD_EMOJIS[nextMood];
            document.getElementById('mood-text').textContent = nextMood;

            // Add a little animation
            const avatar = document.querySelector('.avatar-container');
            avatar.style.transform = 'scale(1.2)';
            setTimeout(() => {
                avatar.style.transform = 'scale(1)';
            }, 200);

            showInfo(`Mood changed to ${nextMood} 💜`);
        }
    } catch (error) {
        console.error('Error changing mood:', error);
        showError('Failed to change mood');
    }
}

async function quickCommit() {
    if (isCommitting) return;

    const commitBtn = document.getElementById('commit-btn');
    const originalText = commitBtn.textContent;

    isCommitting = true;
    commitBtn.disabled = true;
    commitBtn.textContent = '⏳ Committing...';

    // Use VS Code terminal integration if available
    if (vscode) {
        vscode.postMessage({
            command: 'executeGitCommit',
            commitMessage: `🚀 Quick commit from RobbieBar`
        });

        setTimeout(() => {
            commitBtn.textContent = '✅ Pushed!';
            fetchGitStatus();

            setTimeout(() => {
                commitBtn.textContent = originalText;
                commitBtn.disabled = false;
                isCommitting = false;
            }, 2000);
        }, 1000);
    } else {
        // Fallback to API
        try {
            const response = await fetch(`${API_BASE}/code/api/git/quick-commit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (data.success) {
                if (data.skipped) {
                    commitBtn.textContent = '✅ No Changes';
                } else {
                    commitBtn.textContent = '✅ Pushed!';
                }

                setTimeout(() => {
                    fetchGitStatus();
                }, 1000);
            } else {
                commitBtn.textContent = '❌ Failed';
                console.error('Commit failed:', data.error);
            }
        } catch (error) {
            commitBtn.textContent = '❌ Error';
            console.error('Error committing:', error);
        } finally {
            setTimeout(() => {
                commitBtn.textContent = originalText;
                commitBtn.disabled = false;
                isCommitting = false;
            }, 2000);
        }
    }
}

// ============================================
// UI UPDATES
// ============================================

function updatePersonalityUI(data) {
    currentMood = data.mood || 'focused';

    document.getElementById('mood-emoji').textContent = MOOD_EMOJIS[currentMood];
    document.getElementById('mood-text').textContent = currentMood;
    document.getElementById('attraction-level').textContent = data.attraction || 8;
    document.getElementById('gg-level').textContent = data.gandhi_genghis || 7;
    document.getElementById('energy-level').textContent = data.energy || 50;
}

function updateStatsUI(data) {
    const cpuEl = document.getElementById('cpu-stat');
    const memEl = document.getElementById('memory-stat');
    const gpuEl = document.getElementById('gpu-stat');

    cpuEl.textContent = `${Math.round(data.cpu)}%`;
    memEl.textContent = `${Math.round(data.memory)}%`;
    gpuEl.textContent = `${Math.round(data.gpu)}%`;

    // Color coding based on usage
    [cpuEl, memEl, gpuEl].forEach(el => {
        const value = parseFloat(el.textContent);
        el.classList.remove('high', 'critical');
        if (value > 80) el.classList.add('critical');
        else if (value > 60) el.classList.add('high');
    });
}

function updateGitUI(data) {
    document.getElementById('git-branch').textContent = data.branch || 'unknown';

    const modifiedEl = document.getElementById('git-modified');
    const count = data.modified_files || 0;
    modifiedEl.textContent = count === 0 ? 'clean' : `${count} change${count !== 1 ? 's' : ''}`;
    modifiedEl.classList.toggle('has-changes', count > 0);

    const syncEl = document.getElementById('git-sync');
    if (data.ahead > 0 || data.behind > 0) {
        const parts = [];
        if (data.ahead > 0) parts.push(`↑${data.ahead}`);
        if (data.behind > 0) parts.push(`↓${data.behind}`);
        syncEl.textContent = parts.join(' ');
        syncEl.classList.toggle('ahead', data.ahead > 0);
        syncEl.classList.toggle('behind', data.behind > 0);
    } else {
        syncEl.textContent = '';
    }
}

function updateCommitsUI(commits) {
    const listEl = document.getElementById('commits-list');

    if (commits.length === 0) {
        listEl.innerHTML = '<div class="loading">No recent commits</div>';
        return;
    }

    listEl.innerHTML = commits.map(commit => `
        <div class="commit-item">
            <span class="commit-hash">${commit.hash}</span>
            <span class="commit-message">${commit.message}</span>
            <span class="commit-time">${commit.time}</span>
        </div>
    `).join('');
}

function setStatus(status) {
    const dotEl = document.getElementById('status-dot');
    const textEl = document.getElementById('status-text');

    dotEl.classList.remove('online', 'offline');

    if (status === 'online') {
        dotEl.classList.add('online');
        textEl.textContent = 'online';
    } else {
        dotEl.classList.add('offline');
        textEl.textContent = 'offline';
    }
}

// ============================================
// MATRIX RAIN ANIMATION
// ============================================

function initMatrixRain() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Matrix characters (using digits and symbols)
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const charArray = chars.split('');

    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function draw() {
        // Fade effect
        ctx.fillStyle = 'rgba(30, 30, 30, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Matrix color (Cursor teal)
        ctx.fillStyle = '#4ec9b0';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            const char = charArray[Math.floor(Math.random() * charArray.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            ctx.fillText(char, x, y);

            // Reset drop to top randomly
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }
    }

    // Animate
    setInterval(draw, 50);

    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}


