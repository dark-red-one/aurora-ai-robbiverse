#!/usr/bin/env node

// Simple latency probe for local Ollama. Measures time-to-first-byte (TTFB)
// and total time for a short streamed generation. Prints JSON and a compact line.

const DEFAULT_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const promptFromArgs = process.argv.slice(2).join(' ') || 'Say OK.';

function nowNs() {
  return process.hrtime.bigint();
}

function nsToMs(nsBigInt) {
  return Number(nsBigInt) / 1e6;
}

function colorBadge(ms) {
  if (ms < 250) return 'G';
  if (ms < 700) return 'Y';
  return 'R';
}

async function measureLatency({ endpoint, model, prompt }) {
  const url = `${endpoint}/api/generate`;
  const body = {
    model,
    prompt,
    stream: true,
    options: {
      temperature: 0.2,
      num_ctx: 4096,
      repeat_penalty: 1.1
    }
  };

  const startNs = nowNs();
  let firstByteNs = null;
  let totalBytes = 0;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const reader = response.body.getReader();
  // Read chunks until stream ends
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value && value.length > 0) {
      if (!firstByteNs) firstByteNs = nowNs();
      totalBytes += value.length;
    }
  }
  const endNs = nowNs();

  const ttfbMs = nsToMs((firstByteNs ?? endNs) - startNs);
  const totalMs = nsToMs(endNs - startNs);
  return {
    endpoint,
    model,
    promptBytes: Buffer.byteLength(prompt, 'utf8'),
    totalBytes,
    ttfb_ms: Math.round(ttfbMs),
    total_ms: Math.round(totalMs),
    badge: colorBadge(ttfbMs)
  };
}

(async () => {
  try {
    const result = await measureLatency({
      endpoint: DEFAULT_ENDPOINT,
      model: DEFAULT_MODEL,
      prompt: promptFromArgs
    });
    console.log(JSON.stringify(result));
    console.log(`TTFB ${result.ttfb_ms}ms | Total ${result.total_ms}ms | ${result.badge}`);
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
})();


