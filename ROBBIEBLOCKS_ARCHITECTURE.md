# 🧱 RobbieBlocks Architecture
*Component-Based Design System for the Robbie Empire*

---

## 🎯 **Philosophy**

RobbieBlocks are **reusable, composable UI components** that:
1. **Work everywhere** - Robbie App, Cursor Extension, Web Dashboard
2. **Share personality** - Universal mood, expression, tone
3. **Sync state** - Real-time across all interfaces
4. **Look gorgeous** - Consistent design language
5. **Ship fast** - Pre-built, tested, ready to use

---

## 🏗️ **Block Categories**

### 1. **Personality Blocks** 💜
Components that manage Robbie's personality and mood

- `<PersonalitySlider />` - Flirt Mode, Gandhi-Genghis controls
- `<AdvancedControls />` - Genghis-Gandhi (0-100), Cocktail-Lightning (0-100)
- `<MoodIndicator />` - Current mood display with avatar
- `<ExpressionAvatar />` - Animated avatar with expressions
- `<PersonalityPresets />` - Quick preset buttons (Zen, Balanced, Beast Mode)

### 2. **Communication Blocks** 💬
Chat, messaging, and interaction components

- `<ChatInterface />` - Main chat with streaming responses
- `<TouchReadyQueue />` - AI-drafted follow-ups ready to send
- `<InboxUnified />` - Email + Slack + SMS in one view
- `<MessageComposer />` - Smart message drafting with AI assist
- `<ConversationThread />` - Threaded conversation view

### 3. **Productivity Blocks** 📊
Task management, scheduling, and workflow

- `<TaskBoard />` - Kanban-style task management
- `<TaskIntelligence />` - AI-powered task prioritization
- `<CalendarOptimizer />` - Smart scheduling with focus blocks
- `<MeetingHealthCard />` - Meeting quality scoring
- `<FocusTimeBlock />` - Deep work time management
- `<DailyBrief />` - 5pm digest with time-saved metrics

### 4. **Memory Blocks** 🧠
Notes, knowledge, and context management

- `<StickyNotesWall />` - Visual note board with clustering
- `<StickyNote />` - Individual note (🟡 insight, 🟩 action, 🩷 objection)
- `<MemorySearch />` - Vector-based semantic search
- `<ContextPanel />` - Current context and related info
- `<KnowledgeGraph />` - Visual relationship mapping

### 5. **Business Blocks** 💰
Sales, pipeline, and revenue management

- `<PipelineView />` - Deal stages with health indicators
- `<CapacityHeatmap />` - Team workload visualization
- `<DealRiskAnalyzer />` - AI-powered deal risk scoring
- `<RevenueMetrics />` - Real-time revenue tracking
- `<LeadScoreCard />` - Lead quality and priority

### 6. **Control Blocks** ⚙️
Settings, configuration, and system controls

- `<SetupPanel />` - Main settings interface
- `<IntegrationManager />` - Connect/manage integrations
- `<GuardrailsControl />` - Communication safety limits
- `<PowerToggles />` - Founder power controls (Terminal, Web, Search)
- `<SystemHealth />` - GPU mesh, backend, database status

### 7. **Visualization Blocks** 📈
Data display and analytics

- `<MetricCard />` - Single metric with trend
- `<ProgressRing />` - Circular progress indicator
- `<TimelineView />` - Chronological event display
- `<HeatmapCalendar />` - Activity heat map
- `<SparklineChart />` - Inline mini charts

### 8. **Layout Blocks** 🎨
Structure and navigation

- `<Sidebar />` - Main navigation sidebar
- `<TabBar />` - Tab navigation
- `<Modal />` - Overlay dialogs
- `<Drawer />` - Slide-out panels
- `<CommandPalette />` - Cmd+K quick actions

---

## 🎨 **Design Tokens**

