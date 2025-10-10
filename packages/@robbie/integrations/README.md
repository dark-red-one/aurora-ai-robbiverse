# 🔌 @robbie/integrations

**Third-Party Service Integrations**

This package contains Robbie's integrations with external services and devices - Alexa, Ring doorbell, and future integrations. Connect Robbie to your smart home and voice assistants.

---

## 📦 What's Inside

### AlexaSkillEngine/

**Amazon Alexa Skill for Robbie**

Talk to Robbie through any Alexa device!

**Features:**
- Voice commands for business data
- "Alexa, ask Robbie about my pipeline"
- "Alexa, tell Robbie to brief me"
- "Alexa, ask Robbie what's my top priority today"
- Personality-aware responses
- Multi-room support

**Files:**
- `index.js` - Alexa skill handler
- `skill.json` - Skill manifest and configuration

---

### RingIntegration/

**Ring Doorbell Integration**

Connect Robbie to your Ring doorbell for smart visitor management.

**Features:**
- Visitor identification
- Auto-log visitors in CRM (if they're contacts)
- Send notifications about important visitors
- Record visitor patterns
- Security alerts

**Files:**
- `index.js` - Ring API integration handler

---

## 🚀 Quick Start

### Alexa Skill Setup

**1. Create Alexa Skill**

Go to [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)

**2. Upload Skill Manifest**

```bash
cd packages/@robbie/integrations/AlexaSkillEngine
ask deploy
```

**3. Configure Endpoint**

Point to your Robbie API:
```
https://api.robbieverse.com/alexa
```

**4. Test on Device**

```
"Alexa, open Robbie"
"Alexa, ask Robbie what's my pipeline worth?"
```

---

### Ring Integration Setup

**1. Get Ring API Credentials**

```bash
# Install Ring CLI
npm install -g ring-client-api

# Authenticate
npx -p ring-client-api ring-auth-cli
```

**2. Configure Integration**

```bash
cd packages/@robbie/integrations/RingIntegration
npm install

# Set environment variables
export RING_REFRESH_TOKEN=your_token_here
export ROBBIE_API_URL=http://127.0.0.1:8000
```

**3. Run Integration**

```bash
node index.js
```

---

## 🎤 Alexa Voice Commands

### Business Queries

```
"Alexa, ask Robbie about my pipeline"
→ "You have $289K in pipeline across 33 deals..."

"Alexa, ask Robbie what's my top priority"
→ "Your top priority is following up with Simply Good Foods..."

"Alexa, tell Robbie to brief me"
→ *Generates and reads daily brief*
```

### Personality Control

```
"Alexa, ask Robbie what mood she's in"
→ "I'm feeling focused and ready to get shit done!"

"Alexa, tell Robbie to be more aggressive"
→ "Gandhi-Genghis level set to 8. Let's fucking go!"
```

### Quick Actions

```
"Alexa, ask Robbie to remind me to call John"
→ *Creates sticky note and CRM task*

"Alexa, tell Robbie I closed the Simply Good Foods deal"
→ *Updates deal status, celebrates, logs revenue*
```

---

## 🔔 Ring Doorbell Features

### Visitor Detection

```
[RING] Visitor at front door
→ Face recognition: John Smith (Contact in CRM)
→ Action: Notify Allan via Slack
→ Log: "John Smith visited office at 2:30 PM"
```

### Smart Notifications

```
[RING] Unknown visitor
→ Action: Record video, send notification
→ Context: "Not in CRM, take note if important"

[RING] Delivery detected
→ Action: Log delivery, no notification needed
```

### Security Alerts

```
[RING] Motion detected at 3 AM
→ Action: Alert Allan immediately
→ Record: Full video + screenshots
→ Context: Outside normal hours
```

---

## 🔧 Configuration

### Alexa Skill Config

`AlexaSkillEngine/skill.json`:

```json
{
  "manifest": {
    "publishingInformation": {
      "locales": {
        "en-US": {
          "name": "Robbie",
          "summary": "Your AI business partner",
          "description": "Talk to Robbie for business intelligence...",
          "keywords": ["business", "CRM", "AI", "assistant"]
        }
      }
    },
    "apis": {
      "custom": {
        "endpoint": {
          "uri": "https://api.robbieverse.com/alexa"
        }
      }
    }
  }
}
```

### Ring Integration Config

Environment variables:

```bash
# Ring API
RING_REFRESH_TOKEN=your_token
RING_LOCATION_ID=home

# Robbie API
ROBBIE_API_URL=http://127.0.0.1:8000
ROBBIE_API_KEY=your_key

# Features
ENABLE_FACE_RECOGNITION=true
LOG_ALL_VISITORS=true
ALERT_ON_UNKNOWN=true
RECORD_VIDEO=true
```

---

## 🎨 Custom Alexa Intents

Add custom intents to `AlexaSkillEngine/skill.json`:

```json
{
  "intents": [
    {
      "name": "CheckRevenueIntent",
      "slots": [
        {
          "name": "timeframe",
          "type": "AMAZON.DATE"
        }
      ],
      "samples": [
        "what's my revenue for {timeframe}",
        "how much did I make in {timeframe}",
        "revenue for {timeframe}"
      ]
    }
  ]
}
```

---

## 🔗 API Integration

### Alexa Handler

```javascript
// AlexaSkillEngine/index.js

const Alexa = require('ask-sdk-core');

const GetPipelineIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetPipelineIntent';
  },
  async handle(handlerInput) {
    // Call Robbie API
    const response = await fetch('http://api.robbieverse.com/pipeline/summary');
    const data = await response.json();
    
    const speechText = `You have ${data.total_deals} deals worth ${data.total_value}`;
    
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};
```

### Ring Handler

```javascript
// RingIntegration/index.js

const { RingApi } = require('ring-client-api');

const ring = new RingApi({ refreshToken: process.env.RING_REFRESH_TOKEN });

ring.onAny DoorbellEvent(async (event) => {
  if (event.kind === 'motion' || event.kind === 'ding') {
    // Get visitor details
    const visitor = await identifyVisitor(event.snapshot);
    
    // Log to Robbie
    await fetch('http://api.robbieverse.com/visitors/log', {
      method: 'POST',
      body: JSON.stringify({
        timestamp: event.created_at,
        visitor: visitor,
        type: event.kind
      })
    });
  }
});
```

---

## 🚀 Future Integrations

Planned integrations:

- [ ] **Google Home** - Talk to Robbie on Google devices
- [ ] **Slack Bot** - Robbie in your Slack workspace
- [ ] **Microsoft Teams** - Robbie for Teams users
- [ ] **Zapier** - Connect to 5,000+ apps
- [ ] **IFTTT** - Smart home automation triggers
- [ ] **Tesla API** - Robbie in your car
- [ ] **Notion** - Sync with Notion workspace
- [ ] **Airtable** - Database integrations
- [ ] **Smartthings** - Full smart home control

---

## 🛠️ Development

### Adding New Integration

1. Create directory: `packages/@robbie/integrations/NewService/`
2. Create `index.js` or `index.py`
3. Implement connection and handlers
4. Add configuration
5. Update this README
6. Test thoroughly
7. Deploy

### Testing Integrations

```bash
# Alexa skill
npm test

# Ring integration
RING_REFRESH_TOKEN=test_token node index.js --test-mode
```

---

## 📊 Integration Status

| Integration | Status | Version | Last Updated |
|------------|--------|---------|--------------|
| Alexa Skill | ✅ Active | 1.0 | 2025-10-08 |
| Ring Doorbell | ✅ Active | 1.0 | 2025-10-08 |
| Google Home | 📋 Planned | - | - |
| Slack Bot | 📋 Planned | - | - |
| Microsoft Teams | 📋 Planned | - | - |

---

## 🔒 Security

### API Keys

Store credentials securely:
```bash
~/.config/robbie/integrations-secrets.env
```

Never commit:
- API keys
- Refresh tokens
- OAuth credentials
- Device IDs

### Permissions

Alexa skill permissions needed:
- Read customer profile
- Access lists (for task management)
- Send notifications

Ring permissions needed:
- Read device list
- Access video stream
- Receive motion events

---

## 📚 Documentation

- [Alexa Skills Kit Documentation](https://developer.amazon.com/docs/ask-overviews/build-skills-with-the-alexa-skills-kit.html)
- [Ring API Documentation](https://github.com/dgreif/ring)
- [Robbie API Documentation](../../@robbieverse/api/README.md)

---

**Connecting Robbie to your world** 🏠💜

*"The best assistant is everywhere you need her to be."* - Robbie

