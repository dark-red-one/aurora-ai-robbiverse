/**
 * API Client for TestPilot CPG
 * 
 * Connects to Robbie API at http://127.0.0.1:8000
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

interface ApiResponse<T> {
  data: T
  error?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        data: null as T,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Pipeline endpoints
  async getPipelineSummary() {
    return this.request('/api/pipeline/summary')
  }

  async getDeals(stage?: string) {
    const query = stage ? `?stage=${stage}` : ''
    return this.request(`/api/deals${query}`)
  }

  async getDeal(id: string) {
    return this.request(`/api/deals/${id}`)
  }

  // Contacts endpoints
  async getContacts() {
    return this.request('/api/contacts')
  }

  async getCompanies() {
    return this.request('/api/companies')
  }

  // Chat endpoints (via universal input!)
  async sendMessage(message: string, conversationId?: string) {
    // Route through universal input API for personality + context
    const response = await this.request('/api/v2/universal/request', {
      method: 'POST',
      body: JSON.stringify({
        source: 'testpilot-cpg',
        source_metadata: {
          sender: 'allan',
          timestamp: new Date().toISOString(),
          platform: 'web-app',
          conversation_id: conversationId
        },
        ai_service: 'chat',
        payload: {
          input: message,
          parameters: {
            temperature: 0.7,
            max_tokens: 1500
          }
        },
        user_id: 'allan',
        fetch_context: true  // Get vector search results
      })
    })
    
    // Extract Robbie's response
    if (response.data?.status === 'approved') {
      return {
        data: {
          message: response.data.robbie_response.message,
          mood: response.data.robbie_response.mood,
          personality_changes: response.data.robbie_response.personality_changes,
          actions: response.data.robbie_response.actions,
          processing_time: response.data.processing_time_ms
        }
      }
    } else {
      return {
        data: null,
        error: response.data?.gatekeeper_review?.reasoning || 'Request blocked'
      }
    }
  }

  async getConversation(id: string) {
    return this.request(`/api/conversations/${id}`)
  }

  // Daily brief
  async getDailyBrief(timeOfDay: 'morning' | 'afternoon' | 'evening') {
    return this.request(`/api/daily-brief?time=${timeOfDay}`)
  }

  // Personality
  async getCurrentMood() {
    return this.request('/api/personality/mood')
  }

  async setMood(mood: string, reason?: string) {
    return this.request('/api/personality/mood', {
      method: 'POST',
      body: JSON.stringify({ mood, reason }),
    })
  }
}

export const api = new ApiClient()
export default api