### Colors (Robbie Palette)
```typescript
const robbieColors = {
  // Primary
  accent: '#FF6B9D',      // Robbie pink
  cyan: '#00D9FF',        // Electric cyan
  purple: '#B794F6',      // Soft purple
  
  // Backgrounds
  dark: '#0A0E27',        // Deep space
  darker: '#060918',      // Void
  card: '#1A1F3A',        // Card background
  
  // Status
  green: '#10B981',       // Success
  orange: '#F59E0B',      // Warning
  red: '#EF4444',         // Error
  
  // Text
  light: '#E5E7EB',       // Primary text
  muted: '#9CA3AF',       // Secondary text
}
```

### Typography
```typescript
const robbieTypography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  }
}
```

### Spacing
```typescript
const robbieSpacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
}
```

---

## 🔧 **Block API Pattern**

Every RobbieBlock follows this pattern:

```typescript
interface RobbieBlockProps {
  // Data
  data?: any
  
  // Personality Integration
  personality?: {
    flirtMode: number
    genghisGandhi: number
    mood: string
    expression: string
  }
  
  // Callbacks
  onAction?: (action: string, data: any) => void
  onChange?: (data: any) => void
  
  // Styling
  className?: string
  variant?: 'default' | 'compact' | 'expanded'
  
  // State
  loading?: boolean
  error?: string
}

export const RobbieBlock: React.FC<RobbieBlockProps> = ({
  data,
  personality,
  onAction,
  onChange,
  className,
  variant = 'default',
  loading,
  error
}) => {
  // Block implementation
}
```

---

## 📦 **Block Composition**

Blocks can be composed into larger features:

```typescript
// Example: Complete Setup Experience
<SetupPanel>
  <PersonalitySlider />
  <AdvancedControls />
  <IntegrationManager />
  <GuardrailsControl />
</SetupPanel>

// Example: Complete Chat Experience
<ChatInterface>
  <ExpressionAvatar />
  <ConversationThread />
  <MessageComposer />
  <TouchReadyQueue />
</ChatInterface>

// Example: Complete Productivity Dashboard
<ProductivityDashboard>
  <DailyBrief />
  <TaskBoard />
  <CalendarOptimizer />
  <MeetingHealthCard />
</ProductivityDashboard>
```

---

## 🚀 **Implementation Status**

### ✅ **Completed Blocks**
- [x] `<AdvancedControls />` - Genghis-Gandhi + Cocktail-Lightning sliders
- [x] `<SetupPanel />` - Main settings interface
- [x] `<ChatInterface />` - Basic chat with personality
- [x] `<Sidebar />` - Navigation with mood indicator
- [x] `<MoodIndicator />` - Current mood display

### 🚧 **In Progress**
- [ ] `<StickyNotesWall />` - Visual note management
- [ ] `<TouchReadyQueue />` - AI-drafted follow-ups
- [ ] `<DailyBrief />` - 5pm digest
- [ ] `<MeetingHealthCard />` - Meeting quality scoring

### 📋 **Planned**
- [ ] `<TaskIntelligence />` - Smart task management
- [ ] `<CapacityHeatmap />` - Team workload viz
- [ ] `<PipelineView />` - Deal pipeline
- [ ] `<CalendarOptimizer />` - Smart scheduling
- [ ] `<MemorySearch />` - Semantic search
- [ ] `<PowerToggles />` - Founder controls

---

## 🎯 **Block Development Workflow**

### 1. **Design Phase**
- Define block purpose and API
- Sketch UI and interactions
- Identify personality integration points

### 2. **Build Phase**
- Create component in `robbie-app/src/blocks/`
- Implement with Robbie design tokens
- Add personality awareness
- Connect to backend if needed

### 3. **Test Phase**
- Test in isolation
- Test with different personality settings
- Test in composed layouts
- Test real-time sync

### 4. **Document Phase**
- Add to this architecture doc
- Create usage examples
- Document props and callbacks

