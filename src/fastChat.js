// Fast Chat - Maximum Speed Configuration
// Optimized for speed, not verbosity

import { spawn } from 'child_process';

class FastChat {
  constructor() {
    this.model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    this.fastParams = {
      'num_predict': 50,        // Limit response length
      'temperature': 0.3,       // Less creative, faster
      'top_p': 0.9,            // Focus on likely tokens
      'repeat_penalty': 1.1,    // Prevent loops
      'num_ctx': 1024          // Smaller context window
    };
  }

  // Ultra-fast chat response
  async fastResponse(message) {
    console.log(`⚡ Fast chat: "${message}"`);
    
    const startTime = Date.now();
    
    // Build optimized prompt
    const systemPrompt = "Be concise. Answer briefly.";
    const fullPrompt = `${systemPrompt} User: ${message}`;
    
    try {
      // Use spawn for real-time monitoring
      const ollamaArgs = [
        'run',
        this.model,
        '--parameter', `num_predict=${this.fastParams.num_predict}`,
        '--parameter', `temperature=${this.fastParams.temperature}`,
        '--parameter', `top_p=${this.fastParams.top_p}`,
        '--parameter', `repeat_penalty=${this.fastParams.repeat_penalty}`,
        '--parameter', `num_ctx=${this.fastParams.num_ctx}`,
        fullPrompt
      ];
      
      const process = spawn('ollama', ollamaArgs);
      
      let response = '';
      
      return new Promise((resolve, reject) => {
        process.stdout.on('data', (chunk) => {
          response += chunk.toString();
        });
        
        process.on('close', (code) => {
          const responseTime = Date.now() - startTime;
          
          if (code === 0) {
            console.log(`✅ Response time: ${responseTime}ms`);
            resolve({
              response: response.trim(),
              responseTime,
              fast: true
            });
          } else {
            reject(new Error(`Fast chat failed with code ${code}`));
          }
        });
        
        process.on('error', (error) => {
          reject(error);
        });
      });
      
    } catch (error) {
      console.error('❌ Fast chat failed:', error);
      throw error;
    }
  }

  // Speed test
  async speedTest() {
    console.log('🚀 Running speed test...');
    
    const tests = [
      'Hi',
      'Yes',
      'No',
      'Maybe',
      'Help'
    ];
    
    const results = [];
    
    for (const test of tests) {
      const result = await this.fastResponse(test);
      results.push(result);
      console.log(`"${test}" -> ${result.responseTime}ms: "${result.response}"`);
    }
    
    const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    console.log(`📊 Average response time: ${avgTime.toFixed(2)}ms`);
    
    return {
      results,
      avgTime,
      fast: avgTime < 1000
    };
  }
}

export default FastChat;

