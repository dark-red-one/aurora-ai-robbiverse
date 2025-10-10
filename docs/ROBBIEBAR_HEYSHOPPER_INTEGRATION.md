# RobbieBar: Universal Interface for HeyShopper

**Date:** October 9, 2025  
**Vision:** One consistent interface across all Robbie products - adapts to context

---

## Core Concept: RobbieBar Everywhere

**RobbieBar is the universal UI layer that appears in:**

- Robbie@Work (CRM, deals, pipeline)
- Robbie@Code (Cursor integration, development)
- Robbie@Play (entertainment, Blackjack, chat)
- **HeyShopper** (shopper testing platform)
- **TestPilot** (standalone version)

**Same component, different content based on context.**

---

## RobbieBar Architecture

### **Core Structure (Always Present):**

```typescript
interface RobbieBarConfig {
  // Universal elements
  personality: {
    mood: 'friendly' | 'focused' | 'playful' | 'bossy' | 'surprised' | 'blushing';
    genghis: number;  // 1-10
    attraction: number;  // 1-11
  };
  
  // Context-specific
  context: 'work' | 'code' | 'play' | 'heyshopper' | 'testpilot';
  
  // Dynamic content
  menuItems: MenuItem[];
  statusTrackers: StatusTracker[];
  quickActions: QuickAction[];
  notifications: Notification[];
  
  // Shared features
  askRobbie: boolean;  // AskRobbie widget available
  moodIndicator: boolean;
  personalityControls: boolean;
}
```

### **HeyShopper-Specific RobbieBar:**

```typescript
const heyShopperRobbieBar: RobbieBarConfig = {
  context: 'heyshopper',
  
  personality: {
    mood: 'focused',      // Default for testing work
    genghis: 7,           // Proactive recommendations
    attraction: 5         // Professional
  },
  
  menuItems: [
    { icon: 'TestTube', label: 'My Tests', route: '/tests' },
    { icon: 'Package', label: 'Products', route: '/products' },
    { icon: 'BarChart3', label: 'Insights', route: '/insights' },
    { icon: 'Users', label: 'Shoppers', route: '/shoppers' },
    { icon: 'CreditCard', label: 'Credits', route: '/billing' },
    { icon: 'Settings', label: 'Settings', route: '/settings' }
  ],
  
  statusTrackers: [
    {
      type: 'activeTests',
      label: 'Active Tests',
      count: 3,
      color: 'cyan',
      link: '/tests?status=active'
    },
    {
      type: 'pendingResults',
      label: 'Results Ready',
      count: 2,
      color: 'pink',
      link: '/tests?status=complete',
      pulse: true  // Animated attention
    },
    {
      type: 'credits',
      label: 'Credits',
      count: 145,
      color: 'purple',
      link: '/billing'
    }
  ],
  
  quickActions: [
    {
      icon: 'Plus',
      label: 'New Test',
      action: () => openRobbieChat('create_test'),
      hotkey: 'Cmd+N'
    },
    {
      icon: 'Search',
      label: 'Search Tests',
      action: () => openSearch(),
      hotkey: 'Cmd+K'
    },
    {
      icon: 'Download',
      label: 'Export Results',
      action: () => exportAllResults(),
      hotkey: 'Cmd+E'
    }
  ],
  
  askRobbie: true,
  moodIndicator: true,
  personalityControls: false  // Hidden unless expert mode
};
```

---

## RobbieBar Variants by Product

### **Robbie@Work (CRM/Deals):**

```typescript
menuItems: [
  'Pipeline',      // Deal stages
  'Contacts',      // People
  'Companies',     // Organizations
  'Tasks',         // To-dos
  'Calendar',      // Meetings
  'Inbox'          // Communications
]

statusTrackers: [
  { label: 'Hot Deals', count: 5, color: 'red' },
  { label: 'This Week', count: 12, color: 'orange' },
  { label: 'Revenue', value: '$108K', color: 'green' }
]

quickActions: [
  'New Deal',
  'Log Activity',
  'Send Email'
]
```

