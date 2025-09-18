import Fastify from "fastify";
import os from "os";
import { fetch } from "undici";
import { db, initializeSchema } from "./db.js";
import { registerBanishmentRoutes } from "./banishmentRoutes.js";
import { startScheduler } from "./scheduler.js";
import { registerLLMRoutes } from "./llmRoutes.js";
import { registerGovernanceRoutes } from "./routesGovernance.js";
import { registerQuotesRoutes } from "./routesQuotes.js";
import { registerCharacterRoutes } from "./routesCharacters.js";
import { registerAnalyticsRoutes } from "./analyticsDashboard.js";
import { bbsInterface } from "./bbsInterface.js";
import { directGPU } from "./directGPU.js";
import { workTracker } from "./workTracker.js";
import { characterFilter } from "./characterFilter.js";
import { credentialsManager } from "./credentials.js";

const app = Fastify({ logger: true });

// Minimal access logger to verify Cursor hits Vengeance
app.addHook('onResponse', async (request, reply) => {
  try {
    const ua = request.headers['user-agent'] || '';
    db.prepare('INSERT INTO proxy_access (method, path, user_agent, status) VALUES (?,?,?,?)')
      .run(request.method, request.url, ua, reply.statusCode || 0);
  } catch {}
});

app.get("/health", async () => ({ status: "ok", host: os.hostname(), time: new Date().toISOString() }));

// BBS Interface Route
app.get('/', async (request, reply) => {
  const html = bbsInterface.generateInterface();
  reply.headers({ 'content-type': 'text/html; charset=utf-8' }).send(html);
});

