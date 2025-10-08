/**
 * RobbieBlocks Custom Hooks
 */

import { useRobbieStore } from "../stores/robbieStore"

/**
 * Get current personality state for block integration
 */
export const usePersonality = (): PersonalityState => {
  const {
    flirtMode,
    gandhiGenghis,
    genghisGandhiIntensity,
    cocktailLightningEnergy,
    currentMood,
    currentExpression,
  } = useRobbieStore()

  return {
    flirtMode,
    gandhiGenghis,
    genghisGandhiIntensity,
    cocktailLightningEnergy,
    currentMood,
    currentExpression,
  }
}

/**
 * Get personality-aware greeting
 */
export const useGreeting = (): string => {
  const { getGreeting } = useRobbieStore()
  return getGreeting()
}

/**
 * Get personality-aware response tone
 */
export const useResponseTone = (): string => {
  const { getResponseTone } = useRobbieStore()
  return getResponseTone()
}

/**
 * Get personality-aware celebration message
 */
export const useCelebration = (): string => {
  const { getCelebration } = useRobbieStore()
  return getCelebration()
}

/**
 * Get aggressiveness label for Genghis-Gandhi slider
 */
export const useAggressivenessLabel = (): string => {
  const { getAggressivenessLabel } = useRobbieStore()
  return getAggressivenessLabel()
}

/**
 * Get energy label for Cocktail-Lightning slider
 */
export const useEnergyLabel = (): string => {
  const { getEnergyLabel } = useRobbieStore()
  return getEnergyLabel()
}

/**
 * Update context based on user action
 */
export const useContextUpdate = () => {
  const { updateContext } = useRobbieStore()
  return updateContext
}

/**
 * Cycle through avatar expressions
 */
export const useCycleExpression = () => {
  const { cycleExpression } = useRobbieStore()
  return cycleExpression
}
