# Robbie Avatar Cursor Extension

## 🎨 Beautiful Robbie with Perfect Memory

### Installation

**Option 1: Link to Cursor Extensions (Quick)**
```bash
# Create symlink so Cursor finds it
ln -s /Users/allanperetz/aurora-ai-robbiverse/.cursor/extensions/robbie-avatar ~/.cursor/extensions/robbie-avatar

# Reload Cursor
# Press Cmd+Shift+P → "Developer: Reload Window"
```

**Option 2: Install from VSIX (If needed)**
```bash
# Package extension
cd /Users/allanperetz/aurora-ai-robbiverse/.cursor/extensions/robbie-avatar
npm install -g vsce
vsce package

# Install in Cursor
# Extensions → Install from VSIX → robbie-avatar-1.0.0.vsix
```

### Features

✅ **Robbie Avatar in Sidebar**
- Shows current mood with beautiful PNG image
- Click to cycle through 10 expressions
- Real-time status updates

✅ **Conversation Memory**
- Search past conversations
- Save important exchanges
- Never forget decisions

✅ **Commands**
- `Robbie: Change Mood` - Cycle avatar expressions
- `Robbie: Search Memory` - Find past conversations
- `Robbie: Save Conversation` - Store current chat

### Usage

1. **Click Robbie icon** in left sidebar (activity bar)
2. **See avatar** with current mood
3. **Click mood** to cycle expressions
4. **Search memory** to find past conversations
5. **Save important chats** for perfect recall

### Requirements

- Memory system running (chat-memory-system.py)
- Robbie backend on port 9000
- PostgreSQL + ChromaDB active

**Robbie is now embedded in Cursor!** 💕🚀

