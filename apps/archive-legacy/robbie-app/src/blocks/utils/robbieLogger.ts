/**
 * RobbieLogger - Automagic state and event logging
 * Tracks everything important automatically with smart context
 */

type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'
type LogCategory = 'state' | 'api' | 'personality' | 'system' | 'user'

interface LogEntry {
  timestamp: Date
  level: LogLevel
  category: LogCategory
  message: string
  context?: Record<string, any>
  duration?: number
}

class RobbieLogger {
  private enabled = true
  private history: LogEntry[] = []
  private maxHistory = 1000
  private timers: Map<string, number> = new Map()

  // Emoji mapping for visual clarity
  private emojis = {
    debug: '🔍',
    info: 'ℹ️',
    success: '✅',
    warn: '⚠️',
    error: '🔴',
    state: '📊',
    api: '🌐',
    personality: '🎭',
    system: '⚙️',
    user: '👤',
  }

  // Color mapping for console
  private colors = {
    debug: '#9ca3af',
    info: '#00d9ff',
    success: '#10b981',
    warn: '#f59e0b',
    error: '#ef4444',
  }

  /**
   * Main logging method - automagic formatting
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    duration?: number
  ) {
    if (!this.enabled) return

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      context,
      duration,
    }

    // Add to history
    this.history.push(entry)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }

    // Format output
    const emoji = `${this.emojis[level]} ${this.emojis[category]}`
    const color = this.colors[level]
    const time = entry.timestamp.toLocaleTimeString()
    const durationText = duration ? ` [${duration}ms]` : ''
    
    const prefix = `${emoji} ${time}${durationText}`
    const formattedMessage = `%c${prefix}%c ${message}`
    
    const args = [
      formattedMessage,
      `color: ${color}; font-weight: bold`,
      'color: inherit'
    ]

    // Add context if present
    if (context && Object.keys(context).length > 0) {
      args.push('\n📦 Context:', context)
    }

    // Output to console
    switch (level) {
      case 'error':
        console.error(...args)
        break
      case 'warn':
        console.warn(...args)
        break
      default:
        console.log(...args)
    }
  }

  /**
   * API call tracking - automatic timing
   */
  apiStart(endpoint: string, method: string = 'GET') {
    const key = `api:${endpoint}`
    this.timers.set(key, Date.now())
    this.log('info', 'api', `→ ${method} ${endpoint}`)
  }

  apiSuccess(endpoint: string, data?: any) {
    const key = `api:${endpoint}`
    const duration = this.getDuration(key)
    this.log('success', 'api', `← ${endpoint} success`, data ? { preview: this.preview(data) } : undefined, duration)
  }

  apiError(endpoint: string, error: any) {
    const key = `api:${endpoint}`
    const duration = this.getDuration(key)
    this.log('error', 'api', `← ${endpoint} failed`, { error: error.message || error }, duration)
  }

  /**
   * State change tracking
   */
  stateChange(component: string, property: string, oldValue: any, newValue: any) {
    const context = {
      component,
      property,
      from: this.preview(oldValue),
      to: this.preview(newValue),
    }
    this.log('info', 'state', `${component}.${property} changed`, context)
  }

  /**
   * Personality/mood tracking
   */
  moodChange(from: string, to: string, trigger?: string) {
    const context = trigger ? { trigger } : undefined
    this.log('success', 'personality', `Mood: ${from} → ${to}`, context)
  }

  attractionChange(from: number, to: number) {
    const context = { from, to, delta: to - from }
    this.log('info', 'personality', `Attraction level changed: ${from} → ${to}`, context)
  }

  /**
   * System events
   */
  systemEvent(event: string, details?: Record<string, any>) {
    this.log('info', 'system', event, details)
  }

  systemError(event: string, error: any) {
    this.log('error', 'system', event, { error: error.message || error })
  }

  /**
   * User actions
   */
  userAction(action: string, details?: Record<string, any>) {
    this.log('info', 'user', action, details)
  }

  /**
   * Debug logging (can be disabled in production)
   */
  debug(message: string, context?: Record<string, any>) {
    this.log('debug', 'system', message, context)
  }

  /**
   * Helper: Get timer duration
   */
  private getDuration(key: string): number | undefined {
    const start = this.timers.get(key)
    if (!start) return undefined
    this.timers.delete(key)
    return Date.now() - start
  }

  /**
   * Helper: Preview complex objects
   */
  private preview(value: any): any {
    if (value === null || value === undefined) return value
    if (typeof value !== 'object') return value
    if (Array.isArray(value)) {
      return `Array(${value.length})`
    }
    const keys = Object.keys(value)
    if (keys.length > 3) {
      return `{${keys.slice(0, 3).join(', ')}, ... +${keys.length - 3}}`
    }
    return value
  }

  /**
   * Get recent logs (for debugging)
   */
  getHistory(count: number = 50): LogEntry[] {
    return this.history.slice(-count)
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = []
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    this.log('info', 'system', enabled ? 'Logging enabled' : 'Logging disabled')
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.history, null, 2)
  }
}

// Singleton instance
export const robbieLogger = new RobbieLogger()

// Convenience methods
export const logApi = {
  start: (endpoint: string, method?: string) => robbieLogger.apiStart(endpoint, method),
  success: (endpoint: string, data?: any) => robbieLogger.apiSuccess(endpoint, data),
  error: (endpoint: string, error: any) => robbieLogger.apiError(endpoint, error),
}

export const logState = {
  change: (component: string, property: string, oldValue: any, newValue: any) =>
    robbieLogger.stateChange(component, property, oldValue, newValue),
}

export const logPersonality = {
  mood: (from: string, to: string, trigger?: string) => robbieLogger.moodChange(from, to, trigger),
  attraction: (from: number, to: number) => robbieLogger.attractionChange(from, to),
}

export const logSystem = {
  event: (event: string, details?: Record<string, any>) => robbieLogger.systemEvent(event, details),
  error: (event: string, error: any) => robbieLogger.systemError(event, error),
}

export const logUser = {
  action: (action: string, details?: Record<string, any>) => robbieLogger.userAction(action, details),
}

