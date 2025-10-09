# 🧱 RobbieBlocks Component Library

> **"Ship fast, look gorgeous, work everywhere."**

Reusable, personality-aware UI components for the Robbie Empire.

---

## 📦 Quick Start

```typescript
import { 
  AdvancedControls, 
  ChatInterface, 
  TaskBoard,
  StickyNotes 
} from './blocks'

// Use in your component
<AdvancedControls />
<ChatInterface />
<TaskBoard />
```

---

## 🏗️ Block Categories

### 💜 Personality Blocks
Components that manage Robbie's personality and mood
- `<AdvancedControls />` - Genghis-Gandhi + Cocktail-Lightning sliders ✅
- `<MoodIndicator />` - Current mood display ✅
- `<PersonalitySlider />` - Flirt Mode control (planned)
- `<ExpressionAvatar />` - Animated avatar (planned)

### 💬 Communication Blocks
Chat, messaging, and interaction components
- `<ChatInterface />` - Main chat with streaming responses ✅
- `<CommsCenter />` - Unified communications hub ✅
- `<TouchReadyQueue />` - AI-drafted follow-ups (planned)
- `<InboxUnified />` - Email + Slack + SMS (planned)

### 📊 Productivity Blocks
Task management, scheduling, and workflow
- `<TaskBoard />` - Kanban-style task management ✅
- `<TaskIntelligence />` - AI task prioritization (planned)
- `<CalendarOptimizer />` - Smart scheduling (planned)
- `<DailyBrief />` - 5pm digest (planned)
- `<MeetingHealthCard />` - Meeting quality scoring (planned)

### 🧠 Memory Blocks
Notes, knowledge, and context management
- `<StickyNotes />` - Visual note board ✅
- `<StickyNotesWall />` - Advanced note clustering (planned)
- `<MemorySearch />` - Semantic search (planned)
- `<ContextPanel />` - Current context display (planned)

### 💰 Business Blocks
Sales, pipeline, and revenue management
- `<MoneyDashboard />` - Revenue tracking ✅
- `<PipelineView />` - Deal pipeline (planned)
- `<CapacityHeatmap />` - Team workload (planned)
- `<DealRiskAnalyzer />` - AI risk scoring (planned)

### ⚙️ Control Blocks
Settings, configuration, and system controls
- `<SetupPanel />` - Main settings interface ✅
- `<CursorSettings />` - Cursor-specific settings ✅
- `<IntegrationManager />` - Connect integrations (planned)
- `<GuardrailsControl />` - Safety limits (planned)
- `<PowerToggles />` - Founder controls (planned)

### 📈 Visualization Blocks
Data display and analytics
- `<MetricCard />` - Single metric display (planned)
- `<ProgressRing />` - Circular progress (planned)
- `<TimelineView />` - Event timeline (planned)
- `<SparklineChart />` - Inline charts (planned)

### 🎨 Layout Blocks
Structure and navigation
- `<MainApp />` - Main application layout ✅
- `<MatrixWelcome />` - Welcome animation ✅
- `<RobbieAuth />` - Authentication flow ✅
- `<Sidebar />` - Navigation sidebar (planned)
- `<Modal />` - Overlay dialogs (planned)

---

## 🎨 Design System

### Colors
```typescript
const robbieColors = {
  accent: '#FF6B9D',      // Robbie pink
  cyan: '#00D9FF',        // Electric cyan
  purple: '#B794F6',      // Soft purple
  dark: '#0A0E27',        // Deep space
  darker: '#060918',      // Void
  green: '#10B981',       // Success
  orange: '#F59E0B',      // Warning
  red: '#EF4444',         // Error
}
```

### Typography
- **Font Family:** Inter (sans), JetBrains Mono (mono)
- **Sizes:** xs (0.75rem) → 2xl (1.5rem)

### Spacing
- **Scale:** xs (4px) → 2xl (48px)

---

## 🔧 Block API Pattern

