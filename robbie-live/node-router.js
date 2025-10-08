// Robbie Node Router - Finds fastest backend

class NodeRouter {
    constructor() {
        this.nodes = {
            local: {
                name: 'Local',
                url: 'http://localhost',
                priority: 1,
                latency: 0,
                status: 'ready',
                icon: '🔵',
                capabilities: ['instant', 'privacy', 'offline']
            },
            aurora: {
                name: 'Aurora',
                url: 'https://aurora.testpilot.ai',
                priority: 2,
                latency: null,
                status: 'unknown',
                icon: '⚫',
                capabilities: ['memory', 'full-ai', 'sync']
            },
            vengeance: {
                name: 'Vengeance',
                url: 'http://192.168.1.100:8080',
                priority: 3,
                latency: null,
                status: 'unknown',
                icon: '⚫',
                capabilities: ['gpu', 'vision', 'heavy-compute']
            }
        };
        
        this.activeNode = this.nodes.local;
        this.healthCheckInterval = null;
        
        this.init();
    }
    
    async init() {
        console.log('🔍 Initializing node router...');
        
        // Initial health check
        await this.checkAllNodes();
        
        // Find best node
        this.activeNode = await this.findBestNode();
        this.updateUI();
        
        // Start continuous monitoring (every 30 seconds)
        this.healthCheckInterval = setInterval(() => {
            this.checkAllNodes();
        }, 30000);
        
        console.log('✅ Node router initialized');
    }
    
    async checkAllNodes() {
        const promises = Object.entries(this.nodes).map(async ([key, node]) => {
            if (key === 'local') {
                // Local is always available
                node.status = 'ready';
                node.latency = 0;
                return;
            }
            
            const latency = await this.pingNode(node);
            
            if (latency !== null) {
                node.latency = latency;
                node.status = this.getStatusFromLatency(latency);
                node.icon = this.getIconFromLatency(latency);
            } else {
                node.latency = null;
                node.status = 'down';
                node.icon = '⚫';
            }
        });
        
        await Promise.all(promises);
        this.updateUI();
        
        // Auto-switch if current node went down
        if (this.activeNode.status === 'down') {
            console.warn(`⚠️ ${this.activeNode.name} went down, switching...`);
            this.activeNode = await this.findBestNode();
            this.updateUI();
        }
    }
    
