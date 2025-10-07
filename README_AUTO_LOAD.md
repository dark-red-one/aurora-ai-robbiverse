# Robbie Memory Auto-Load Setup

## What This Does
- Automatically starts Robbie Memory System when Cursor loads
- Saves all our conversations with vector embeddings
- Detects business opportunities from our discussions
- Provides searchable conversation history

## How It Works
1. When Cursor starts, it automatically loads the memory system
2. Every message we exchange gets saved to the database
3. Opportunities are automatically detected and stored as sticky notes
4. You can search through our entire conversation history

## Usage
Once auto-load is set up, the memory system starts automatically. You can:

```python
# Search our conversations
await robbie_memory['remember']("GPU mesh")

# Find all opportunities
await robbie_memory['show_opportunities']()

# Get memory statistics
await robbie_memory['show_stats']()
```

## Manual Control
If you need to manually start/stop the system:

```bash
# Start manually
python3 .cursor/hooks/start-memory.py

# Stop manually
# The system will stop when Cursor closes
```

## Configuration
Edit `.cursor/robbie-memory-config.json` to adjust settings:
- `autoSave`: Enable/disable automatic saving
- `opportunityDetection`: Enable/disable opportunity detection
- `saveInterval`: How often to save (milliseconds)
- `vectorEmbeddings`: Enable/disable vector search

## Files Created
- `.cursor/robbie-memory-config.json` - Configuration
- `.cursor/hooks/start-memory.py` - Startup script
- `.cursor/extensions/robbie-memory-autoload/` - Extension files

## Status
✅ Auto-load setup complete!
The memory system will start automatically when Cursor loads.
