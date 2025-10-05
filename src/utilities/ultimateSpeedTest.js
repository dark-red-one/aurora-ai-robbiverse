// Ultimate Speed Test - Real RTX 4090 performance
import { spawn } from 'child_process';

class UltimateSpeedTest {
  async testSpeed(prompt) {
    console.log(`🚀 Testing: "${prompt}"`);
    
    const startTime = process.hrtime.bigint();
    let firstTokenTime = null;
    let response = '';
    
    return new Promise((resolve) => {
      const ollama = spawn('ollama', ['run', 'llama3.1:8b', prompt]);
      
      ollama.stdout.on('data', (data) => {
        if (!firstTokenTime) {
          firstTokenTime = process.hrtime.bigint();
        }
        response += data.toString();
      });
      
      ollama.on('close', (code) => {
        const endTime = process.hrtime.bigint();
        const totalMs = Number(endTime - startTime) / 1_000_000;
        const firstTokenMs = firstTokenTime ? 
          Number(firstTokenTime - startTime) / 1_000_000 : totalMs;
        
        const speed = totalMs < 500 ? '🟢' : totalMs < 1000 ? '🟡' : '🔴';
        const status = totalMs < 500 ? 'FAST' : totalMs < 1000 ? 'OK' : 'SLOW';
        
        console.log(`⚡ Speed: [${speed} ${totalMs.toFixed(0)}ms total, ${firstTokenMs.toFixed(0)}ms first token - ${status}]`);
        console.log(`💬 Response: ${response.trim().substring(0, 100)}...`);
        
        resolve({
          response: response.trim(),
          totalMs: Math.round(totalMs),
          firstTokenMs: Math.round(firstTokenMs),
          speed,
          status
        });
      });
    });
  }
  
  async runSpeedTests() {
    console.log('🔥 RTX 4090 Speed Test Suite');
    console.log('============================');
    
    const tests = [
      "Hi",
      "What's our revenue target?",
      "Are we alone?",
      "Protect the president!",
      "Generate a quick business strategy"
    ];
    
    for (const test of tests) {
      await this.testSpeed(test);
      console.log('---');
    }
  }
}

export default UltimateSpeedTest;

