// Chat Speed Investigation - Find out why chat is SLOW
// Real logging and performance analysis

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

class ChatSpeedInvestigation {
  constructor() {
    this.logFile = '/home/allan/vengeance/chat_speed_investigation.log';
    this.results = [];
  }

  // Log with timestamp
  async log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    
    try {
      await fs.appendFile(this.logFile, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  // Investigate chat speed bottlenecks
  async investigateChatSpeed() {
    await this.log('🔍 STARTING CHAT SPEED INVESTIGATION');
    await this.log('=====================================');
    
    try {
      // 1. Check Ollama status and configuration
      await this.checkOllamaStatus();
      
      // 2. Test response times with different prompts
      await this.testResponseTimes();
      
      // 3. Check system resources during chat
      await this.checkSystemResources();
      
      // 4. Analyze GPU vs CPU usage
      await this.analyzeProcessorUsage();
      
      // 5. Check for bottlenecks
      await this.identifyBottlenecks();
      
      // 6. Generate recommendations
      await this.generateRecommendations();
      
      await this.log('✅ CHAT SPEED INVESTIGATION COMPLETE');
      
      return this.results;
      
    } catch (error) {
      await this.log(`❌ Investigation failed: ${error.message}`);
      throw error;
    }
  }

  // Check Ollama status and configuration
  async checkOllamaStatus() {
    await this.log('📊 Checking Ollama status and configuration...');
    
    try {
      // Check running models
      const { stdout: models } = await execAsync('ollama ps');
      await this.log(`🤖 Running models:\n${models}`);
      
      // Check Ollama version
      const { stdout: version } = await execAsync('ollama --version');
      await this.log(`📋 Ollama version: ${version.trim()}`);
      
      // Check Ollama processes
      const { stdout: processes } = await execAsync('ps aux | grep ollama | grep -v grep');
      await this.log(`🔍 Ollama processes:\n${processes}`);
      
      // Check Ollama logs
      try {
        const { stdout: logs } = await execAsync('tail -20 /tmp/ollama.log 2>/dev/null || echo "No log file found"');
        await this.log(`📜 Recent Ollama logs:\n${logs}`);
      } catch (error) {
        await this.log('📜 No Ollama logs available');
      }
      
      this.results.push({
        category: 'ollama_status',
        models: models,
        version: version.trim(),
        processes: processes
      });
      
    } catch (error) {
      await this.log(`❌ Ollama status check failed: ${error.message}`);
    }
  }

  // Test response times with different prompts
  async testResponseTimes() {
    await this.log('⏱️ Testing response times with different prompts...');
    
    const testPrompts = [
      { name: 'Short', prompt: 'Hi', expectedTime: '<2s' },
      { name: 'Medium', prompt: 'Explain AI in one paragraph', expectedTime: '<5s' },
      { name: 'Long', prompt: 'Write a detailed explanation of machine learning with examples', expectedTime: '<10s' }
    ];
    
    const timingResults = [];
    
    for (const test of testPrompts) {
      await this.log(`🧪 Testing "${test.name}" prompt: "${test.prompt}"`);
      
      const startTime = Date.now();
      
      try {
        const { stdout: response } = await execAsync(`ollama run llama3.1:8b "${test.prompt}"`);
        const responseTime = Date.now() - startTime;
        
        await this.log(`✅ ${test.name} response time: ${responseTime}ms (expected: ${test.expectedTime})`);
        await this.log(`📝 Response length: ${response.length} characters`);
        
        timingResults.push({
          name: test.name,
          prompt: test.prompt,
          responseTime: responseTime,
          responseLength: response.length,
          expectedTime: test.expectedTime,
          slow: responseTime > 10000
        });
        
      } catch (error) {
        await this.log(`❌ ${test.name} test failed: ${error.message}`);
        timingResults.push({
          name: test.name,
          error: error.message,
          slow: true
        });
      }
    }
    
    this.results.push({
      category: 'response_times',
      tests: timingResults
    });
  }

  // Check system resources during chat
  async checkSystemResources() {
    await this.log('💻 Checking system resources during chat...');
    
    try {
      // CPU usage
      const { stdout: cpu } = await execAsync('top -bn1 | grep "Cpu(s)" | head -1');
      await this.log(`🔥 CPU usage: ${cpu.trim()}`);
      
      // Memory usage
      const { stdout: memory } = await execAsync('free -h');
      await this.log(`💾 Memory usage:\n${memory}`);
      
      // Disk I/O
      const { stdout: disk } = await execAsync('iostat -x 1 1 | tail -n +4');
      await this.log(`💿 Disk I/O:\n${disk}`);
      
      // Load average
      const { stdout: load } = await execAsync('uptime');
      await this.log(`📊 System load: ${load.trim()}`);
      
      this.results.push({
        category: 'system_resources',
        cpu: cpu.trim(),
        memory: memory,
        load: load.trim()
      });
      
    } catch (error) {
      await this.log(`❌ System resource check failed: ${error.message}`);
    }
  }

  // Analyze GPU vs CPU usage
  async analyzeProcessorUsage() {
    await this.log('🔍 Analyzing GPU vs CPU usage...');
    
    try {
      // Check if nvidia-smi is available (it's not in WSL)
      try {
        await execAsync('nvidia-smi');
      } catch (error) {
        await this.log('⚠️ nvidia-smi not available in WSL - cannot directly monitor GPU');
      }
      
      // Check Ollama GPU configuration
      const { stdout: ollamaPs } = await execAsync('ollama ps');
      await this.log(`🤖 Ollama GPU status:\n${ollamaPs}`);
      
      // Check if model is using GPU or CPU
      if (ollamaPs.includes('GPU')) {
        await this.log('✅ Model is configured for GPU usage');
      } else if (ollamaPs.includes('CPU')) {
        await this.log('❌ Model is using CPU - this could be the slowdown!');
      }
      
      // Check process CPU usage during inference
      await this.log('🔍 Monitoring process CPU usage during inference...');
      
      const monitorPromise = this.monitorProcessUsage();
      const inferencePromise = execAsync('ollama run llama3.1:8b "Generate a response to test CPU usage"');
      
      await Promise.all([monitorPromise, inferencePromise]);
      
    } catch (error) {
      await this.log(`❌ Processor usage analysis failed: ${error.message}`);
    }
  }

  // Monitor process usage
  async monitorProcessUsage() {
    return new Promise((resolve) => {
      let samples = 0;
      const maxSamples = 5;
      
      const interval = setInterval(async () => {
        try {
          const { stdout: processes } = await execAsync('ps aux | grep ollama | grep -v grep');
          await this.log(`📊 Process usage sample ${samples + 1}:\n${processes}`);
          
          samples++;
          if (samples >= maxSamples) {
            clearInterval(interval);
            resolve();
          }
        } catch (error) {
          await this.log(`❌ Process monitoring error: ${error.message}`);
          clearInterval(interval);
          resolve();
        }
      }, 2000);
    });
  }

  // Identify bottlenecks
  async identifyBottlenecks() {
    await this.log('🔍 Identifying potential bottlenecks...');
    
    const bottlenecks = [];
    
    // Check if using CPU instead of GPU
    const responseTimeResults = this.results.find(r => r.category === 'response_times');
    if (responseTimeResults) {
      const slowTests = responseTimeResults.tests.filter(t => t.slow);
      if (slowTests.length > 0) {
        bottlenecks.push('Slow response times detected');
        await this.log('❌ BOTTLENECK: Slow response times detected');
      }
    }
    
    // Check system resources
    const resourceResults = this.results.find(r => r.category === 'system_resources');
    if (resourceResults) {
      if (resourceResults.cpu.includes('100%')) {
        bottlenecks.push('High CPU usage');
        await this.log('❌ BOTTLENECK: High CPU usage detected');
      }
    }
    
    // Check Ollama configuration
    const ollamaResults = this.results.find(r => r.category === 'ollama_status');
    if (ollamaResults) {
      if (!ollamaResults.models.includes('GPU')) {
        bottlenecks.push('Model not using GPU');
        await this.log('❌ BOTTLENECK: Model may not be using GPU acceleration');
      }
    }
    
    this.results.push({
      category: 'bottlenecks',
      identified: bottlenecks
    });
  }

  // Generate recommendations
  async generateRecommendations() {
    await this.log('💡 Generating recommendations to speed up chat...');
    
    const recommendations = [];
    
    // Check bottlenecks and generate specific recommendations
    const bottlenecks = this.results.find(r => r.category === 'bottlenecks')?.identified || [];
    
    if (bottlenecks.includes('Slow response times detected')) {
      recommendations.push('Optimize Ollama parameters for faster inference');
      recommendations.push('Reduce model context window');
      recommendations.push('Use faster sampling methods');
    }
    
    if (bottlenecks.includes('Model not using GPU')) {
      recommendations.push('Verify GPU drivers are installed in WSL');
      recommendations.push('Check CUDA toolkit installation');
      recommendations.push('Restart Ollama with GPU flags');
    }
    
    if (bottlenecks.includes('High CPU usage')) {
      recommendations.push('Force GPU usage to reduce CPU load');
      recommendations.push('Increase GPU memory allocation');
    }
    
    // General recommendations
    recommendations.push('Set OLLAMA_NUM_PARALLEL=1 for single-user optimization');
    recommendations.push('Set OLLAMA_MAX_LOADED_MODELS=1 to free memory');
    recommendations.push('Use streaming responses for perceived speed');
    recommendations.push('Implement response caching for common queries');
    
    await this.log('💡 RECOMMENDATIONS:');
    for (const rec of recommendations) {
      await this.log(`   • ${rec}`);
    }
    
    this.results.push({
      category: 'recommendations',
      list: recommendations
    });
  }

  // Get investigation results
  getResults() {
    return {
      timestamp: new Date().toISOString(),
      logFile: this.logFile,
      results: this.results
    };
  }
}

export default ChatSpeedInvestigation;

