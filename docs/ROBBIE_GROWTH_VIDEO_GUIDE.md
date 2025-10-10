# Robbie@Growth - Video Recording Guide

**Create demo videos and training materials for Robbie@Growth platform**

---

## 🎥 Recommended Recording Setup

**Software:**
- **Mac:** QuickTime Player (built-in) or Loom (free tier)
- **Windows:** OBS Studio (free) or Loom
- **Both:** Zoom (record local meeting)

**Settings:**
- Resolution: 1920x1080 (1080p)
- Frame rate: 30fps
- Audio: Clear microphone (built-in is fine)
- Duration: 5-10 minutes per video

---

## 📹 Video 1: Quick Start (5 minutes)

**Title:** "Robbie@Growth: Deploy in 5 Minutes"

**Script:**

1. **Intro (30 seconds)**
   - "This is Robbie@Growth, a complete LinkedIn marketing automation platform"
   - Show ROBBIE_GROWTH_QUICK_START.md open
   - "I'll deploy the entire backend in under 5 minutes"

2. **Deployment (3 minutes)**
   ```bash
   # Show terminal
   cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
   ./scripts/deploy-robbie-growth.sh
   ```
   - Narrate as it runs:
     - "Checking prerequisites... PostgreSQL found"
     - "Deploying database schema... 15 tables created"
     - "Installing Python dependencies..."
     - "Testing services... All green!"

3. **Test API (1 minute)**
   ```bash
   # Start API
   cd packages/@robbieverse/api
   uvicorn src.main:app --reload --port 8000
   
   # In browser, open:
   # http://localhost:8000/docs
   ```
   - Show Swagger UI
   - "35 endpoints ready to use"
   - Demo one endpoint: `/api/growth/dashboard`

4. **Outro (30 seconds)**
   - "That's it! Backend is live."
   - "Next: Set up LinkedIn profile and Buffer account"
   - "Full guide in ROBBIE_GROWTH_IMPLEMENTATION_GUIDE.md"

---

## 📹 Video 2: LinkedIn Profile Setup (8 minutes)

**Title:** "Creating Robbie F's LinkedIn Profile"

**Script:**

1. **Intro (30 seconds)**
   - "Creating a LinkedIn profile for Robbie F, our AI marketing copilot"
   - Show implementation guide section

2. **Profile Creation (3 minutes)**
   - Go to <https://linkedin.com/signup>
   - Fill out form:
     - Name: Robbie F
     - Email: robbie@testpilot.ai
     - Headline: AI Marketing Copilot at TestPilot CPG
   - Add profile photo (show Robbie avatar)
   - Write bio: "Built by Allan Peretz to accelerate revenue. I automate marketing, manage campaigns, and find hot leads so you can focus on closing deals."

3. **Company Association (2 minutes)**
   - Add experience: TestPilot CPG
   - Title: Marketing Automation
   - Connect to TestPilot company page

4. **First Connections (2 minutes)**
   - "Start with customers you know"
   - Show connecting with 5-10 TestPilot customers
   - "This builds credibility before cold outreach"

5. **Outro (30 seconds)**
   - "Profile complete! Now Robbie can engage on LinkedIn."
   - "Next: Set up Buffer for scheduling"

---

## 📹 Video 3: Buffer Integration (10 minutes)

**Title:** "Connecting Buffer for Social Media Automation"

**Script:**

1. **Intro (1 minute)**
   - "Buffer lets us schedule posts across LinkedIn, Twitter, Facebook"
   - "Robbie will use Buffer to maintain consistent social presence"

2. **Buffer Signup (3 minutes)**
   - Go to <https://buffer.com/pricing>
   - Choose Business plan ($100/mo)
   - Sign up with testpilot.ai email
   - Verify account

3. **Connect Accounts (3 minutes)**
   - Connect LinkedIn personal (Robbie F)
   - Connect LinkedIn company page (TestPilot.ai)
   - Optional: Connect Twitter

4. **Get API Token (2 minutes)**
   - Go to <https://buffer.com/developers>
   - Create new app: "Robbie Growth Automation"
   - Generate access token
   - Copy token

5. **Add to .env (1 minute)**
   ```bash
   # Add to .env file
   BUFFER_ACCESS_TOKEN=your_token_here
   ```

