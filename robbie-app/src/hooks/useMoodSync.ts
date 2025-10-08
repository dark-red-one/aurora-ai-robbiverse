import { useEffect } from 'react'
import { useRobbieStore } from '../stores/robbieStore'

export const useMoodSync = () => {
  const { setMood } = useRobbieStore()

  useEffect(() => {
    // Connect to WebSocket for real-time mood updates
    const ws = new WebSocket(`ws://${window.location.host}/ws/mood`)

    ws.onopen = () => {
      console.log('✅ Mood sync WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'mood_update') {
        const { mood, expression } = data.data
        setMood(mood)
        setExpression(expression)
        console.log(`🎭 Mood updated: ${mood} / ${expression}`)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ Mood sync error:', error)
    }

    ws.onclose = () => {
      console.log('🔌 Mood sync disconnected, reconnecting in 5s...')
      setTimeout(() => {
        // Reconnect
      }, 5000)
    }

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)

    return () => {
      clearInterval(heartbeat)
      ws.close()
    }
  }, [setMood, setExpression])

  // Trigger mood events from app actions
  const triggerMoodEvent = async (eventType: string) => {
    try {
      await fetch('/api/mood/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          user_id: 'allan'
        })
      })
    } catch (error) {
      console.error('Failed to trigger mood event:', error)
    }
  }

  return { triggerMoodEvent }
}
