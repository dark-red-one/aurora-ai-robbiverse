/**
 * API Client for HeyShopper
 * 
 * Routes through universal input API for personality-aware responses
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

  // Chat with Robbie (via universal input!)
  async chat(message: string) {
    // Route through universal input API
    const response = await this.request('/api/v2/universal/request', {
      method: 'POST',
      body: JSON.stringify({
        source: 'heyshopper',
        source_metadata: {
          sender: 'user',
          timestamp: new Date().toISOString(),
          platform: 'web-app'
        },
        ai_service: 'chat',
        payload: {
          input: message,
          parameters: {
            temperature: 0.8,  // Slightly higher for friendly shopping assistant
            max_tokens: 1000
          }
        },
        user_id: 'guest',  // HeyShopper users are guests by default
        fetch_context: true
      })
    })
    
    // Extract response
    if (response.data?.status === 'approved') {
      return {
        data: {
          message: response.data.robbie_response.message,
          mood: response.data.robbie_response.mood,
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

  // Search products (future)
  async searchProducts(query: string) {
    return this.request('/api/products/search', {
      method: 'POST',
      body: JSON.stringify({ query })
    })
  }
}

export const api = new ApiClient()
export default api

