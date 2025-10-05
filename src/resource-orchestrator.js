/**
 * ROBBIE RESOURCE ORCHESTRATOR
 * Intelligent network-aware resource discovery and routing
 * 
 * Priority Order:
 * 1. Aurora Town (always first choice - has RunPod GPU access)
 * 2. Vengeance (local RTX 4090)
 * 3. RobbieBook1 (M3 MacBook Pro - local fallback)
 * 
 * Features:
 * - Automatic resource discovery
 * - Network-aware routing
 * - Graceful degradation (airplane mode = local)
 * - Database sync/fallback
 */

class ResourceOrchestrator {
    constructor() {
        this.resources = {
            aurora: {
                name: 'Aurora Town',
                priority: 1,
                endpoints: {
                    chat: 'http://10.0.0.1:8007/api/chat',
                    llm: 'http://10.0.0.1:11434',
                    db: 'postgresql://aurora-town-u44170.vm.elestio.app:5432/aurora'
                },
                capabilities: ['chat', 'llm', 'database', 'runpod-gpu', 'vector-search'],
                status: 'unknown',
                lastCheck: null,
                latency: null
            },
            vengeance: {
                name: 'Vengeance',
                priority: 2,
                endpoints: {
                    chat: 'http://localhost:3000/api/chat',
                    llm: 'http://localhost:11434',
                    db: 'postgresql://localhost:5432/vengeance',
                    gpu: 'http://localhost:8001/gpu'
                },
                capabilities: ['chat', 'llm', 'database', 'rtx-4090', 'local-training'],
                status: 'unknown',
                lastCheck: null,
                latency: null
            },
            robbiebook1: {
                name: 'RobbieBook1',
                priority: 3,
                endpoints: {
                    chat: 'http://localhost:8080/api/chat',
                    llm: 'http://localhost:11434',
                    db: 'sqlite:///Users/allan/robbie-local.db'
                },
                capabilities: ['chat', 'llm', 'local-db', 'm3-neural-engine'],
                status: 'unknown',
                lastCheck: null,
                latency: null
            }
        };

        this.currentResource = null;
        this.offlineMode = false;
        this.discoveryInterval = null;
    }