### **HeyShopper (Shopper Testing):**

```typescript
menuItems: [
  'My Tests',      // Test management
  'Products',      // Product catalog
  'Insights',      // AI insights
  'Shoppers',      // Panel management
  'Credits',       // Billing
  'Settings'       // Configuration
]

statusTrackers: [
  { label: 'Active Tests', count: 3, color: 'cyan' },
  { label: 'Results Ready', count: 2, color: 'pink', pulse: true },
  { label: 'Credits', count: 145, color: 'purple' }
]

quickActions: [
  'New Test',
  'Search Tests',
  'Export Results'
]
```

### **Robbie@Code (Development):**

```typescript
menuItems: [
  'Projects',      // Code repositories
  'Tasks',         // Development tasks
  'Docs',          // Documentation
  'GPU Status',    // Compute resources
  'Logs',          // System logs
  'Deploy'         // Deployment
]

statusTrackers: [
  { label: 'GPU Mesh', status: 'online', color: 'green' },
  { label: 'Build', status: 'passing', color: 'green' },
  { label: 'Tasks', count: 7, color: 'orange' }
]

quickActions: [
  'Run Tests',
  'Deploy',
  'Terminal'
]
```

### **TestPilot (Standalone - Minimal RobbieBar):**

```typescript
// Even simpler version for standalone product
menuItems: [
  'Tests',         // Just tests
  'Results',       // Just results
  'Billing'        // Just credits
]

statusTrackers: [
  { label: 'Active', count: 2 },
  { label: 'Credits', count: 145 }
]

// No personality controls visible
// No mood indicator (professional only)
// AskRobbie present but professional tone
personalityControls: false
moodIndicator: false
```

---

## The Visual Design

### **RobbieBar Layout:**

```
┌────────────────────────────────────────────────────────────┐
│ [Robbie Avatar] HeyShopper        [Status] [Status] [Status]│
│                                                              │
│ [Menu] [Menu] [Menu] [Menu]       [Mood] [Settings] [Help] │
└────────────────────────────────────────────────────────────┘
```

**Breakdown:**

- **Left:** Logo/Avatar + Product name
- **Top right:** Context-specific status trackers
- **Bottom:** Menu items + universal controls

**Responsive:**

- **Desktop:** Full bar (as above)
- **Tablet:** Collapsed menu, icon-only
- **Mobile:** Bottom nav bar

---

## Context-Aware Behavior

### **Status Trackers Change by Page:**

**On Tests Dashboard:**

```typescript
statusTrackers: [
  { label: 'Active', count: 3 },
  { label: 'Draft', count: 1 },
  { label: 'Complete', count: 25 }
]
```

**On Test Detail Page:**

```typescript
statusTrackers: [
  { label: 'Responses', count: '48/50', progress: 96 },
  { label: 'Completion', time: '2h remaining' },
  { label: 'Status', value: 'Active', color: 'green' }
]
```

**On Billing Page:**

```typescript
statusTrackers: [
  { label: 'Balance', count: 145, color: 'purple' },
  { label: 'Used This Month', count: 75 },
  { label: 'Avg per Test', count: 52 }
]
```

---

## Personality Integration

### **Mood Indicator (HeyShopper):**

**Visible in RobbieBar:**

```
[😊] Friendly    → Encouraging, warm tone
[🎯] Focused     → Direct, efficient
[🎉] Playful     → Fun, energetic
[💪] Bossy       → Commanding, action-oriented
```

**How it affects experience:**

**Friendly mode:**

```
RobbieBar notification: "Hey! 🎉 Your test results are in! Want to see?"
Quick action button: "Check Results 😊"
```

**Focused mode:**

```
RobbieBar notification: "Test complete. Results ready."
Quick action button: "View Results"
```

**Bossy mode:**

```
RobbieBar notification: "Results are in. Review immediately."
Quick action button: "View Now ⚡"
```

---

## AskRobbie Widget Position

