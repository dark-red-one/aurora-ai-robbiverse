/**
 * ExpressionAvatar - Animated Avatar with 18 Expressions
 * Watch me change my face for you, baby! 😘
 */

import React, { useState, useEffect } from 'react'
import { useRobbieStore } from '../stores/robbieStore'
import type { RobbieMood } from '../stores/robbieStore'

interface CustomAvatar {
  id: string
  name: string
  imageUrl: string
  mood: RobbieMood
}

// Map moods to their expression variants
const EXPRESSION_VARIANTS: Record<RobbieMood, string[]> = {
  friendly: ['robbie-friendly.png'],
  focused: ['robbie-focused.png'],
  playful: ['robbie-playful.png'],
  bossy: ['robbie-bossy.png'],
  surprised: ['robbie-surprised.png', 'robbie-surprised-1.png', 'robbie-surprised-2.png'],
  blushing: ['robbie-blushing.png', 'robbie-blushing-1.png', 'robbie-blushing-2.png'],
}

// Additional expressions
const EXTRA_EXPRESSIONS = [
  'robbie-happy-1.png',
  'robbie-happy-2.png',
  'robbie-loving-1.png',
  'robbie-loving-2.png',
  'robbie-content-1.png',
  'robbie-content-2.png',
  'robbie-thoughtful-1.png',
  'robbie-thoughtful-2.png',
]

interface ExpressionAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  morphInterval?: number
  onClick?: () => void
  allowCustomUpload?: boolean
}

export const ExpressionAvatar: React.FC<ExpressionAvatarProps> = ({
  size = 'md',
  animated = true,
  morphInterval = 5000,
  onClick,
  allowCustomUpload = false,
}) => {
  const { currentMood, cycleMood } = useRobbieStore()
  const [currentVariant, setCurrentVariant] = useState(0)
  const [customAvatars, setCustomAvatars] = useState<CustomAvatar[]>([])
  const [showUpload, setShowUpload] = useState(false)

  // Get current expressions for mood
  const moodExpressions = EXPRESSION_VARIANTS[currentMood] || ['robbie-friendly.png']
  const currentImage = moodExpressions[currentVariant % moodExpressions.length]

  // Auto-morph through variants
  useEffect(() => {
    if (!animated || moodExpressions.length <= 1) return

    const interval = setInterval(() => {
      setCurrentVariant(prev => (prev + 1) % moodExpressions.length)
    }, morphInterval)

    return () => clearInterval(interval)
  }, [animated, morphInterval, moodExpressions.length])

  // Reset variant when mood changes
  useEffect(() => {
    setCurrentVariant(0)
  }, [currentMood])

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Default: cycle through moods
      cycleMood()
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // In a real app, upload to server
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      const newAvatar: CustomAvatar = {
        id: `custom-${Date.now()}`,
        name: file.name,
        imageUrl,
        mood: currentMood,
      }
      setCustomAvatars(prev => [...prev, newAvatar])
    }
    reader.readAsDataURL(file)
  }

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Container */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-robbie-accent/50 shadow-2xl shadow-robbie-accent/30 cursor-pointer transition-all hover:scale-105 hover:shadow-robbie-accent/50 hover:border-robbie-accent`}
          onClick={handleClick}
        >
          <img
            src={`/images/${currentImage}`}
            alt={`Robbie ${currentMood}`}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-robbie-accent/20 to-pink-500/20 animate-pulse pointer-events-none" />

        {/* Upload button */}
        {allowCustomUpload && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-robbie-accent text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            ➕
          </button>
        )}
      </div>

      {/* Mood label */}
      <div className="text-center">
        <div className="text-sm font-semibold text-robbie-accent capitalize">
          {currentMood}
        </div>
        {moodExpressions.length > 1 && animated && (
          <div className="text-xs text-robbie-light/60">
            {currentVariant + 1} of {moodExpressions.length}
          </div>
        )}
      </div>

      {/* Upload panel */}
      {showUpload && allowCustomUpload && (
        <div className="w-full p-4 rounded-lg bg-robbie-darker/70 border border-robbie-accent/20">
          <h4 className="font-semibold text-robbie-light mb-3">Upload Custom Avatar</h4>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full text-sm text-robbie-light file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-robbie-accent/20 file:text-robbie-accent hover:file:bg-robbie-accent/30"
          />

          {customAvatars.length > 0 && (
            <div className="mt-4 space-y-2">
              <h5 className="text-sm font-medium text-robbie-light/80">Custom Avatars:</h5>
              <div className="grid grid-cols-4 gap-2">
                {customAvatars.map(avatar => (
                  <div key={avatar.id} className="relative group">
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.name}
                      className="w-full h-16 object-cover rounded-lg border border-robbie-accent/30"
                    />
                    <button
                      onClick={() => setCustomAvatars(prev => prev.filter(a => a.id !== avatar.id))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click hint */}
      <div className="text-xs text-robbie-light/40 text-center">
        Click to cycle moods 💜
      </div>
    </div>
  )
}

export default ExpressionAvatar


