# 📞 OpenPhone Integration

**Status:** ✅ Ready to Deploy  
**API Key:** `ArdnOKmS9s1cNAwsRnXhNMscrYnDdlq1`  
**Integration:** Universal Input API  

---

## 🎯 What This Does

OpenPhone SMS and voice calls are routed through the **Universal Input API** for consistent personality across all interfaces.

**Per-User Personality:**
- Allan's phone number → attraction 11 (flirty responses) 😏💋
- Joe's phone number → attraction 3 (professional responses)
- Unknown numbers → guest settings (professional)

**Features:**
- ✅ Incoming SMS auto-responded with Robbie's personality
- ✅ Incoming voice calls transcribed and responded to
- ✅ All responses use Universal Input API
- ✅ Mood-aware responses (playful, focused, etc.)
- ✅ Vector search for context across all conversations

---

## 🚀 Setup Instructions

### 1. Configure Environment Variables

Add to your `.env` file:

```bash
OPENPHONE_API_KEY=ArdnOKmS9s1cNAwsRnXhNMscrYnDdlq1
OPENPHONE_NUMBER=your_openphone_number
```

### 2. Register Webhooks in OpenPhone Dashboard

**SMS Webhook:**
```
POST https://your-domain.com/webhooks/openphone/sms
```

**Voice Webhook:**
```
POST https://your-domain.com/webhooks/openphone/voice
```

### 3. Start the API Server

```bash
cd packages/@robbieverse/api
python main_universal.py
```

The OpenPhone webhooks are automatically registered when the server starts.

---

## 📱 How It Works

### SMS Flow

1. **SMS received** → OpenPhone calls webhook
2. **Extract sender** → Look up user_id by phone number
3. **Route through Universal Input** → Get personality-aware response
4. **Send SMS reply** → Via OpenPhone API

### Voice Flow

1. **Call received** → OpenPhone calls webhook
2. **Transcription available** → Extract spoken text
3. **Route through Universal Input** → Get personality-aware response
4. **Return response** → Ready for TTS integration

---

## 🔧 API Endpoints

### SMS Webhook
```
POST /webhooks/openphone/sms
```

**Request Body:**
```json
{
  "id": "msg_123",
  "object": "message",
  "createdAt": "2025-10-10T12:00:00Z",
  "direction": "incoming",
  "from": "+15551234567",
  "to": ["+15559876543"],
  "body": "Hey Robbie, what's the deal status?",
  "status": "delivered"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "SMS processed and reply sent",
  "response": "Hey baby! 😏 The TestPilot deal is looking hot...",
  "mood": "playful"
}
```

### Voice Webhook
```
POST /webhooks/openphone/voice
```

**Request Body:**
```json
{
  "id": "call_123",
  "object": "call",
  "createdAt": "2025-10-10T12:00:00Z",
  "direction": "incoming",
  "from": "+15551234567",
  "to": "+15559876543",
  "status": "completed",
  "transcription": "Hey Robbie, what's the deal status?"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Voice call processed",
  "response": "Hey baby! 😏 The TestPilot deal is looking hot...",
  "mood": "playful",
  "speak": true
}
```

---

## 🎨 Personality Examples

### Allan's Phone (Attraction 11)
**Input:** "Hey Robbie, what's the deal status?"
**Output:** "Hey baby! 😏 The TestPilot deal is looking hot - they're ready to sign! Want me to make it work harder for you? 💋"

### Joe's Phone (Attraction 3)
**Input:** "Hey Robbie, what's the deal status?"
**Output:** "Good morning, Joe. The TestPilot deal is progressing well. They've reviewed the proposal and are ready to move forward. I recommend scheduling a follow-up call."

### Unknown Number (Guest)
**Input:** "Hey Robbie, what's the deal status?"
**Output:** "Hello. I'm Robbie, Allan's AI assistant. I can help with business inquiries. Please contact Allan directly for deal status updates."

---

## 🔍 Testing

### Test SMS Webhook
```bash
curl -X POST http://localhost:8000/webhooks/openphone/sms \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_123",
    "object": "message",
    "direction": "incoming",
    "from": "+15551234567",
    "to": ["+15559876543"],
    "body": "Test message from Allan",
    "status": "delivered"
  }'
```

### Test Voice Webhook
```bash
curl -X POST http://localhost:8000/webhooks/openphone/voice \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_123",
    "object": "call",
    "direction": "incoming",
    "from": "+15551234567",
    "to": "+15559876543",
    "status": "completed",
    "transcription": "Test voice message"
  }'
```

---

## 📊 Phone Number Mapping

Add phone numbers to `openphone_handler.py`:

```python
known_numbers = {
    "+15551234567": "allan",  # Allan's phone
    "+15559876543": "joe",    # Joe's phone
}
```

---

## 🚨 Error Handling

### API Unavailable
If Universal Input API is down, responses will be:
- SMS: "Sorry, I'm having technical difficulties. Please try again later."
- Voice: "I'm experiencing technical issues. Please contact Allan directly."

### Unknown Number
Unknown phone numbers get guest personality (professional, no flirting).

### Rate Limiting
OpenPhone has rate limits. The handler includes appropriate delays and error handling.

---

## 🔧 Configuration

### Timeouts
- Universal Input API: 20 seconds
- OpenPhone API: 10 seconds

### Retries
- SMS sending: 1 retry on failure
- Voice processing: No retries (transcription is final)

---

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:8000/webhooks/openphone/health
```

### Logs
Check logs for:
- SMS/voice processing
- Personality lookups
- API responses
- Error handling

---

## 🎯 Success Criteria

✅ **SMS Integration**
- Incoming SMS triggers webhook
- Sender identified by phone number
- Response generated via Universal Input
- SMS reply sent automatically

✅ **Voice Integration**
- Incoming calls trigger webhook
- Transcription processed via Universal Input
- Response ready for TTS

✅ **Personality Consistency**
- Allan's number gets flirty responses
- Joe's number gets professional responses
- Same personality as Cursor, apps, email

✅ **Error Handling**
- Graceful fallbacks for API failures
- Appropriate responses for unknown numbers
- Rate limiting compliance

---

**Ready to deploy! All interfaces now use ONE personality system!** 🚀💋

*Context improved by main overview rule - using SQL website framework pattern with FastAPI backend, PostgreSQL database, and deployable at /code on all servers (Vengeance, RobbieBook1, Aurora Town)*