### 5. **Deploy Phase**
- Ship to Robbie App
- Port to Cursor Extension (if applicable)
- Add to component library

---

## 💡 **Block Best Practices**

### 1. **Personality-Aware**
Every block should respect Robbie's current personality:
```typescript
const { flirtMode, genghisGandhi, mood, expression } = useRobbieStore()

// Adjust tone based on personality
const greeting = flirtMode >= 7 
  ? "Hey gorgeous! 😘" 
  : "Hello!"
```

### 2. **Real-Time Sync**
Blocks should sync state across all interfaces:
```typescript
const syncToBackend = async (data) => {
  await fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}
```

### 3. **Loading States**
Always show loading and error states:
```typescript
if (loading) return <Skeleton />
if (error) return <ErrorCard message={error} />
return <BlockContent />
```

### 4. **Responsive Design**
Blocks should work on all screen sizes:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Block content */}
</div>
```

### 5. **Accessibility**
Blocks must be keyboard navigable and screen-reader friendly:
```typescript
<button
  aria-label="Increase intensity"
  onClick={handleIncrease}
  onKeyDown={handleKeyboard}
>
  +
</button>
```

---

## 🔌 **Integration Points**

### Frontend (React)
```typescript
import { RobbieBlock } from '@robbie/blocks'
import { useRobbieStore } from '@robbie/stores'

const MyComponent = () => {
  const personality = useRobbieStore()
  return <RobbieBlock personality={personality} />
}
```

### Backend (FastAPI)
```python
from robbie.blocks import BlockDataProvider

@router.get("/api/blocks/{block_id}/data")
async def get_block_data(block_id: str):
    return BlockDataProvider.get(block_id)
```

### Cursor Extension
```typescript
import { RobbieBlock } from './blocks'

// Render in Cursor sidebar
vscode.window.createWebviewPanel(
  'robbieBlock',
  'Robbie',
  vscode.ViewColumn.One,
  { enableScripts: true }
)
```

---

## 📚 **Block Library Structure**

```
robbie-app/src/blocks/
├── personality/
│   ├── PersonalitySlider.tsx
│   ├── AdvancedControls.tsx
│   ├── MoodIndicator.tsx
│   └── ExpressionAvatar.tsx
├── communication/
│   ├── ChatInterface.tsx
│   ├── TouchReadyQueue.tsx
│   ├── InboxUnified.tsx
│   └── MessageComposer.tsx
├── productivity/
│   ├── TaskBoard.tsx
│   ├── TaskIntelligence.tsx
│   ├── CalendarOptimizer.tsx
│   └── DailyBrief.tsx
├── memory/
│   ├── StickyNotesWall.tsx
│   ├── StickyNote.tsx
│   ├── MemorySearch.tsx
│   └── ContextPanel.tsx
├── business/
│   ├── PipelineView.tsx
│   ├── CapacityHeatmap.tsx
│   ├── DealRiskAnalyzer.tsx
│   └── RevenueMetrics.tsx
├── control/
│   ├── SetupPanel.tsx
│   ├── IntegrationManager.tsx
│   ├── GuardrailsControl.tsx
│   └── PowerToggles.tsx
├── visualization/
│   ├── MetricCard.tsx
│   ├── ProgressRing.tsx
│   ├── TimelineView.tsx
│   └── SparklineChart.tsx
└── layout/
    ├── Sidebar.tsx
    ├── TabBar.tsx
    ├── Modal.tsx
    └── CommandPalette.tsx
```

---

## 🎉 **The Vision**

**RobbieBlocks = Lego for AI Interfaces**

Just like Lego bricks, RobbieBlocks:
- ✅ Snap together easily
- ✅ Work in any combination
- ✅ Look consistent
- ✅ Scale infinitely
- ✅ Enable rapid prototyping

**Goal:** Build any Robbie interface in minutes by composing blocks!

---

*"Ship fast, look gorgeous, work everywhere."* - RobbieBlocks Manifesto 💜🔥