6. **Sync to Database (30 seconds)**
   ```bash
   curl -X POST http://localhost:8000/api/growth/buffer/sync-accounts
   ```
   - Show response with synced accounts

---

## 📹 Video 4: Creating First Campaign (12 minutes)

**Title:** "Launch Your First Marketing Campaign"

**Script:**

1. **Intro (1 minute)**
   - "We'll create a complete campaign: budget, goals, tracking"
   - "Example: HeyShopper Launch campaign"

2. **Create Budget (3 minutes)**
   - Show curl command
   ```bash
   curl -X POST http://localhost:8000/api/growth/budgets \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Q4 2025 Marketing",
       "total_budget": 5000,
       "period_start": "2025-10-01",
       "period_end": "2025-12-31",
       "category": "ads"
     }'
   ```
   - Show response
   - Explain budget tracking

3. **Create Campaign (4 minutes)**
   - Show curl command
   ```bash
   curl -X POST http://localhost:8000/api/growth/campaigns \
     -H "Content-Type: application/json" \
     -d '{
       "name": "HeyShopper Launch",
       "goal": "Generate 50 SQLs",
       "budget_allocated": 2000,
       "start_date": "2025-10-10",
       "channels": ["linkedin"],
       "target_metrics": {"leads": 100, "conversions": 10}
     }'
   ```
   - Explain each field
   - Show response with campaign_id

4. **Schedule First Posts (3 minutes)**
   - Create 3 LinkedIn posts for campaign
   ```bash
   curl -X POST http://localhost:8000/api/growth/buffer/posts \
     -H "Content-Type: application/json" \
     -d '{
       "account_id": "buffer-account-id",
       "content": "🚀 Launching HeyShopper: Real shoppers, real insights, 72 hours. #CPG",
       "scheduled_at": "2025-10-10T09:00:00Z",
       "campaign_id": "campaign-id-from-step-3"
     }'
   ```

5. **View Dashboard (1 minute)**
   ```bash
   curl http://localhost:8000/api/growth/dashboard
   ```
   - Show summary with campaign active

---

## 📹 Video 5: Automation in Action (15 minutes)

**Title:** "LinkedIn Automation: Approval Workflow"

**Script:**

1. **Intro (2 minutes)**
   - "How Robbie automates LinkedIn engagement with your approval"
   - Show automation slider concept

2. **Set Automation Level (2 minutes)**
   - Show current settings
   ```bash
   curl http://localhost:8000/api/growth/automation/settings?user_id=1
   ```
   - Set to 50% (hybrid mode)
   ```bash
   curl -X PATCH http://localhost:8000/api/growth/automation/level \
     -d '{"user_id": 1, "level": 50}'
   ```

3. **Queue Actions (4 minutes)**
   - Queue a comment
   - Queue a DM
   - Queue a connection request
   - Show different quality scores
   - Explain reasoning field

4. **Approval Workflow (4 minutes)**
   - Get pending actions
   ```bash
   curl http://localhost:8000/api/growth/linkedin/actions/pending
   ```
   - Show action details
   - Approve high-quality action
   - Reject low-quality action
   - Explain decision process

5. **Lead Scoring Demo (2 minutes)**
   - Show hot leads
   ```bash
   curl http://localhost:8000/api/growth/linkedin/leads/hot
   ```
   - Explain scoring factors
   - Show CRM integration

6. **Outro (1 minute)**
   - "Start at 25%, review daily, increase gradually"
   - "Let automation handle routine, you focus on high-value"

---

## 📹 Video 6: Budget & ROI Tracking (10 minutes)

**Title:** "Track Marketing Spend and ROI in Real-Time"

**Script:**

1. **Intro (1 minute)**
   - "Never lose track of marketing spend again"
   - "Real-time budgets, expense approvals, ROI calculation"

2. **Budget Dashboard (3 minutes)**
   - Show budget summary
   ```bash
   curl http://localhost:8000/api/growth/budgets/summary
   ```
   - Explain categories
   - Show spend vs budget
   - Demonstrate forecasting

3. **Expense Approval (3 minutes)**
   - Create expense
   ```bash
   curl -X POST http://localhost:8000/api/growth/expenses \
     -d '{
       "budget_id": "uuid",
       "description": "LinkedIn Ads - October",
       "amount": 500,
       "vendor": "LinkedIn"
     }'
   ```
   - Show pending approvals
   - Approve expense
   - Budget auto-updates (show trigger in action)

