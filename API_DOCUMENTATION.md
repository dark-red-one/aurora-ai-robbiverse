# 🚀 Aurora AI Robbiverse - API Documentation

## Overview
The Aurora AI Robbiverse provides a comprehensive conversation management system with intelligent context, rollback capabilities, and branching functionality. This API enables advanced AI conversation features with full user control.

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
Currently using basic authentication. Future versions will support OAuth2 and JWT tokens.

## Core Features

### 🧠 Intelligent Context Management
- **Smart Message Selection**: Automatically selects the most important messages for context
- **Importance Scoring**: Combines recency (70%) and content importance (30%)
- **Context Window**: Configurable context window size
- **Question Detection**: Automatically boosts importance of messages with questions

### ⏪ Advanced Rollback System
- **Soft Delete**: Messages are marked as deleted, not permanently removed
- **Rollback History**: Track all rolled back messages with timestamps and reasons
- **Restore Capability**: Can restore previously rolled back messages
- **Audit Trail**: Complete history of all rollback operations

### 🌿 Conversation Branching
- **Multiple Paths**: Create alternative conversation branches from any message
- **Branch Management**: Switch between different conversation paths
- **Parallel Exploration**: Explore different AI responses to the same question
- **Branch Metadata**: Track branch names, descriptions, and creation times

---

## API Endpoints

### Conversations

#### Create Conversation
```http
POST /conversations
```

**Request Body:**
```json
{
  "title": "My AI Conversation",
  "user_id": "user123",
  "context_window_size": 10
}
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "title": "My AI Conversation",
  "user_id": "user123",
  "context_window_size": 10
}
```

