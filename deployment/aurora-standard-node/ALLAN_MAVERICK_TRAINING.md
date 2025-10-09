# 🧠 Allan Maverick Model - Training Infrastructure

## Overview

The Allan Maverick model is Allan's digital twin - an AI model fine-tuned on Allan's actual:
- Emails (writing style)
- Conversations (decision-making)
- Deals (business logic)
- Sticky notes (thoughts and insights)

## Architecture

### Data Collection
```
PostgreSQL Database
├── crm_emails (Allan's emails)
├── messages (Allan's conversations)
├── crm_deals (Allan's business decisions)
└── sticky_notes (Allan's thoughts)
     ↓
Allan Maverick Trainer
     ↓
Fine-tuned Model (LoRA adapters)
     ↓
Deployed to Ollama
```

### Training Pipeline

1. **Data Collection** (Automated)
   - Pulls latest emails from CRM
   - Extracts conversation history
   - Gathers deal notes and decisions
   - Collects sticky notes and insights

2. **Data Preparation**
   - Filters for quality (min 10 chars)
   - Creates prompt-completion pairs
   - Splits into train/val (90/10)
   - Tokenizes for model

3. **Fine-Tuning** (LoRA)
   - Base model: Llama 2 7B Chat
   - LoRA rank: 16
   - LoRA alpha: 32
   - Learning rate: 2e-4
   - Epochs: 3
   - 4-bit quantization (efficient)

4. **Deployment**
   - Saves model to `/models/allan-maverick/final`
   - Exports to Ollama format
   - Distributes to all GPU nodes
   - Available as "allan-maverick" personality

## GPU Memory Reservation

To ensure training and inference can coexist:

```yaml
# In docker-compose.yml
allan-maverick-trainer:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
      limits:
        memory: 16G  # Reserve 16GB for training
```

**Memory Allocation:**
- **Inference (Ollama):** 8GB reserved
- **Training (Maverick):** 16GB reserved
- **Total GPU RAM needed:** 24GB (RTX 4090, A100)

## Training Schedule

### Automatic Training
```bash
# Cron job (daily at 3 AM)
0 3 * * * curl -X POST http://localhost:8011/api/train
```

### Manual Training
```bash
# Start training with default config
curl -X POST http://localhost:8011/api/train \
  -H "Content-Type: application/json" \
  -d '{
    "epochs": 3,
    "learning_rate": 0.0002,
    "batch_size": 4,
    "max_length": 512
  }'

# Check training status
curl http://localhost:8011/api/training/status
```

## Training Data Sources

### 1. Emails (Writing Style)
```sql
SELECT subject, body, sent_at
FROM crm_emails
WHERE sender_email LIKE '%allan%'
ORDER BY sent_at DESC
LIMIT 1000
```

**What it learns:**
- Allan's writing style
- Email structure and tone
- Business communication patterns
- Subject line preferences

### 2. Conversations (Decision-Making)
```sql
SELECT m.content, m.role, c.metadata
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.user_id = 'allan'
ORDER BY m.created_at DESC
LIMIT 5000
```

**What it learns:**
- Decision-making process
- Problem-solving approach
- Question-answering style
- Conversational patterns

### 3. Deals (Business Logic)
```sql
SELECT deal_name, stage, amount, notes
FROM crm_deals
WHERE owner_email LIKE '%allan%'
ORDER BY created_at DESC
LIMIT 500
```

**What it learns:**
- Business strategy
- Deal evaluation criteria
- Pricing decisions
- Negotiation approach

### 4. Sticky Notes (Insights)
```sql
SELECT title, content, tags, created_at
FROM sticky_notes
WHERE user_id = 'allan'
ORDER BY created_at DESC
LIMIT 2000
```

**What it learns:**
- Strategic thinking
- Personal insights
- Knowledge organization
- Thought patterns

## Model Performance

### Metrics Tracked
- **Training Loss:** Target < 0.5
- **Validation Loss:** Target < 0.6
- **Perplexity:** Target < 10
- **Training Examples:** ~8,500 total
- **Training Time:** ~2-4 hours (RTX 4090)

### Quality Checks
1. **Human Evaluation:** Allan reviews sample responses
2. **Style Matching:** Compare with actual Allan emails
3. **Decision Accuracy:** Test on known business scenarios
4. **Personality Alignment:** Verify tone and approach

## Using Allan Maverick

### In Chat Interface
```javascript
// Select Allan Maverick personality
personality: "allan-maverick"

// Model responds as Allan would
```

### Via API
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Should we close this deal?",
    "personality": "allan-maverick",
    "context": {
      "deal_amount": 50000,
      "deal_stage": "negotiation"
    }
  }'
```

### In AllanBot
```python
# AllanBot uses Maverick for decision-making
allanbot = AllanBot(model="allan-maverick")
decision = allanbot.make_decision(
    context="New client wants 30% discount",
    options=["Accept", "Counter-offer", "Decline"]
)
```

## Continuous Improvement

### Data Collection Loop
```
Allan's Actions
     ↓
Stored in Database
     ↓
Nightly Training
     ↓
Updated Model
     ↓
Better Predictions
     ↓
(Repeat)
```

### Training Frequency
- **Daily:** Incremental training on new data
- **Weekly:** Full retraining from scratch
- **Monthly:** Model evaluation and tuning

### Model Versioning
```
/models/allan-maverick/
├── v1.0/ (baseline)
├── v1.1/ (after 1 week)
├── v1.2/ (after 2 weeks)
└── final/ (latest)
```

## Monitoring

### Training Metrics
```bash
# Check training status
curl http://localhost:8011/api/training/status

# View training logs
docker logs aurora-allan-maverick-trainer -f

# Check GPU usage
nvidia-smi
```

### Model Quality
```bash
# Test model responses
curl -X POST http://localhost:8011/api/test \
  -d '{"prompt": "Write an email about TestPilot CPG"}'

# Compare with actual Allan response
# Human evaluation score: 1-10
```

## Deployment Checklist

- [x] Allan Maverick Trainer service created
- [x] Data collection from 4 sources
- [x] LoRA fine-tuning configured
- [x] GPU memory reservation (16GB)
- [x] Automated training schedule
- [x] Model versioning system
- [x] Health checks and monitoring
- [x] API endpoints for training
- [x] Integration with Ollama
- [x] Integration with AllanBot

## Next Steps

1. **Deploy trainer service** (included in docker-compose.yml)
2. **Run initial training** (manual trigger)
3. **Evaluate model quality** (Allan reviews)
4. **Enable automatic training** (daily cron)
5. **Monitor and improve** (continuous loop)

---

**Allan Maverick is your digital twin - continuously learning from your actions to make better decisions on your behalf.** 🧠

*Last Updated: $(date)*
