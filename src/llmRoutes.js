import { exec } from "child_process";
import { randomUUID } from "crypto";
import fs from "fs";
import { fetch } from "undici";
import { db } from "./db.js";
import { usageTracker } from "./usageTracker.js";

const LITELLM_BASE = process.env.LITELLM_BASE || "http://localhost:23936";
// Optimized model stack per Robbie's recommendations (October 2024)
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "llama3.1:8b"; // Primary: Best for Robbie's personality

export async function registerLLMRoutes(app) {
  app.log.info({ LITELLM_BASE, DEFAULT_MODEL }, "Registering LLM routes");
  // Fallback chain: llama3.1:8b → qwen2.5:7b → mistral:7b
  const FALLBACK_MODEL = process.env.FALLBACK_MODEL || "qwen2.5:7b"; // Coding tasks
  const BACKUP_MODEL = process.env.BACKUP_MODEL || "mistral:7b"; // Complex analysis

  async function postChat(payload) {
    // Try primary, then fallback models automatically
    // Model selection per Robbie's optimization: llama3.1:8b → qwen2.5:7b → mistral:7b
    const candidateModels = [payload.model || DEFAULT_MODEL, FALLBACK_MODEL, BACKUP_MODEL]; // ordered attempts
    let lastText = null;
    let lastRes = null;
    let usedModel = candidateModels[0];
    for (const candidate of candidateModels) {
      const attemptPayload = { ...payload, model: candidate };
      try {
        const res = await fetch(`${LITELLM_BASE}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": "Bearer sk-fake-key-for-local"
          },
          body: JSON.stringify(attemptPayload)
        });
        const text = await res.text();
        lastRes = res; lastText = text; usedModel = candidate;
        // consider success if HTTP OK and no top-level error field
        let ok = res.ok;
        try { const j = JSON.parse(text); if (j.error) ok = false; } catch { }
        if (ok) return { res, text, model: usedModel };
      } catch (e) {
        lastText = JSON.stringify({ error: e.message });
      }
    }
    return { res: lastRes, text: lastText, model: usedModel };
  }
  app.get("/llm/models", async () => {
    const res = await fetch(`${LITELLM_BASE}/v1/models`, {
      headers: { "authorization": "Bearer sk-fake-key-for-local" }
    });
    return res.json();
  });

  app.post("/llm/chat", async (request, reply) => {
    const { messages, model, temperature, max_tokens, stream } = request.body || {};
    const payload = {
      model: model || DEFAULT_MODEL,
      messages: messages || [],
      temperature: temperature ?? 0.6,
      max_tokens: max_tokens ?? 1024,
      stream: !!stream
    };
    const started = Date.now();
    const reqId = randomUUID();
    const { res, text, model: usedModel } = await postChat(payload);
    reply.headers({ "content-type": (res && res.headers && res.headers.get("content-type")) || "application/json" });
    try {
      const json = JSON.parse(text);
      const usage = json.usage || {};
      db.prepare(
        `INSERT INTO llm_usage (id, request_id, provider, model, input_tokens, output_tokens, total_tokens, duration_ms, success, error_message)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
      ).run(
        randomUUID(),
        reqId,
        'litellm',
        usedModel,
        usage.prompt_tokens ?? usage.input_tokens ?? 0,
        usage.completion_tokens ?? usage.output_tokens ?? 0,
        usage.total_tokens ?? ((usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0)),
        Date.now() - started,
        (res && res.ok) ? 1 : 0,
        (res && res.ok) ? null : (json.error?.message || (res ? `HTTP ${res.status}` : 'no_response'))
      );

      // Comprehensive usage tracking
      const latency = Date.now() - started;
      const inputTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
      const outputTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;
      const totalTokens = usage.total_tokens ?? (inputTokens + outputTokens);
      // Cost calculation: Local models are free, external models cost
      const costUsd = (usedModel.includes('gpt') || usedModel.includes('claude') || usedModel.includes('gemini')) ?
        totalTokens * 0.0001 : 0.0; // Only charge for external API calls

      usageTracker.trackApiCall({
        service: 'llm',
        endpoint: '/v1/chat/completions',
        model: usedModel,
        method: 'POST',
        requestSize: JSON.stringify(payload).length,
        responseSize: text.length,
        inputTokens,
        outputTokens,
        totalTokens,
        latencyMs: latency,
        costUsd,
        success: res && res.ok,
        errorMessage: (res && res.ok) ? null : (json.error?.message || (res ? `HTTP ${res.status}` : 'no_response')),
        userId: 'robbie',
        sessionId: reqId,
        modelFlags: {
          temperature: payload.temperature,
          max_tokens: payload.max_tokens,
          stream: payload.stream
        }
      });
    } catch (e) {
      db.prepare(
        `INSERT INTO llm_usage (id, request_id, provider, model, duration_ms, success, error_message)
         VALUES (?,?,?,?,?,?,?)`
      ).run(randomUUID(), reqId, 'litellm', usedModel, Date.now() - started, 0, e.message);

      // Track failed request comprehensively
      const latency = Date.now() - started;
      usageTracker.trackApiCall({
        service: 'llm',
        endpoint: '/v1/chat/completions',
        model: usedModel,
        method: 'POST',
        requestSize: JSON.stringify(payload).length,
        responseSize: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        latencyMs: latency,
        costUsd: 0.0,
        success: false,
        errorMessage: e.message,
        userId: 'robbie',
        sessionId: reqId,
        modelFlags: {
          temperature: payload.temperature,
          max_tokens: payload.max_tokens,
          stream: payload.stream
        }
      });
    }
    return text;
  });

  app.post("/llm/chat/stream", async (request, reply) => {
    const { messages, model, temperature, max_tokens } = request.body || {};
    const payload = {
      model: model || DEFAULT_MODEL,
      messages: messages || [],
      temperature: temperature ?? 0.6,
      max_tokens: max_tokens ?? 1024,
      stream: true
    };
    // Try primary, then fallbacks for streaming as well
    const candidates = [payload.model || DEFAULT_MODEL, FALLBACK_MODEL, "llama3-8b-local"];
    let res = null;
    for (const candidate of candidates) {
      const attempt = { ...payload, model: candidate };
      res = await fetch(`${LITELLM_BASE}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": "Bearer sk-fake-key-for-local"
        },
        body: JSON.stringify(attempt)
      });
      if (res.ok) break;
    }

    reply.raw.writeHead(200, {
      "Content-Type": res.headers.get("content-type") || "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked",
      "Access-Control-Allow-Origin": "*"
    });

    const nodeStream = res.body?.pipe ? res.body : null;
    if (nodeStream) {
      nodeStream.pipe(reply.raw);
      nodeStream.on("end", () => { try { reply.raw.end(); } catch { } });
      nodeStream.on("error", () => { try { reply.raw.end(); } catch { } });
    } else {
      const text = await res.text();
      reply.raw.write(text);
      reply.raw.end();
    }

    return reply;
  });

  // Simple status proxy for GPU/health (LiteLLM may not expose; placeholder)
  app.get("/llm/status", async () => ({
    litellm: LITELLM_BASE,
    default_model: DEFAULT_MODEL
  }));

  // expose last proxy hits (for quick debug)
  app.get("/llm/access/recent", async () => {
    const rows = db.prepare('SELECT method, path, user_agent, status, created_at FROM proxy_access ORDER BY id DESC LIMIT 20').all();
    return { rows };
  });

  // Recent usage (no sqlite client needed)
  app.get("/llm/usage/recent", async () => {
    const rows = db
      .prepare(
        "SELECT provider, model, input_tokens, output_tokens, total_tokens, duration_ms, success, created_at FROM llm_usage ORDER BY rowid DESC LIMIT 20"
      )
      .all();
    return { rows };
  });

  // Comprehensive usage analytics endpoints
  app.get("/llm/analytics/usage", async (request) => {
    const { service = 'llm', days = 7 } = request.query || {};
    const analytics = usageTracker.getUsageAnalytics(service, parseInt(days));
    return { analytics };
  });

  app.get("/llm/analytics/costs", async (request) => {
    const { days = 30 } = request.query || {};
    const trends = usageTracker.getCostTrends(parseInt(days));
    return { trends };
  });

  app.get("/llm/analytics/models", async () => {
    const performance = usageTracker.getModelPerformance();
    return { performance };
  });

  app.get("/llm/analytics/expensive", async (request) => {
    const { limit = 10 } = request.query || {};
    const expensive = usageTracker.getTopExpensiveOperations(parseInt(limit));
    return { expensive };
  });

  app.get("/llm/analytics/cost-per-token", async () => {
    const costPerToken = usageTracker.getCostPerToken();
    return { costPerToken };
  });

  // GPU verification: check ollama PID, env flags, and loaded CUDA libs
  app.get("/llm/gpu/verify", async () => {
    const result = {
      listening: false,
      pid: null,
      env: {},
      cudaLibsDetected: false,
      sampleLibs: [],
      errors: []
    };

    try {
      // find PID listening on 11434
      const ssOutput = await new Promise((resolve) => {
        exec("ss -ltnp", (err, stdout) => resolve(stdout || ""));
      });
      const line = (ssOutput || "").split("\n").find((l) => l.includes(":11434 ")) || "";
      const pidMatch = line.match(/pid=(\d+)/);
      if (pidMatch) {
        result.listening = true;
        result.pid = parseInt(pidMatch[1], 10);
      } else {
        result.errors.push("no_pid_found_on_11434");
      }

      if (!result.pid) {
        // fallback: pgrep ollama
        const pgrepOut = await new Promise((resolve) => {
          exec("pgrep -f 'ollama serve' || pgrep -f ollama || true", (err, stdout) => resolve(stdout || ""));
        });
        const pid = (pgrepOut.split(/\s+/).filter(Boolean)[0]) || null;
        if (pid) result.pid = parseInt(pid, 10);
      }

      if (result.pid) {
        // read env
        try {
          const envRaw = fs.readFileSync(`/proc/${result.pid}/environ`);
          const envStr = envRaw.toString().split("\0");
          const kv = Object.fromEntries(envStr.filter(Boolean).map((e) => {
            const idx = e.indexOf("=");
            return [e.slice(0, idx), e.slice(idx + 1)];
          }));
          const keys = [
            "OLLAMA_NO_CPU_FALLBACK",
            "OLLAMA_FLASH_ATTENTION",
            "OLLAMA_GPU_LAYERS",
            "OLLAMA_KEEP_ALIVE",
            "CUDA_VISIBLE_DEVICES",
          ];
          for (const k of keys) result.env[k] = kv[k] ?? null;
        } catch (e) {
          result.errors.push("read_environ_failed");
        }

        // read maps for CUDA libs
        try {
          const maps = fs.readFileSync(`/proc/${result.pid}/maps`).toString();
          const lines = maps.split("\n").filter((l) => /nvidia|cuda|cublas|cudart/i.test(l));
          result.sampleLibs = lines.slice(0, 10);
          result.cudaLibsDetected = lines.length > 0;
        } catch (e) {
          result.errors.push("read_maps_failed");
        }
      } else {
        result.errors.push("no_pid_available");
      }
    } catch (e) {
      result.errors.push("verify_exception");
    }

    return result;
  });
}


