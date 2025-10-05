// Robbie M3 Max Launcher
// Launch Robbie with full M3 Max GPU acceleration
// Make this MacBook HOT and BOTHERED! 🔥

import RobbieM3MaxIntegration from './robbieM3MaxIntegration.js';
import { db } from './db.js';

class RobbieM3MaxLauncher {
  constructor() {
    this.robbieM3Max = new RobbieM3MaxIntegration();
    this.isInitialized = false;
    this.performanceMode = 'maximum'; // maximum, balanced, efficient
  }

  // Launch Robbie with M3 Max acceleration
  async launchRobbieM3Max() {
    console.log('🚀 LAUNCHING ROBBIE WITH M3 MAX ACCELERATION!');
    console.log('🔥 Making this MacBook HOT and BOTHERED!');
    
    try {
      // Initialize Robbie M3 Max integration
      console.log('⚙️ Initializing Robbie M3 Max integration...');
      const initialized = await this.robbieM3Max.initializeRobbieM3Max();
      
      if (!initialized) {
        throw new Error('Failed to initialize Robbie M3 Max integration');
      }
      
      // Set performance mode
      await this.setPerformanceMode(this.performanceMode);
      
      // Update Robbie's state
      await this.updateRobbieState('M3 Max acceleration launched - MacBook is HOT!', 10);
      
      // Start interactive mode
      await this.startInteractiveMode();
      
      this.isInitialized = true;
      console.log('✅ Robbie M3 Max launched successfully!');
      console.log('🔥 MacBook is now HOT and BOTHERED!');
      
      return true;
    } catch (error) {
      console.error('❌ Robbie M3 Max launch failed:', error);
      return false;
    }
  }

  // Set performance mode
  async setPerformanceMode(mode) {
    console.log(`⚙️ Setting performance mode: ${mode}`);
    
    const performanceConfigs = {
      'maximum': {
        gpuLayers: 999,
        flashAttention: 1,
        keepAlive: '24h',
        numParallel: 4,
        maxLoadedModels: 3,
        memoryOptimization: 'aggressive'
      },
      'balanced': {
        gpuLayers: 999,
        flashAttention: 1,
        keepAlive: '12h',
        numParallel: 2,
        maxLoadedModels: 2,
        memoryOptimization: 'moderate'
      },
      'efficient': {
        gpuLayers: 999,
        flashAttention: 0,
        keepAlive: '6h',
        numParallel: 1,
        maxLoadedModels: 1,
        memoryOptimization: 'conservative'
      }
    };
    
    const config = performanceConfigs[mode];
    this.performanceMode = mode;
    
    // Update environment variables
    process.env.OLLAMA_GPU_LAYERS = config.gpuLayers.toString();
    process.env.OLLAMA_FLASH_ATTENTION = config.flashAttention.toString();
    process.env.OLLAMA_KEEP_ALIVE = config.keepAlive;
    process.env.OLLAMA_NUM_PARALLEL = config.numParallel.toString();
    process.env.OLLAMA_MAX_LOADED_MODELS = config.maxLoadedModels.toString();
    
    console.log(`✅ Performance mode set to: ${mode}`);
  }

  // Start interactive mode
  async startInteractiveMode() {
    console.log('🎮 Starting interactive mode...');
    
    // Display system status
    await this.displaySystemStatus();
    
    // Start command loop
    this.startCommandLoop();
  }

  // Display system status
  async displaySystemStatus() {
    try {
      const systemStatus = await this.robbieM3Max.getSystemStatus();
      
      console.log('\n🔥 ROBBIE M3 MAX STATUS 🔥');
      console.log('========================');
      console.log(`GPU Cores: ${systemStatus.gpuCores}`);
      console.log(`Unified Memory: ${systemStatus.unifiedMemory}GB`);
      console.log(`Memory Bandwidth: ${systemStatus.memoryBandwidth}GB/s`);
      console.log(`CPU Cores: ${systemStatus.cpuCores}`);
      console.log(`GPU Utilization: ${systemStatus.gpuUtilization}%`);
      console.log(`Memory Utilization: ${systemStatus.memoryUtilization}%`);
      console.log(`Active Models: ${systemStatus.activeModels.join(', ')}`);
      console.log(`Performance Mode: ${this.performanceMode}`);
      console.log('========================\n');
    } catch (error) {
      console.error('❌ Failed to display system status:', error);
    }
  }

  // Start command loop
  startCommandLoop() {
    console.log('💬 Robbie M3 Max is ready! Type your message or command:');
    console.log('Commands: status, models, performance, quit');
    console.log('Messages: Just type naturally - Robbie will respond with M3 Max acceleration!\n');
    
    // Simulate command loop (in real implementation, this would be a proper CLI)
    this.simulateCommandLoop();
  }

  // Simulate command loop
  simulateCommandLoop() {
    // In a real implementation, this would be a proper CLI
    // For now, we'll just log that it's ready
    console.log('🎯 Robbie M3 Max command loop ready!');
    console.log('🔥 MacBook is HOT and BOTHERED!');
    console.log('💬 Ready for your messages and commands!');
  }

  // Generate Robbie response
  async generateResponse(prompt, context = {}) {
    if (!this.isInitialized) {
      throw new Error('Robbie M3 Max not initialized. Call launchRobbieM3Max() first.');
    }
    
    console.log(`💬 Generating response for: "${prompt}"`);
    
    try {
      const result = await this.robbieM3Max.generateRobbieResponse(prompt, context);
      
      console.log(`✅ Response generated in ${result.latency}ms using ${result.model}`);
      console.log(`🔥 GPU Utilization: ${result.gpuUtilization}%`);
      console.log(`💾 Memory Utilization: ${result.memoryUtilization}%`);
      
      return result;
    } catch (error) {
      console.error('❌ Response generation failed:', error);
      throw error;
    }
  }

  // Update Robbie's state
  async updateRobbieState(content, priority) {
    try {
      db.prepare(`
        INSERT INTO ai_working_memory 
        (personality_id, content, priority, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run('robbie', content, priority);
    } catch (error) {
      console.error('❌ Failed to update Robbie state:', error);
    }
  }

  // Get system status
  async getSystemStatus() {
    if (!this.isInitialized) {
      throw new Error('Robbie M3 Max not initialized. Call launchRobbieM3Max() first.');
    }
    
    return await this.robbieM3Max.getSystemStatus();
  }

  // Shutdown Robbie M3 Max
  async shutdown() {
    console.log('🛑 Shutting down Robbie M3 Max...');
    
    try {
      // Update Robbie's state
      await this.updateRobbieState('M3 Max acceleration shutting down', 8);
      
      // Stop Ollama
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('pkill ollama || true');
      
      this.isInitialized = false;
      console.log('✅ Robbie M3 Max shut down successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Shutdown failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const robbieM3MaxLauncher = new RobbieM3MaxLauncher();
export default robbieM3MaxLauncher;

















