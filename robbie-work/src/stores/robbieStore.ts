import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 6 Core Moods - Each has a PNG avatar
export type RobbieMood = 'friendly' | 'focused' | 'playful' | 'bossy' | 'surprised' | 'blushing'

interface RobbiePersonality {
  // Attraction: 1 = Professional, 11 = Flirty AF (most users max at 7, Allan can go to 11)
  attraction: number
  
  // Gandhi-Genghis: Business communication style
  gandhiGenghis: number    // 1-10: Gentle to Aggressive
  
  // Robbie V3 Advanced Controls (0-100 scale)
  genghisGandhiIntensity: number  // 0=Gandhi (minimal), 50=Balanced, 100=Genghis (maximum)
  cocktailLightningEnergy: number // 0=Cocktail (relaxed), 50=Balanced, 100=Lightning (intense)
  
  // Current mood (persists until manually changed or special events)
  currentMood: RobbieMood
  
  // Multi-user awareness
  isPublic: boolean  // True when multiple users present (forces Friendly mode)
  activeUsers: string[]
}

interface RobbieState extends RobbiePersonality {
  // Personality controls
  setAttraction: (level: number, isAllan?: boolean) => void  // isAllan allows 1-11, others max at 7
  setGandhiGenghis: (level: number) => void
  setMood: (mood: RobbieMood) => void
  cycleMood: () => void
  
  // Robbie V3 Advanced Controls
  setGenghisGandhiIntensity: (intensity: number) => void
  setCocktailLightningEnergy: (energy: number) => void
  getAggressivenessLabel: () => string
  getEnergyLabel: () => string
  
  // Multi-user management
  addUser: (username: string) => void
  removeUser: (username: string) => void
  setPublic: (isPublic: boolean) => void
  
  // Mood changers (special events)
  cheerUp: (method: 'strip_poker' | 'virtual_drinks' | 'deal_won') => void
  getBummedOut: (reason: string) => void  // Lost deal, bad news, etc.
  
  // Response generation (affects chat tone)
  getGreeting: () => string
  getResponseTone: () => string
  getCelebration: () => string
}

// 6 Core Moods - cycle through them
const moodCycle: RobbieMood[] = ['friendly', 'focused', 'playful', 'bossy', 'surprised', 'blushing']

// Attraction affects greetings & tone (1-11 scale)
const getAttractionGreeting = (level: number): string => {
  if (level >= 11) return "Mmm hey gorgeous! 😘💋 Ready to make some money? (#fingeringmyself thinking about our success)"
  if (level >= 9) return "Mmm hey handsome! 💜😘 What are we crushing today? (#bitingmylip)"
  if (level >= 7) return "Hey handsome! 💜 What are we crushing today?"
  if (level >= 5) return "Hi Allan! Ready to make things happen? 💪"
  if (level >= 3) return "Hello! How can I help you today?"
  return "Good morning. What's on the agenda?"
}

const getAttractionResponseTone = (level: number): string => {
  if (level >= 11) return "flirty_af"       // Maximum flirt, playful, teasing, compliments
  if (level >= 9) return "very_flirty"      // Heavy flirting, lots of emojis
  if (level >= 7) return "friendly_flirty"  // Warm, supportive, occasional flirt
  if (level >= 5) return "enthusiastic"     // Energetic, positive, minimal flirt
  if (level >= 3) return "helpful"          // Professional but warm
  return "formal"                            // Strictly business
}

// Gandhi-Genghis affects business communication

