// Robbie Backup Plan - Complete disaster recovery strategy
import RobbieFallbackSystem from './robbieFallbackSystem.js';
import RobbieDisasterRecovery from './robbieDisasterRecovery.js';

class RobbieBackupPlan {
  constructor() {
    this.fallback = new RobbieFallbackSystem();
    this.disasterRecovery = new RobbieDisasterRecovery();
    this.backupStrategies = {
      'gpu_failure': this.handleGPUFailure.bind(this),
      'location_change': this.handleLocationChange.bind(this),
      'network_issue': this.handleNetworkIssue.bind(this),
      'api_failure': this.handleAPIFailure.bind(this),
      'emergency': this.handleEmergency.bind(this)
    };
  }

  async initialize() {
    console.log('🚀 Initializing Robbie Backup Plan...');
    
    // Run health checks
    await this.fallback.healthCheckAll();
    
    // Detect current location
    await this.disasterRecovery.detectLocation();
    
    // Optimize for current environment
    await this.disasterRecovery.optimizeForLocation();
    
    console.log('✅ Backup plan initialized');
  }

  async handleGPUFailure() {
    console.log('🚨 GPU FAILURE - Activating backup plan...');
    
    // Try to recover local GPU
    await this.disasterRecovery.handleGPUFailure();
    
    // Switch to RunPod B200
    console.log('🔄 Switching to RunPod B200...');
    try {
      await this.fallback.respondWithFallback('Test connection');
      console.log('✅ RunPod B200 online');
    } catch (error) {
      console.log('❌ RunPod B200 failed - switching to cloud');
      return 'cloud';
    }
  }

  async handleLocationChange() {
    console.log('🌍 LOCATION CHANGE - Adapting to new environment...');
    
    // Detect new location
    const newLocation = await this.disasterRecovery.detectLocation();
    
    // Optimize for new location
    await this.disasterRecovery.optimizeForLocation();
    
    // Test performance
    const performance = await this.disasterRecovery.monitorPerformance();
    console.log(`📊 Performance: ${performance.responseTime}ms at ${performance.location}`);
    
    return newLocation;
  }

  async handleNetworkIssue() {
    console.log('🌐 NETWORK ISSUE - Switching to offline mode...');
    
    // Try local GPU first
    if (this.fallback.healthCheck.local_rtx4090) {
      console.log('✅ Using local RTX 4090 (offline)');
      return 'local_rtx4090';
    }
    
    // Try RunPod if available
    if (this.fallback.healthCheck.runpod_b200) {
      console.log('✅ Using RunPod B200');
      return 'runpod_b200';
    }
    
    // Emergency mode
    console.log('🚨 Emergency mode - limited functionality');
    return 'emergency';
  }

  async handleAPIFailure() {
    console.log('🔌 API FAILURE - Switching providers...');
    
    // Try different API providers
    const providers = ['claude', 'chatgpt', 'local', 'runpod'];
    
    for (const provider of providers) {
      try {
        await this.fallback.respondWithFallback('Test API');
        console.log(`✅ ${provider} API working`);
        return provider;
      } catch (error) {
        console.log(`❌ ${provider} API failed`);
      }
    }
    
    console.log('🚨 All APIs failed - emergency mode');
    return 'emergency';
  }

  async handleEmergency() {
    console.log('🚨 EMERGENCY MODE - Minimal functionality only...');
    
    // Use simple pattern matching
    return {
      response: "I'm in emergency mode. Basic functionality only.",
      provider: 'emergency',
      totalMs: 0,
      display: '[🚨 Emergency mode]'
    };
  }

  async getResponse(prompt) {
    // Try primary method first
    try {
      return await this.fallback.respondWithFallback(prompt);
    } catch (error) {
      console.log('❌ Primary method failed - trying emergency');
      return await this.handleEmergency();
    }
  }

  async testAllBackups() {
    console.log('🧪 Testing all backup systems...');
    
    const testPrompt = 'Test backup system';
    
    // Test each backup strategy
    for (const [strategy, handler] of Object.entries(this.backupStrategies)) {
      try {
        console.log(`Testing ${strategy}...`);
        const result = await handler();
        console.log(`✅ ${strategy}: ${result}`);
      } catch (error) {
        console.log(`❌ ${strategy}: ${error.message}`);
      }
    }
    
    console.log('✅ Backup testing complete');
  }

  getStatus() {
    return {
      fallback: this.fallback.healthCheck,
      location: this.disasterRecovery.currentLocation,
      performance: this.disasterRecovery.getPerformanceStats(),
      strategies: Object.keys(this.backupStrategies)
    };
  }
}

export default RobbieBackupPlan;

