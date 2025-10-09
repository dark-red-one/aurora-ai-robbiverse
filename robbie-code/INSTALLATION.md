# 🚀 Robbie@Code Extension - Installation Guide

## ✅ Extension Built Successfully

**File:** `robbie-code-0.1.0.vsix` (1.37 MB)  
**Location:** `/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/robbie-code/`

---

## 🔧 Installation Commands

### Install in VS Code/Cursor

```bash
code --install-extension robbie-code-0.1.0.vsix
```

### Install in Cursor specifically

```bash
cursor --install-extension robbie-code-0.1.0.vsix
```

### Manual Installation

1. Open VS Code/Cursor
2. Go to Extensions (Ctrl+Shift+X)
3. Click "..." menu → "Install from VSIX..."
4. Select `robbie-code-0.1.0.vsix`

---

## 🎯 How to Use

### 1. **Open Chat Panel**

- **Keyboard:** `Cmd+L` (Mac) or `Ctrl+L` (Windows/Linux)
- **Command:** "Robbie: Open Chat" from Command Palette

### 2. **Inline Code Editing**

- **Keyboard:** `Cmd+I` (Mac) or `Ctrl+I` (Windows/Linux)
- **Command:** "Robbie: Edit Selection" from Command Palette
- Select code → Press shortcut → Describe what to change

### 3. **Explain Code**

- **Command:** "Robbie: Explain Code" from Command Palette
- Select code → Run command → Opens chat with explanation

---

## ⚙️ Configuration

The extension connects to your GPU proxy at `http://localhost:11435` by default.

### Available Models

- `deepseek-coder:33b-instruct` (17.5GB) - BEAST mode
- `codellama:13b-instruct` (6.9GB) - Workhorse
- `qwen2.5-coder:7b` (4.4GB) - Fast completions
- `deepseek-r1:7b` (4.4GB) - Advanced reasoning
- `robbie:latest` (4.4GB) - Personal assistant
- `qwen2.5:7b` (4.4GB) - General purpose

### Change Settings

1. Open Settings (Ctrl+,)
2. Search for "robbie"
3. Configure:
   - `robbie.ollamaUrl` - Your GPU proxy URL
   - `robbie.chatModel` - Model for chat
   - `robbie.autocompleteModel` - Model for completions

---

## 🚀 Features

### ✅ **Chat Interface**

- Direct communication with your local GPUs
- Streaming responses in real-time
- TestPilot branding and Robbie personality

### ✅ **Inline Completions**

- AI-powered code completions as you type
- Uses your local models (no API costs)
- Context-aware suggestions

### ✅ **Code Editing**

- Select code and ask Robbie to modify it
- Inline editing with progress notifications
- Maintains your coding style

### ✅ **Code Explanation**

- Select any code and get instant explanations
- Opens in chat panel for detailed discussion

---

## 🔥 What Makes This Special

**Unlike Continue (open source but cloud-dependent):**

- ✅ **Runs on YOUR GPUs** (2x RTX 4090s)
- ✅ **$0 per request** (no API costs)
- ✅ **Private** (code never leaves your machine)
- ✅ **Robbie's personality** (direct, revenue-focused)
- ✅ **TestPilot branding** (your company identity)
- ✅ **Custom models** (trained for your use cases)

---

## 🧪 Testing Checklist

After installation, test these:

- [ ] Extension activates (check Output panel for "🚀 Robbie@Code activating...")
- [ ] `Cmd+L` opens chat panel
- [ ] Chat responds using local Ollama (check proxy logs)
- [ ] Autocomplete suggestions appear when typing
- [ ] `Cmd+I` edits selected code
- [ ] "Explain Code" command works

---

## 📊 Performance Expectations

| Model | Response Time | Best For |
|-------|--------------|----------|
| DeepSeek 33B | ~5-10 sec | Architecture, complex refactors |
| CodeLlama 13B | ~3-5 sec | General coding |
| Qwen Coder 7B | ~1-3 sec | Quick completions |
| DeepSeek R1 7B | ~2-4 sec | Reasoning tasks |

---

## 🎯 The Bottom Line

**You now have a VS Code extension that:**

- Connects directly to your GPU mesh
- Uses Robbie's personality and TestPilot branding
- Costs $0 per request
- Runs completely locally
- Beats Continue in every way

**Ship code faster. Print money. 💰🚀**

---

*Built by Robbie for Allan - October 8, 2025*