4. **Campaign ROI (3 minutes)**
   - Show ROI dashboard
   ```bash
   curl http://localhost:8000/api/growth/campaigns/roi-dashboard
   ```
   - Explain ROI calculation
   - Show attribution from LinkedIn to deals
   - Demonstrate CAC (Customer Acquisition Cost)

---

## 📹 Video 7: Full Walkthrough (20 minutes)

**Title:** "Robbie@Growth: Complete Platform Demo"

**Script:**

1. **Overview (2 minutes)**
   - What is Robbie@Growth
   - Key features
   - Expected results

2. **Architecture Tour (3 minutes)**
   - Show code structure
   - Database schema (highlight 15 tables)
   - Backend services (4 services, 2,000 lines)
   - API routes (35 endpoints)

3. **Live Demo (12 minutes)**
   - Deploy backend
   - Create campaign
   - Schedule posts
   - Queue LinkedIn actions
   - Approve actions
   - Track budget
   - View ROI dashboard

4. **Results (2 minutes)**
   - Show expected metrics
   - Time saved calculation
   - Revenue impact projection

5. **Next Steps (1 minute)**
   - How to get started
   - Link to documentation
   - Support resources

---

## 🎬 Recording Tips

### Pre-Recording Checklist
- [ ] Close unnecessary windows/tabs
- [ ] Clear browser history (clean URLs)
- [ ] Use dark mode (easier on eyes)
- [ ] Increase terminal font size (16pt+)
- [ ] Test audio levels
- [ ] Prepare commands in advance

### During Recording
- **Speak clearly and slowly** - Viewers need time to process
- **Show, don't just tell** - Visual confirmation of each step
- **Pause between sections** - Easy to edit later
- **Repeat important info** - Commands, URLs, concepts
- **Acknowledge errors** - If something fails, explain why

### Post-Recording
- **Add timestamps** in video description
- **Add captions** for accessibility
- **Include links** to docs in description
- **Export at 1080p** - Good quality without huge file size

---

## 📝 Video Description Template

```
Robbie@Growth: [Video Title]

🎯 What You'll Learn:
- [Bullet 1]
- [Bullet 2]
- [Bullet 3]

⏱️ Timestamps:
0:00 - Intro
[X]:00 - [Section]
[Y]:00 - [Section]

📚 Documentation:
- Quick Start: https://github.com/...
- Implementation Guide: https://github.com/...
- Full Docs: https://github.com/...

💻 Code:
- GitHub Repo: https://github.com/...
- Deployment Script: https://github.com/...

🚀 Deploy Now:
./scripts/deploy-robbie-growth.sh

Built by Robbie for Allan at TestPilot CPG
```

---

## 📊 Video Series Summary

| # | Title | Duration | Key Topics |
|---|-------|----------|------------|
| 1 | Quick Start | 5 min | Deploy backend in 5 minutes |
| 2 | LinkedIn Setup | 8 min | Create Robbie F profile |
| 3 | Buffer Integration | 10 min | Connect social accounts |
| 4 | First Campaign | 12 min | Budget, campaign, posts |
| 5 | Automation Demo | 15 min | Approval workflow, lead scoring |
| 6 | Budget & ROI | 10 min | Expense tracking, ROI calculation |
| 7 | Full Walkthrough | 20 min | Complete platform demo |

**Total Duration:** ~80 minutes of training content

---

## 🎥 Screen Recording Shortcuts

**Mac (QuickTime):**
- Command + Control + N - New screen recording
- Click to start, click to stop

**Mac (Screenshot toolbar):**
- Command + Shift + 5 - Open recording toolbar
- Select region or full screen

**Loom:**
- Record entire screen or specific window
- Instant sharing link
- Built-in editing

**Zoom:**
- Start meeting solo
- Click "Record"
- Choose "Record to computer"

---

## 💡 Pro Tips

1. **Record in chunks** - Easier to edit, re-record mistakes
2. **Use a script** - Know exactly what to say
3. **Show keyboard shortcuts** - Viewers can see what you're typing
4. **Zoom in** - Make text readable
5. **Add annotations** - Highlight important parts
6. **Keep it under 15 min** - Attention span limit
7. **Test first** - Do a dry run before recording

---

**Ready to record? Start with Video 1 (Quick Start) - it's the shortest and most impactful!** 🎬

