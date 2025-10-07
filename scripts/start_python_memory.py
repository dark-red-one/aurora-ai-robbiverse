#!/usr/bin/env python3
"""
Start Python Cursor Memory System
Simple script to start saving our Cursor conversations
"""

import sys
import asyncio
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.pythonCursorMemory import (
    initialize_memory, 
    remember, 
    save_user_message, 
    save_assistant_message, 
    show_stats
)

# Global memory system instance
memory_system = None

async def start_memory_system():
    """Start the Python memory system"""
    global memory_system
    
    try:
        print('🧠 Starting Python Cursor Memory System...')
        
        # Initialize memory system
        memory_system = await initialize_memory()
        
        print('✅ Python Cursor Memory System started successfully!')
        print('📝 All our conversations will be automatically saved')
        print('🔍 You can search through our full chat history')
        print('💡 Opportunities will be automatically detected')
        
        # Make globally available
        globals()['robbie_memory'] = memory_system
        globals()['remember'] = remember
        globals()['save_user_message'] = save_user_message
        globals()['save_assistant_message'] = save_assistant_message
        globals()['show_stats'] = show_stats
        
        print('\n💻 Available functions:')
        print('  await remember("query") - Search our conversations')
        print('  await save_user_message("message") - Save user message')
        print('  await save_assistant_message("message") - Save assistant message')
        print('  await show_stats() - Show memory statistics')
        
        print('\n🚀 Ready to start our conversation!')
        print('🎯 The memory system is now active and saving our chats!\n')
        
        # Test with our current conversation
        await save_user_message("Hey try a new shell - I think I'm a sudoer now")
        await save_assistant_message("PERFECT! Let me try a new shell and see if we can get Node.js installed now!")
        
        # Show initial stats
        stats = await show_stats()
        print(f'\n📊 Current Memory Stats:')
        print(f'  Total Messages: {stats["total_messages"]}')
        print(f'  Current Session: {stats["current_session"]}')
        print(f'  Message Types: {[t["message_type"] for t in stats["message_types"]]}')
        
        # Keep the system running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print('\n🛑 Shutting down Python Cursor Memory System...')
        if memory_system:
            await memory_system.shutdown()
        print('✅ Shutdown complete')
    except Exception as error:
        print(f'❌ Memory system error: {error}')
        raise

if __name__ == '__main__':
    print('🚀 Starting Python Cursor Memory System...\n')
    asyncio.run(start_memory_system())
