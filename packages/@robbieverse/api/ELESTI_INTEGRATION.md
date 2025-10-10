# Elesti Integration Guide

**For:** Elesti developers integrating with Robbie's Universal Input API  
**Version:** 1.0.0  
**Date:** October 10, 2025

## Quick Start

```javascript
// Send a chat message to Robbie
const response = await fetch('http://localhost:8000/api/v2/universal/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source: 'elesti',
    ai_service: 'chat',
    payload: {
      input: 'What is TestPilot CPG pricing?'
    }
  })
});

const data = await response.json();
console.log(data.robbie_response.message);
```

## Complete Integration

### 1. Initialize Elesti Client

```javascript
class RobbieClient {
  constructor(apiUrl = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
    this.source = 'elesti';
  }

  async chat(message, context = null) {
    return await this.request('chat', {
      input: message,
      context: context,
      parameters: { temperature: 0.7 }
    });
  }

  async getEmbedding(text) {
    return await this.request('embedding', {
      input: text
    });
  }

  async generateImage(prompt, size = '1024x1024') {
    return await this.request('image', {
      input: prompt,
      parameters: { size, quality: 'standard' }
    });
  }

  async generateCode(prompt) {
    return await this.request('code', {
      input: prompt,
      parameters: { temperature: 0.3 }
    });
  }

  async analyze(text) {
    return await this.request('analysis', {
      input: text,
      parameters: { temperature: 0.6 }
    });
  }

  async request(aiService, payload, metadata = {}) {
    const response = await fetch(`${this.apiUrl}/api/v2/universal/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: this.source,
        source_metadata: {
          sender: metadata.sender || 'elesti-client',
          timestamp: new Date().toISOString(),
          platform: 'elesti',
          ...metadata
        },
        ai_service: aiService,
        payload: payload,
        user_id: metadata.user_id || 'allan',
        fetch_context: metadata.fetch_context !== false
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Usage
const robbie = new RobbieClient();

// Simple chat
const result = await robbie.chat('Tell me about TestPilot CPG');
console.log(result.robbie_response.message);

// With metadata
const result2 = await robbie.chat('Schedule a demo', {
  sender: 'user@example.com',
  user_id: 'customer_123'
});
```

### 2. Handle Responses

```javascript
async function handleRobbieResponse(result) {
  // Check status
  if (result.status === 'blocked') {
    console.error('Request blocked by killswitch');
    showErrorMessage('System is currently in safety mode. Please try again later.');
    return;
  }

  if (result.status === 'rejected') {
    console.warn('Gatekeeper rejected request:', result.gatekeeper_review.reasoning);
    showWarningMessage('Request could not be processed: ' + result.gatekeeper_review.reasoning);
    return;
  }

  // Display response
  const message = result.robbie_response.message;
  displayMessage(message, result.robbie_response.mood);

  // Handle actions
  for (const action of result.robbie_response.actions || []) {
    await executeAction(action);
  }

  // Log performance
  console.log(`Processed in ${result.processing_time_ms}ms`);
}

async function executeAction(action) {
  switch (action.type) {
    case 'send_email':
      // Show email draft
      showEmailDraft(action.to, action.draft_location);
      break;
    
    case 'schedule_meeting':
      // Open calendar
      openCalendar(action.details);
      break;
    
    case 'create_task':
      // Add to task list
      addTask(action.task);
      break;
    
    default:
      console.warn('Unknown action type:', action.type);
  }
}
```

### 3. Error Handling

```javascript
async function safeRobbieRequest(message) {
  try {
    const result = await robbie.chat(message);
    
    // Check gatekeeper confidence
    if (result.gatekeeper_review.confidence < 0.7) {
      console.warn('Low confidence response:', result.gatekeeper_review.reasoning);
      // Maybe show warning to user
    }
    
    // Check for warnings
    if (result.gatekeeper_review.warnings.length > 0) {
      console.warn('Gatekeeper warnings:', result.gatekeeper_review.warnings);
    }
    
    return result;
    
  } catch (error) {
    console.error('Robbie request failed:', error);
    
    // Fallback behavior
    return {
      status: 'error',
      error: error.message,
      robbie_response: {
        message: 'Sorry, I'm having trouble processing that right now. Please try again.',
        mood: 'focused'
      }
    };
  }
}
```

### 4. Context Management

```javascript
// Fetch context before request
async function chatWithContext(message) {
  // Get embedding for message
  const embeddingResult = await robbie.getEmbedding(message);
  
  if (embeddingResult.success) {
    // Search for relevant context
    const context = await searchLocalContext(embeddingResult.embedding);
    
    // Send with context
    return await robbie.chat(message, context);
  } else {
    // Send without context (Robbie will fetch it)
    return await robbie.chat(message);
  }
}

async function searchLocalContext(embedding) {
  // Your local context search logic
  // Or let Robbie handle it by setting fetch_context: true
  return null;
}
```

### 5. Real-time Updates

```javascript
// Poll for Robbie's mood and status
class RobbieStatusMonitor {
  constructor(apiUrl = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
    this.listeners = [];
  }

