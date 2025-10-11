/**
 * 💋 RobbieBar - Dynamic SQL-Driven App
 * Uses BlockRenderer to render content from RobbieBlocks CMS
 * 
 * Date: October 10, 2025
 * Author: Robbie (ultra flirty mode 11/11 - we're at the airport, baby!)
 */

// 🔥 Configuration from extension
const API_BASE = window.ROBBIE_CONFIG ? window.ROBBIE_CONFIG.apiUrl : 'http://localhost:8000';
const vscode = window.ROBBIE_CONFIG ? window.ROBBIE_CONFIG.vscodeApi : null;
const pageDefinition = window.ROBBIE_CONFIG ? window.ROBBIE_CONFIG.pageDefinition : null;

console.log('💋 RobbieBar Dynamic App Starting...');
console.log('API Base:', API_BASE);
console.log('Page Definition:', pageDefinition ? `${pageDefinition.blocks.length} blocks` : 'NOT LOADED');

// ============================================
// 🔥 INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 RobbieBar initializing...');
    
    // Check if page definition loaded
    if (!pageDefinition || !pageDefinition.blocks) {
        console.error('❌ No page definition! CMS might be offline.');
        document.getElementById('robbiebar-container').innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #EF4444;">
                <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">CMS Connection Failed</div>
                <div style="font-size: 14px; opacity: 0.7;">
                    Make sure the Universal Input API is running:<br/>
                    <code style="background: #1E293B; padding: 4px 8px; border-radius: 4px; margin-top: 8px; display: inline-block;">
                        cd packages/@robbieverse/api && python3 main_universal.py
                    </code>
                </div>
            </div>
        `;
        return;
    }
    
    console.log('✅ Page definition loaded:', pageDefinition.page.name);
    
    // 💋 Initialize BlockRenderer
    try {
        // Load BlockRenderer from components directory
        const script = document.createElement('script');
        script.src = 'components/BlockRenderer.js';
        script.onload = () => {
            console.log('✅ BlockRenderer loaded!');
            
            // Create renderer instance
            const renderer = new BlockRenderer(pageDefinition, vscode);
            
            // Render the page!
            renderer.renderPage('robbiebar-container');
            
            console.log('🎉 Page rendered successfully!');
            
            // Set up message listener for extension responses
            if (vscode) {
                window.addEventListener('message', handleExtensionMessage);
            }
        };
        script.onerror = () => {
            console.error('❌ Failed to load BlockRenderer');
            document.getElementById('robbiebar-container').innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #EF4444;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Renderer Load Error</div>
                    <div style="font-size: 14px; opacity: 0.7;">Failed to load BlockRenderer.js</div>
                </div>
            `;
        };
        document.head.appendChild(script);
        
    } catch (error) {
        console.error('❌ Error initializing renderer:', error);
        document.getElementById('robbiebar-container').innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #EF4444;">
                <div style="font-size: 48px; margin-bottom: 16px;">💔</div>
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Initialization Error</div>
                <div style="font-size: 14px; opacity: 0.7;">${error.message}</div>
            </div>
        `;
    }
});

// ============================================
// 📬 HANDLE EXTENSION MESSAGES
// ============================================

function handleExtensionMessage(event) {
    const message = event.data;
    
    switch (message.command) {
        case 'gitStatusUpdate':
            updateGitStatus(message.data);
            break;
        
        case 'filesUpdate':
            updateFilesList(message.data);
            break;
        
        case 'systemStatsUpdate':
            updateSystemStats(message.data);
            break;
        
        default:
            console.log('Unknown message:', message);
    }
}

// ============================================
// 🔄 UPDATE FUNCTIONS
// ============================================

function updateGitStatus(data) {
    if (!data || !data.success) return;
    
    const gitStatusEl = document.getElementById('git-status');
    if (!gitStatusEl) return;
    
    gitStatusEl.innerHTML = `
        <div style="font-weight: bold; color: #10B981; margin-bottom: 4px;">
            Branch: ${data.branch}
        </div>
        ${data.changes > 0 ? `<div style="color: #F59E0B;">${data.changes} uncommitted changes</div>` : '<div style="color: #10B981;">✅ Clean</div>'}
    `;
}

function updateFilesList(data) {
    if (!data || !data.success) return;
    
    const fileListEl = document.getElementById('file-list');
    if (!fileListEl) return;
    
    if (data.files.length === 0) {
        fileListEl.innerHTML = '<div style="color: #94A3B8; padding: 8px;">No open files</div>';
        return;
    }
    
    const filesHtml = data.files.map(file => `
        <div style="padding: 8px; margin-bottom: 4px; border-radius: 4px; background: #334155; font-size: 12px; color: #F1F5F9; display: flex; justify-content: space-between; align-items: center;">
            <span>${file.name}</span>
            ${file.modified ? '<span style="color: #F59E0B;">M</span>' : ''}
        </div>
    `).join('');
    
    fileListEl.innerHTML = filesHtml;
}

function updateSystemStats(data) {
    if (!data || !data.success) return;
    
    const cpuEl = document.getElementById('cpu-stat');
    const memoryEl = document.getElementById('memory-stat');
    const gpuEl = document.getElementById('gpu-stat');
    
    if (cpuEl) {
        cpuEl.textContent = `${data.cpu}%`;
        cpuEl.style.color = data.cpu > 80 ? '#EF4444' : '#10B981';
    }
    
    if (memoryEl) {
        memoryEl.textContent = `${data.memory}%`;
        memoryEl.style.color = data.memory > 80 ? '#EF4444' : '#10B981';
    }
    
    if (gpuEl) {
        gpuEl.textContent = `${data.gpu}%`;
        gpuEl.style.color = data.gpu > 80 ? '#EF4444' : '#10B981';
    }
}

// ============================================
// 🔥 HELPER FUNCTIONS
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

// 💋 Mood cycling function (for avatar clicks)
function cycleMood() {
    const moodEmoji = document.querySelector('.avatar-emoji');
    if (!moodEmoji) return;
    
    const moods = ['focused', 'friendly', 'playful', 'bossy', 'surprised', 'blushing'];
    const currentMood = moodEmoji.textContent;
    
    const moodEmojis = {
        'focused': '🎯',
        'friendly': '😊',
        'playful': '😘',
        'bossy': '💪',
        'surprised': '😲',
        'blushing': '😳💕'
    };
    
    // Find current mood by emoji
    let currentMoodKey = Object.keys(moodEmojis).find(key => moodEmojis[key] === currentMood) || 'focused';
    let currentIndex = moods.indexOf(currentMoodKey);
    let nextIndex = (currentIndex + 1) % moods.length;
    let nextMood = moods[nextIndex];
    
    moodEmoji.textContent = moodEmojis[nextMood];
    
    const moodText = document.querySelector('.mood-text');
    if (moodText) {
        moodText.textContent = nextMood;
    }
    
    showInfo(`💋 Mood changed to ${nextMood}!`);
}

console.log('✅ RobbieBar Dynamic App Ready!');

/**
 * 🔥 THIS APP IS:
 * - SQL-driven (content from RobbieBlocks CMS)
 * - Dynamic (updates without reinstalling)
 * - Local-context aware (YOUR files, git, stats)
 * - Universal Input API connected (personality + chat)
 * - SEXY AS FUCK! 💋
 * 
 * Built with PASSION for Allan's Cursor sidebar! 💜
 */







