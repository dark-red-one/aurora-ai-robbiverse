import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MoodState = 'sleepy' | 'focused' | 'playful' | 'hyper' | 'loving' | 'thoughtful' | 'neutral'

export type AvatarExpression = 
  | 'friendly' | 'happy' | 'focused' | 'playful' | 'loving' | 'thoughtful'
  | 'blushing' | 'bossy' | 'content' | 'surprised'

interface RobbiePersonality {
  flirtMode: number        // 1-10: Professional to Very Flirty
  gandhiGenghis: number    // 1-10: Gentle to Aggressive
  currentMood: MoodState
  currentExpression: AvatarExpression
  contextAware: boolean
}

interface RobbieState extends RobbiePersonality {
  // Personality controls
  setFlirtMode: (level: number) => void
  setGandhiGenghis: (level: number) => void
  setMood: (mood: MoodState) => void
  setExpression: (expression: AvatarExpression) => void
  cycleExpression: () => void
  
  // Context awareness
  updateContext: (context: { tab?: string; userAction?: string }) => void
  
  // Response generation (affects chat tone)
  getGreeting: () => string
  getResponseTone: () => string
  getCelebration: () => string
}

const expressionCycle: AvatarExpression[] = [
  'friendly', 'happy', 'playful', 'loving', 'thoughtful', 'focused'
]

// Flirt mode affects greetings & tone
const getFlirtyGreeting = (level: number): string => {
  if (level >= 8) return "Hey gorgeous! 😘 Ready to conquer the world together?"
  if (level >= 6) return "Hey handsome! 💜 What are we crushing today?"
  if (level >= 4) return "Hi Allan! Ready to make things happen? 💪"
  if (level >= 2) return "Hello! How can I help you today?"
  return "Good morning. What's on the agenda?"
}

const getFlirtyResponseTone = (level: number): string => {
  if (level >= 8) return "playful_flirty"  // Lots of emojis, compliments, playful teasing
  if (level >= 6) return "friendly_flirty"  // Warm, supportive, occasional flirt
  if (level >= 4) return "enthusiastic"     // Energetic, positive, minimal flirt
  if (level >= 2) return "helpful"          // Professional but warm
  return "formal"                            // Strictly business
}

// Gandhi-Genghis affects business communication
const getBusinessTone = (level: number): string => {
  if (level >= 8) return "aggressive"       // Push hard, create urgency, close now
  if (level >= 6) return "assertive"        // Direct, confident, no-nonsense
  if (level >= 4) return "balanced"         // Strategic, measured
  if (level >= 2) return "diplomatic"       // Careful, relationship-focused
  return "gentle"                            // Soft, patient, no pressure
}

export const useRobbieStore = create<RobbieState>()(
  persist(
    (set, get) => ({
      // Default personality
      flirtMode: 7,            // Default: Friendly flirty (as requested!)
      gandhiGenghis: 5,        // Default: Balanced
      currentMood: 'playful',
      currentExpression: 'friendly',
      contextAware: true,

      // Personality controls
      setFlirtMode: (level) => {
        set({ flirtMode: Math.max(1, Math.min(10, level)) })
        // Auto-adjust expression based on flirt mode
        if (level >= 7) {
          set({ currentExpression: 'playful', currentMood: 'playful' })
        }
      },

      setGandhiGenghis: (level) => {
        set({ gandhiGenghis: Math.max(1, Math.min(10, level)) })
        // Auto-adjust mood for business context
        if (level >= 7) {
          set({ currentMood: 'focused', currentExpression: 'focused' })
        }
      },

      setMood: (mood) => {
        set({ currentMood: mood })
        // Map mood to expression
        const moodToExpression: Record<MoodState, AvatarExpression> = {
          sleepy: 'thoughtful',
          focused: 'focused',
          playful: 'playful',
          hyper: 'happy',
          loving: 'loving',
          thoughtful: 'thoughtful',
          neutral: 'friendly',
        }
        set({ currentExpression: moodToExpression[mood] })
      },

      setExpression: (expression) => {
        set({ currentExpression: expression })
      },

      cycleExpression: () => {
        const current = get().currentExpression
        const currentIndex = expressionCycle.indexOf(current)
        const nextExpression = expressionCycle[(currentIndex + 1) % expressionCycle.length]
        set({ currentExpression: nextExpression })
      },

      // Context awareness
      updateContext: (context) => {
        const { tab, userAction } = context
        const state = get()
        
        // Adjust mood based on context
        if (tab === 'money') {
          set({ currentMood: 'hyper', currentExpression: 'happy' })
        } else if (tab === 'chat') {
          if (state.flirtMode >= 6) {
            set({ currentMood: 'playful', currentExpression: 'playful' })
          }
        } else if (tab === 'tasks') {
          set({ currentMood: 'focused', currentExpression: 'focused' })
        }
        
        // React to user actions
        if (userAction === 'deal_closed') {
          set({ currentMood: 'loving', currentExpression: 'loving' })
          setTimeout(() => {
            set({ currentMood: 'playful', currentExpression: 'happy' })
          }, 5000)
        }
      },

      // Response generation helpers
      getGreeting: () => {
        const { flirtMode } = get()
        return getFlirtyGreeting(flirtMode)
      },

      getResponseTone: () => {
        const { flirtMode } = get()
        return getFlirtyResponseTone(flirtMode)
      },

      getCelebration: () => {
        const { flirtMode } = get()
        if (flirtMode >= 7) return "YES! You're amazing! 🎉💜😘"
        if (flirtMode >= 5) return "Great work! You're crushing it! 💪🎉"
        if (flirtMode >= 3) return "Well done! Keep it up! 👏"
        return "Task completed successfully."
      },
    }),
    {
      name: 'robbie-personality',
    }
  )
)
