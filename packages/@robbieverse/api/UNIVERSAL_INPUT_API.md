# Universal Input API Documentation

**Version:** 1.0.0  
**Date:** October 10, 2025  
**Status:** ✅ Implemented

## Overview

The Universal Input API is a single, standardized endpoint that handles ALL AI requests across the Robbie ecosystem. Every AI interaction - whether from email, SMS, chat, web forms, Elesti, LinkedIn, or any other source - goes through this API for security, logging, and intelligent routing.

## Architecture

```
Request → Universal API → Gatekeeper (pre-flight) → Vector Search → AI Service → Gatekeeper (post-flight) → Response
```

### Key Components

1. **Universal Input Endpoint** (`/api/v2/universal/request`)
2. **Gatekeeper AI** (Llama 3.2 1B for <100ms security checks)
3. **AI Service Router** (Routes to Maverick, Qwen, OpenAI, etc.)
4. **Vector Search** (pgvector for 90%+ context matching)
5. **Killswitch Manager** (Emergency internet blocking)
6. **Comprehensive Logger** (Dual file + SQL logging, 90-day retention)

## API Endpoint

### POST `/api/v2/universal/request`

**Request Format:**

```json
{
  "request_id": "optional-uuid",
  "source": "email|sms|chat|web_form|linkedin|elesti|api|cursor|robbiebar|mobile",
  "source_metadata": {
    "sender": "user@example.com",
    "timestamp": "2025-10-10T12:00:00Z",
    "platform": "gmail",
    "extra": {}
  },
  "ai_service": "chat|embedding|image|code|analysis",
  "payload": {
    "input": "User message or data to process",
    "context": [...],  // Optional pre-fetched context
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 1000
    }
  },
  "user_id": "allan",
  "fetch_context": true
}
```

**Response Format:**

```json
{
  "request_id": "uuid",
  "status": "approved|rejected|revised|blocked",
  "robbie_response": {
    "mood": "focused",
    "message": "Here's what I found...",
    "sticky_notes": [...],
    "personality_changes": {"attraction": 8, "gandhi_genghis": 7},
    "actions": [
      {"type": "send_email", "to": "user@example.com", "draft_location": "db_id_123"}
    ]
  },
  "gatekeeper_review": {
    "approved": true,
    "confidence": 0.95,
    "reasoning": "Safe business communication",
    "warnings": []
  },
  "processing_time_ms": 250,
  "timestamp": "2025-10-10T12:00:00.250Z"
}
```

## AI Services Supported

### 1. Chat (`ai_service: "chat"`)

**Model:** Maverick (trainable for AllanBot)  
**Use:** Conversational AI, business queries, strategic discussions

```json
{
  "ai_service": "chat",
  "payload": {
    "input": "What's the pricing for TestPilot?",
    "parameters": {"temperature": 0.7}
  }
}
```

### 2. Embeddings (`ai_service": "embedding"`)

**Model:** OpenAI `text-embedding-ada-002` (1536-dim)  
**Use:** Vector search, semantic matching, context retrieval

```json
{
  "ai_service": "embedding",
  "payload": {
    "input": "Text to convert to vector embedding"
  }
}
```

### 3. Image Generation (`ai_service: "image"`)

**Model:** DALL-E 3 or Stable Diffusion XL  
**Use:** Generate images from text descriptions

```json
{
  "ai_service": "image",
  "payload": {
    "input": "A futuristic AI robot in a corporate office",
    "parameters": {
      "size": "1024x1024",
      "quality": "standard"
    }
  }
}
```

### 4. Code Generation (`ai_service: "code"`)

**Model:** Qwen 2.5-Coder 7B  
**Use:** Code generation, bug fixes, refactoring

```json
{
  "ai_service": "code",
  "payload": {
    "input": "Write a Python function to calculate Fibonacci sequence",
    "parameters": {"temperature": 0.3}
  }
}
```

### 5. Analysis (`ai_service: "analysis"`)

**Model:** Maverick  
**Use:** Strategic analysis, business insights, deep thinking

```json
{
  "ai_service": "analysis",
  "payload": {
    "input": "Analyze our Q4 revenue trends and suggest improvements"
  }
}
```

## Security Features

### Gatekeeper AI

Every request goes through TWO gatekeeper checks:

1. **Pre-flight:** Before AI processing
   - Rate limit checking
   - Suspicious content detection
   - Intent analysis

2. **Post-flight:** Before action execution
   - Response content review
   - Action safety validation
   - Sensitive data filtering

### Killswitch

Emergency internet blocking when:
- Rate limits exceeded (10+ emails in 5 minutes)
- Suspicious activity detected
- Manual activation from Robbiebar
- Failed authentication attempts

**When active:**
- ✅ Local chat allowed
- ✅ GPU mesh access allowed
- ❌ Email sending blocked
- ❌ Webhooks blocked
- ❌ External APIs blocked

**Robbie's mood:** Set to "blushing" (urgently fixing, not sexy)

## Logging System

### Dual Logging

1. **File Logs:** `/var/log/robbie/universal-input.log`
   - Human-readable format
   - Tail with: `tail -f /var/log/robbie/universal-input.log`
   - 90-day rotation

2. **SQL Logs:** `ai_request_logs` table
   - Structured data for analysis
   - 90-day auto-purge
   - **NO sensitive data stored**

### What Gets Logged

