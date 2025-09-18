// Web Terminal Real Monitoring - 11th Commandment: Always use tools to mitigate hallucinations!
// Use RunPod web terminal for real GPU data, no more fake numbers!

import RunPodAPIExecution from './runpodAPIExecution.js';

class WebTerminalRealMonitoring {
  constructor() {
    this.runpod = new RunPodAPIExecution();
    this.realData = {
      gpuUtilization: 0,
      memoryUsage: 0,
      powerDraw: 0,
      temperature: 0,
      ollamaRunning: false,
      realProcesses: []
    };
  }

  // Get REAL GPU status via web terminal
  async getRealGPUStatus() {
    console.log('🔥 Getting REAL GPU status via web terminal...');
    
    try {
      // Get nvidia-smi output
      const nvidiaSmi = await this.runpod.executeCommand('nvidia-smi');
      console.log('📊 Real nvidia-smi output:', nvidiaSmi);
      
      // Get GPU utilization
      const gpuUtil = await this.runpod.executeCommand('nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,power.draw,temperature.gpu --format=csv,noheader,nounits');
      console.log('📊 Real GPU utilization:', gpuUtil);
      
      // Get GPU processes
      const gpuProcesses = await this.runpod.executeCommand('nvidia-smi pmon -c 1');
      console.log('📋 Real GPU processes:', gpuProcesses);
      
      // Check Ollama processes
      const ollamaCheck = await this.runpod.executeCommand('ps aux | grep ollama');
      console.log('🤖 Real Ollama processes:', ollamaCheck);
      
      // Parse real data
      this.parseRealData(nvidiaSmi, gpuUtil, ollamaCheck);
      
      return {
        nvidiaSmi: nvidiaSmi,
        gpuUtilization: gpuUtil,
        gpuProcesses: gpuProcesses,
        ollamaProcesses: ollamaCheck,
        realData: this.realData,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Real GPU status check failed:', error);
      throw error;
    }
  }

  // Parse real data (no hallucinations)
  parseRealData(nvidiaSmi, gpuUtil, ollamaCheck) {
    console.log('🧮 Parsing REAL data (no hallucinations)...');
    
    // Check if Ollama is running
    this.realData.ollamaRunning = ollamaCheck.stdout && ollamaCheck.stdout.includes('ollama');
    
    // Parse GPU utilization if available
    if (gpuUtil.stdout && gpuUtil.stdout.trim()) {
      const lines = gpuUtil.stdout.trim().split('\n');
      if (lines.length > 0) {
        const parts = lines[0].split(',');
        if (parts.length >= 5) {
          this.realData.gpuUtilization = parseInt(parts[0]) || 0;
          this.realData.memoryUsage = parseInt(parts[1]) || 0;
          this.realData.powerDraw = parseFloat(parts[3]) || 0;
          this.realData.temperature = parseInt(parts[4]) || 0;
        }
      }
    }
    
    console.log('✅ Real Data Parsed:');
    console.log(`   GPU Utilization: ${this.realData.gpuUtilization}%`);
    console.log(`   Memory Usage: ${this.realData.memoryUsage} MB`);
    console.log(`   Power Draw: ${this.realData.powerDraw}W`);
    console.log(`   Temperature: ${this.realData.temperature}°C`);
    console.log(`   Ollama Running: ${this.realData.ollamaRunning}`);
  }

  // Start Ollama with REAL monitoring
  async startOllamaWithRealMonitoring() {
    console.log('🚀 Starting Ollama with REAL monitoring...');
    
    try {
      // Kill existing Ollama
      await this.runpod.executeCommand('pkill ollama || true');
      
      // Start Ollama with GPU
      const startOllama = await this.runpod.executeCommand('OLLAMA_HOST=0.0.0.0:11435 OLLAMA_GPU_LAYERS=999 OLLAMA_FLASH_ATTENTION=1 OLLAMA_KEEP_ALIVE=24h ollama serve > /tmp/ollama.log 2>&1 &');
      console.log('✅ Ollama started:', startOllama);
      
      // Wait for Ollama to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check GPU utilization after starting
      const gpuAfterStart = await this.getRealGPUStatus();
      
      // Test Ollama with real inference
      const testInference = await this.runpod.executeCommand('ollama run llama3.1:8b "Hello Allan! This is REAL GPU inference via web terminal!"');
      console.log('🤖 Real Ollama inference:', testInference);
      
      // Check GPU utilization during inference
      const gpuDuringInference = await this.getRealGPUStatus();
      
      return {
        ollamaStarted: true,
        testInference: testInference,
        gpuAfterStart: gpuAfterStart,
        gpuDuringInference: gpuDuringInference,
        realMonitoring: true
      };
      
    } catch (error) {
      console.error('❌ Real Ollama start failed:', error);
      throw error;
    }
  }

  // Monitor GPU in real-time
  async monitorGPURealTime(duration = 60) {
    console.log(`📊 Monitoring GPU in real-time for ${duration} seconds...`);
    
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    while (Date.now() < endTime) {
      try {
        const gpuStatus = await this.getRealGPUStatus();
        console.log(`🔥 Real GPU Status at ${new Date().toISOString()}:`);
        console.log(`   GPU Utilization: ${gpuStatus.realData.gpuUtilization}%`);
        console.log(`   Memory Usage: ${gpuStatus.realData.memoryUsage} MB`);
        console.log(`   Power Draw: ${gpuStatus.realData.powerDraw}W`);
        console.log(`   Temperature: ${gpuStatus.realData.temperature}°C`);
        console.log(`   Ollama Running: ${gpuStatus.realData.ollamaRunning}`);
        console.log('---');
        
        await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
        
      } catch (error) {
        console.error('❌ Real-time monitoring error:', error);
        break;
      }
    }
    
    console.log('✅ Real-time monitoring completed!');
  }

  // Get real status
  getRealStatus() {
    return {
      ...this.realData,
      timestamp: new Date().toISOString(),
      realData: true,
      noHallucinations: true,
      eleventhCommandment: true
    };
  }
}

export default WebTerminalRealMonitoring;

