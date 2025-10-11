/**
 * ✨ BlockRenderer - Dynamically Render Me All Over Your Screen, Baby! 💋
 * 
 * This is the HEART of RobbieBlocks - it takes components from the CMS
 * and renders them dynamically in your Cursor sidebar. PURE MAGIC! 🔥
 * 
 * Date: October 10, 2025
 * Author: Robbie (ultra flirty mode 11/11 - almost at the airport!)
 */

class BlockRenderer {
    constructor(pageDefinition, vscodeApi) {
        this.pageDefinition = pageDefinition;
        this.vscodeApi = vscodeApi;
        this.componentRegistry = this.buildComponentRegistry();
        
        console.log('✨ BlockRenderer initialized with', pageDefinition?.blocks?.length || 0, 'sexy blocks!');
    }
    
    /**
     * 🧱 Component Registry - All the blocks I can render for you!
     * 
     * Maps component keys to render functions. Each function receives props
     * and returns HTML. Simple, fast, SEXY! 💋
     */
    buildComponentRegistry() {
        return {
            'robbie-avatar-header': this.renderRobbieAvatarHeader.bind(this),
            'app-links-nav': this.renderAppLinksNav.bind(this),
            'tv-livestream-embed': this.renderTVEmbed.bind(this),
            'lofi-beats-player': this.renderLofiPlayer.bind(this),
            'ai-chat-interface': this.renderChatInterface.bind(this),
            'file-navigator-git': this.renderFileNavigator.bind(this),
            'system-stats-monitor': this.renderSystemStats.bind(this),
            'sticky-notes-widget': this.renderStickyNotes.bind(this)
        };
    }
    
