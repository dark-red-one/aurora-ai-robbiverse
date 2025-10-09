// Speed Monitor - Auto-fix slow responses
import { exec } from 'child_process';
const execAsync = require('util').promisify(exec);

class SpeedMonitor {
  async timedChat(msg) {
    const start = Date.now();
    const result = await execAsync(`ollama run llama3.1:8b "Brief: ${msg}"`);
    const time = Date.now() - start;
    
    if (time > 2000) {
      console.log(`❌ SLOW: ${time}ms - Auto-fixing...`);
      await execAsync('pkill ollama && OLLAMA_NUM_PREDICT=20 ollama serve &');
    } else {
      console.log(`✅ FAST: ${time}ms`);
    }
    
    return { response: result.stdout.trim(), time };
  }
}

export default SpeedMonitor;

