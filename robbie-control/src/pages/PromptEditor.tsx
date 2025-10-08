import { useState, useEffect } from 'react'
import './PromptEditor.css'

interface Personality {
  id: number
  category: string
  name: string
  short_description: string
  avatar: string
  default_flirt_mode: number
  default_gandhi_genghis: number
  is_active: boolean
}

interface Mood {
  id: number
  name: string
  emoji: string
  description: string
}

interface Prompt {
  id: number
  personality_id: number
  mood_id: number
  system_prompt: string
  tone: string
  style: string
  emoji_guidelines: string
  example_responses: string[]
  version: number
  usage_count: number
  avg_satisfaction: number | null
}

export default function PromptEditor() {
  const [categories, setCategories] = useState<string[]>([])
  const [personalities, setPersonalities] = useState<Personality[]>([])
  const [moods, setMoods] = useState<Mood[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  
  const [selectedCategory, setSelectedCategory] = useState<string>('Robbie')
  const [selectedPersonality, setSelectedPersonality] = useState<number | null>(null)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null)
  
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load personalities
      const persResp = await fetch('http://localhost:8002/api/personalities/all')
      if (persResp.ok) {
        const data = await persResp.json()
        setPersonalities(data.personalities || [])
        
        // Extract unique categories
        const cats = [...new Set(data.personalities.map((p: Personality) => p.category))]
        setCategories(cats)
        
        // Select first personality
        if (data.personalities.length > 0) {
          setSelectedPersonality(data.personalities[0].id)
        }
      }
      
      // Load moods
      const moodsResp = await fetch('http://localhost:8002/api/moods/all')
      if (moodsResp.ok) {
        const data = await moodsResp.json()
        setMoods(data.moods || [])
        if (data.moods.length > 0) {
          setSelectedMood(data.moods[0].id)
        }
      }
      
      // Load prompts
      loadPrompts()
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const loadPrompts = async () => {
    try {
      const resp = await fetch('http://localhost:8002/api/prompts/all')
      if (resp.ok) {
        const data = await resp.json()
        setPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error('Failed to load prompts:', error)
    }
  }

  useEffect(() => {
    if (selectedPersonality && selectedMood) {
      const prompt = prompts.find(
        p => p.personality_id === selectedPersonality && p.mood_id === selectedMood
      )
      setCurrentPrompt(prompt || null)
    }
  }, [selectedPersonality, selectedMood, prompts])

  const savePrompt = async () => {
    if (!currentPrompt) return
    
    setSaving(true)
    try {
      const resp = await fetch('http://localhost:8002/api/prompts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPrompt)
      })
      
      if (resp.ok) {
        setHasChanges(false)
        await loadPrompts()
        alert('✅ Prompt saved!')
      }
    } catch (error) {
      alert('⚠️ Save failed')
    }
    setSaving(false)
  }

  const updatePromptField = (field: keyof Prompt, value: any) => {
    if (!currentPrompt) return
    setCurrentPrompt({ ...currentPrompt, [field]: value })
    setHasChanges(true)
  }

  const filteredPersonalities = personalities.filter(p => p.category === selectedCategory)
  const selectedPers = personalities.find(p => p.id === selectedPersonality)

  return (
    <div className="prompt-editor">
      {/* Category Selector */}
      <div className="category-selector">
        <h2>📁 Categories</h2>
        <div className="category-buttons">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat)
                const first = personalities.find(p => p.category === cat)
                if (first) setSelectedPersonality(first.id)
              }}
            >
              {cat === 'Mentors' && '🧙 '}
              {cat === 'Robbie' && '💜 '}
              {cat === 'Pros' && '👥 '}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Personality Selector */}
      <div className="personality-selector">
        <h3>🎭 Personalities in {selectedCategory}</h3>
        <div className="personality-grid">
          {filteredPersonalities.map(pers => (
            <div
              key={pers.id}
              className={`personality-card ${selectedPersonality === pers.id ? 'active' : ''}`}
              onClick={() => setSelectedPersonality(pers.id)}
            >
              <div className="pers-avatar">{pers.avatar}</div>
              <div className="pers-name">{pers.name}</div>
              <div className="pers-desc">{pers.short_description}</div>
              <div className="pers-sliders">
                <span>💕 {pers.default_flirt_mode}</span>
                <span>⚔️ {pers.default_gandhi_genghis}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mood Selector */}
      <div className="mood-selector">
        <h3>🎭 Moods</h3>
        <div className="mood-tabs">
          {moods.map(mood => (
            <button
              key={mood.id}
              className={`mood-tab ${selectedMood === mood.id ? 'active' : ''}`}
              onClick={() => setSelectedMood(mood.id)}
            >
              <span className="mood-emoji">{mood.emoji}</span>
              <span className="mood-name">{mood.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Editor */}
      {currentPrompt ? (
        <div className="prompt-editor-panel">
          <div className="editor-header">
            <h2>
              {selectedPers?.avatar} {selectedPers?.name} in {moods.find(m => m.id === selectedMood)?.emoji} {moods.find(m => m.id === selectedMood)?.name}
            </h2>
            <div className="prompt-meta">
              <span>Version {currentPrompt.version}</span>
              <span>•</span>
              <span>Used {currentPrompt.usage_count} times</span>
              {currentPrompt.avg_satisfaction && (
                <>
                  <span>•</span>
                  <span>⭐ {currentPrompt.avg_satisfaction.toFixed(1)}/5.0</span>
                </>
              )}
            </div>
          </div>

          <div className="editor-fields">
            <div className="field">
              <label>Tone</label>
              <input
                type="text"
                value={currentPrompt.tone || ''}
                onChange={(e) => updatePromptField('tone', e.target.value)}
                placeholder="e.g., direct, efficient, no-nonsense"
              />
            </div>

            <div className="field">
              <label>Style</label>
              <input
                type="text"
                value={currentPrompt.style || ''}
                onChange={(e) => updatePromptField('style', e.target.value)}
                placeholder="e.g., Lead with answer, minimal explanation"
              />
            </div>

            <div className="field">
              <label>Emoji Guidelines</label>
              <input
                type="text"
                value={currentPrompt.emoji_guidelines || ''}
                onChange={(e) => updatePromptField('emoji_guidelines', e.target.value)}
                placeholder="e.g., Minimal (✅ 🔴 ⚠️)"
              />
            </div>

            <div className="field full-width">
              <label>System Prompt</label>
              <textarea
                value={currentPrompt.system_prompt}
                onChange={(e) => updatePromptField('system_prompt', e.target.value)}
                rows={12}
                placeholder="Full system prompt for LLM..."
              />
            </div>
          </div>

          <div className="editor-actions">
            <button
              className={`save-btn ${hasChanges ? 'has-changes' : ''}`}
              onClick={savePrompt}
              disabled={!hasChanges || saving}
            >
              {saving ? '⏳ Saving...' : hasChanges ? '💾 Save Changes' : '✅ Saved'}
            </button>
            
            {hasChanges && (
              <button
                className="cancel-btn"
                onClick={() => {
                  loadPrompts()
                  setHasChanges(false)
                }}
              >
                ↩️ Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="no-prompt">
          <p>Select a personality and mood to edit prompts</p>
          <button className="generate-btn">
            ✨ Auto-Generate Missing Prompts
          </button>
        </div>
      )}

      {/* Add New Personality */}
      <div className="add-personality-section">
        <button className="add-personality-btn">
          ➕ Add New Personality
        </button>
      </div>
    </div>
  )
}
