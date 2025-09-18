// SSH Real Monitoring - 11th Commandment: Always use tools to mitigate hallucinations!
// SSH for real GPU data, no more fake numbers!

import { Client } from 'ssh2';
import { readFileSync } from 'fs';

class SSHRealMonitoring {
  constructor() {
    this.sshClient = new Client();
    this.connected = false;
    this.connectionConfig = {
      host: '209.104.217.10',
      port: 12483,
      username: 'root',
      privateKey: readFileSync('/home/allan/.ssh/id_ed25519'),
      readyTimeout: 20000,
      keepaliveInterval: 10000
    };
  }

  // Connect via SSH
  async connect() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting via SSH to RunPod B200...');
      
      this.sshClient.on('ready', () => {
        console.log('✅ SSH Connected to RunPod B200!');
        this.connected = true;
        resolve(true);
      });

      this.sshClient.on('error', (err) => {
        console.error('❌ SSH Connection failed:', err.message);
        this.connected = false;
        reject(err);
      });

      this.sshClient.connect(this.connectionConfig);
    });
  }

  // Execute command via SSH and get REAL output
  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('SSH not connected'));
        return;
      }

      console.log(`⚡ SSH Command: ${command}`);
      
      this.sshClient.exec(command, (err, stream) => {
        if (err) {
          console.error('❌ SSH Command failed:', err);
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code, signal) => {
          console.log(`✅ SSH Command completed with code: ${code}`);
          resolve({
            command: command,
            stdout: stdout,
            stderr: stderr,
            exitCode: code,
            signal: signal,
            timestamp: new Date().toISOString()
          });
        });

        stream.on('data', (data) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    });
  }

  // Get REAL GPU status via SSH
  async getRealGPUStatus() {
    console.log('🔥 Getting REAL GPU status via SSH...');
    
    try {
      // Check nvidia-smi
      const nvidiaSmi = await this.executeCommand('nvidia-smi');
      console.log('📊 Real nvidia-smi output:', nvidiaSmi.stdout);
      
      // Check GPU utilization
      const gpuUtil = await this.executeCommand('nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,power.draw,temperature.gpu --format=csv,noheader,nounits');
      console.log('📊 Real GPU utilization:', gpuUtil.stdout);
      
      // Check GPU processes
      const gpuProcesses = await this.executeCommand('nvidia-smi pmon -c 1');
      console.log('📋 Real GPU processes:', gpuProcesses.stdout);
      
      // Check if Ollama is running
      const ollamaCheck = await this.executeCommand('ps aux | grep ollama');
      console.log('🤖 Real Ollama processes:', ollamaCheck.stdout);
      
      return {
        nvidiaSmi: nvidiaSmi.stdout,
        gpuUtilization: gpuUtil.stdout,
        gpuProcesses: gpuProcesses.stdout,
        ollamaProcesses: ollamaCheck.stdout,
        realData: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Real GPU status check failed:', error);
      throw error;
    }
  }

  // Start Ollama with REAL GPU monitoring
  async startOllamaWithRealMonitoring() {
    console.log('🚀 Starting Ollama with REAL GPU monitoring...');
    
    try {
      // Kill existing Ollama
      await this.executeCommand('pkill ollama || true');
      
      // Start Ollama with GPU
      const startOllama = await this.executeCommand('OLLAMA_HOST=0.0.0.0:11435 OLLAMA_GPU_LAYERS=999 OLLAMA_FLASH_ATTENTION=1 OLLAMA_KEEP_ALIVE=24h ollama serve > /tmp/ollama.log 2>&1 &');
      console.log('✅ Ollama started:', startOllama.stdout);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check GPU utilization after starting
      const gpuAfterStart = await this.getRealGPUStatus();
      
      // Test Ollama with real inference
      const testInference = await this.executeCommand('ollama run llama3.1:8b "Hello Allan! This is REAL GPU inference via SSH!"');
      console.log('🤖 Real Ollama inference:', testInference.stdout);
      
      // Check GPU utilization during inference
      const gpuDuringInference = await this.getRealGPUStatus();
      
      return {
        ollamaStarted: true,
        testInference: testInference.stdout,
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
        console.log(`   GPU Utilization: ${gpuStatus.gpuUtilization}`);
        console.log(`   Memory Usage: ${gpuStatus.gpuProcesses}`);
        console.log(`   Ollama Running: ${gpuStatus.ollamaProcesses.includes('ollama')}`);
        console.log('---');
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
        
      } catch (error) {
        console.error('❌ Real-time monitoring error:', error);
        break;
      }
    }
    
    console.log('✅ Real-time monitoring completed!');
  }

  // Disconnect SSH
  async disconnect() {
    if (this.connected) {
      this.sshClient.end();
      this.connected = false;
      console.log('🔌 SSH disconnected');
    }
  }
}

export default SSHRealMonitoring;