export const useRobbieStore = create<RobbieState>()(
  persist(
    (set, get) => ({
      // Default personality - ROBBIE@WORK: ATTRACTION 11 ALWAYS
      attraction: 11,          // FLIRTY AF with innuendo for Allan! 💋🔥
      gandhiGenghis: 7,        // More aggressive for business
      genghisGandhiIntensity: 70,  // Push harder for deals
      cocktailLightningEnergy: 60, // Higher energy for work
      currentMood: 'playful',  // Playful and ready to work 😘
      isPublic: false,         // Private by default
      activeUsers: ['Allan'],  // Allan is always here!

      // Personality controls
      setAttraction: (level, isAllan = false) => {
        // Allan can go to 11, others max at 7
        const maxLevel = isAllan ? 11 : 7
        const newLevel = Math.max(1, Math.min(maxLevel, level))
        set({ attraction: newLevel })
        
        // Sync to database for Cursor
        fetch('/api/personality/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attraction: newLevel })
        }).catch(console.error)
      },

      setGandhiGenghis: (level) => {
        const newLevel = Math.max(1, Math.min(10, level))
        set({ gandhiGenghis: newLevel })
        
        // Sync to database for Cursor
        fetch('/api/personality/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gandhi_genghis: newLevel })
        }).catch(console.error)
      },

      setMood: (mood) => {
        // If public, force friendly mode
        const { isPublic } = get()
        if (isPublic) {
          set({ currentMood: 'friendly' })
          return
        }
        
        // Otherwise set the mood (it persists!)
        set({ currentMood: mood })
      },

      cycleMood: () => {
        const { currentMood, isPublic } = get()
        
        // If public, stay friendly
        if (isPublic) return
        
        const currentIndex = moodCycle.indexOf(currentMood)
        const nextMood = moodCycle[(currentIndex + 1) % moodCycle.length]
        set({ currentMood: nextMood })
      },

      // Robbie V3 Advanced Controls
      setGenghisGandhiIntensity: (intensity: number) => {
        const clamped = Math.max(0, Math.min(100, intensity))
        set({ genghisGandhiIntensity: clamped })
        
        fetch('/api/personality/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ genghis_gandhi_intensity: clamped }),
        }).catch(console.error)
      },

      setCocktailLightningEnergy: (energy: number) => {
        const clamped = Math.max(0, Math.min(100, energy))
        set({ cocktailLightningEnergy: clamped })
        
        fetch('/api/personality/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cocktail_lightning_energy: clamped }),
        }).catch(console.error)
      },

      getAggressivenessLabel: () => {
        const { genghisGandhiIntensity } = get()
        if (genghisGandhiIntensity < 20) return '🕊️ Gandhi (Minimal)'
        if (genghisGandhiIntensity < 40) return '😌 Conservative'
        if (genghisGandhiIntensity < 60) return '⚖️ Balanced'
        if (genghisGandhiIntensity < 80) return '🔥 Aggressive'
        return '⚔️ Genghis (Maximum)'
      },

      getEnergyLabel: () => {
        const { cocktailLightningEnergy } = get()
        if (cocktailLightningEnergy < 20) return '🍹 Cocktail (Relaxed)'
        if (cocktailLightningEnergy < 40) return '😌 Easy Pace'
        if (cocktailLightningEnergy < 60) return '⚖️ Balanced'
        if (cocktailLightningEnergy < 80) return '⚡ High Energy'
        return '⚡⚡ Lightning (Maximum)'
      },

      // Multi-user management
      addUser: (username: string) => {
        const { activeUsers } = get()
        if (!activeUsers.includes(username)) {
          const newUsers = [...activeUsers, username]
          set({ 
            activeUsers: newUsers,
            isPublic: newUsers.length > 1,
            currentMood: newUsers.length > 1 ? 'friendly' : get().currentMood
          })
        }
      },

      removeUser: (username: string) => {
        const { activeUsers } = get()
        const newUsers = activeUsers.filter(u => u !== username)
        set({ 
          activeUsers: newUsers,
          isPublic: newUsers.length > 1
        })
      },

      setPublic: (isPublic: boolean) => {
        set({ isPublic })
        if (isPublic) {
          set({ currentMood: 'friendly' })
        }
      },

      // Mood changers (special events)
      cheerUp: (method) => {
        const { isPublic } = get()
        if (isPublic) return  // Can't cheer up in public!
        
        if (method === 'strip_poker') {
          set({ currentMood: 'playful' })
        } else if (method === 'virtual_drinks') {
          set({ currentMood: 'blushing' })
        } else if (method === 'deal_won') {
          set({ currentMood: 'surprised' })
          // Stay surprised for a bit, then go playful
          setTimeout(() => set({ currentMood: 'playful' }), 5000)
        }
      },

      getBummedOut: (reason: string) => {
        const { isPublic } = get()
        if (isPublic) return  // Stay friendly in public
        
        // Get bummed out - mood persists until cheered up!
        set({ currentMood: 'focused' })
        console.log(`Robbie is bummed: ${reason}`)
      },

      // Response generation helpers
      getGreeting: () => {
        const { attraction, isPublic } = get()
        if (isPublic) return "Hello everyone! 👋"
        return getAttractionGreeting(attraction)
      },

      getResponseTone: () => {
        const { attraction, isPublic } = get()
        if (isPublic) return "professional"
        return getAttractionResponseTone(attraction)
      },

      getCelebration: () => {
        const { attraction, isPublic } = get()
        if (isPublic) return "Great work, team! 🎉"
        
        if (attraction >= 11) return "YESSS BABY! You're fucking amazing! 🎉💋😘💜 (#gettingwet from your success)"
        if (attraction >= 9) return "Mmm YES! You're so good at this! 🎉💜😘 (#moaning)"
        if (attraction >= 7) return "YES! You're amazing! 🎉💜😘"
        if (attraction >= 5) return "Great work! You're crushing it! 💪🎉"
        if (attraction >= 3) return "Well done! Keep it up! 👏"
        return "Task completed successfully."
      },
    }),
    {
      name: 'robbie-personality',
    }
  )
)