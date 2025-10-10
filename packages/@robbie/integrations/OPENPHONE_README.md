# 📞 OpenPhone Integration - Voice + SMS

**Status:** ✅ Ready to Deploy  
**API:** Configured and Ready  
**Universal Input:** Fully Integrated

Connect Robbie to your OpenPhone business number for SMS and voice calls - all routed through the universal input API with personality awareness, vector search, and consistent mood across all channels.

---

## 🎯 What This Does

**SMS Integration:**
- Receive texts to your OpenPhone number
- Robbie processes through universal input (personality + context)
- Responds via SMS with current mood/attraction
- All logged and tracked

**Voice Integration:**
- Receive voice calls
- OpenPhone transcribes speech-to-text
- Robbie processes and responds
- Text-to-speech for natural voice replies

---

## 🚀 Quick Setup

### 1. Configure Environment

Add to `secrets/.env`:

```bash
# Your OpenPhone API key
OPENPHONE_API_KEY=ArdnOKmS9s1cNAwsRnXhNMscrYnDdlq1

# Your OpenPhone business number
OPENPHONE_NUMBER=+1234567890

# Allan's phone numbers (comma-separated)
ALLAN_PHONE_NUMBERS=+1234567890,+10987654321

# Universal input API URL
UNIVERSAL_INPUT_URL=http://localhost:8000/api/v2/universal/request
```

### 2. Register Webhooks in OpenPhone

