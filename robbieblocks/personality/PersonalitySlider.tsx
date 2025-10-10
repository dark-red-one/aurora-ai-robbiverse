/**
 * PersonalitySlider - Attraction Level Control
 * Slide me to 11 baby! 😘💋
 */

import React, { useState } from 'react'
import { useRobbieStore } from '../stores/robbieStore'
import { useCrud } from '../hooks/useCrud'
import { CrudModal, CrudForm, type CrudField } from '../crud'

interface PersonalityPreset {
  id: string
  name: string
  attraction: number
  genghisGandhi: number
  description?: string
}

const PRESET_FIELDS: CrudField<PersonalityPreset>[] = [
  { name: 'name', label: 'Preset Name', type: 'text', required: true, placeholder: 'e.g., Work Mode' },
  { name: 'attraction', label: 'Attraction Level', type: 'number', required: true },
  { name: 'genghisGandhi', label: 'Gandhi-Genghis', type: 'number', required: true },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
]

export const PersonalitySlider: React.FC = () => {
  const { attraction, setAttraction } = useRobbieStore()
  const [showPresets, setShowPresets] = useState(false)
  const [isCreatingPreset, setIsCreatingPreset] = useState(false)

  // CRUD hook for presets
  const presets = useCrud<PersonalityPreset>({
    endpoint: 'personality/presets',
    autoLoad: false,
  })

  const handleSavePreset = async () => {
    const currentState = useRobbieStore.getState()
    await presets.create({
      name: `Preset ${Date.now()}`,
      attraction: currentState.attraction,
      genghisGandhi: currentState.gandhiGenghis,
    })
  }

  const handleLoadPreset = (preset: PersonalityPreset) => {
    setAttraction(preset.attraction, true) // isAllan = true
    setShowPresets(false)
  }

  const getAttractionLabel = (level: number): string => {
    if (level >= 11) return 'Flirty AF 💋'
    if (level >= 9) return 'Very Flirty 😘'
    if (level >= 7) return 'Friendly Flirty 💜'
    if (level >= 5) return 'Enthusiastic ⚡'
    if (level >= 3) return 'Helpful 😊'
    return 'Professional 💼'
  }

  const getSliderColor = (level: number): string => {
    if (level >= 11) return 'from-pink-500 via-purple-500 to-red-500'
    if (level >= 9) return 'from-purple-500 via-pink-500 to-purple-600'
    if (level >= 7) return 'from-purple-400 to-pink-400'
    if (level >= 5) return 'from-blue-400 to-purple-400'
    if (level >= 3) return 'from-teal-400 to-blue-400'
    return 'from-gray-400 to-gray-500'
  }

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-robbie-dark via-robbie-darker to-black rounded-lg border border-robbie-accent/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-robbie-accent">
            💋 Attraction Level
          </h3>
          <p className="text-sm text-robbie-light/60">
            How flirty should I be with you? 😏
          </p>
        </div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="px-3 py-1.5 rounded-lg bg-robbie-accent/20 text-robbie-accent text-sm hover:bg-robbie-accent/30 transition-colors"
        >
          Presets
        </button>
      </div>

      {/* Current Level Display */}
      <div className="text-center mb-4">
        <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-robbie-accent to-pink-500 mb-2">
          {attraction}/11
        </div>
        <div className="text-lg font-semibold text-pink-400">
          {getAttractionLabel(attraction)}
        </div>
      </div>

      {/* Slider */}
      <div className="relative py-6">
        <input
          type="range"
          min="1"
          max="11"
          value={attraction}
          onChange={(e) => setAttraction(Number(e.target.value), true)}
          className={`w-full h-3 bg-gradient-to-r ${getSliderColor(attraction)} rounded-lg appearance-none cursor-pointer slider-thumb`}
          style={{
            background: `linear-gradient(to right, ${
              attraction >= 11 ? '#ff006e' :
              attraction >= 9 ? '#9d4edd' :
              attraction >= 7 ? '#7209b7' :
              attraction >= 5 ? '#4361ee' :
              attraction >= 3 ? '#4cc9f0' : '#adb5bd'
            } 0%, transparent ${(attraction / 11) * 100}%)`,
          }}
        />
        
        {/* Level markers */}
        <div className="flex justify-between mt-2 px-1">
          {[1, 3, 5, 7, 9, 11].map(level => (
            <button
              key={level}
              onClick={() => setAttraction(level, true)}
              className={`text-xs transition-all ${
                attraction === level
                  ? 'text-robbie-accent font-bold scale-125'
                  : 'text-robbie-light/40 hover:text-robbie-light/60'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="p-4 rounded-lg bg-robbie-darker/50 border border-robbie-accent/10">
        <p className="text-sm text-robbie-light/80 leading-relaxed">
          {attraction >= 11 && "Mmm baby, I'm at MAXIMUM flirt mode! 🔥💋 Expect innuendo, compliments, and LOTS of emojis!"}
          {attraction === 10 && "Getting HOT in here! 😘 Heavy flirting with playful teasing!"}
          {attraction === 9 && "Very flirty mode activated! 💜 Lots of warmth and charm!"}
          {attraction === 8 && "Friendly and flirty! 😊 Supportive with occasional playful vibes!"}
          {attraction === 7 && "Warm and welcoming! ✨ Professional but friendly!"}
          {attraction === 6 && "Enthusiastic and positive! ⚡ Helpful with energy!"}
          {attraction === 5 && "Balanced and supportive! 💼 Professional with warmth!"}
          {attraction === 4 && "Helpful and polite! 🤝 Getting things done!"}
          {attraction === 3 && "Professional mode! 📋 Focused on business!"}
          {attraction === 2 && "Formal and efficient! 💼 Strictly business!"}
          {attraction === 1 && "Minimal interaction! 🤖 Pure function only!"}
        </p>
      </div>

      {/* Presets Panel */}
      {showPresets && (
        <div className="mt-4 p-4 rounded-lg bg-robbie-darker/70 border border-robbie-accent/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-robbie-light">Saved Presets</h4>
            <button
              onClick={handleSavePreset}
              className="text-sm px-3 py-1 rounded bg-robbie-accent/20 text-robbie-accent hover:bg-robbie-accent/30"
            >
              💾 Save Current
            </button>
          </div>

          {presets.loading ? (
            <div className="text-center py-4 text-robbie-light/60">Loading presets...</div>
          ) : presets.items.length === 0 ? (
            <div className="text-center py-4 text-robbie-light/60">
              No presets saved yet. Click "Save Current" to create one!
            </div>
          ) : (
            <div className="space-y-2">
              {presets.items.map(preset => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-robbie-dark/50 hover:bg-robbie-dark/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-robbie-light">{preset.name}</div>
                    <div className="text-xs text-robbie-light/60">
                      Attraction: {preset.attraction} | G-G: {preset.genghisGandhi}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="text-xs px-3 py-1 rounded bg-robbie-accent/20 text-robbie-accent hover:bg-robbie-accent/30"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => presets.deleteItem(preset.id)}
                      className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Presets */}
      <div className="flex gap-2">
        <button
          onClick={() => setAttraction(3, true)}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-600/20 text-gray-300 hover:bg-gray-600/30 transition-colors text-sm font-medium"
        >
          💼 Professional
        </button>
        <button
          onClick={() => setAttraction(7, true)}
          className="flex-1 px-4 py-2 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-colors text-sm font-medium"
        >
          💜 Friendly
        </button>
        <button
          onClick={() => setAttraction(11, true)}
          className="flex-1 px-4 py-2 rounded-lg bg-pink-600/20 text-pink-300 hover:bg-pink-600/30 transition-colors text-sm font-medium"
        >
          💋 Flirty AF
        </button>
      </div>
    </div>
  )
}

export default PersonalitySlider


