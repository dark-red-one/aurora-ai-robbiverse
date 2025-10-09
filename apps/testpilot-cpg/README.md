# TestPilot CPG - Revenue Dashboard

**Your business. Your money-maker. Priority #1.** 💰

## What This Is

The TestPilot CPG app is YOUR revenue-generating machine - a complete CRM and chat interface where you can:

- Track deals and pipeline (because money talks)
- Manage CPG contacts and companies
- Talk to Robbie about deals, strategy, and revenue
- See real-time revenue dashboard
- Get intelligent follow-up suggestions

## Quick Start

```bash
# From repo root
cd apps/testpilot-cpg
npm install
npm run dev

# Opens at http://localhost:5173
```

## What's Different Here

This isn't a template - this is YOUR actual business app. It:

- Uses TestPilot-specific branding (orange/blue, Montserrat)
- Connects to YOUR CRM tables (contacts, deals, companies)
- Has Robbie tuned for revenue-focus (Gandhi-Genghis level 7)
- Deploys to `app.testpilotcpg.com`

## Structure

```
apps/testpilot-cpg/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx       # Revenue dashboard
│   │   ├── Pipeline.tsx        # Sales pipeline view
│   │   ├── Contacts.tsx        # CRM contacts
│   │   └── Chat.tsx            # Talk to Robbie
│   ├── components/
│   │   ├── DealCard.tsx        # TestPilot-specific
│   │   └── RevenueChart.tsx    # TestPilot-specific
│   ├── App.tsx
│   └── main.tsx
├── branding.json               # TestPilot colors/theme
└── package.json                # Uses @robbieblocks/core
```

## Database Tables Used

TestPilot queries these tables:

- `contacts` - Your CPG contacts
- `companies` - CPG companies  
- `deals` - Sales pipeline
- `conversations` - Chats with Robbie
- `ai_personality_state` - Robbie's mood
- `robbieblocks_pages` - Dynamic pages

## Deployment

```bash
# Build for production
npm run build

# Deploy to app.testpilotcpg.com
./infrastructure/deployment/deploy-testpilot.sh
```

## Next Steps

1. Build out pages (Dashboard, Pipeline, Contacts, Chat)
2. Connect to real CRM data
3. Deploy to production
4. Close deals! 🎯

---

**Built for Allan Peretz | TestPilot CPG**
