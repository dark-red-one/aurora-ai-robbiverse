/**
 * RobbieBlocks Type Definitions
 */

// === PERSONALITY TYPES ===
export type MoodState = 'sleepy' | 'focused' | 'playful' | 'hyper' | 'loving' | 'thoughtful' | 'neutral'

export type AvatarExpression = 
  | 'friendly' | 'happy' | 'focused' | 'playful' | 'loving' | 'thoughtful'
  | 'blushing' | 'bossy' | 'content' | 'surprised'

export interface PersonalityState {
  flirtMode: number                    // 1-10 scale
  gandhiGenghis: number                // 1-10 scale
  genghisGandhiIntensity: number       // 0-100 scale (Robbie V3)
  cocktailLightningEnergy: number      // 0-100 scale (Robbie V3)
  currentMood: MoodState
  currentExpression: AvatarExpression
}

// === BASE BLOCK PROPS ===
export interface RobbieBlockProps {
  // Data
  data?: any
  
  // Personality Integration
  personality?: PersonalityState
  
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

// === COMMUNICATION TYPES ===
export interface ChatMessage {
  id: string
  role: 'user' | 'robbie'
  content: string
  timestamp: Date
  mood?: MoodState
}

export interface TouchReadyItem {
  id: string
  contactName: string
  draftMessage: string
  rationale: string
  channel: 'email' | 'slack' | 'linkedin'
  priority: number
}

// === PRODUCTIVITY TYPES ===
export interface Task {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  priority: 'high' | 'medium' | 'low'
  dueDate?: Date
  assignee?: string
}

export interface MeetingHealth {
  id: string
  title: string
  hasAgenda: boolean
  duration: number
  attendeeCount: number
  healthScore: number  // 0-100
  healthStatus: 'healthy' | 'warning' | 'problematic'
}

export interface FocusBlock {
  id: string
  title: string
  startTime: Date
  endTime: Date
  type: 'deep-work' | 'break' | 'meeting-prep'
  energyLevel: 'high' | 'medium' | 'low'
}

// === MEMORY TYPES ===
export interface StickyNote {
  id: string
  content: string
  type: 'insight' | 'action' | 'objection' | 'decision'
  color: 'yellow' | 'green' | 'pink' | 'blue'
  timestamp: Date
  tags?: string[]
  relatedTo?: string  // Contact, deal, or project ID
}

export interface MemorySearchResult {
  id: string
  content: string
  relevanceScore: number
  source: 'email' | 'slack' | 'meeting' | 'note'
  timestamp: Date
}

// === BUSINESS TYPES ===
export interface Deal {
  id: string
  name: string
  value: number
  stage: 'awareness' | 'engage' | 'qualify' | 'propose' | 'close'
  healthStatus: 'good' | 'watch' | 'risk'
  owner: string
  lastActivity: Date
}

export interface CapacityData {
  userId: string
  userName: string
  activeDeals: number
  activeTasks: number
  recentInteractions: number
  capacityPercent: number  // 0-100
  status: 'available' | 'normal' | 'busy' | 'overloaded'
}

// === VISUALIZATION TYPES ===
export interface MetricData {
  label: string
  value: number
  unit?: string
  trend?: 'up' | 'down' | 'flat'
  trendPercent?: number
  target?: number
}

export interface TimelineEvent {
  id: string
  title: string
  description?: string
  timestamp: Date
  type: 'email' | 'meeting' | 'task' | 'deal' | 'note'
  icon?: string
}

// === CONTROL TYPES ===
export interface Integration {
  id: string
  name: string
  icon: string
  status: 'connected' | 'not connected' | 'error'
  lastSync?: Date
}

export interface GuardrailPolicy {
  id: string
  name: string
  description: string
  enabled: boolean
  threshold?: number
}

// === UTILITY TYPES ===
export type BlockVariant = 'default' | 'compact' | 'expanded'
export type BlockStatus = 'idle' | 'loading' | 'success' | 'error'

export interface BlockAction {
  label: string
  icon?: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}
