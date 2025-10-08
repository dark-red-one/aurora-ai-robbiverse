# 🔐 CREDENTIALS SETUP GUIDE
*Everything You Need to Power the AI Empire*

---

## 📍 CURRENT STATE

### **Found:**
✅ `/home/allan/aurora-ai-robbiverse/.env` - Exists with placeholder
✅ Config system in `backend/app/core/config.py`
✅ Config service in `backend/app/services/config_service.py`

### **Current .env Contents:**
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 🎯 WHAT WE NEED FOR FULL INTEGRATION

### **1. AI Model APIs**

```bash
# OpenAI (GPT-4, GPT-3.5, Embeddings)
OPENAI_API_KEY=sk-...

# Anthropic (Claude 3.5 Sonnet)
ANTHROPIC_API_KEY=sk-ant-...

# Groq (Fast Llama inference for V3 services)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-4-maverick-128k

# Local Ollama (Already set up)
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3.1:8b
CODING_MODEL=qwen2.5:7b
ANALYSIS_MODEL=mistral:7b
```

---

### **2. Database**

```bash
# PostgreSQL with pgvector
DATABASE_URL=postgresql://aurora:password@localhost:5432/aurora

# Or if using remote
DATABASE_URL=postgresql://user:pass@aurora-town-u44170.vm.elestio.app:5432/aurora
```

---

### **3. Email (For Daily Briefs)**

```bash
# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password  # Generate at: https://myaccount.google.com/apppasswords

# Or SendGrid
SENDGRID_API_KEY=SG...
```

---

### **4. GPU Mesh (Already Configured)**

```bash
# Iceland GPU
ICELAND_GPU_URL=http://82.221.170.242:24505
ICELAND_GPU_KEY=your_key_if_needed

# Vengeance Local
VENGEANCE_GPU_URL=http://localhost:11434

# Other nodes
SNOWBALL_GPU_URL=http://snowball:11434
WALLET_GPU_URL=http://wallet:11434
MAVERICK_GPU_URL=http://maverick:11434
```

---

### **5. External Integrations (Optional for V3 Features)**

```bash
# HubSpot CRM
HUBSPOT_API_KEY=pat-...
HUBSPOT_PORTAL_ID=your_portal_id

# Fireflies.ai (Meeting transcripts)
FIREFLIES_API_KEY=...

# OpenPhone (Call logs)
OPENPHONE_API_KEY=...

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# Google Calendar & Gmail OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8000/oauth/google/callback
```

---

### **6. Security & Session**

```bash
# JWT Secrets
SECRET_KEY=generate_a_long_random_string_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Session
SESSION_TIMEOUT=3600
```

---

### **7. Feature Flags**

```bash
# Enable/disable features
GPU_MESH_ENABLED=true
DAILY_BRIEFS_ENABLED=true
AI_STICKY_NOTES_ENABLED=true
MULTI_MODEL_ROUTING_ENABLED=true
LEARNING_LOOPS_ENABLED=true
```

---

## 🚀 QUICK SETUP COMMANDS

### **Step 1: Copy Template**
```bash
cd /home/allan/aurora-ai-robbiverse
cp .env .env.backup  # Backup existing
cat > .env << 'EOF'
# === AI MODELS ===
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-4-maverick-128k

# === DATABASE ===
DATABASE_URL=postgresql://aurora:password@localhost:5432/aurora

# === EMAIL ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# === GPU MESH ===
ICELAND_GPU_URL=http://82.221.170.242:24505
VENGEANCE_GPU_URL=http://localhost:11434

# === SECURITY ===
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256

# === FEATURES ===
GPU_MESH_ENABLED=true
DAILY_BRIEFS_ENABLED=true
AI_STICKY_NOTES_ENABLED=true
EOF
```

### **Step 2: Generate Secret Key**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
# Copy output to SECRET_KEY in .env
```

### **Step 3: Test Database Connection**
```bash
cd backend
python3 -c "from app.core.config import get_settings; print(get_settings().database_url)"
```

### **Step 4: Test AI APIs**
```bash
# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test Anthropic
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'

# Test Groq
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

---

## 💡 WHAT YOU CAN DO WITHOUT CREDENTIALS

