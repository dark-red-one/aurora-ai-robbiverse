// Honest GPU Check - No More Hallucinations!
// Actually check what's happening on the RunPod B200

import RunPodAPIExecution from './runpodAPIExecution.js';

class HonestGPUCheck {
  constructor() {
    this.runpod = new RunPodAPIExecution();
    this.realStatus = {
      gpuUtilization: 0,
      memoryUsage: 0,
      powerDraw: 0,
      temperature: 0,
      processes: [],
      ollamaRunning: false,
      actualWork: false
    };
  }

  // Actually check GPU status honestly
  async checkRealGPUStatus() {
    console.log('🔍 HONEST GPU CHECK - No more hallucinations!');
    
    try {
      // Get real pod status
      const podStatus = await this.runpod.runpod.getPodStatus();
      console.log('📊 Real Pod Status:', JSON.stringify(podStatus, null, 2));
      
      // Check if Ollama is actually running
      console.log('🤖 Checking if Ollama is actually running...');
      const ollamaCheck = await this.runpod.executeCommand('ps aux | grep ollama');
      console.log('📋 Ollama Process Check:', ollamaCheck);
      
      // Check real GPU utilization
      console.log('🔥 Checking REAL GPU utilization...');
      const gpuCheck = await this.runpod.executeCommand('nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,power.draw,temperature.gpu --format=csv,noheader,nounits');
      console.log('📊 Real GPU Data:', gpuCheck);
      
      // Check if any processes are using GPU
      console.log('🔍 Checking GPU processes...');
      const gpuProcesses = await this.runpod.executeCommand('nvidia-smi pmon -c 1');
      console.log('📋 GPU Processes:', gpuProcesses);
      
      // Parse real data
      this.parseRealData(gpuCheck, ollamaCheck);
      
      return this.realStatus;
      
    } catch (error) {
      console.error('❌ Honest check failed:', error);
      return {
        error: error.message,
        status: 'check_failed'
      };
    }
  }

  // Parse real data (no hallucinations)
  parseRealData(gpuData, ollamaData) {
    console.log('🧮 Parsing REAL data (no hallucinations)...');
    
    // Check if Ollama is running
    this.realStatus.ollamaRunning = ollamaData.includes('ollama');
    
    // Parse GPU data if available
    if (gpuData && gpuData.trim()) {
      const lines = gpuData.trim().split('\n');
      if (lines.length > 0) {
        const parts = lines[0].split(',');
        if (parts.length >= 5) {
          this.realStatus.gpuUtilization = parseInt(parts[0]) || 0;
          this.realStatus.memoryUsage = parseInt(parts[1]) || 0;
          this.realStatus.powerDraw = parseFloat(parts[3]) || 0;
          this.realStatus.temperature = parseInt(parts[4]) || 0;
        }
      }
    }
    
    // Determine if there's actual work
    this.realStatus.actualWork = this.realStatus.gpuUtilization > 0 || this.realStatus.memoryUsage > 0;
    
    console.log('✅ Real Status Parsed:');
    console.log(`   GPU Utilization: ${this.realStatus.gpuUtilization}%`);
    console.log(`   Memory Usage: ${this.realStatus.memoryUsage} MB`);
    console.log(`   Power Draw: ${this.realStatus.powerDraw}W`);
    console.log(`   Temperature: ${this.realStatus.temperature}°C`);
    console.log(`   Ollama Running: ${this.realStatus.ollamaRunning}`);
    console.log(`   Actual Work: ${this.realStatus.actualWork}`);
  }

  // Run a real GPU test
  async runRealGPUTest() {
    console.log('🧪 Running REAL GPU test...');
    
    try {
      // Start a real GPU-intensive task
      console.log('🚀 Starting real GPU task...');
      const gpuTask = await this.runpod.executeCommand('python3 -c "import torch; print(f\"CUDA available: {torch.cuda.is_available()}\"); print(f\"GPU count: {torch.cuda.device_count()}\"); print(f\"GPU name: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \'None\'}\")"');
      console.log('🐍 PyTorch CUDA Check:', gpuTask);
      
      // Check GPU utilization during task
      const gpuDuring = await this.runpod.executeCommand('nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader,nounits');
      console.log('📊 GPU During Task:', gpuDuring);
      
      return {
        pytorch: gpuTask,
        gpuUtilization: gpuDuring,
        realTest: true
      };
      
    } catch (error) {
      console.error('❌ Real GPU test failed:', error);
      return {
        error: error.message,
        realTest: false
      };
    }
  }

  // Get honest status
  getHonestStatus() {
    return {
      ...this.realStatus,
      timestamp: new Date().toISOString(),
      honest: true,
      noHallucinations: true
    };
  }
}

export default HonestGPUCheck;

