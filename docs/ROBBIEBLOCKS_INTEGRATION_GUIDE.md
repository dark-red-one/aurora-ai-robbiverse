# RobbieBlocks Integration Guide
## Connecting Widgets to Engines & APIs

**Version:** 1.0  
**Last Updated:** October 6, 2025  
**Status:** Production Ready

---

## 🎯 Overview

This guide explains how to integrate RobbieBlocks widgets with backend engines, APIs, and third-party services.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Widget 1 │  │ Widget 2 │  │ Widget 3 │  │ Widget N│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
└───────┼─────────────┼─────────────┼──────────────┼──────┘
        │             │             │              │
        └─────────────┴─────────────┴──────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Integration Layer       │
        │  (Event Bus + API Client) │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────────────────────┐
        │           Backend Engines                  │
        │  ┌─────────┐  ┌─────────┐  ┌───────────┐ │
        │  │   LLM   │  │ Pricing │  │ Workflow  │ │
        │  │ Engine  │  │ Engine  │  │  Engine   │ │
        │  └─────────┘  └─────────┘  └───────────┘ │
        └────────────────────────────────────────────┘
```

---

## 🔌 Engine Endpoints

### SuperfastLLMEngine
**Base URL:** `http://localhost:8001`

#### REST API
```typescript
POST /api/v1/llm/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "prompt": "Your prompt here",
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 1000
}

Response:
{
  "response": "Generated text...",
  "tokens_used": 150,
  "model": "gpt-4"
}
```

#### WebSocket
```typescript
const ws = new WebSocket('ws://localhost:8001/llm');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'generate',
    prompt: 'Your prompt',
    model: 'gpt-4',
    stream: true
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle streaming response
};
```

**Used By:** ChatWidget, PromptConsole

---

### DynamicPricingEngine
**Base URL:** `http://localhost:8002`

#### REST API
```typescript
POST /api/v1/pricing/calculate
Content-Type: application/json

{
  "product_id": "prod_123",
  "quantity": 1,
  "user_segment": "enterprise",
  "promo_code": "SAVE20"
}

Response:
{
  "base_price": 99.00,
  "discount": 19.80,
  "tax": 7.94,
  "total": 87.14,
  "currency": "USD"
}
```

#### GraphQL
```graphql
query GetPricing($productId: ID!, $quantity: Int!) {
  pricing(productId: $productId, quantity: $quantity) {
    basePrice
    discount
    tax
    total
    currency
  }
}
```

**Used By:** PricingPlans, SmartCart, ROICalculator

---

### WorkflowPlaybookEngine
**Base URL:** `http://localhost:8003`

#### REST API
```typescript
POST /api/v1/workflows/execute
Content-Type: application/json

{
  "workflow_id": "wf_123",
  "inputs": {
    "param1": "value1",
    "param2": "value2"
  }
}

Response:
{
  "execution_id": "exec_456",
  "status": "running",
  "steps_completed": 0,
  "total_steps": 5
}
```

#### WebSocket (Real-time Updates)
```typescript
const ws = new WebSocket('ws://localhost:8003/workflows/exec_456');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // { step: 2, status: 'completed', result: {...} }
};
```

**Used By:** WorkflowRunner

---

### StripePaymentEngine
**Integration:** Direct Stripe API

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');

// Create payment intent
const response = await fetch('/api/v1/payments/create-intent', {
  method: 'POST',
  body: JSON.stringify({ amount: 9900, currency: 'usd' })
});

const { clientSecret } = await response.json();

// Confirm payment
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'Customer Name' }
  }
});
```

**Used By:** SmartCart, PricingPlans

---

### Analytics Engine
**Base URL:** `http://localhost:8004`

#### Track Event
```typescript
POST /api/v1/analytics/track
Content-Type: application/json

{
  "event": "widget_interaction",
  "widget_id": "chat_widget_1",
  "user_id": "user_123",
  "properties": {
    "action": "message_sent",
    "message_length": 150
  },
  "timestamp": "2025-10-06T12:00:00Z"
}
```

#### Query Analytics
```typescript
GET /api/v1/analytics/query?widget_id=chat_widget_1&start_date=2025-10-01&end_date=2025-10-06

Response:
{
  "total_events": 1250,
  "unique_users": 87,
  "top_actions": [
    { "action": "message_sent", "count": 450 },
    { "action": "button_clicked", "count": 320 }
  ]
}
```

**Used By:** ALL widgets (via analytics prop)

---

## 🔧 Widget Integration Patterns

### Pattern 1: Direct API Integration

```typescript
import React, { useState } from 'react';
import { ChatWidget } from '@robbieblocks/widgets';

const MyApp = () => {
  const config = {
    id: 'main-chat',
    apiEndpoint: 'http://localhost:8001/api/v1/llm/generate',
    theme: 'dark',
  };

  const handleEvent = async (event) => {
    if (event.type === 'message_sent') {
      // Custom handling
      console.log('User sent:', event.data.message);
    }
  };

  return (
    <ChatWidget 
      config={config}
      onEvent={handleEvent}
    />
  );
};
```

---

### Pattern 2: Event Bus Integration

```typescript
// eventBus.ts
class EventBus {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
}

export const eventBus = new EventBus();

// Usage in widget
import { eventBus } from './eventBus';

const handleWidgetEvent = (event) => {
  eventBus.emit(`widget:${event.type}`, event.data);
};

<ChatWidget config={config} onEvent={handleWidgetEvent} />

// Listen elsewhere
eventBus.on('widget:message_sent', (data) => {
  // Handle message
});
```

---

### Pattern 3: Analytics Integration