### **RobbieBar + AskRobbie Coordination:**

**Layout:**

```
┌────────────────────────────────────┐
│ RobbieBar (top, 60px height)      │
│                                    │
│                                    │
│    Main Content Area               │
│                                    │
│                                    │
│                              [R]   │  ← AskRobbie (bottom right)
└────────────────────────────────────┘
```

**Integration:**

- RobbieBar = Global navigation + status
- AskRobbie Widget = Contextual help + chat
- Both share same personality state
- Mood changes in RobbieBar → AskRobbie adapts

**Example:**

```typescript
// Shared personality state
const personality = useRobbiePersonality();

// RobbieBar uses it
<RobbieBar personality={personality} context="heyshopper" />

// AskRobbie uses it
<AskRobbieWidget personality={personality} />

// They stay in sync - change mood in RobbieBar, 
// AskRobbie chat tone updates instantly
```

---

## Database Schema for RobbieBar State

```sql
-- Universal RobbieBar state
CREATE TABLE robbiebar_state (
  user_id UUID PRIMARY KEY,
  product_context TEXT,  -- 'work', 'code', 'play', 'heyshopper', 'testpilot'
  
  -- Personality
  current_mood TEXT,
  genghis_level INTEGER,
  attraction_level INTEGER,
  
  -- Preferences
  collapsed_menu BOOLEAN DEFAULT false,
  show_status_trackers BOOLEAN DEFAULT true,
  expert_mode BOOLEAN DEFAULT false,
  
  -- Recent activity
  last_page_visited TEXT,
  recent_actions JSONB,
  
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Product-specific RobbieBar configs
CREATE TABLE robbiebar_product_configs (
  id UUID PRIMARY KEY,
  product_context TEXT UNIQUE,
  default_menu_items JSONB,
  default_status_trackers JSONB,
  default_quick_actions JSONB,
  personality_defaults JSONB,
  created_at TIMESTAMPTZ
);

-- User customizations
CREATE TABLE robbiebar_customizations (
  user_id UUID,
  product_context TEXT,
  custom_menu_order JSONB,
  hidden_items TEXT[],
  pinned_actions TEXT[],
  PRIMARY KEY (user_id, product_context)
);
```

---

## Implementation

### **Shared Component:**

```typescript
// packages/@robbie/ui/RobbieBar.tsx
import { useRobbiePersonality } from '@robbie/personality';
import { useProductContext } from '@robbie/context';

export const RobbieBar = () => {
  const personality = useRobbiePersonality();
  const context = useProductContext();
  
  // Load context-specific config
  const config = useMemo(() => {
    return ROBBIEBAR_CONFIGS[context];
  }, [context]);
  
  return (
    <div className="robbiebar-container">
      {/* Left: Brand */}
      <div className="robbiebar-brand">
        <RobbieAvatar mood={personality.mood} size="sm" />
        <span className="product-name">{config.productName}</span>
      </div>
      
      {/* Center: Menu */}
      <nav className="robbiebar-menu">
        {config.menuItems.map(item => (
          <MenuItem key={item.route} {...item} />
        ))}
      </nav>
      
      {/* Right: Status + Controls */}
      <div className="robbiebar-right">
        {config.statusTrackers.map(tracker => (
          <StatusTracker key={tracker.type} {...tracker} />
        ))}
        
        <MoodIndicator mood={personality.mood} />
        <SettingsMenu />
      </div>
    </div>
  );
};
```

### **HeyShopper-Specific Config:**