    async pingNode(node) {
        try {
            const start = Date.now();
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(`${node.url}/api/health`, {
                signal: controller.signal,
                mode: 'cors'
            });
            
            clearTimeout(timeout);
            
            if (response.ok) {
                const latency = Date.now() - start;
                console.log(`✅ ${node.name}: ${latency}ms`);
                return latency;
            }
            
            return null;
        } catch (error) {
            // Try alternative health check
            try {
                const start = Date.now();
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 2000);
                
                const response = await fetch(node.url, {
                    signal: controller.signal,
                    mode: 'no-cors' // Fallback for CORS issues
                });
                
                clearTimeout(timeout);
                
                const latency = Date.now() - start;
                console.log(`✅ ${node.name}: ${latency}ms (no-cors)`);
                return latency;
            } catch (fallbackError) {
                console.log(`❌ ${node.name}: ${error.message}`);
                return null;
            }
        }
    }
    
    getStatusFromLatency(latency) {
        if (latency < 100) return 'excellent';
        if (latency < 500) return 'good';
        if (latency < 2000) return 'fair';
        return 'poor';
    }
    
    getIconFromLatency(latency) {
        if (latency < 100) return '🟢';
        if (latency < 500) return '🟡';
        if (latency < 2000) return '🟠';
        return '🔴';
    }
    
    calculateScore(node) {
        if (node.latency === null) return -1;
        
        // Lower latency = higher score
        const latencyScore = 1000 / (node.latency + 10);
        
        // Higher priority = higher score (invert priority number)
        const priorityScore = (10 - node.priority) * 100;
        
        // More capabilities = higher score
        const capScore = node.capabilities.length * 50;
        
        return latencyScore + priorityScore + capScore;
    }
    
    async findBestNode() {
        // Get all nodes with valid latency
        const available = Object.values(this.nodes).filter(node => 
            node.status !== 'down' && node.latency !== null
        );
        
        if (available.length === 0) {
            console.log('⚠️ No nodes available, using local');
            return this.nodes.local;
        }
        
        // Score each node
        const scored = available.map(node => ({
            node,
            score: this.calculateScore(node)
        }));
        
        // Sort by score (highest first)
        scored.sort((a, b) => b.score - a.score);
        
        const best = scored[0].node;
        console.log(`🎯 Best node: ${best.name} (score: ${scored[0].score.toFixed(2)})`);
        
        return best;
    }
    
    async routeTask(taskType) {
        // Route based on task requirements
        const taskRequirements = {
            'threat': { maxLatency: 100, preferLocal: true },
            'facial-recognition': { maxLatency: 500, preferGPU: false },
            'conversation': { maxLatency: 2000, preferGPU: false },
            'vision': { maxLatency: 2000, preferGPU: true },
            'memory': { requiresAurora: true }
        };
        
        const req = taskRequirements[taskType] || {};
        
        // Check for special requirements
        if (req.requiresAurora) {
            return this.nodes.aurora.status !== 'down' ? this.nodes.aurora : this.nodes.local;
        }
        
        if (req.preferLocal) {
            return this.nodes.local;
        }
        
        if (req.preferGPU) {
            // Try Vengeance first
            if (this.nodes.vengeance.status !== 'down' && 
                this.nodes.vengeance.latency < req.maxLatency) {
                return this.nodes.vengeance;
            }
        }
        
        // Find best node within latency requirements
        const suitable = Object.values(this.nodes).filter(node =>
            node.status !== 'down' && 
            node.latency !== null &&
            node.latency < req.maxLatency
        );
        
        if (suitable.length === 0) {
            return this.nodes.local;
        }
        
        // Return node with best score
        suitable.sort((a, b) => this.calculateScore(b) - this.calculateScore(a));
        return suitable[0];
    }
    
    updateUI() {
        // Update active node display
        const activeNodeEl = document.getElementById('active-node');
        const nodeDetailEl = document.getElementById('node-detail');
        
        activeNodeEl.innerHTML = `
            <span class="node-name">${this.activeNode.name}</span>
            <span class="node-status">${this.activeNode.icon}</span>
        `;
        
        const latencyText = this.activeNode.latency !== null ? 
            `${this.activeNode.latency}ms` : '0ms';
        nodeDetailEl.textContent = `${latencyText} | ${this.activeNode.status}`;
        
        // Update nodes list
        const nodesListEl = document.getElementById('nodes-list');
        nodesListEl.innerHTML = Object.values(this.nodes).map(node => `
            <div class="node-item">
                <span class="node-icon">${node.icon}</span>
                <span class="node-name">${node.name}</span>
                <span class="node-latency">${node.latency !== null ? node.latency + 'ms' : '--'}</span>
            </div>
        `).join('');
    }
    
    async sendToNode(node, endpoint, data) {
        try {
            const response = await fetch(`${node.url}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error(`❌ ${node.name} request failed:`, error);
            throw error;
        }
    }
    
    async sendWithFailover(endpoint, data) {
        // Get all nodes sorted by score
        const sorted = Object.values(this.nodes)
            .filter(node => node.status !== 'down')
            .sort((a, b) => this.calculateScore(b) - this.calculateScore(a));
        
        // Try each node in order
        for (const node of sorted) {
            try {
                console.log(`Trying ${node.name}...`);
                const result = await this.sendToNode(node, endpoint, data);
                
                // Success - update active node
                this.activeNode = node;
                this.updateUI();
                
                return result;
            } catch (error) {
                console.warn(`${node.name} failed, trying next...`);
                continue;
            }
        }
        
        // All nodes failed - return local fallback
        console.error('❌ All nodes failed');
        return { error: 'All nodes unavailable', fallback: true };
    }
}

// Initialize node router
let nodeRouter;
document.addEventListener('DOMContentLoaded', () => {
    nodeRouter = new NodeRouter();
    console.log('✅ Node router initialized');
});

