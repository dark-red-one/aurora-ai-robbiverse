#!/usr/bin/env python3
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