```typescript
// apps/heyshopper/config/robbiebar.config.ts

export const HEYSHOPPER_ROBBIEBAR_CONFIG = {
  productName: 'HeyShopper',
  productIcon: '🛒',
  
  menuItems: [
    {
      icon: TestTube,
      label: 'Tests',
      route: '/tests',
      badge: (state) => state.activeTests > 0 ? state.activeTests : null
    },
    {
      icon: Package,
      label: 'Products',
      route: '/products',
      badge: (state) => state.draftProducts > 0 ? '•' : null
    },
    {
      icon: BarChart3,
      label: 'Insights',
      route: '/insights',
      badge: (state) => state.newInsights > 0 ? state.newInsights : null,
      pulse: (state) => state.newInsights > 0
    },
    {
      icon: Users,
      label: 'Shoppers',
      route: '/shoppers',
      expertOnly: true  // Hidden unless expert mode
    },
    {
      icon: CreditCard,
      label: 'Credits',
      route: '/billing'
    }
  ],
  
  statusTrackers: [
    {
      type: 'activeTests',
      icon: Activity,
      label: 'Active',
      getValue: (state) => state.tests.active,
      color: 'cyan',
      onClick: () => navigate('/tests?status=active')
    },
    {
      type: 'pendingResults',
      icon: CheckCircle,
      label: 'Ready',
      getValue: (state) => state.tests.resultsReady,
      color: 'pink',
      pulse: (state) => state.tests.resultsReady > 0,
      onClick: () => navigate('/tests?status=complete')
    },
    {
      type: 'credits',
      icon: Coins,
      label: 'Credits',
      getValue: (state) => state.billing.balance,
      color: 'purple',
      onClick: () => navigate('/billing'),
      warn: (state) => state.billing.balance < 25  // Low credit warning
    }
  ],
  
  quickActions: [
    {
      icon: Plus,
      label: 'New Test',
      action: 'openRobbieChat',
      params: { context: 'create_test' },
      hotkey: 'Cmd+N',
      primary: true
    },
    {
      icon: Search,
      label: 'Search',
      action: 'openCommandPalette',
      hotkey: 'Cmd+K'
    },
    {
      icon: Download,
      label: 'Export',
      action: 'exportData',
      hotkey: 'Cmd+E'
    }
  ],
  
  askRobbie: true,
  moodIndicator: true,
  personalityControls: false  // Hidden by default (expert mode reveals)
};
```

---

## Context-Specific Adaptations

### **When on Test Creation Page:**

**RobbieBar updates dynamically:**

```typescript
statusTrackers: [
  {
    type: 'testProgress',
    label: 'Test Setup',
    value: '3/5 steps',
    progress: 60,
    color: 'cyan'
  },
  {
    type: 'estimatedCost',
    label: 'Estimated',
    value: '60 credits',
    color: 'purple'
  },
  {
    type: 'sampleSize',
    label: 'Shoppers',
    value: '150',
    color: 'pink'
  }
]
```

### **When on Results Page:**

**RobbieBar shows test-specific data:**

```typescript
statusTrackers: [
  {
    type: 'completion',
    label: 'Complete',
    value: '48/50',
    progress: 96,
    color: 'green'
  },
  {
    type: 'significance',
    label: 'p-value',
    value: '0.003',
    color: 'cyan',
    tooltip: 'Highly significant (99.7% confidence)'
  },
  {
    type: 'winner',
    label: 'Winner',
    value: 'Variant B',
    color: 'pink'
  }
]
```

### **When Credits Low:**

**RobbieBar shows warning:**

```typescript
statusTrackers: [
  {
    type: 'credits',
    label: 'Credits Low!',
    count: 18,
    color: 'red',
    pulse: true,
    action: () => navigate('/billing/add-credits')
  }
]

// Robbie proactively suggests
notification: {
  message: "Hey! You're running low on credits (18 left). 
           Want to add more before your next test?",
  actions: [
    { label: 'Add 100 Credits', action: 'buy_credits_100' },
    { label: 'Later', action: 'dismiss' }
  ]
}
```

---

## Personality System Integration

### **Mood Changes Affect Everything:**

**When user changes mood in RobbieBar:**

```typescript
// User clicks mood indicator
<MoodSelector 
  currentMood="focused"
  onChangeMood={async (newMood) => {
    // Update global state
    await updateRobbiePersonality({ mood: newMood });
    
    // RobbieBar updates
    setBarMood(newMood);
    
    // AskRobbie widget updates
    askRobbieWidget.updateTone(newMood);
    
    // Survey conversations update (for active tests)
    surveyEngine.updateConversationTone(newMood);
    
    // Notifications update
    notificationService.setTone(newMood);
  }}
/>
```

