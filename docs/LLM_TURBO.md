# Vengeance LLM Turbo (GPU-first)

### Goals
- Prioritize local RTX 4090 via Ollama + LiteLLM proxy.
- Default model: Qwen 2.5 7B; allow Llama 3.1/3.2 alternates.
- Simple endpoints for models, chat, and streaming (soon).
- Usage tracking and exception monitoring (planned).

### Current Setup
- LiteLLM on `http://localhost:4000` (pointing to Ollama).
- Vengeance Fastify server on `http://localhost:5055`.
- GPU env for Ollama:
  - `OLLAMA_NO_CPU_FALLBACK=1`
  - `OLLAMA_FLASH_ATTENTION=1`
  - `OLLAMA_GPU_LAYERS=999`
  - `OLLAMA_KEEP_ALIVE=24h`

Ensure `ollama serve` uses CUDA in WSL and `btop`/`nvidia-smi` show activity during prompts.

### How to Use (now)
- Models: `GET http://localhost:5055/models` → relays `http://localhost:4000/v1/models`
- Health: `GET http://localhost:5055/health`

Upcoming: `/chat` and `/chat/stream` in Vengeance to proxy LiteLLM and centralize logging.

### Cursor & Console
- Cursor: OpenAI-compatible endpoint `http://localhost:4000` (LiteLLM). Choose `ollama/qwen2.5:7b`.
- Console: `curl` to LiteLLM now; use Vengeance endpoints once added for streaming/usage.

### Performance Tips
- Prefer Qwen 2.5 7B for general work; switch to Llama 3.1 8B as needed.
- For long docs, raise `num_ctx` in Ollama model config.
- Watch `nvidia-smi` / `btop` to confirm GPU usage.

### Legal-safe Messaging (votes/announcements)
- Stick to facts and timestamps; avoid allegations/opinions.
- Use disclaimers: “unverified summary provided by initiator.”
- Mayor approves all public texts before release.
- Keep under 300 words; avoid character assertions.

### Troubleshooting GPU
- If CPU is pegged: remove snap Ollama; install official with CUDA in WSL.
- Export GPU env vars above and restart services.
- `ollama ps` should show GPU; logs should indicate flash-attention.

### Roadmap
- Vengeance `/chat` and `/chat/stream` SSE.
- SQLite usage tracking with hourly/daily rollups.
- Gaming mode signal to downshift model.
- TrendAnalyzer hooks for anomalies.
