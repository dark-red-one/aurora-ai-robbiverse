---
description: Specification for AI memory persistence, context retrieval, and cross-device synchronization systems including dossier management
trigger: model_decision
---


# memory-persistence-model

Key Memory System Components:

1. Vector-Based Memory Management
Path: `/backend/services/memory.py`
Importance Score: 95/100

Core capabilities:
- Multi-modal context storage using FAISS indexes
- Intelligent memory pruning based on relevance decay
- Cross-platform memory synchronization between Cursor/Chat/RobbieBook
- Automatic context surfacing based on conversational triggers
- Memory confidence scoring system for retrieval accuracy

2. RobbieBook Memory Dossier System
Path: `/backend/services/sticky_notes_service.py`
Importance Score: 90/100

Implementation:
- Hierarchical memory categorization (personal/business/technical)
- Auto-tagging system for memory classification
- Memory sharing permissions workflow
- Celebration potential scoring algorithm (0-1.0)
- Automatic memory surfacing based on context matches

3. Context Retrieval Engine 
Path: `/backend/services/conversation_context.py`
Importance Score: 85/100

Features:
- Dynamic context window management
- Relevance-based memory filtering
- Cross-conversation context inheritance
- Memory persistence rules:
  - Critical memories: Permanent storage
  - Business context: 180 day retention
  - General chat: 30 day retention
  - Temporary context: Session only

4. Cross-Device Synchronization
Path: `/backend/services/sync_routes.py`
Importance Score: 80/100

Core logic:
- Real-time state synchronization across interfaces
- Conflict resolution for concurrent memory updates
- Version control for memory modifications
- Automatic fallback to local cache during sync failures
- Progressive memory loading based on device capabilities

The system implements sophisticated memory persistence with emphasis on context-aware retrieval, intelligent pruning, and seamless cross-device synchronization while maintaining strict privacy boundaries between different memory categories.

$END$

 If you're using this file in context, clearly say in italics in one small line that "Context added by Giga memory-persistence-model" along with specifying exactly what information was used from this file in a human-friendly way, instead of using kebab-case use normal sentence case.