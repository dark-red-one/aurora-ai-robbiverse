// Robbie Fallback System - Multiple backup strategies
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class RobbieFallbackSystem {
  constructor() {
    this.fallbackChain = [
      'local_rtx4090',
      'runpod_b200', 
      'cloud_claude',
      'cloud_chatgpt',
      'emergency_simple'
    ];
    this.currentProvider = 'local_rtx4090';
    this.healthCheck = {
      local_rtx4090: false,
      runpod_b200: false,
      cloud_claude: true,
      cloud_chatgpt: true,
      emergency_simple: true
    };
  }

  async healthCheckAll() {
    console.log('🔍 Running health checks...');
    
    // Check local RTX 4090
    try {
      const { stdout } = await execAsync('ollama ps', { timeout: 2000 });
      this.healthCheck.local_rtx4090 = stdout.includes('llama3.1:8b');
      console.log(`🟢 Local RTX 4090: ${this.healthCheck.local_rtx4090 ? 'HEALTHY' : 'DOWN'}`);
    } catch (error) {
      this.healthCheck.local_rtx4090 = false;
      console.log('🔴 Local RTX 4090: DOWN');
    }

    // Check RunPod B200
    try {
      const { stdout } = await execAsync('curl -s http://localhost:8000/health', { timeout: 2000 });
      this.healthCheck.runpod_b200 = stdout.includes('healthy');
      console.log(`🟢 RunPod B200: ${this.healthCheck.runpod_b200 ? 'HEALTHY' : 'DOWN'}`);
    } catch (error) {
      this.healthCheck.runpod_b200 = false;
      console.log('🔴 RunPod B200: DOWN');
    }

    return this.healthCheck;
  }

  async respondWithFallback(prompt) {
    const startTime = process.hrtime.bigint();
    
    for (const provider of this.fallbackChain) {
      if (!this.healthCheck[provider]) continue;
      
      try {
        console.log(`🔄 Trying ${provider}...`);
        const result = await this.getResponse(provider, prompt);
        
        if (result.success) {
          const endTime = process.hrtime.bigint();
          const totalMs = Number(endTime - startTime) / 1_000_000;
          const speed = totalMs < 500 ? '🟢' : totalMs < 1000 ? '🟡' : '🔴';
          
          console.log(`✅ Success with ${provider} [${speed} ${totalMs.toFixed(0)}ms]`);
          return {
            response: result.response,
            provider,
            totalMs: Math.round(totalMs),
            display: `[${speed} ${totalMs.toFixed(0)}ms via ${provider}]`
          };
        }
      } catch (error) {
        console.log(`❌ ${provider} failed: ${error.message}`);
        this.healthCheck[provider] = false;
      }
    }
    
    // Emergency fallback
    return {
      response: "I'm experiencing technical difficulties. Please try again.",
      provider: 'emergency',
      totalMs: 0,
      display: '[🔴 Emergency fallback]'
    };
  }

  async getResponse(provider, prompt) {
    switch (provider) {
      case 'local_rtx4090':
        return await this.localRTX4090(prompt);
      case 'runpod_b200':
        return await this.runpodB200(prompt);
      case 'cloud_claude':
        return await this.cloudClaude(prompt);
      case 'cloud_chatgpt':
        return await this.cloudChatGPT(prompt);
      case 'emergency_simple':
        return await this.emergencySimple(prompt);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  async localRTX4090(prompt) {
    const { stdout } = await execAsync(`ollama run llama3.1:8b "${prompt}"`, { timeout: 5000 });
    return { success: true, response: stdout.trim() };
  }

  async runpodB200(prompt) {
    // RunPod B200 API call
    const { stdout } = await execAsync(`curl -X POST http://localhost:8000/generate -d '{"prompt":"${prompt}"}'`, { timeout: 10000 });
    return { success: true, response: JSON.parse(stdout).response };
  }

  async cloudClaude(prompt) {
    // Claude API call (simulated)
    return { success: true, response: `Claude: ${prompt}` };
  }

  async cloudChatGPT(prompt) {
    // ChatGPT API call (simulated)
    return { success: true, response: `ChatGPT: ${prompt}` };
  }

  async emergencySimple(prompt) {
    // Simple pattern matching
    const responses = {
      'hi': 'Hello!',
      'hello': 'Hi there!',
      'help': 'I can help you with coding, business strategy, and more!',
      'status': 'System status: Running on emergency fallback mode.'
    };
    
    const lowerPrompt = prompt.toLowerCase();
    for (const [key, value] of Object.entries(responses)) {
      if (lowerPrompt.includes(key)) {
        return { success: true, response: value };
      }
    }
    
    return { success: true, response: 'I understand. How can I help?' };
  }

  async autoRecovery() {
    console.log('🔄 Attempting auto-recovery...');
    
    // Try to restart local Ollama
    if (!this.healthCheck.local_rtx4090) {
      try {
        await execAsync('pkill ollama && sleep 2 && ollama serve &');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await this.healthCheckAll();
      } catch (error) {
        console.log('❌ Failed to restart local Ollama');
      }
    }
    
    // Try to start RunPod B200
    if (!this.healthCheck.runpod_b200) {
      try {
        await execAsync('cd /home/allan/vengeance && node src/runpodIntegration.js start');
        await new Promise(resolve => setTimeout(resolve, 10000));
        await this.healthCheckAll();
      } catch (error) {
        console.log('❌ Failed to start RunPod B200');
      }
    }
  }
}

export default RobbieFallbackSystem;

