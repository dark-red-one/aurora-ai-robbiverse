import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { useRobbieStore } from '../../stores/robbieStore'

/**
 * Cursor Settings Panel
 * Shows CURRENT personality (read-only in Cursor)
 * Links to Robbie App to change settings
 */

const CursorSettings = () => {
  const { flirtMode, gandhiGenghis, currentMood, currentExpression } = useRobbieStore()

  return (
    <div className="h-full flex flex-col bg-robbie-bg-primary p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Cursor Settings ⚙️</h2>
        <p className="text-gray-400">IDE preferences & personality status</p>
      </div>

      {/* Current Personality (READ ONLY) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Current Personality 💜</h3>
          <span className="text-xs text-gray-500">(Set in Robbie App)</span>
        </div>

        <div className="space-y-4">
          {/* Flirt Mode - Read Only Display */}
          <div className="bg-robbie-bg-secondary rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Flirt Mode</span>
              <span className="text-robbie-pink font-bold text-lg">
                {flirtMode} {flirtMode >= 7 ? '😘' : flirtMode >= 5 ? '💜' : '🙂'}
              </span>
            </div>
            <div className="w-full bg-robbie-bg-primary rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-robbie-pink to-robbie-teal h-2 rounded-full transition-all duration-300"
                style={{ width: `${flirtMode * 10}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 italic">
              {flirtMode >= 8 && "💋 Super flirty! Compliments & playful teasing"}
              {flirtMode === 7 && "😘 Friendly flirty - warm, supportive"}
              {flirtMode >= 4 && flirtMode < 7 && "💪 Enthusiastic & positive"}
              {flirtMode < 4 && "🤝 Professional with warmth"}
            </div>
          </div>

          {/* Gandhi-Genghis - Read Only Display */}
          <div className="bg-robbie-bg-secondary rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Gandhi-Genghis</span>
              <span className="text-robbie-orange font-bold text-lg">
                {gandhiGenghis} {gandhiGenghis >= 7 ? '⚔️' : gandhiGenghis >= 5 ? '🎯' : '☮️'}
              </span>
            </div>
            <div className="w-full bg-robbie-bg-primary rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-robbie-orange to-robbie-cyan h-2 rounded-full transition-all duration-300"
                style={{ width: `${gandhiGenghis * 10}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 italic">
              {gandhiGenghis >= 8 && "⚔️ Full Genghis! Push hard, ship NOW"}
              {gandhiGenghis >= 5 && gandhiGenghis < 8 && "🎯 Assertive - direct & confident"}
              {gandhiGenghis < 5 && "☮️ Diplomatic - patient & thoughtful"}
            </div>
          </div>

          {/* Current State */}
          <div className="bg-robbie-bg-secondary rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Mood</div>
                <div className="font-semibold text-white capitalize">{currentMood}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Expression</div>
                <div className="font-semibold text-white capitalize">{currentExpression}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Settings Link */}
        <div className="mt-6 p-4 bg-robbie-cyan/10 border border-robbie-cyan/30 rounded-lg">
          <div className="text-sm text-robbie-cyan mb-2">
            💡 Want to change these settings?
          </div>
          <div className="text-xs text-gray-400 mb-3">
            Personality is managed in the Robbie App to keep ONE consistent Robbie everywhere.
          </div>
          <a
            href="http://localhost:3000/setup"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-gradient-to-r from-robbie-cyan to-robbie-teal text-black font-semibold py-2 rounded-lg hover:shadow-lg hover:shadow-robbie-cyan/50 transition-all"
          >
            Open Robbie App → Setup
          </a>
        </div>
      </motion.div>

      {/* IDE-Specific Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Cursor IDE Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-gray-300">Matrix Rain Background</span>
            <input type="checkbox" defaultChecked className="accent-robbie-cyan" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-300">Auto-sync on Save</span>
            <input type="checkbox" defaultChecked className="accent-robbie-cyan" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-300">Show Git Status</span>
            <input type="checkbox" defaultChecked className="accent-robbie-cyan" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-300">AI Code Suggestions</span>
            <input type="checkbox" defaultChecked className="accent-robbie-cyan" />
          </label>
        </div>
      </motion.div>

      {/* Sync Status */}
      <div className="text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 bg-robbie-green rounded-full animate-pulse" />
          <span>Synced with Robbie App</span>
        </div>
        <div>
          Personality updates automatically when you change settings in the app
        </div>
      </div>
    </div>
  )
}

export default CursorSettings