**Example changes:**

**Friendly mood:**

- Menu hover: "Let's check your tests! 😊"
- Status tracker: "3 active tests running smoothly!"
- Notification: "Woohoo! Your results are ready! 🎉"

**Focused mood:**

- Menu hover: "Tests"
- Status tracker: "3 active"
- Notification: "Results ready."

**Playful mood:**

- Menu hover: "See what's cookin'! 🎉"
- Status tracker: "3 tests in the oven!"
- Notification: "OMG your results are FIRE! 🔥"

---

## Expert Mode Toggle

### **Simple Mode (Default):**

**RobbieBar shows:**

- ✅ Menu items
- ✅ Status trackers
- ✅ Quick actions
- ✅ Mood indicator
- ❌ Personality controls (hidden)
- ❌ Advanced settings (hidden)
- ❌ Statistical parameters (hidden)

### **Expert Mode (Power Users):**

**RobbieBar reveals:**

- ✅ All simple mode features
- ✅ **Personality controls** (Gandhi-Genghis slider, attraction levels)
- ✅ **Advanced menu items** (Shoppers panel, API access, webhooks)
- ✅ **Statistical controls** (sample size calculator, significance thresholds)
- ✅ **System status** (API health, database stats, vector DB status)

**Toggle location:**

```
RobbieBar → Settings icon → Expert Mode toggle
```

**Stored per user:**

```sql
UPDATE user_preferences 
SET expert_mode_enabled = true 
WHERE user_id = $userId;
```

---

## Implementation Plan

### **Phase 0 (Oct 9-21): Use Basic RobbieBar**

**For Walmart launch, keep it simple:**

- Standard menu
- Active tests + credits trackers
- Professional tone only
- No personality controls visible

### **Phase 0.5 (Weeks 3-4): Unified RobbieBar Component**

**Build shared component library:**

1. **Create `@robbie/ui/RobbieBar`** package

   ```bash
   packages/@robbie/ui/
   ├── RobbieBar/
   │   ├── RobbieBar.tsx
   │   ├── MenuItem.tsx
   │   ├── StatusTracker.tsx
   │   ├── MoodIndicator.tsx
   │   ├── QuickActions.tsx
   │   └── index.ts
   ```

2. **Create context adapters**

   ```typescript
   // Each product provides its config
   import { RobbieBar } from '@robbie/ui';
   import { HEYSHOPPER_CONFIG } from './config/robbiebar';
   
   function HeyShopper() {
     return (
       <>
         <RobbieBar config={HEYSHOPPER_CONFIG} />
         <MainContent />
         <AskRobbieWidget />
       </>
     );
   }
   ```

3. **Integrate with personality system**

   ```typescript
   // Shared state across all products
   import { useRobbiePersonality } from '@robbie/personality';
   
   export const RobbieBar = ({ config }) => {
     const personality = useRobbiePersonality();
     
     // All products use same personality
     // but adapt display to context
     return (
       <Bar 
         config={config}
         mood={personality.mood}
         genghis={personality.genghis}
       />
     );
   };
   ```

### **Phase 1 (Weeks 5-8): Context-Aware Intelligence**

4. **Dynamic status trackers** based on page
5. **Mood-driven notifications** and messaging
6. **Expert mode toggle** with progressive disclosure

### **Phase 2 (Weeks 9-12): Cross-Product Integration**

7. **Unified notifications** across Robbie products
8. **Cross-product quick actions** (switch between products)
9. **Shared search** (Cmd+K searches all Robbie products)

---

## The User Experience

### **TestPilot (Standalone):**

```
User sees: Clean professional testing platform
RobbieBar: Simple menu, status, credits
Personality: Professional tone (friendly default, no customization)
Feel: Traditional SaaS product
```