Every RobbieBlock follows this standard interface:

```typescript
interface RobbieBlockProps {
  data?: any
  personality?: PersonalityState
  onAction?: (action: string, data: any) => void
  onChange?: (data: any) => void
  className?: string
  variant?: 'default' | 'compact' | 'expanded'
  loading?: boolean
  error?: string
}
```

---

## 🪝 Custom Hooks

```typescript
import { 
  usePersonality,
  useGreeting,
  useResponseTone,
  useCelebration,
  useAggressivenessLabel,
  useEnergyLabel
} from './blocks/hooks'

// Get current personality state
const personality = usePersonality()

// Get personality-aware greeting
const greeting = useGreeting()

// Get response tone
const tone = useResponseTone()
```

---

## 📝 Usage Examples

### Simple Block
```typescript
import { MoodIndicator } from './blocks'

<MoodIndicator />
```

### Block with Props
```typescript
import { ChatInterface } from './blocks'

<ChatInterface
  onAction={(action, data) => console.log(action, data)}
  variant="expanded"
/>
```

### Block with Personality
```typescript
import { TaskBoard, usePersonality } from './blocks'

const MyComponent = () => {
  const personality = usePersonality()
  
  return (
    <TaskBoard 
      personality={personality}
      onAction={handleTaskAction}
    />
  )
}
```

### Composed Blocks
```typescript
import { 
  SetupPanel,
  AdvancedControls,
  IntegrationManager 
} from './blocks'

<SetupPanel>
  <AdvancedControls />
  <IntegrationManager />
</SetupPanel>
```

---

## 🚀 Adding New Blocks

1. **Create Component**
   ```bash
   # Create in appropriate category
   touch src/blocks/productivity/MyNewBlock.tsx
   ```

2. **Implement Block**
   ```typescript
   import { RobbieBlockProps } from '../types'
   
   export const MyNewBlock: React.FC<RobbieBlockProps> = ({
     data,
     personality,
     onAction,
     className
   }) => {
     // Block implementation
   }
   ```

3. **Export from Index**
   ```typescript
   // In src/blocks/index.ts
   export { default as MyNewBlock } from './productivity/MyNewBlock'
   ```

4. **Document**
   - Add to this README
   - Add usage examples
   - Update ROBBIEBLOCKS_ARCHITECTURE.md

---

## 📂 Directory Structure

```
blocks/
├── personality/        # Personality & mood components
├── communication/      # Chat & messaging
├── productivity/       # Tasks & scheduling
├── memory/            # Notes & knowledge
├── business/          # Sales & revenue
├── control/           # Settings & config
├── visualization/     # Charts & metrics
├── layout/            # Structure & navigation
├── index.ts           # Main exports
├── types.ts           # TypeScript types
├── hooks.ts           # Custom hooks
└── README.md          # This file
```

---

## 🎯 Philosophy

RobbieBlocks are designed to be:

1. **Reusable** - Work in any context
2. **Composable** - Combine like Lego bricks
3. **Personality-Aware** - Respect Robbie's mood
4. **Synced** - Real-time across all interfaces
5. **Beautiful** - Consistent design language
6. **Fast** - Pre-built and optimized

---

## 💡 Best Practices

### 1. Always Use Personality
```typescript
const personality = usePersonality()
const greeting = personality.flirtMode >= 7 
  ? "Hey gorgeous! 😘" 
  : "Hello!"
```

### 2. Handle Loading States
```typescript
if (loading) return <Skeleton />
if (error) return <ErrorCard message={error} />
return <BlockContent />
```

### 3. Sync to Backend
```typescript
const handleChange = async (data) => {
  await fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}
```

### 4. Responsive Design
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Block content */}
</div>
```

---

## 📊 Status

- ✅ **10 blocks** implemented
- 🚧 **25+ blocks** planned
- 💜 **100%** personality-aware
- 🔄 **Real-time** sync enabled

---

*Built with 💜 for the Robbie Empire*
