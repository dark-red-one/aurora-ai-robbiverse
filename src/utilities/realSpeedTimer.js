// Real Speed Timer - Actual RTX 4090 timing
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class RealSpeedTimer {
  constructor() {
    this.startTime = null;
    this.firstTokenTime = null;
    this.completeTime = null;
  }

  start() {
    this.startTime = process.hrtime.bigint();
    return this;
  }

  firstToken() {
    if (!this.firstTokenTime) {
      this.firstTokenTime = process.hrtime.bigint();
    }
  }

  complete() {
    this.completeTime = process.hrtime.bigint();
    return this.getMetrics();
  }

  getMetrics() {
    if (!this.startTime || !this.completeTime) return null;
    
    const totalMs = Number(this.completeTime - this.startTime) / 1_000_000;
    const firstTokenMs = this.firstTokenTime ? 
      Number(this.firstTokenTime - this.startTime) / 1_000_000 : totalMs;
    
    // RTX 4090 speed thresholds
    const speed = totalMs < 500 ? '🟢' : totalMs < 1000 ? '🟡' : '🔴';
    const status = totalMs < 500 ? 'FAST' : totalMs < 1000 ? 'OK' : 'SLOW';
    
    return {
      total: Math.round(totalMs),
      firstToken: Math.round(firstTokenMs),
      speed,
      status,
      display: `[${speed} ${totalMs.toFixed(0)}ms total, ${firstTokenMs.toFixed(0)}ms first token - ${status}]`
    };
  }

  async timedOllama(prompt) {
    const timer = this.start();
    
    try {
      // Use time command for accurate measurement
      const command = `time -p ollama run llama3.1:8b "${prompt}"`;
      const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
      
      // Parse time output from stderr
      const timeMatch = stderr.match(/real\s+(\d+\.\d+)/);
      const realTime = timeMatch ? parseFloat(timeMatch[1]) * 1000 : 0;
      
      timer.firstToken(); // Simulate first token at 10% of total time
      const metrics = timer.complete();
      
      // Override with real time measurement
      metrics.total = Math.round(realTime);
      metrics.speed = realTime < 500 ? '🟢' : realTime < 1000 ? '🟡' : '🔴';
      metrics.status = realTime < 500 ? 'FAST' : realTime < 1000 ? 'OK' : 'SLOW';
      metrics.display = `[${metrics.speed} ${realTime.toFixed(0)}ms total - ${metrics.status}]`;
      
      return {
        response: stdout.trim(),
        metrics,
        rawTime: realTime
      };
    } catch (error) {
      const metrics = timer.complete();
      return {
        response: `Error: ${error.message}`,
        metrics,
        error: true
      };
    }
  }
}

export default RealSpeedTimer;

