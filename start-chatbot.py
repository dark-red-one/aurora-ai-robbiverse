#!/usr/bin/env python3
"""
Aurora Chatbot Launcher
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scripts.aurora_chat_real import AuroraChatReal

if __name__ == "__main__":
    chat = AuroraChatReal()
    chat.start_chat_session()