✅ **Safe to log:**
- Request source and type
- Processing time
- Gatekeeper decisions
- General summaries

❌ **NEVER logged:**
- Passwords or API keys
- Personal information
- Credit card numbers
- Full message content with sensitive data

## Monitoring

### Endpoints

- `GET /code/api/monitoring/system/current` - Current system metrics
- `GET /code/api/monitoring/services/health` - Service health status
- `GET /code/api/monitoring/security/recent-blocks` - Recent security blocks
- `GET /code/api/monitoring/ai/stats` - AI performance stats

### Metrics Tracked

**System Health:**
- CPU, RAM, Disk, GPU usage
- Network bandwidth
- Status colors (green <70%, yellow <85%, red >85%)

**Service Health:**
- API uptime
- Database connectivity
- Ollama availability
- Gatekeeper status

**Security Events:**
- Gatekeeper blocks
- Rate limit violations
- Killswitch activations
- Suspicious patterns

**AI Performance:**
- Requests per minute
- Average latency
- Token usage
- Service breakdown

## Elesti Integration

Elesti should POST to the Universal Input API:

```javascript
// Example Elesti integration
const response = await fetch('http://localhost:8000/api/v2/universal/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key' // Optional for external services
  },
  body: JSON.stringify({
    source: 'elesti',
    source_metadata: {
      sender: 'elesti-client-id',
      timestamp: new Date().toISOString(),
      platform: 'elesti'
    },
    ai_service: 'chat',
    payload: {
      input: userMessage,
      parameters: { temperature: 0.7 }
    },
    user_id: 'allan',
    fetch_context: true
  })
});

const data = await response.json();

if (data.status === 'approved') {
  // Use data.robbie_response.message
  displayResponse(data.robbie_response.message);
  
  // Execute any approved actions
  for (const action of data.robbie_response.actions) {
    handleAction(action);
  }
} else {
  // Handle rejection
  console.error('Request blocked:', data.gatekeeper_review.reasoning);
}
```

## Rate Limits

Default limits (configurable):

- **Email sends:** 10 per 5 minutes
- **API calls:** 100 per minute
- **Image generation:** 20 per 10 minutes

Exceeding limits triggers:
1. Request rejection
2. Gatekeeper block logged
3. Killswitch activation (if excessive)

## Error Handling

### HTTP Status Codes

- `200 OK` - Request processed successfully
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Invalid API key (if required)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Processing failed

### Status Field

- `approved` - Request approved, actions can be executed
- `rejected` - Pre-flight check failed
- `revised` - Post-flight modified response
- `blocked` - Killswitch active or critical security issue

## Testing

### Test the Universal API

```bash
# Test chat request
curl -X POST http://localhost:8000/api/v2/universal/request \
  -H "Content-Type: application/json" \
  -d '{
    "source": "api",
    "ai_service": "chat",
    "payload": {
      "input": "Hello, Robbie!",
      "parameters": {"temperature": 0.7}
    }
  }'

# Test killswitch
curl http://localhost:8000/code/api/killswitch/status

# Test monitoring
curl http://localhost:8000/code/api/monitoring/system/current
```

### Test Robbiebar Killswitch

1. Open Cursor
2. Click RobbieBar icon in sidebar
3. See killswitch control bar at top
4. Click "🔴 Activate Killswitch"
5. Verify network status changes to "BLOCKED"
6. Try sending email - should be blocked
7. Click "🟢 Deactivate Killswitch" to restore

## Database Schema

Logs are stored in these tables:

- `ai_request_logs` - All AI requests (90-day retention)
- `killswitch_state` - Killswitch activation history
- `gatekeeper_blocks` - Security blocks and reasons
- `rate_limit_tracking` - Rate limit violations
- `monitoring_metrics` - System/service/security metrics

See `database/unified-schema/24-universal-input-logs.sql` for full schema.

## Performance

**Target Latency:**
- Gatekeeper checks: <100ms
- Chat requests: <2 seconds
- Embeddings: <500ms
- Code generation: <3 seconds
- Image generation: <10 seconds

**With Context Retrieval:**
- Add ~200ms for vector search

## Security Best Practices

1. **API Keys:** Use authentication for external services
2. **Rate Limiting:** Monitor and adjust limits as needed
3. **Killswitch:** Test regularly to ensure it works
4. **Logging:** Review logs daily for suspicious patterns
5. **Updates:** Keep gatekeeper rules current

## Troubleshooting

### Requests Being Blocked

Check gatekeeper logs:
```bash
tail -f /var/log/robbie/universal-input.log | grep BLOCKED
```

Or query database:
```sql
SELECT * FROM gatekeeper_blocks ORDER BY timestamp DESC LIMIT 10;
```

### Slow Responses

Check monitoring metrics:
```bash
curl http://localhost:8000/code/api/monitoring/ai/stats
```

### Killswitch Won't Deactivate

Check killswitch status:
```bash
curl http://localhost:8000/code/api/killswitch/status
```

Force deactivate via SQL if needed:
```sql
UPDATE killswitch_state SET is_active = FALSE WHERE is_active = TRUE;
```

## Support

For issues or questions:
1. Check logs: `/var/log/robbie/universal-input.log`
2. Review monitoring dashboard
3. Query SQL logs for detailed history
4. Contact system administrator

---

**Built with 💜 by Robbie for Allan's AI Empire**  
**TestPilot CPG | Aurora AI Robbiverse**


