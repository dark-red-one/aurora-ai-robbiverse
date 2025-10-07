#!/usr/bin/env python3
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
            print(f'\n🎯 OPPORTUNITY DETECTED IN OUR CHAT!')
            print(f'Stickies generated: {data["stickyCount"]}')
            
            for sticky in data.get('stickies', []):
                print(f'\n📝 STICKY NOTE:')
                print(f'Category: {sticky["category"]}')
                print(f'Importance: {sticky["importanceScore"]:.2f}')
                print(f'Urgency: {sticky["urgencyScore"]:.2f}')
                print(f'Content: {sticky["content"]}')
                print(f'Follow-up: {sticky["followUpDate"]}')
            print('\n' + '='*60 + '\n')
        
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