// Legacy terminal interface
app.get('/terminal', async (request, reply) => {
  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Vengeance Terminal</title>
<style>
/* Cursor + Databox Hybrid Aesthetic */
:root {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d30;
  --border: #3c3c3c;
  --border-light: #464647;
  --text-primary: #cccccc;
  --text-secondary: #969696;
  --accent: #007acc;
  --accent-hover: #1177bb;
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
  font-family: var(--font-mono); 
  background: var(--bg-primary); 
  color: var(--text-primary);
  line-height: 1.4;
  overflow: hidden;
}

.terminal {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.status {
  display: flex;
  gap: 16px;
}

.status span {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  font-size: 11px;
}

.chat {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-size: 13px;
  line-height: 1.4;
}

.message {
  margin-bottom: 8px;
  word-wrap: break-word;
}

.user { color: var(--accent); }
.ai { color: var(--text-primary); }
.system { color: var(--text-secondary); font-style: italic; }

.input-area {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 12px 16px;
  display: flex;
  gap: 8px;
}

#input {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: 13px;
  border-radius: 4px;
}

#input:focus {
  outline: none;
  border-color: var(--accent);
}

.btn {
  background: var(--accent);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 12px;
}

.btn:hover { background: var(--accent-hover); }

/* Scrollbar styling */
.chat::-webkit-scrollbar { width: 8px; }
.chat::-webkit-scrollbar-track { background: var(--bg-secondary); }
.chat::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.chat::-webkit-scrollbar-thumb:hover { background: var(--border-light); }
</style>
</head>
<body>
<div class="terminal">
  <div class="header">
    <div class="status">
      <span>Vengeance Terminal</span>
      <span>GPU: Active</span>
      <span>Models: Loaded</span>
    </div>
  </div>
  <div id="chat" class="chat"></div>
  <div class="input-area">
    <input type="text" id="input" placeholder="Type a message or command..." autocomplete="off">
    <button class="btn" onclick="sendMessage()">Send</button>
  </div>
</div>

<script>
// Client-side JavaScript for terminal interface
const chat = document.getElementById('chat');
const input = document.getElementById('input');

function addMessage(text, sender) {
  const div = document.createElement('div');
  div.className = 'message ' + sender;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function sendMessage() {
  const message = input.value.trim();
  if (!message) return;
  
  addMessage(message, 'user');
  input.value = '';
  
  if (message.startsWith('/')) {
    handleCommand(message);
    return;
  }
  
  // Send to backend
  fetch('/llm/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
  .then(r => r.json())
  .then(data => {
    addMessage(data.response, 'ai');
  })
  .catch(e => {
    addMessage('Error: ' + e.message, 'system');
  });
}

function handleCommand(cmd) {
  switch(cmd) {
    case '/help':
      addMessage('Commands: /help, /clear, /status, /models', 'system');
      break;
    case '/clear':
      chat.innerHTML = '';
      break;
    case '/status':
      fetch('/health').then(r => r.json()).then(d => addMessage('Status: ' + JSON.stringify(d), 'system'));
      break;
    case '/models':
      fetch('/llm/models').then(r => r.json()).then(d => addMessage('Models: ' + JSON.stringify(d.data?.map(m => m.id) || []), 'system'));
      break;
    default:
      addMessage('Unknown command: ' + cmd, 'system');
  }
}

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

input.focus();
addMessage('Terminal ready. Type /help for commands.', 'system');
</script>
</body></html>`;
  reply.headers({ 'content-type': 'text/html; charset=utf-8' }).send(html);
});

app.get("/models", async () => {
  try {
    const res = await fetch("http://localhost:4000/v1/models");
    const data = await res.json();
    return { source: "litellm", ...data };
  } catch (e) {
    return { source: "litellm", error: e.message };
  }
});

// BBS Interface Routes
app.post('/bbs/message', async (request, reply) => {
  const { channel, username, message, messageType = 'text', metadata = {} } = request.body;
  
  try {
    const result = await bbsInterface.addMessage(channel, username, message, messageType, metadata);
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

app.get('/bbs/messages/:channel', async (request, reply) => {
  const { channel } = request.params;
  const { limit = 50 } = request.query;
  
  try {
    const messages = await bbsInterface.getMessages(channel, parseInt(limit));
    return { messages };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

app.get('/bbs/hashtags/trending', async (request, reply) => {
  const { limit = 10 } = request.query;
  
  try {
    const hashtags = await bbsInterface.getTrendingHashtags(parseInt(limit));
    return { hashtags };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Direct GPU Routes
app.post('/gpu/generate', async (request, reply) => {
  const { prompt, model = 'llama-maverick', temperature = 0.7, max_tokens = 1024 } = request.body;
  
  try {
    const result = await directGPU.generateText(prompt, { model, temperature, max_tokens });
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

app.post('/gpu/stream', async (request, reply) => {
  const { prompt, model = 'llama-maverick', temperature = 0.7, max_tokens = 1024 } = request.body;
  
  try {
    reply.headers({ 'Content-Type': 'text/plain' });
    
    await directGPU.generateTextStream(prompt, { model, temperature, max_tokens }, (chunk) => {
      reply.raw.write(chunk);
    });
    
    reply.raw.end();
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

app.get('/gpu/models', async (request, reply) => {
  try {
    const models = await directGPU.getAvailableModels();
    return { models };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

app.get('/gpu/stats', async (request, reply) => {
  try {
    const stats = await directGPU.getGPUStats();
    return stats;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Work Tracker Routes
app.post('/work/create', async (request, reply) => {
  const { title, description, type, priority = 5, clientId = 'allan' } = request.body;
  
  try {
    const workItem = workTracker.createWorkItem(title, description, type, priority, clientId);
    return workItem;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

app.post('/work/select-option', async (request, reply) => {
  const { workItemId, optionId, feedback = '' } = request.body;
  
  try {
    const result = workTracker.selectOption(workItemId, optionId, feedback);
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

app.get('/work/queue', async (request, reply) => {
  try {
    const queue = workTracker.getWorkQueue();
    return { queue };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Character Filter Routes
app.post('/character/assess', async (request, reply) => {
  const { response, context = {} } = request.body;
  
  try {
    const assessment = await characterFilter.assessResponse(response, context);
    return assessment;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Credentials Routes
app.post('/credentials/store', async (request, reply) => {
  const { service, credentialType, data, description, expiresAt } = request.body;
  
  try {
    const result = await credentialsManager.storeCredential(service, credentialType, data, description, expiresAt);
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

app.get('/credentials/:service', async (request, reply) => {
  const { service } = request.params;
  const { credentialType } = request.query;
  
  try {
    const credential = await credentialsManager.getCredential(service, credentialType);
    return { credential };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

app.get('/api/endpoints', async (request, reply) => {
  try {
    const services = credentialsManager.listServices();
    return { services };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Register all route modules
registerLLMRoutes(app);
registerGovernanceRoutes(app);
registerQuotesRoutes(app);
registerCharacterRoutes(app);
registerAnalyticsRoutes(app);
registerBanishmentRoutes(app);

initializeSchema();
startScheduler(app.log);

const port = process.env.PORT || 5055;
app.listen({ port, host: "0.0.0.0" });