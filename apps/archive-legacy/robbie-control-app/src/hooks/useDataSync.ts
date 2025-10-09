import { useEffect, useCallback, useRef } from 'react'

interface SyncConfig {
  endpoint: string
  interval?: number  // Auto-sync interval in ms (default: 30000 = 30s)
  onSync?: (data: any) => void
  onError?: (error: Error) => void
}

export const useDataSync = (config: SyncConfig) => {
  const { endpoint, interval = 30000, onSync, onError } = config
  const syncTimerRef = useRef<NodeJS.Timeout>()

  const sync = useCallback(async () => {
    try {
      const response = await fetch(`/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('robbie_token')}`,
        },
      })
      
      if (!response.ok) throw new Error('Sync failed')
      
      const data = await response.json()
      onSync?.(data)
      
      return data
    } catch (error) {
      console.error('Data sync error:', error)
      onError?.(error as Error)
      throw error
    }
  }, [endpoint, onSync, onError])

  const push = useCallback(async (data: any) => {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('robbie_token')}`,
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Push failed')
      
      return await response.json()
    } catch (error) {
      console.error('Data push error:', error)
      onError?.(error as Error)
      throw error
    }
  }, [endpoint, onError])

  // Auto-sync on interval
  useEffect(() => {
    if (interval > 0) {
      syncTimerRef.current = setInterval(sync, interval)
      
      // Initial sync
      sync()
      
      return () => {
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current)
        }
      }
    }
  }, [sync, interval])

  return { sync, push }
}
