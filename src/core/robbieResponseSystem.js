// Robbie Response System - Real GPU timing (streamed via Ollama HTTP API)
import ResponseTimer, { timer, metricsSuffix } from './responseTimer.js';

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

class RobbieResponseSystem {
  constructor() {
    this.rtx4090 = true;
    this.targetSpeed = 200; // ms target for RTX 4090
  }

  async respond(prompt) {
    const responseTimer = new ResponseTimer().start();

    try {
      const url = `${OLLAMA_ENDPOINT}/api/generate`;
      const body = {
        model: OLLAMA_MODEL,
        prompt,
        stream: true,
        options: {
          temperature: 0.2,
          num_ctx: 4096,
          repeat_penalty: 1.1
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value && value.length > 0) {
          if (!responseTimer.firstTokenTime) responseTimer.firstToken();
          fullText += decoder.decode(value, { stream: true });
        }
      }

      const metrics = responseTimer.complete();
      const response = fullText.trim();

      const suffix = metricsSuffix(metrics);
      console.log(`🤖 Robbie Response: ${response}${suffix}`);
      console.log(`⚡ Speed: ${metrics.display}`);

      return { response, metrics };
    } catch (error) {
      const metrics = responseTimer.complete();
      console.error(`❌ Error: ${error.message}`);
      const suffix = metrics ? metricsSuffix(metrics) : '';
      console.log(`⚡ Speed: ${metrics?.display ?? ''}`);
      return { response: `Error: ${error.message}${suffix}`, metrics };
    }
  }

  async speedTest() {
    console.log('🚀 Running RTX 4090 Speed Test...');
    const tests = [
      "Hi",
      "What's our revenue target?",
      "Are we alone?",
      "Protect the president!",
      "Generate a quick business strategy"
    ];

    for (const test of tests) {
      await this.respond(test);
      await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause
    }
  }
}

export default RobbieResponseSystem;