#### Get Conversation
```http
GET /conversations/{conversation_id}?include_deleted=false
```

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "user_id": "user123",
    "title": "My AI Conversation",
    "created_at": "2025-01-23T10:00:00Z",
    "updated_at": "2025-01-23T10:30:00Z",
    "context_window_size": 10,
    "context_compression_enabled": true
  },
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Hello! I need help with Python.",
      "created_at": "2025-01-23T10:00:00Z",
      "context_importance": 7,
      "token_count": 15,
      "is_deleted": false
    }
  ],
  "active_branch": null,
  "context_window": 10,
  "total_messages": 5,
  "context_compressed": false
}
```

#### Chat with Context
```http
POST /conversations/{conversation_id}/chat
```

**Request Body:**
```json
{
  "message": "How do I use async/await in Python?",
  "client_id": "client123",
  "use_context": true,
  "context_window": 10
}
```

**Response:**
```json
{
  "response": "Async/await in Python allows you to write asynchronous code...",
  "conversation_id": "uuid",
  "user_message_id": "uuid",
  "ai_message_id": "uuid",
  "source": "robbie",
  "safety_status": "approved",
  "confidence": 0.95,
  "processing_time_ms": 150,
  "context_used": true,
  "context_window": 10
}
```

### Messages

#### Add Message
```http
POST /conversations/{conversation_id}/messages
```

**Request Body:**
```json
{
  "content": "This is a test message",
  "role": "user",
  "metadata": {
    "client_id": "client123",
    "source": "web"
  }
}
```

**Response:**
```json
{
  "message_id": "uuid",
  "conversation_id": "uuid",
  "role": "user",
  "content": "This is a test message",
  "timestamp": "2025-01-23T10:00:00Z"
}
```

#### Rollback Message
```http
POST /conversations/{conversation_id}/rollback
```

**Request Body:**
```json
{
  "message_id": "uuid",
  "reason": "User requested rollback"
}
```

**Response:**
```json
{
  "message_id": "uuid",
  "rolled_back": true,
  "reason": "User requested rollback",
  "timestamp": "2025-01-23T10:00:00Z"
}
```

#### Restore Message
```http
POST /conversations/{conversation_id}/restore
```

**Request Body:**
```json
{
  "message_id": "uuid"
}
```

**Response:**
```json
{
  "message_id": "uuid",
  "restored": true,
  "timestamp": "2025-01-23T10:00:00Z"
}
```

#### Get Rollback History
```http
GET /conversations/{conversation_id}/rollback-history
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "rollback_history": [
    {
      "message_id": "uuid",
      "role": "assistant",
      "content": "Previous response...",
      "deleted_at": "2025-01-23T10:00:00Z",
      "deleted_reason": "User requested rollback",
      "created_at": "2025-01-23T09:55:00Z"
    }
  ],
  "total_rolled_back": 1
}
```

### Conversation Branches

#### Create Branch
```http
POST /conversations/{conversation_id}/branches
```

**Request Body:**
```json
{
  "name": "Alternative Approach",
  "description": "Exploring a different solution",
  "branch_point_message_id": "uuid"
}
```

**Response:**
```json
{
  "branch_id": "uuid",
  "conversation_id": "uuid",
  "name": "Alternative Approach",
  "description": "Exploring a different solution",
  "branch_point_message_id": "uuid",
  "created_at": "2025-01-23T10:00:00Z"
}
```

#### Get Branches
```http
GET /conversations/{conversation_id}/branches
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "branches": [
    {
      "id": "uuid",
      "name": "Alternative Approach",
      "description": "Exploring a different solution",
      "created_at": "2025-01-23T10:00:00Z",
      "is_active": true
    }
  ],
  "total_branches": 1
}
```

#### Switch to Branch
```http
POST /conversations/{conversation_id}/branches/{branch_id}/switch
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "branch_id": "uuid",
  "switched": true,
  "timestamp": "2025-01-23T10:00:00Z"
}
```

### Context Management

#### Get Context Summary
```http
GET /conversations/{conversation_id}/context?window_size=10
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "context_window": 10,
  "message_count": 15,
  "total_tokens": 2500,
  "context_compressed": false,
  "active_branch": null,
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Recent message...",
      "context_importance": 8,
      "token_count": 25
    }
  ]
}
```

#### Compress Context
```http
POST /conversations/{conversation_id}/compress
```

**Response:**
```json
{
  "compressed": true,
  "snapshot_id": "uuid",
  "original_message_count": 50,
  "compressed_content": "[2025-01-23 10:00] User: 5 messages | Assistant: 5 responses\n[2025-01-23 10:30] User: 3 messages | Assistant: 3 responses"
}
```

### System Status

#### Get System Status
```http
GET /system/status
```

**Response:**
```json
{
  "status": "operational",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "mentors": 4
  },
  "ai_system": {
    "robbie": "active",
    "gatekeeper": "active",
    "dual_llm": "operational"
  },
  "components": {
    "api": "running",
    "websockets": "running",
    "database": "connected",
    "dual_llm": "active"
  }
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "detail": "Error message",
  "status_code": 400,
  "timestamp": "2025-01-23T10:00:00Z"
}
```

### Common Error Codes
- `400` - Bad Request (invalid input)
- `404` - Not Found (conversation/message not found)
- `422` - Validation Error (invalid request body)
- `500` - Internal Server Error

---

## Rate Limiting
- **Default**: 100 requests per minute per IP
- **Chat Endpoints**: 20 requests per minute per user
- **Bulk Operations**: 10 requests per minute per user

---

## WebSocket Support

### Real-time Updates
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/conversations/{conversation_id}');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

### WebSocket Events
- `message_added` - New message added to conversation
- `message_rolled_back` - Message rolled back
- `message_restored` - Message restored
- `branch_created` - New branch created
- `branch_switched` - Active branch changed
- `context_compressed` - Context was compressed

---

## Database Functions

### Native PostgreSQL Functions

#### Get Conversation Context
```sql
SELECT * FROM get_conversation_context('conversation_id', 10);
```

#### Get Rollback History
```sql
SELECT * FROM get_rollback_history('conversation_id');
```

#### Compress Context
```sql
SELECT compress_conversation_context('conversation_id');
```

---

## Examples

### Complete Conversation Flow

1. **Create Conversation**
```bash
curl -X POST http://localhost:8000/api/v1/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "Python Help", "user_id": "user123"}'
```

2. **Start Chatting**
```bash
curl -X POST http://localhost:8000/api/v1/conversations/{id}/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I use async/await?"}'
```

3. **Create Branch for Alternative Response**
```bash
curl -X POST http://localhost:8000/api/v1/conversations/{id}/branches \
  -H "Content-Type: application/json" \
  -d '{"name": "Alternative Approach", "branch_point_message_id": "msg_id"}'
```

4. **Rollback a Message**
```bash
curl -X POST http://localhost:8000/api/v1/conversations/{id}/rollback \
  -H "Content-Type: application/json" \
  -d '{"message_id": "msg_id", "reason": "Try different approach"}'
```

5. **Get Context Summary**
```bash
curl http://localhost:8000/api/v1/conversations/{id}/context?window_size=5
```

---

## Performance Tips

1. **Use Context Windows**: Set appropriate context window sizes (5-15 messages)
2. **Enable Compression**: For conversations with 20+ messages
3. **Batch Operations**: Use bulk endpoints when possible
4. **Monitor Tokens**: Keep track of token usage for cost optimization
5. **Use Branches**: For exploring alternatives without losing context

---

## Future Features

- **Vector Search**: Semantic search through conversation history
- **AI Summarization**: Automatic conversation summaries
- **Export/Import**: Conversation backup and restore
- **Analytics**: Conversation insights and metrics
- **Multi-language**: Support for multiple languages
- **Voice Integration**: Voice-to-text and text-to-voice
- **Collaboration**: Multi-user conversation sharing

---

## Support

For questions, issues, or feature requests:
- **GitHub**: [Aurora AI Robbiverse Repository]
- **Documentation**: [Full Documentation]
- **API Status**: [Status Page]

---

*Last Updated: January 23, 2025*
*Version: 1.0.0*









