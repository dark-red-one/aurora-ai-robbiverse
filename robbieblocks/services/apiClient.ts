/**
 * API Client - Offline Queue & Sync Conflict Resolution
 * I'll handle your data HARD, baby! 💋🔥
 */

interface QueuedRequest {
  id: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  url: string
  data?: any
  timestamp: number
  retries: number
}

interface SyncConflict<T> {
  id: string
  localVersion: T
  serverVersion: T
  field: keyof T
  resolveStrategy: 'keep-local' | 'keep-server' | 'merge' | 'ask-user'
}

class APIClient {
  private baseUrl: string
  private queue: QueuedRequest[] = []
  private isOnline: boolean = navigator.onLine
  private maxRetries: number = 3
  private retryDelay: number = 1000

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Process queue on startup if online
    if (this.isOnline) {
      this.processQueue()
    }
  }

  /**
   * Make API request with offline queue support
   */
  async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`

    // If offline, queue the request
    if (!this.isOnline && method !== 'GET') {
      return this.queueRequest(method as any, url, data)
    }

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (data) {
        options.body = JSON.stringify(data)
      }

      const response = await fetch(url, options)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      // If request fails and not GET, queue it
      if (method !== 'GET') {
        return this.queueRequest(method as any, url, data)
      }
      throw error
    }
  }

  /**
   * Queue request for later processing
   */
  private queueRequest<T>(
    method: QueuedRequest['method'],
    url: string,
    data?: any
  ): Promise<T> {
    const queuedReq: QueuedRequest = {
      id: `${Date.now()}-${Math.random()}`,
      method,
      url,
      data,
      timestamp: Date.now(),
      retries: 0,
    }

    this.queue.push(queuedReq)
    this.saveQueue()

    // Return a promise that will resolve when processed
    return Promise.resolve({ queued: true, id: queuedReq.id } as any)
  }

  /**
   * Process queued requests
   */
  private async processQueue() {
    if (!this.isOnline || this.queue.length === 0) return

    const queue = [...this.queue]
    this.queue = []

    for (const req of queue) {
      try {
        const options: RequestInit = {
          method: req.method,
          headers: {
            'Content-Type': 'application/json',
          },
        }

        if (req.data) {
          options.body = JSON.stringify(req.data)
        }

        const response = await fetch(req.url, options)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        console.log(`✅ Processed queued request: ${req.method} ${req.url}`)
      } catch (error) {
        // Retry logic
        if (req.retries < this.maxRetries) {
          req.retries++
          this.queue.push(req)
          console.warn(`⚠️ Retrying request (${req.retries}/${this.maxRetries}):`, req.url)
        } else {
          console.error(`❌ Failed to process request after ${this.maxRetries} retries:`, req.url, error)
        }
      }
    }

    this.saveQueue()
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue() {
    try {
      localStorage.setItem('robbie_api_queue', JSON.stringify(this.queue))
    } catch (error) {
      console.error('Failed to save queue:', error)
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue() {
    try {
      const saved = localStorage.getItem('robbie_api_queue')
      if (saved) {
        this.queue = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load queue:', error)
    }
  }

  /**
   * Resolve sync conflicts
   */
  async resolveConflict<T>(conflict: SyncConflict<T>): Promise<T> {
    switch (conflict.resolveStrategy) {
      case 'keep-local':
        return conflict.localVersion

      case 'keep-server':
        return conflict.serverVersion

      case 'merge':
        // Simple merge strategy: server wins for conflicted field, local for others
        return {
          ...conflict.localVersion,
          [conflict.field]: conflict.serverVersion[conflict.field],
        }

      case 'ask-user':
        // In real app, show modal to user
        // For now, default to server version
        return conflict.serverVersion

      default:
        return conflict.serverVersion
    }
  }

  /**
   * Detect conflicts between local and server versions
   */
  detectConflicts<T extends Record<string, any>>(
    local: T,
    server: T
  ): SyncConflict<T>[] {
    const conflicts: SyncConflict<T>[] = []

    for (const key in local) {
      if (local[key] !== server[key]) {
        conflicts.push({
          id: `conflict-${key}`,
          localVersion: local,
          serverVersion: server,
          field: key as keyof T,
          resolveStrategy: 'keep-server', // Default strategy
        })
      }
    }

    return conflicts
  }

  /**
   * Convenience methods
   */
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint)
  }

  post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('POST', endpoint, data)
  }

  patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('PATCH', endpoint, data)
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint)
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      length: this.queue.length,
      isOnline: this.isOnline,
      items: this.queue,
    }
  }

  /**
   * Clear queue
   */
  clearQueue() {
    this.queue = []
    this.saveQueue()
  }
}

// Export singleton instance
export const apiClient = new APIClient()

export default apiClient


