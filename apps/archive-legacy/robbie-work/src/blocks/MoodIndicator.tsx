import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRobbieStore } from "../../stores/robbieStore"
import { useRobbieStore } from "../../stores/robbieStore"

const MoodIndicator = () => {
  const { currentMood, flirtMode, gandhiGenghis } = useRobbieStore()

  const moodEmojis: Record<string, string> = {
    sleepy: '😴',
    focused: '🎯',
    playful: '😊',
    hyper: '🔥',
    loving: '💜',
    thoughtful: '🤔',
    neutral: '🤖',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-4 right-4 z-50 bg-robbie-bg-card/80 backdrop-blur-sm border border-robbie-cyan/30 rounded-lg px-4 py-2"
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{moodEmojis[currentMood]}</div>
        <div className="text-xs">
          <div className="font-semibold text-white capitalize">{currentMood}</div>
          <div className="text-gray-400">
            Flirt: {flirtMode} • G-G: {gandhiGenghis}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default MoodIndicator
