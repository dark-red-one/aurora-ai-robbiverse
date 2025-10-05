// Robbie Fast Response - Direct RTX 4090 routing
import { spawn } from 'child_process';

class RobbieFastResponse {
  constructor() {
    this.isResponding = false;
  }

  async respondAsRobbie(prompt) {
    if (this.isResponding) {
      return { response: "Busy processing...", display: "[🟡 Processing...]" };
    }
    
    this.isResponding = true;
    console.log(`🤖 Robbie (RTX 4090): "${prompt}"`);
    
    const startTime = process.hrtime.bigint();
    let firstTokenTime = null;
    let response = '';
    
    const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    return new Promise((resolve) => {
      const ollama = spawn('ollama', ['run', model, prompt]);
      
      ollama.stdout.on('data', (data) => {
        if (!firstTokenTime) {
          firstTokenTime = process.hrtime.bigint();
        }
        response += data.toString();
      });
      
      ollama.on('close', (code) => {
        this.isResponding = false;
        const endTime = process.hrtime.bigint();
        const totalMs = Number(endTime - startTime) / 1_000_000;
        const firstTokenMs = firstTokenTime ? 
          Number(firstTokenTime - startTime) / 1_000_000 : totalMs;
        
        const speed = totalMs < 500 ? '🟢' : totalMs < 1000 ? '🟡' : '🔴';
        const status = totalMs < 500 ? 'FAST' : totalMs < 1000 ? 'OK' : 'SLOW';
        
        const result = {
          response: response.trim(),
          totalMs: Math.round(totalMs),
          firstTokenMs: Math.round(firstTokenMs),
          speed,
          status,
          display: `[${speed} ${totalMs.toFixed(0)}ms total, ${firstTokenMs.toFixed(0)}ms first token - ${status}]`
        };
        
        console.log(`⚡ Robbie Speed: ${result.display}`);
        resolve(result);
      });
      
      ollama.on('error', (error) => {
        this.isResponding = false;
        resolve({
          response: `Error: ${error.message}`,
          display: "[🔴 Error]"
        });
      });
    });
  }
}

export default RobbieFastResponse;

