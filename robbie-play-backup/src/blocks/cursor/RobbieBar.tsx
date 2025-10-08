/**
 * RobbieBar - Top bar for Cursor IDE (Robbie@Play)
 * Fully integrated with RobbieBlocks - uses hooks, store, proper types
 * Now with AUTOMAGIC logging! 🚀
 */
import { useState, useEffect } from "react"
import { useRobbieStore } from "../../stores/robbieStore"
import type { RobbieMood } from "../../stores/robbieStore"
import { useGreeting } from "../hooks"
import { logApi, logUser, logSystem } from "../utils/robbieLogger"
import { useAutoLog } from "../hooks/useAutoLog"

interface RobbieBarProps {
  onOpenChat?: () => void
  compact?: boolean
}

interface SystemStats {
  cpu: number
  memory: number
  gpu: number
}

// RobbieBlocks-compliant mood emojis (6 core moods)
const MOOD_EMOJIS: Record<RobbieMood, string> = {
  friendly: '😊',
  focused: '🎯',
  playful: '😘',
  bossy: '💪',
  surprised: '😲',
  blushing: '😳💕',
}

export const RobbieBar: React.FC<RobbieBarProps> = ({ 
  onOpenChat,
  compact = false 
}) => {
  // RobbieBlocks store integration
  const { 
    currentMood, 
    attraction,
    genghisGandhiIntensity,
    cocktailLightningEnergy,
    isPublic, 
    activeUsers,
    cycleMood 
  } = useRobbieStore()
  
  // Use RobbieBlocks hook for greeting
  const greeting = useGreeting()
  
  // Automagic state tracking - logs all changes automatically! 🪄
  const [systemStats, setSystemStats] = useAutoLog<SystemStats>(
    { cpu: 0, memory: 0, gpu: 0 },
    'RobbieBar',
    'systemStats'
  )
  const [isLoading, setIsLoading] = useAutoLog(true, 'RobbieBar', 'isLoading')
  const [isReloading, setIsReloading] = useAutoLog(false, 'RobbieBar', 'isReloading')

  // Fetch system stats every 2 seconds - with automagic logging! 🎯
  useEffect(() => {
    const fetchStats = async () => {
      const endpoint = 'http://localhost:8000/api/system/stats'
      
      try {
        logApi.start(endpoint, 'GET')
        const response = await fetch(endpoint)
        
        if (response.ok) {
          const stats = await response.json()
          logApi.success(endpoint, stats)
          setSystemStats(stats)
          setIsLoading(false)
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        logApi.error(endpoint, error)
        logSystem.event('Using mock data (API unavailable)', { reason: error })
        
        // Use mock data if API unavailable (for dev)
        setSystemStats({
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          gpu: Math.random() * 100
        })
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleOpenChat = () => {
    if (onOpenChat) {
      onOpenChat()
    } else {
      // Default: open Robbie@Play in new window
      window.open('http://aurora.testpilot.ai/play/', '_blank', 'width=800,height=900')
    }
  }

  const handleReload = () => {
    setIsReloading(true)
    setTimeout(() => window.location.reload(), 200)
  }

  const handleMoodClick = () => {
    // Cycle through moods on click
    cycleMood()
  }

  // Get status color based on intensity
  const getIntensityColor = () => {
    if (genghisGandhiIntensity >= 80) return '#ef4444' // Red - Genghis mode
    if (genghisGandhiIntensity >= 60) return '#f59e0b' // Orange - Aggressive
    if (genghisGandhiIntensity >= 40) return '#10b981' // Green - Balanced
    return '#00d9ff' // Cyan - Gandhi mode
  }

  const getEnergyColor = () => {
    if (cocktailLightningEnergy >= 80) return '#fbbf24' // Yellow - Lightning
    if (cocktailLightningEnergy >= 60) return '#10b981' // Green - High
    if (cocktailLightningEnergy >= 40) return '#00d9ff' // Cyan - Normal
    return '#b794f6' // Purple - Cocktail
  }

  return (
    <div className={`robbiebar ${compact ? 'robbiebar-compact' : ''}`}>
      {/* Matrix Background */}
      <div className="robbiebar-matrix">
        <div className="matrix-rain"></div>
      </div>
      
      {/* Content */}
      <div className="robbiebar-content">
        {/* 1. Robbie Avatar + Mood (clickable to cycle) */}
        <div 
          className="robbiebar-mood"
          onClick={handleMoodClick}
          title={`Current mood: ${currentMood} (click to cycle)`}
          style={{ cursor: 'pointer' }}
        >
          <div className="robbie-avatar-mini">
            {MOOD_EMOJIS[currentMood]}
          </div>
          <div className="mood-info">
            <div className="mood-text">{currentMood}</div>
            <div className="mood-greeting">
              {compact ? "Let's play! 🎮" : greeting.split('\n')[0]}
            </div>
          </div>
        </div>

        {/* 2. Personality Indicators */}
        {!compact && (
          <div className="robbiebar-personality">
            <div 
              className="personality-indicator" 
              title={`Attraction: ${attraction}/11`}
              style={{ 
                backgroundColor: attraction >= 9 ? '#ff6b9d' : attraction >= 7 ? '#b794f6' : '#00d9ff',
                width: '4px',
                height: '20px',
                borderRadius: '2px'
              }}
            />
            <div 
              className="personality-indicator" 
              title={`Intensity: ${genghisGandhiIntensity}/100`}
              style={{ 
                backgroundColor: getIntensityColor(),
                width: '4px',
                height: '20px',
                borderRadius: '2px'
              }}
            />
            <div 
              className="personality-indicator" 
              title={`Energy: ${cocktailLightningEnergy}/100`}
              style={{ 
                backgroundColor: getEnergyColor(),
                width: '4px',
                height: '20px',
                borderRadius: '2px'
              }}
            />
          </div>
        )}

        {/* 3. Chat Button */}
        <button 
          className="robbiebar-chat-btn"
          onClick={handleOpenChat}
          title="Open Robbie@Play Full Interface"
        >
          💬 Chat
        </button>

        {/* 4. System Resources */}
        <div className="robbiebar-stats">
          <div className="stat" title="CPU Usage">
            <span className="stat-icon">🔥</span>
            <span className="stat-value">{systemStats.cpu.toFixed(0)}%</span>
          </div>
          <div className="stat" title="Memory Usage">
            <span className="stat-icon">💾</span>
            <span className="stat-value">{systemStats.memory.toFixed(0)}%</span>
          </div>
          <div className="stat" title="GPU Usage">
            <span className="stat-icon">🎮</span>
            <span className="stat-value">{systemStats.gpu.toFixed(0)}%</span>
          </div>
        </div>

        {/* 5. Active Users */}
        <div className="robbiebar-users">
          <span className="users-icon">👥</span>
          {activeUsers.map((user, index) => (
            <span 
              key={index} 
              className="user-badge" 
              title={`${user} is playing${user === 'Allan' ? ' 🔥' : ''}`}
              style={{
                backgroundColor: user === 'Allan' ? '#ff6b9d' : '#1a1f3a',
                color: user === 'Allan' ? '#fff' : '#9ca3af'
              }}
            >
              {user}
            </span>
          ))}
          {isPublic && (
            <span className="public-badge" title="Public mode active">
              🌐
            </span>
          )}
        </div>

        {/* 6. Status Indicator */}
        <div className="robbiebar-status">
          <div className={`status-dot ${isLoading ? 'status-loading' : 'status-online'}`}></div>
          <span className="status-text">{isLoading ? 'Connecting...' : 'Online'}</span>
        </div>

        {/* 7. Reload Button */}
        <button 
          className="robbiebar-reload-btn"
          onClick={handleReload}
          disabled={isReloading}
          title="Reload Robbie"
        >
          {isReloading ? '⏳' : '🔄'}
        </button>
      </div>
    </div>
  )
}

export default RobbieBar