    /**
     * Initialize orchestrator - discover available resources
     */
    async initialize() {
        console.log('🚀 Robbie Resource Orchestrator starting...');
        
        // Immediate discovery
        await this.discoverResources();
        
        // Continuous monitoring (every 30 seconds)
        this.discoveryInterval = setInterval(() => {
            this.discoverResources();
        }, 30000);

        // Listen for network changes
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleNetworkChange(true));
            window.addEventListener('offline', () => this.handleNetworkChange(false));
        }

        console.log(`✅ Orchestrator initialized. Current resource: ${this.currentResource?.name || 'None'}`);
        return this.currentResource;
    }

    /**
     * Discover and test all available resources
     */
    async discoverResources() {
        console.log('🔍 Discovering available resources...');
        
        const discoveries = Object.entries(this.resources).map(async ([key, resource]) => {
            try {
                const startTime = Date.now();
                
                // Try to ping the chat endpoint
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
                
                const response = await fetch(resource.endpoints.chat.replace('/api/chat', '/health'), {
                    method: 'GET',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    resource.status = 'online';
                    resource.latency = Date.now() - startTime;
                    resource.lastCheck = new Date();
                    console.log(`✅ ${resource.name}: ONLINE (${resource.latency}ms)`);
                } else {
                    resource.status = 'degraded';
                    console.log(`⚠️  ${resource.name}: DEGRADED (HTTP ${response.status})`);
                }
            } catch (error) {
                resource.status = 'offline';
                resource.latency = null;
                console.log(`❌ ${resource.name}: OFFLINE (${error.message})`);
            }
        });

        await Promise.all(discoveries);

        // Select best available resource
        this.selectBestResource();
    }

    /**
     * Select the best available resource based on priority and status
     */
    selectBestResource() {
        // Sort by priority, then by status
        const available = Object.values(this.resources)
            .filter(r => r.status === 'online')
            .sort((a, b) => a.priority - b.priority);

        if (available.length > 0) {
            this.currentResource = available[0];
            this.offlineMode = false;
            console.log(`🎯 Selected: ${this.currentResource.name} (Priority ${this.currentResource.priority}, ${this.currentResource.latency}ms)`);
        } else {
            // No network resources - go local
            this.currentResource = this.resources.robbiebook1;
            this.offlineMode = true;
            console.log('✈️  OFFLINE MODE: Using local RobbieBook1 resources');
        }

        // Emit event for UI updates
        this.emitResourceChange();
    }

    /**
     * Handle network connectivity changes
     */
    async handleNetworkChange(isOnline) {
        if (isOnline) {
            console.log('🌐 Network restored - rediscovering resources...');
            await this.discoverResources();
        } else {
            console.log('✈️  Network lost - switching to offline mode...');
            this.currentResource = this.resources.robbiebook1;
            this.offlineMode = true;
            this.emitResourceChange();
        }
    }

    /**
     * Send a chat message using best available resource
     */
    async sendMessage(message, options = {}) {
        if (!this.currentResource) {
            throw new Error('No resources available');
        }

        console.log(`💬 Sending message via ${this.currentResource.name}...`);

        try {
            const response = await fetch(this.currentResource.endpoints.chat, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    resource: this.currentResource.name,
                    offline_mode: this.offlineMode,
                    ...options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            console.error(`❌ Failed to send via ${this.currentResource.name}:`, error);
            
            // Try to failover to next available resource
            return this.failoverAndRetry(message, options);
        }
    }

    /**
     * Failover to next available resource and retry
     */
    async failoverAndRetry(message, options) {
        console.log('🔄 Attempting failover...');
        
        // Mark current resource as degraded
        if (this.currentResource) {
            this.currentResource.status = 'degraded';
        }

        // Rediscover and select new resource
        await this.discoverResources();

        if (!this.currentResource || this.currentResource.status !== 'online') {
            throw new Error('All resources unavailable');
        }

        // Retry with new resource
        return this.sendMessage(message, options);
    }

    /**
     * Get current resource info for UI display
     */
    getResourceInfo() {
        if (!this.currentResource) {
            return {
                name: 'No Resource',
                status: 'offline',
                mode: 'offline',
                hardware: 'Unknown',
                capabilities: []
            };
        }

        return {
            name: this.currentResource.name,
            status: this.currentResource.status,
            mode: this.offlineMode ? 'offline' : 'online',
            latency: this.currentResource.latency,
            hardware: this.getHardwareInfo(this.currentResource),
            capabilities: this.currentResource.capabilities,
            lastCheck: this.currentResource.lastCheck
        };
    }

    /**
     * Get hardware info string for display
     */
    getHardwareInfo(resource) {
        if (resource === this.resources.aurora) {
            return 'CPU: AMD EPYC (+ RunPod GPU)';
        } else if (resource === this.resources.vengeance) {
            return 'GPU: RTX 4090';
        } else if (resource === this.resources.robbiebook1) {
            return 'CPU: M3 Pro';
        }
        return 'Unknown';
    }

    /**
     * Emit resource change event for UI updates
     */
    emitResourceChange() {
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('resourcechange', {
                detail: this.getResourceInfo()
            });
            window.dispatchEvent(event);
        }
    }

    /**
     * Get database connection string for current resource
     */
    getDatabaseEndpoint() {
        if (!this.currentResource) {
            return null;
        }
        return this.currentResource.endpoints.db;
    }

    /**
     * Get LLM endpoint for current resource
     */
    getLLMEndpoint() {
        if (!this.currentResource) {
            return null;
        }
        return this.currentResource.endpoints.llm;
    }

    /**
     * Check if a specific capability is available
     */
    hasCapability(capability) {
        if (!this.currentResource) {
            return false;
        }
        return this.currentResource.capabilities.includes(capability);
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
        }
    }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceOrchestrator;
}

if (typeof window !== 'undefined') {
    window.ResourceOrchestrator = ResourceOrchestrator;
}
