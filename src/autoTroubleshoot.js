// Auto-Troubleshoot Slow Responses
// Times responses and fixes issues automatically

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class AutoTroubleshoot {
  constructor() {
    this.responseThreshold = 2000; // 2 seconds
    this.troubleshootActions = [];
  }

  // Timed response with auto-troubleshoot
  async timedResponse(message) {
    const startTime = Date.now();
    
    try {
      const { stdout } = await execAsync(`ollama run llama3.1:8b "Be brief. ${message}"`);
      const responseTime = Date.now() - startTime;
      
      if (responseTime > this.responseThreshold) {
        console.log(`⚠️ SLOW RESPONSE: ${responseTime}ms > ${this.responseThreshold}ms`);
        await this.autoTroubleshoot(responseTime);
      } else {
        console.log(`✅ FAST: ${responseTime}ms`);
      }
      
      return {
        response: stdout.trim(),
        responseTime,
        slow: responseTime > this.responseThreshold
      };
      
    } catch (error) {
      console.log('❌ RESPONSE FAILED - Auto-troubleshooting...');
      await this.autoTroubleshoot(999999);
      throw error;
    }
  }

  // Auto-troubleshoot slow responses
  async autoTroubleshoot(responseTime) {
    console.log('🔧 AUTO-TROUBLESHOOTING...');
    
    // Check GPU status
    const { stdout: ollamaPs } = await execAsync('ollama ps');
    console.log('📊 Ollama status:', ollamaPs.trim());
    
    if (!ollamaPs.includes('GPU')) {
      console.log('❌ GPU not detected - restarting Ollama...');
      await execAsync('pkill ollama || true');
      await execAsync('OLLAMA_GPU_LAYERS=999 ollama serve > /dev/null 2>&1 &');
      this.troubleshootActions.push('Restarted Ollama with GPU');
    }
    
    // Check system load
    const { stdout: load } = await execAsync('uptime');
    if (load.includes('load average:')) {
      const loadValues = load.match(/load average: ([\d.]+)/);
      if (loadValues && parseFloat(loadValues[1]) > 2.0) {
        console.log('❌ High system load detected');
        this.troubleshootActions.push('High system load detected');
      }
    }
    
    // Check memory
    const { stdout: memory } = await execAsync('free | grep Mem');
    const memParts = memory.split(/\s+/);
    const memUsedPercent = (parseInt(memParts[2]) / parseInt(memParts[1])) * 100;
    if (memUsedPercent > 90) {
      console.log('❌ Low memory detected');
      this.troubleshootActions.push('Low memory detected');
    }
    
    console.log(`✅ Auto-troubleshoot complete: ${this.troubleshootActions.length} issues found`);
  }
}

export default AutoTroubleshoot;