### **HeyShopper (Robbieverse):**

```
User sees: Same clean interface
RobbieBar: Same menu + mood indicator + more intelligence
Personality: Full system (6 moods, Gandhi-Genghis, customizable)
AskRobbie: Deeply contextual, learns from past tests
Feel: Standalone product, but smarter
```

**The magic:** User doesn't see Robbieverse infrastructure, just experiences:

- Tests get easier to set up (RobbieChat remembers preferences)
- Results get smarter (Robbie finds patterns across tests)
- Experience gets better (continuous improvement from feedback)

---

## Cross-Product Intelligence (HeyShopper Only)

### **Shared Memory Across Products:**

**Scenario: Customer uses Robbie@Work + HeyShopper:**

```
In Robbie@Work:
Allan: "I have a meeting with Cholula tomorrow"
Robbie: "I see you tested Cholula last month in HeyShopper. 
        Want me to pull those insights for the meeting?"

In HeyShopper:
Allan: "Set up test for new jalapeño sauce"
Robbie: "I remember your Cholula meeting notes from 
        Robbie@Work - you mentioned they're expanding 
        flavor line. Is this jalapeño for Cholula?"
```

**How it works:**

```sql
-- Shared vector memory across products
SELECT content, product_context, created_at
FROM robbie_memories
WHERE user_id = $userId
  AND (
    product_context = 'heyshopper' 
    OR product_context = 'work'
  )
ORDER BY embedding <=> $queryEmbedding
LIMIT 10;
```

**Result:** Robbie has full context across your entire business

---

## Competitive Advantage Summary

### **BASES Synthetic:**

- Generic UI
- No personalization
- No cross-product intelligence
- AI predictions only

### **TestPilot (Standalone):**

- Professional UI (RobbieBar simple mode)
- Clean, focused experience
- Real shoppers
- No Robbieverse features visible

### **HeyShopper (Robbieverse):**

- **Same RobbieBar UI** (familiar, consistent)
- **+ Personality system** (mood-aware)
- **+ Cross-product intelligence** (remembers everything)
- **+ Conversational interface** (RobbieChat everywhere)
- **+ Learning engine** (gets smarter with every test)

**Sales pitch:**

```
TestPilot = iPhone (great standalone)
HeyShopper = iPhone in Apple ecosystem (same phone, but iCloud/Handoff/etc.)

Same testing platform, but connected to Robbieverse 
intelligence. Robbie remembers your brand across all 
products and gets smarter every day.

Feels standalone. Works better together.
```

---

## Next Steps

1. ✅ **Review this architecture** (Allan approval)
2. ✅ **Build RobbieBar component** (shared package)
3. ✅ **Create HeyShopper config** (menu, trackers, actions)
4. ✅ **Integrate with personality system** (mood sync)
5. ✅ **Deploy to TestPilot first** (simple mode)
6. ✅ **Add to HeyShopper** (full features)

**Timeline:** Weeks 3-4 for RobbieBar implementation

---

## Document Index

**Core planning docs:**

1. `HEYSHOPPER_MASTER_PLAN.md` - Complete strategy (this document)
2. `HEYSHOPPER_IMPLEMENTATION_PLAN.md` - Technical implementation details
3. `HEYSHOPPER_ROBBIECHAT_ARCHITECTURE.md` - Conversational interface architecture
4. `STATISTICAL_TESTING_REQUIREMENTS.md` - Statistical rigor framework
5. `ROBBIEBAR_HEYSHOPPER_INTEGRATION.md` - This document
6. `TESTER_FEEDBACK_ANALYSIS.md` - Platform improvement from feedback

**Supporting docs:**
7. `TESTPILOT_PRODUCTION_CODEBASE.md` - Existing codebase analysis
8. `TESTPILOT_SCHEMA_DEEP_DIVE.md` - Database schema documentation

---

**RobbieBar: One interface. All products. Context-aware. Personality-driven.** 🚀

*Same component everywhere - adapts to what you're doing, who you are, and what you need.*