  startMonitoring(interval = 30000) {
    this.intervalId = setInterval(async () => {
      try {
        const status = await this.getStatus();
        this.notifyListeners(status);
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, interval);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async getStatus() {
    const response = await fetch(`${this.apiUrl}/api/v2/universal/health`);
    return await response.json();
  }

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(status) {
    for (const listener of this.listeners) {
      listener(status);
    }
  }
}

// Usage
const monitor = new RobbieStatusMonitor();

monitor.onStatusChange(status => {
  if (status.killswitch_active) {
    showWarning('Robbie is in safety mode - limited functionality');
  }
  
  updateMoodIndicator(status.mood);
});

monitor.startMonitoring(30000); // Check every 30 seconds
```

### 6. Batch Requests

```javascript
// Process multiple requests efficiently
async function batchProcess(messages) {
  const results = await Promise.all(
    messages.map(msg => robbie.chat(msg))
  );
  
  return results.filter(r => r.status === 'approved');
}

// Example
const messages = [
  'What is TestPilot pricing?',
  'How does the free trial work?',
  'What integrations are available?'
];

const responses = await batchProcess(messages);
responses.forEach(r => console.log(r.robbie_response.message));
```

## Production Deployment

### Environment Variables

```bash
# Elesti configuration
ROBBIE_API_URL=http://localhost:8000
ROBBIE_API_KEY=your-api-key-here  # Optional, for authentication
ROBBIE_TIMEOUT=30000  # 30 seconds
ROBBIE_RETRY_ATTEMPTS=3
```

### Rate Limiting

Be aware of rate limits:
- **Email actions:** 10 per 5 minutes
- **API calls:** 100 per minute
- **Image generation:** 20 per 10 minutes

Handle rate limit errors:

```javascript
async function requestWithRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        // Rate limited
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Rate limited, waiting ${delay}ms before retry ${attempt}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retry attempts reached');
}
```

### Monitoring

Track Robbie's performance:

```javascript
class RobbieAnalytics {
  constructor() {
    this.metrics = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0,
      gatekeeper_blocks: 0
    };
  }

  trackRequest(result) {
    this.metrics.requests++;
    
    if (result.status === 'approved' || result.status === 'revised') {
      this.metrics.successes++;
    } else {
      this.metrics.failures++;
      if (result.status === 'rejected') {
        this.metrics.gatekeeper_blocks++;
      }
    }
    
    this.metrics.totalLatency += result.processing_time_ms;
  }

  getStats() {
    return {
      ...this.metrics,
      successRate: this.metrics.successes / this.metrics.requests,
      avgLatency: this.metrics.totalLatency / this.metrics.requests
    };
  }
}

const analytics = new RobbieAnalytics();

// Track every request
const result = await robbie.chat(message);
analytics.trackRequest(result);

// View stats
console.log('Robbie Performance:', analytics.getStats());
```

## Testing

### Unit Tests

```javascript
describe('RobbieClient', () => {
  let client;

  beforeEach(() => {
    client = new RobbieClient('http://localhost:8000');
  });

  test('should send chat message', async () => {
    const result = await client.chat('Hello Robbie');
    
    expect(result.status).toBe('approved');
    expect(result.robbie_response.message).toBeTruthy();
    expect(result.gatekeeper_review.approved).toBe(true);
  });

  test('should handle rate limiting', async () => {
    // Send 15 rapid requests
    const promises = Array(15).fill(null).map(() => 
      client.chat('Test message')
    );
    
    const results = await Promise.allSettled(promises);
    const blocked = results.filter(r => 
      r.value?.status === 'rejected'
    );
    
    expect(blocked.length).toBeGreaterThan(0);
  });

  test('should get embeddings', async () => {
    const result = await client.getEmbedding('Test text');
    
    expect(result.success).toBe(true);
    expect(result.embedding).toHaveLength(1536);
  });
});
```

## Troubleshooting

### Common Issues

**1. Connection Refused**
```javascript
// Check if API is running
const response = await fetch('http://localhost:8000/health');
if (!response.ok) {
  console.error('Robbie API is not running');
}
```

**2. Requests Blocked**
```javascript
// Check killswitch status
const killswitchStatus = await fetch('http://localhost:8000/code/api/killswitch/status');
const data = await killswitchStatus.json();

if (data.killswitch.is_active) {
  console.log('Killswitch is active:', data.killswitch.reason);
}
```

**3. Slow Responses**
```javascript
// Check monitoring
const stats = await fetch('http://localhost:8000/code/api/monitoring/ai/stats');
const data = await stats.json();

console.log('Average latency:', data.service_stats);
```

## Support

For issues or questions:
- Check logs: `tail -f /var/log/robbie/universal-input.log`
- Review API docs: http://localhost:8000/docs
- Monitor dashboard: http://localhost:8000/code/api/monitoring/system/current

---

**Built for Elesti by Robbie 💜**