```typescript
// analytics.ts
class AnalyticsTracker {
  track(event: any) {
    fetch('http://localhost:8004/api/v1/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: event.event,
        widget_id: event.widget_id,
        user_id: this.getUserId(),
        properties: event.properties || {},
        timestamp: new Date().toISOString(),
      }),
    });
  }

  private getUserId() {
    return localStorage.getItem('user_id') || 'anonymous';
  }
}

export const analytics = new AnalyticsTracker();

// Usage
<ChatWidget 
  config={config}
  analytics={analytics}
/>
```

---

### Pattern 4: State Management Integration (Redux)

```typescript
// redux/widgetSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const widgetSlice = createSlice({
  name: 'widgets',
  initialState: {
    chatMessages: [],
    cartItems: [],
  },
  reducers: {
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    },
    addCartItem: (state, action) => {
      state.cartItems.push(action.payload);
    },
  },
});

export const { addChatMessage, addCartItem } = widgetSlice.actions;

// Usage
import { useDispatch } from 'react-redux';
import { addChatMessage } from './redux/widgetSlice';

const MyApp = () => {
  const dispatch = useDispatch();

  const handleChatEvent = (event) => {
    if (event.type === 'message_sent') {
      dispatch(addChatMessage(event.data));
    }
  };

  return <ChatWidget config={config} onEvent={handleChatEvent} />;
};
```

---

## 🔐 Authentication & Authorization

### JWT Token Authentication

```typescript
// authService.ts
class AuthService {
  private token: string | null = null;

  async login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const { token } = await response.json();
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  async fetchWithAuth(url: string, options: RequestInit = {}) {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });
  }
}

export const authService = new AuthService();

// Usage in widget config
const config = {
  id: 'secure-chat',
  apiEndpoint: 'http://localhost:8001/api/v1/llm/generate',
  fetchFunction: authService.fetchWithAuth.bind(authService),
};
```

---

## 🌐 Cross-Origin Resource Sharing (CORS)

### Backend Configuration (FastAPI)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://askrobbie.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🚀 Deployment Configurations

### Development
```typescript
const config = {
  llmEndpoint: 'http://localhost:8001/api/v1/llm/generate',
  pricingEndpoint: 'http://localhost:8002/api/v1/pricing/calculate',
  analyticsEndpoint: 'http://localhost:8004/api/v1/analytics/track',
};
```

### Production
```typescript
const config = {
  llmEndpoint: 'https://api.askrobbie.ai/llm/generate',
  pricingEndpoint: 'https://api.askrobbie.ai/pricing/calculate',
  analyticsEndpoint: 'https://api.askrobbie.ai/analytics/track',
};
```

### Environment Variables
```bash
# .env
REACT_APP_LLM_ENDPOINT=https://api.askrobbie.ai/llm/generate
REACT_APP_PRICING_ENDPOINT=https://api.askrobbie.ai/pricing/calculate
REACT_APP_ANALYTICS_ENDPOINT=https://api.askrobbie.ai/analytics/track
REACT_APP_STRIPE_KEY=pk_live_...
```

```typescript
const config = {
  llmEndpoint: process.env.REACT_APP_LLM_ENDPOINT,
  pricingEndpoint: process.env.REACT_APP_PRICING_ENDPOINT,
  analyticsEndpoint: process.env.REACT_APP_ANALYTICS_ENDPOINT,
};
```

---

## 📊 Error Handling

### Widget-Level Error Handling

```typescript
const handleWidgetEvent = (event) => {
  if (event.type === 'error') {
    console.error('Widget error:', event.data);
    
    // Log to error tracking service
    fetch('/api/errors/log', {
      method: 'POST',
      body: JSON.stringify({
        widget: event.widget,
        error: event.data.message,
        stack: event.data.stack,
      }),
    });
    
    // Show user-friendly message
    showNotification('Something went wrong. Please try again.');
  }
};
```

### Global Error Boundary

```typescript
import React from 'react';

class WidgetErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Widget crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Widget failed to load. Please refresh.</div>;
    }
    return this.props.children;
  }
}

// Usage
<WidgetErrorBoundary>
  <ChatWidget config={config} />
</WidgetErrorBoundary>
```

---

## 🧪 Testing Integration

### Mock API Responses

```typescript
// mockApi.ts
export const mockLLMResponse = {
  response: 'This is a mock response from the LLM.',
  tokens_used: 50,
  model: 'gpt-4',
};

export const mockPricingResponse = {
  base_price: 99.00,
  discount: 0,
  tax: 7.92,
  total: 106.92,
  currency: 'USD',
};

// Usage in tests
import { mockLLMResponse } from './mockApi';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockLLMResponse),
  })
);
```

---

## 📝 Best Practices

1. **Always use environment variables** for API endpoints
2. **Implement retry logic** for failed API calls
3. **Cache responses** when appropriate
4. **Use WebSockets** for real-time features
5. **Implement proper error handling** at all levels
6. **Log all events** to analytics
7. **Use TypeScript** for type safety
8. **Test integration points** thoroughly
9. **Monitor API performance** in production
10. **Implement rate limiting** on the client side

---

## 🔗 Quick Reference

| Widget | Primary Engine | Secondary Engine | Analytics |
|--------|---------------|------------------|-----------|
| ChatWidget | LLM | - | ✅ |
| SmartCart | Pricing | Stripe | ✅ |
| WorkflowRunner | Workflow | - | ✅ |
| ROICalculator | Pricing | - | ✅ |
| PromptConsole | LLM | - | ✅ |
| All Others | - | - | ✅ |

---

**Built with 💕 by Robbie AI**  
**For Allan's AI Empire**  
**October 6, 2025**