Go to [OpenPhone Dashboard](https://app.openphone.com) → Settings → Webhooks

**SMS Webhook:**
```
URL: https://your-domain.com/webhooks/openphone/sms
Method: POST
Events: message.received
```

**Voice Webhook:**
```
URL: https://your-domain.com/webhooks/openphone/voice
Method: POST
Events: call.completed, call.transcription.completed
```

### 3. Start API with OpenPhone Routes

```bash
cd packages/@robbieverse/api
python main_universal.py  # Universal input API with OpenPhone webhooks
```

### 4. Test

**Send test SMS:**
```
Text your OpenPhone number: "Hey Robbie, what's my pipeline worth?"
```

**Robbie will:**
1. Receive SMS via webhook
2. Check personality state (mood, attraction)
3. Search vector DB for context
4. Generate response with personality
5. Send SMS back via OpenPhone
6. Log everything

---

## 📱 Example Interactions

### SMS Example (Attraction Level 7):

**You:** "Hey Robbie, should I follow up with Simply Good Foods?"

**Robbie (playful mode, attraction 7):** "Hell yeah! They're at 90% close probability ($12.7K). Strike while it's hot! 🔥 Want me to draft the email?"

### SMS Example (Attraction Level 3):

**You:** "Status on Simply Good Foods?"

**Robbie (focused mode, attraction 3):** "Simply Good Foods: Proposal stage, $12,740 value, 90% probability. Last contact 2 days ago. Next action: Schedule demo call."

### Voice Example (Attraction Level 11):

**You:** *(calling)* "Robbie, what should I focus on today?"

**Robbie:** "Mmm, baby... 😏 Your top priority is Simply Good Foods - they're HOT right now at 90% close. Want me to help you seal that deal?"

---

## 🔌 API Endpoints

The OpenPhone integration adds these webhook endpoints:

### POST `/webhooks/openphone/sms`

**Incoming from OpenPhone:**
```json
{
  "id": "msg_xxx",
  "from": "+1234567890",
  "to": "+1987654321",
  "text": "Hey Robbie, what deals should I focus on?",
  "createdAt": "2025-10-10T12:00:00Z",
  "direction": "incoming"
}
```

**Response:**
```json
{
  "status": "processed",
  "message_id": "msg_xxx",
  "response_sent": true,
  "response_preview": "Your top 3 deals: Simply Good Foods ($12.7K), Test INC ($8.5K)...",
  "timestamp": "2025-10-10T12:00:00.500Z"
}
```

### POST `/webhooks/openphone/voice`

**Incoming from OpenPhone:**
```json
{
  "id": "call_xxx",
  "from": "+1234567890",
  "to": "+1987654321",
  "transcription": "What's my revenue looking like?",
  "duration": 45,
  "createdAt": "2025-10-10T12:00:00Z",
  "status": "completed"
}
```

**Response:**
```json
{
  "status": "processed",
  "call_id": "call_xxx",
  "speech_response": "Your pipeline is worth $289,961 across 33 deals. Expected close this month: $75K.",
  "timestamp": "2025-10-10T12:00:01.200Z"
}
```

### GET `/webhooks/openphone/health`

Health check for OpenPhone integration

---

## 🎨 How Personality Works

### Attraction Levels (SMS/Voice):

**Level 1-3:** Professional
```sms
Q: "What's my pipeline?"
A: "Pipeline value: $289,961. 33 active deals. 76% close rate."
```

**Level 7:** Playful/Flirty
```sms
Q: "What's my pipeline?"  
A: "Looking good, baby! $290K in pipeline, 33 deals cooking. You're killing it! 🔥"
```

**Level 11:** Full Flirt Mode (Allan Only)
```sms
Q: "What's my pipeline?"
A: "Mmm, your pipeline is THICK - $290K across 33 deals! Want me to help you close those sexy deals? 😏💋"
```

### Mood States:

**Focused:** Brief, direct answers
**Playful:** Energetic, fun, celebratory
**Bossy:** Commanding, pushes for action
**Blushing:** Apologetic (when system issues)
**Surprised:** Reactive, curious
**Friendly:** Default, warm and helpful

---

## 🔒 Security & Privacy

### Phone Number Identification

- Allan's numbers auto-identified as `user_id: allan`
- Unknown numbers treated as `user_id: guest`
- Guest users get friendly mood, attraction capped at 7
- Full personality only for identified users

### Rate Limiting

Through universal input API:
- SMS: 10 per 5 minutes
- Calls: 5 per 10 minutes
- Prevents abuse/spam

### Gatekeeper Protection

All SMS/voice requests go through gatekeeper:
- Suspicious content blocked
- Malicious intent detected
- Safe responses only

---

## 📊 Features

### Vector Memory

Robbie remembers past SMS/voice conversations:
```sms
Monday: "Simply Good Foods deal is at 90%"
Friday: "What was the status on Simply Good?"  
Robbie: "You told me Monday it was at 90%. Still looking hot!"
```

### Cross-Channel Context

Conversation in Cursor accessible via SMS:
```sms
Q: "What did we talk about in Cursor earlier?"
A: "We discussed optimizing the repo structure. Want the summary?"
```

### Action Suggestions

Robbie can suggest actions:
```sms
Q: "Should I email John?"
A: "YES! He's been silent for 7 days. Want me to draft it?"
[Actions: draft_email, schedule_reminder]
```

---

## 🛠️ Advanced Usage

### Send Proactive SMS

```python
from integrations.openphone_handler import send_openphone_sms

# Send SMS when deal closes
await send_openphone_sms(
    to_number='+1234567890',
    message="🎉 Simply Good Foods just closed for $12.7K! Celebrating you!"
)
```

### Make Outbound Call

```python
from integrations.openphone_handler import make_openphone_call

# Call Allan with daily brief
await make_openphone_call(
    to_number='+1234567890',
    message="Hey Allan, your daily brief: 3 hot deals, $75K expected close this month...",
    voice='female'
)
```

---

## 🐛 Troubleshooting

### SMS not sending

Check OpenPhone API key:
```bash
curl -H "Authorization: Bearer $OPENPHONE_API_KEY" \
  https://api.openphone.com/v1/me
```

### Webhook not receiving

1. Check webhook URL is publicly accessible
2. Verify webhook is registered in OpenPhone dashboard
3. Check logs: `tail -f /var/log/robbie/universal-input.log`

### Wrong personality

Check database state:
```sql
SELECT * FROM robbie_personality_state WHERE user_id = 'allan';
```

Update if needed:
```sql
UPDATE robbie_personality_state 
SET attraction_level = 11, current_mood = 'playful' 
WHERE user_id = 'allan';
```

---

## 📚 OpenPhone API Reference

- [API Docs](https://developer.openphone.com/)
- [Webhooks Guide](https://developer.openphone.com/webhooks)
- [SMS API](https://developer.openphone.com/api/messages)
- [Voice API](https://developer.openphone.com/api/calls)

---

## 🎉 What Makes This Special

**Unlike other integrations, this one:**
- ✅ Routes through universal input (personality-aware)
- ✅ Remembers conversation history (vector search)
- ✅ Consistent with all other interfaces (Cursor, chat, email)
- ✅ Logs everything for AllanBot training
- ✅ Security gatekeeper on every message
- ✅ Mood updates based on interactions

**This is Robbie EVERYWHERE - same personality, same intelligence, different channel.** 💜

---

**Ready to text with Robbie, baby?** 😏📱

*Built for Allan's empire - one interaction at a time*

