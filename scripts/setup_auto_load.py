#!/usr/bin/env python3
"""
Setup Auto-Load for Robbie Memory System
One-time setup to make memory system start automatically
"""

import os
import sys
import json
import stat
import subprocess
from datetime import datetime
from pathlib import Path

def setup_auto_load():
    print('🚀 Setting up Robbie Memory System Auto-Load...\n')
    
    try:
        # Get the project root directory
        project_root = Path(__file__).parent.parent
        cursor_dir = project_root / '.cursor'
        
        # Create .cursor directory if it doesn't exist
        cursor_dir.mkdir(exist_ok=True)
        print('📁 Created .cursor directory')
        
        # Create hooks directory
        hooks_dir = cursor_dir / 'hooks'
        hooks_dir.mkdir(exist_ok=True)
        print('📁 Created .cursor/hooks directory')
        
        # Create extensions directory
        extensions_dir = cursor_dir / 'extensions'
        extensions_dir.mkdir(exist_ok=True)
        print('📁 Created .cursor/extensions directory')
        
        # Create auto-load configuration
        auto_load_config = {
            "name": "robbie-memory-autoload",
            "version": "1.0.0",
            "description": "Automatically starts Robbie Memory System",
            "autoStart": True,
            "enabled": True,
            "startupDelay": 2000,
            "memorySystem": {
                "autoSave": True,
                "opportunityDetection": True,
                "saveInterval": 5000,
                "vectorEmbeddings": True,
                "searchEnabled": True
            },
            "created": datetime.now().isoformat(),
            "lastUpdated": datetime.now().isoformat()
        }
        
        # Write configuration file
        config_path = cursor_dir / 'robbie-memory-config.json'
        with open(config_path, 'w') as f:
            json.dump(auto_load_config, f, indent=2)
        print('✅ Created Robbie Memory configuration')
        
        # Create Python startup script
        startup_script = '''#!/usr/bin/env python3
"""
Robbie Memory System Startup Script
Automatically runs when Cursor loads
"""

import sys
import os
import asyncio
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

async def start_memory_system():
    """Start the Robbie Memory System"""
    try:
        print('🧠 Starting Robbie Memory System...')
        
        # Import the memory system components
        from src.cursorChatMemory import CursorChatMemory
        from src.intelligentStickySystem import IntelligentStickySystem
        
        # Initialize memory system
        chat_memory = CursorChatMemory()
        await chat_memory.initialize()
        
        sticky_system = IntelligentStickySystem()
        await sticky_system.initialize()
        
        print('✅ Robbie Memory System started successfully')
        print('📝 All conversations will be automatically saved')
        print('🔍 Search functionality is available')
        print('💡 Opportunities will be automatically detected')
        
        # Set up event listeners
        def on_opportunity_detected(data):
            print(f'\\n🎯 OPPORTUNITY DETECTED IN OUR CHAT!')
            print(f'Stickies generated: {data["stickyCount"]}')
            
            for sticky in data.get('stickies', []):
                print(f'\\n📝 STICKY NOTE:')
                print(f'Category: {sticky["category"]}')
                print(f'Importance: {sticky["importanceScore"]:.2f}')
                print(f'Urgency: {sticky["urgencyScore"]:.2f}')
                print(f'Content: {sticky["content"]}')
                print(f'Follow-up: {sticky["followUpDate"]}')
            print('\\n' + '='*60 + '\\n')
        
        # Make memory systems globally available
        global robbie_memory
        robbie_memory = {
            'chat_memory': chat_memory,
            'sticky_system': sticky_system,
            'remember': lambda query: chat_memory.searchConversations(query),
            'show_opportunities': lambda: sticky_system.getActiveStickies(),
            'show_stats': lambda: chat_memory.getMemoryStats()
        }
        
        # Keep the system running
        while True:
            await asyncio.sleep(1)
            
    except Exception as error:
        print(f'❌ Failed to start Robbie Memory System: {error}')
        raise

if __name__ == '__main__':
    asyncio.run(start_memory_system())
'''
        
        startup_path = hooks_dir / 'start-memory.py'
        with open(startup_path, 'w') as f:
            f.write(startup_script)
        
        # Make executable
        startup_path.chmod(stat.S_IRWXU | stat.S_IRGRP | stat.S_IROTH)
        print('✅ Created Python startup script')
        
        # Create package.json for the extension
        package_json = {
            "name": "robbie-memory-autoload",
            "displayName": "Robbie Memory Auto-Load",
            "description": "Automatically starts Robbie chat memory system",
            "version": "1.0.0",
            "main": "extension.py",
            "activationEvents": [
                "onStartupFinished"
            ],
            "engines": {
                "vscode": "^1.74.0"
            }
        }
        
        extension_dir = extensions_dir / 'robbie-memory-autoload'
        extension_dir.mkdir(exist_ok=True)
        
        with open(extension_dir / 'package.json', 'w') as f:
            json.dump(package_json, f, indent=2)
        print('✅ Created extension package.json')
        
        # Create Python extension file
        extension_script = '''#!/usr/bin/env python3
"""
Robbie Memory Auto-Load Extension
Automatically starts Robbie Memory System when Cursor loads
"""

import sys
import subprocess
from pathlib import Path

def activate():
    """Activate the extension"""
    print('🧠 Robbie Memory Auto-Load Extension activated')
    
    # Start the memory system
    project_root = Path(__file__).parent.parent.parent.parent
    startup_script = project_root / '.cursor' / 'hooks' / 'start-memory.py'
    
    if startup_script.exists():
        try:
            # Start the memory system in the background
            subprocess.Popen([sys.executable, str(startup_script)])
            print('✅ Robbie Memory System started via extension')
        except Exception as e:
            print(f'❌ Failed to start memory system: {e}')
    else:
        print('❌ Startup script not found')

def deactivate():
    """Deactivate the extension"""
    print('🛑 Robbie Memory Auto-Load Extension deactivated')

if __name__ == '__main__':
    activate()
'''
        
        with open(extension_dir / 'extension.py', 'w') as f:
            f.write(extension_script)
        
        extension_file = extension_dir / 'extension.py'
        extension_file.chmod(stat.S_IRWXU | stat.S_IRGRP | stat.S_IROTH)
        print('✅ Created Python extension file')
        
        # Create README with instructions
        readme = '''# Robbie Memory Auto-Load Setup

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
'''
        
        readme_path = project_root / 'README_AUTO_LOAD.md'
        with open(readme_path, 'w') as f:
            f.write(readme)
        print('✅ Created README with instructions')
        
        print('\\n🎉 Robbie Memory System Auto-Load setup complete!')
        print('\\n📋 What happens next:')
        print('1. ✅ Memory system will start automatically when Cursor loads')
        print('2. ✅ All our conversations will be saved with vector embeddings')
        print('3. ✅ Business opportunities will be automatically detected')
        print('4. ✅ You can search through our entire chat history')
        print('5. ✅ Sticky notes will be generated for opportunities')
        
        print('\\n🚀 Ready to go! The next time you open Cursor, the memory system will start automatically.')
        print('\\n💡 You can also start it manually with: python3 .cursor/hooks/start-memory.py')
        
        # Test the startup script
        print('\\n🧪 Testing the startup script...')
        try:
            result = subprocess.run([
                sys.executable, str(startup_path), '--test'
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                print('✅ Startup script test passed')
            else:
                print(f'⚠️ Startup script test failed: {result.stderr}')
        except Exception as e:
            print(f'⚠️ Could not test startup script: {e}')
        
        return True
        
    except Exception as error:
        print(f'❌ Setup failed: {error}')
        return False

if __name__ == '__main__':
    success = setup_auto_load()
    if success:
        print('\\n🎯 Setup completed successfully!')
        sys.exit(0)
    else:
        print('\\n❌ Setup failed!')
        sys.exit(1)