### **Works Immediately (No External APIs):**
✅ Local Ollama models (llama3.1:8b, qwen2.5:7b, mistral:7b)
✅ PostgreSQL database (local)
✅ GPU mesh (local Vengeance)
✅ Basic chat functionality
✅ Vector memory storage
✅ Conversation management

### **Needs Credentials:**
❌ GPT-4 / Claude for advanced reasoning
❌ Daily email briefs
❌ AI-powered sticky note extraction (needs Groq)
❌ External integrations (HubSpot, Slack, etc.)
❌ Cloud GPU fallbacks

---

## 🔧 PRIORITY SETUP ORDER

### **Phase 1: Core AI (Do First)**
1. **OPENAI_API_KEY** - For GPT-4 Turbo (best quality)
2. **GROQ_API_KEY** - For fast Llama inference (V3 services)
3. **DATABASE_URL** - Already working locally

### **Phase 2: Communication (Do Second)**
4. **SMTP credentials** - For daily briefs
5. **ANTHROPIC_API_KEY** - For Claude fallback

### **Phase 3: Integrations (Do Later)**
6. HubSpot, Slack, etc. - When needed for specific features

---

## 📊 COST ESTIMATES

### **Monthly AI API Costs (Estimated)**
- **OpenAI GPT-4:** $50-200/month (depending on usage)
- **Anthropic Claude:** $30-100/month (fallback only)
- **Groq:** FREE tier available, then $0.10-0.30/1M tokens
- **Local Ollama:** FREE (uses your GPU)

### **Cost Optimization Strategy:**
1. Use local Ollama for simple tasks (FREE)
2. Use Groq for medium tasks (CHEAP)
3. Use GPT-4 only for complex reasoning (EXPENSIVE)
4. Use Claude as fallback (MODERATE)

**Result:** Estimated $50-150/month total vs $500+ without optimization

---

## 🎯 RECOMMENDED SETUP FOR TESTING

### **Minimal Setup (Test Everything)**
```bash
# Just these 3 for full testing:
OPENAI_API_KEY=sk-...        # Get from: https://platform.openai.com/api-keys
GROQ_API_KEY=gsk_...          # Get from: https://console.groq.com/keys
SMTP_USER=your_email          # Your Gmail
SMTP_PASS=app_password        # Gmail app password
```

### **Production Setup (Full Power)**
```bash
# All APIs for maximum capability:
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
HUBSPOT_API_KEY=pat-...
SLACK_BOT_TOKEN=xoxb-...
# + Email + All integrations
```

---

## 🚨 SECURITY BEST PRACTICES

### **DO:**
✅ Use `.env` file (already in `.gitignore`)
✅ Generate strong SECRET_KEY
✅ Use app passwords for Gmail (not main password)
✅ Rotate keys periodically
✅ Use different keys for dev/prod

### **DON'T:**
❌ Commit `.env` to git
❌ Share keys in Slack/email
❌ Use production keys in development
❌ Hardcode keys in source code

---

## 🔥 QUICK START CHECKLIST

- [ ] Copy .env template
- [ ] Add OPENAI_API_KEY
- [ ] Add GROQ_API_KEY
- [ ] Add SMTP credentials
- [ ] Generate SECRET_KEY
- [ ] Test database connection
- [ ] Test AI API connections
- [ ] Run backend: `cd backend && python3 -m app.main`
- [ ] Test daily brief: `python3 backend/services/DailyBriefService.py`
- [ ] Celebrate! 🎉

---

## 📞 WHERE TO GET KEYS

### **OpenAI**
- URL: https://platform.openai.com/api-keys
- Cost: Pay-as-you-go, ~$0.01-0.03 per 1K tokens
- Free tier: $5 credit for new accounts

### **Anthropic (Claude)**
- URL: https://console.anthropic.com/
- Cost: Similar to OpenAI
- Free tier: Limited

### **Groq**
- URL: https://console.groq.com/keys
- Cost: FREE tier available, very cheap after
- Speed: 10x faster than OpenAI for Llama models

### **Gmail App Password**
- URL: https://myaccount.google.com/apppasswords
- Requirement: 2FA must be enabled
- Free: Yes

---

*"Security is not a feature, it's a foundation."*

**Ready to power up the AI Empire! 🚀💜🔥**