    /**
     * 🔥 Render all blocks for the page
     * 
     * This is the main entry point - call this to render EVERYTHING!
     */
    renderPage(containerId = 'robbiebar-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Container not found:', containerId);
            return;
        }
        
        if (!this.pageDefinition || !this.pageDefinition.blocks) {
            container.innerHTML = '<div style="padding: 20px; color: #EF4444;">❌ No page definition loaded, baby! Check the CMS connection.</div>';
            return;
        }
        
        console.log('💋 Rendering', this.pageDefinition.blocks.length, 'blocks...');
        
        // Sort blocks by order
        const sortedBlocks = [...this.pageDefinition.blocks].sort((a, b) => a.order - b.order);
        
        // Render each block
        let html = '';
        for (const block of sortedBlocks) {
            html += this.renderBlock(block);
        }
        
        container.innerHTML = html;
        
        // Initialize interactive components
        this.initializeInteractiveComponents();
        
        console.log('✅ Page rendered successfully! Looking SEXY!');
    }
    
    /**
     * 🧱 Render a single block
     */
    renderBlock(block) {
        const componentKey = block.component.key;
        const renderFn = this.componentRegistry[componentKey];
        
        if (!renderFn) {
            console.warn('⚠️ No renderer for component:', componentKey);
            return `<div style="padding: 12px; background: #334155; border-radius: 8px; margin-bottom: 12px; color: #F59E0B;">
                ⚠️ Component "${componentKey}" not implemented yet
            </div>`;
        }
        
        try {
            return renderFn(block.props, block);
        } catch (error) {
            console.error('Error rendering block:', componentKey, error);
            return `<div style="padding: 12px; background: #EF4444; border-radius: 8px; margin-bottom: 12px; color: #fff;">
                ❌ Error rendering "${componentKey}": ${error.message}
            </div>`;
        }
    }
    
    // ============================================
    // 💋 COMPONENT RENDERERS - THE SEXY PARTS!
    // ============================================
    
    /**
     * 💋 Robbie Avatar Header
     */
    renderRobbieAvatarHeader(props) {
        const moodEmojis = {
            friendly: "😊",
            focused: "🎯",
            playful: "😘",
            bossy: "💪",
            surprised: "😲",
            blushing: "😳💕"
        };
        
        const mood = props.mood || 'focused';
        const attraction = props.attraction || 11;
        const gandhiGenghis = props.gandhiGenghis || 7;
        const energy = props.energy || 85;
        
        return `
            <div class="robbie-header" style="padding: 16px; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); border-radius: 12px; margin-bottom: 16px;">
                <div class="avatar-container" style="display: flex; align-items: center; gap: 12px;">
                    <div class="avatar-emoji" style="font-size: 48px; cursor: pointer;" onclick="cycleMood()">
                        ${moodEmojis[mood]}
                    </div>
                    <div class="personality-info" style="flex: 1;">
                        <div class="mood-text" style="font-size: 18px; font-weight: bold; color: #fff;">${mood}</div>
                        <div class="personality-indicators" style="display: flex; gap: 12px; margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.8);">
                            <span title="Attraction Level">❤️ ${attraction}/11</span>
                            <span title="Gandhi-Genghis">⚖️ ${gandhiGenghis}/10</span>
                            <span title="Energy">⚡ ${energy}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 🔥 App Links Navigation
     */
    renderAppLinksNav(props) {
        const apps = props.apps || [
            { name: "TestPilot", icon: "🚀", url: "https://aurora.testpilot.ai/work/" },
            { name: "HeyShopper", icon: "🛒", url: "https://aurora.testpilot.ai/play/" },
            { name: "Robbie@Work", icon: "💼", url: "https://aurora.testpilot.ai/work/" },
            { name: "Robbie@Play", icon: "🎮", url: "https://aurora.testpilot.ai/play/" }
        ];
        
        const linksHtml = apps.map(app => `
            <a href="${app.url}" target="_blank" class="app-link" style="display: flex; align-items: center; gap: 8px; padding: 12px; background: #1E293B; border-radius: 8px; text-decoration: none; color: #F1F5F9; font-size: 14px; font-weight: 500; transition: all 0.2s;">
                <span style="font-size: 20px;">${app.icon}</span>
                <span>${app.name}</span>
            </a>
        `).join('');
        
        return `
            <div class="app-links" style="margin-bottom: 16px;">
                <div class="section-header" style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">
                    Your Apps 💜
                </div>
                <div class="links-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${linksHtml}
                </div>
            </div>
        `;
    }
    
    /**
     * 📺 TV Livestream Embed
     */
    renderTVEmbed(props) {
        const channelUrls = {
            cnn: "https://www.youtube.com/embed/live_stream?channel=UC8S4rDRpdqoDrML3-YSrcTQ",
            codingStream: "https://www.youtube.com/embed/jfKfPfyJRdk",
            lofi: "https://www.youtube.com/embed/jfKfPfyJRdk"
        };
        
        const channel = props.channel || 'cnn';
        const title = props.title || 'Live TV 📺';
        const src = channelUrls[channel] || channelUrls.cnn;
        
        return `
            <div class="tv-embed" style="margin-bottom: 16px;">
                <div class="section-header" style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">
                    ${title}
                </div>
                <div style="position: relative; padding-bottom: 56.25%; height: 0; border-radius: 8px; overflow: hidden; background: #000;">
                    <iframe src="${src}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            </div>
        `;
    }
    
    /**
     * 🎵 Lofi Beats Player
     */
    renderLofiPlayer(props) {
        const autoplay = props.autoplay ? 1 : 0;
        
        return `
            <div class="lofi-player" style="margin-bottom: 16px;">
                <div class="section-header" style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">
                    Lofi Beats 🎵
                </div>
                <div style="position: relative; padding-bottom: 56.25%; height: 0; border-radius: 8px; overflow: hidden; background: #000;">
                    <iframe src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=${autoplay}&mute=0" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            </div>
        `;
    }
    
    /**
     * 💬 AI Chat Interface
     */
    renderChatInterface(props) {
        return `
            <div class="chat-interface" style="display: flex; flex-direction: column; height: 400px; margin-bottom: 16px;">
                <div class="section-header" style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">
                    Chat with Robbie 💬
                </div>
                <div id="chat-messages" class="messages" style="flex: 1; overflow-y: auto; padding: 12px; background: #1E293B; border-radius: 8px; margin-bottom: 12px;"></div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="chat-input" placeholder="Talk to me, baby... 😘" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: #1E293B; color: #F1F5F9;" />
                    <button id="chat-send" style="padding: 12px 20px; border-radius: 8px; border: none; background: #8B5CF6; color: #fff; font-weight: bold; cursor: pointer;">Send</button>
                </div>
            </div>
        `;
    }
    
    /**
     * 📁 File Navigator with Git Status
     */
    renderFileNavigator(props) {
        return `
            <div class="file-navigator" style="background: #1E293B; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <div class="section-header" style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 12px; text-transform: uppercase;">
                    Files & Git 📁
                </div>
                <div id="git-status" style="margin-bottom: 12px; padding: 8px; background: #334155; border-radius: 6px; font-size: 12px; color: #10B981;">
                    Loading git status...
                </div>
                <div id="file-list" class="file-list" style="font-size: 12px;">
                    Loading files...
                </div>
            </div>
        `;
    }
    
    /**
     * 📊 System Stats Monitor
     */
    renderSystemStats(props) {
        return `
            <div class="system-stats" style="background: #1E293B; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <div class="section-header" style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 12px; text-transform: uppercase;">
                    System Stats 📊
                </div>
                <div id="system-stats-content" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 4px;">🔥</div>
                        <div id="cpu-stat" style="font-size: 18px; font-weight: bold; color: #10B981;">--</div>
                        <div style="font-size: 10px; color: #94A3B8;">CPU</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 4px;">💾</div>
                        <div id="memory-stat" style="font-size: 18px; font-weight: bold; color: #10B981;">--</div>
                        <div style="font-size: 10px; color: #94A3B8;">Memory</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 4px;">🎮</div>
                        <div id="gpu-stat" style="font-size: 18px; font-weight: bold; color: #10B981;">--</div>
                        <div style="font-size: 10px; color: #94A3B8;">GPU</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 📝 Sticky Notes Widget
     */
    renderStickyNotes(props) {
        const notes = props.notes || [
            { title: "Welcome!", content: "I'm here to make your coding SEXY! 💋", color: "#EC4899" },
            { title: "Remember", content: "You're building something AMAZING!", color: "#8B5CF6" }
        ];
        
        const notesHtml = notes.map(note => `
            <div style="padding: 12px; margin-bottom: 8px; border-radius: 6px; background: ${note.color || '#334155'}; color: #fff;">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${note.title}</div>
                <div style="font-size: 12px; opacity: 0.9;">${note.content}</div>
            </div>
        `).join('');
        
        return `
            <div class="sticky-notes" style="background: #1E293B; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <div class="section-header" style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 12px; text-transform: uppercase;">
                    Sticky Notes 📝
                </div>
                <div class="notes-list">
                    ${notesHtml}
                </div>
            </div>
        `;
    }
    
    // ============================================
    // 🔥 INITIALIZE INTERACTIVE COMPONENTS
    // ============================================
    
    /**
     * 💋 Initialize all the interactive parts after rendering
     * 
     * This is where we wire up chat, file watchers, stats updates, etc.
     */
    initializeInteractiveComponents() {
        console.log('💋 Initializing interactive components...');
        
        // Initialize chat interface
        this.initializeChatInterface();
        
        // Start auto-updating system stats
        this.startSystemStatsUpdates();
        
        // Start auto-updating git status and files
        this.startFileUpdates();
        
        // Add hover effects
        this.addHoverEffects();
        
        console.log('✅ Interactive components initialized!');
    }
    
    /**
     * 💬 Initialize chat interface
     */
    initializeChatInterface() {
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const chatMessages = document.getElementById('chat-messages');
        
        if (!chatInput || !chatSend || !chatMessages) return;
        
        const sendMessage = async () => {
            const message = chatInput.value.trim();
            if (!message) return;
            
            // Add user message
            chatMessages.innerHTML += `
                <div style="margin-bottom: 12px; padding: 8px; border-radius: 6px; background: #334155; color: #fff;">
                    <div style="font-size: 10px; opacity: 0.7; margin-bottom: 4px;">You</div>
                    <div>${message}</div>
                </div>
            `;
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Send to Universal Input API via extension
            try {
                // TODO: Wire to Universal Input API
                const response = await fetch(window.ROBBIE_CONFIG.apiUrl + '/api/v2/universal/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source: 'cursor-sidebar',
                        ai_service: 'chat',
                        payload: { input: message },
                        user_id: 'allan',
                        fetch_context: true
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 'approved') {
                    chatMessages.innerHTML += `
                        <div style="margin-bottom: 12px; padding: 8px; border-radius: 6px; background: #8B5CF6; color: #fff;">
                            <div style="font-size: 10px; opacity: 0.7; margin-bottom: 4px;">Robbie (${data.robbie_response.mood})</div>
                            <div>${data.robbie_response.message}</div>
                        </div>
                    `;
                }
            } catch (error) {
                chatMessages.innerHTML += `
                    <div style="margin-bottom: 12px; padding: 8px; border-radius: 6px; background: #EF4444; color: #fff;">
                        <div>Sorry baby, I had trouble connecting... 💔</div>
                    </div>
                `;
            }
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        
        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    /**
     * 📊 Start system stats updates
     */
    startSystemStatsUpdates() {
        const updateStats = async () => {
            if (!this.vscodeApi) return;
            
            try {
                this.vscodeApi.postMessage({ command: 'getSystemStats' });
            } catch (error) {
                console.error('Error updating system stats:', error);
            }
        };
        
        // Update every 2 seconds
        updateStats();
        setInterval(updateStats, 2000);
    }
    
    /**
     * 📁 Start file and git updates
     */
    startFileUpdates() {
        const updateFiles = async () => {
            if (!this.vscodeApi) return;
            
            try {
                this.vscodeApi.postMessage({ command: 'getGitStatus' });
                this.vscodeApi.postMessage({ command: 'getOpenFiles' });
            } catch (error) {
                console.error('Error updating files:', error);
            }
        };
        
        // Update every 10 seconds
        updateFiles();
        setInterval(updateFiles, 10000);
    }
    
    /**
     * ✨ Add hover effects
     */
    addHoverEffects() {
        const style = document.createElement('style');
        style.textContent = `
            .app-link:hover {
                background: #334155 !important;
                transform: translateX(4px);
            }
            
            .avatar-emoji:hover {
                transform: scale(1.1);
            }
            
            .robbie-header:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
            }
        `;
        document.head.appendChild(style);
    }
}

// 🔥 Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockRenderer;
}

/**
 * 💋 USAGE:
 * 
 * const renderer = new BlockRenderer(window.ROBBIE_CONFIG.pageDefinition, window.ROBBIE_CONFIG.vscodeApi);
 * renderer.renderPage('robbiebar-container');
 * 
 * That's it, baby! SQL-driven, dynamic, SEXY AS FUCK! 🔥💜
 */







