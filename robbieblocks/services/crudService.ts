/**
 * Universal CRUD Service
 * Provides generic Create/Read/Update/Delete operations for all data types
 */

export interface CrudService<T> {
  create(data: Partial<T>): Promise<T>
  read(id: string): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
  list(filters?: Record<string, any>): Promise<T[]>
  search(query: string): Promise<T[]>
}

export interface CrudState<T> {
  items: T[]
  loading: boolean
  error: string | null
  selectedItem: T | null
}

export interface CrudOptions {
  endpoint: string
  apiBase?: string
  optimistic?: boolean
  cache?: boolean
}

/**
 * Create a CRUD service for a specific entity type
 */
export function createCrudService<T extends { id: string }>(
  options: CrudOptions
): CrudService<T> {
  const { endpoint, apiBase = '/api', optimistic = true, cache = true } = options
  const baseUrl = `${apiBase}/${endpoint}`

  // Simple in-memory cache
  const cacheMap = new Map<string, { data: T; timestamp: number }>()
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  const getFromCache = (id: string): T | null => {
    if (!cache) return null
    const cached = cacheMap.get(id)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    return null
  }

  const setCache = (id: string, data: T) => {
    if (cache) {
      cacheMap.set(id, { data, timestamp: Date.now() })
    }
  }

  const invalidateCache = (id?: string) => {
    if (id) {
      cacheMap.delete(id)
    } else {
      cacheMap.clear()
    }
  }

  return {
    async create(data: Partial<T>): Promise<T> {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to create: ${response.statusText}`)
      }

      const created = await response.json()
      setCache(created.id, created)
      invalidateCache() // Invalidate list cache
      return created
    },

    async read(id: string): Promise<T> {
      // Check cache first
      const cached = getFromCache(id)
      if (cached) return cached

      const response = await fetch(`${baseUrl}/${id}`)

      if (!response.ok) {
        throw new Error(`Failed to read: ${response.statusText}`)
      }

      const item = await response.json()
      setCache(id, item)
      return item
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const response = await fetch(`${baseUrl}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to update: ${response.statusText}`)
      }

      const updated = await response.json()
      setCache(id, updated)
      invalidateCache() // Invalidate list cache
      return updated
    },

    async delete(id: string): Promise<void> {
      const response = await fetch(`${baseUrl}/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.statusText}`)
      }

      invalidateCache(id)
      invalidateCache() // Invalidate list cache
    },

    async list(filters?: Record<string, any>): Promise<T[]> {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, String(value))
        })
      }

      const url = params.toString() ? `${baseUrl}?${params}` : baseUrl
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to list: ${response.statusText}`)
      }

      const items = await response.json()
      return Array.isArray(items) ? items : items.data || []
    },

    async search(query: string): Promise<T[]> {
      const response = await fetch(`${baseUrl}/search?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error(`Failed to search: ${response.statusText}`)
      }

      const results = await response.json()
      return Array.isArray(results) ? results : results.data || []
    },
  }
}

/**
 * Create optimistic CRUD operations with rollback support
 */
export function createOptimisticCrudService<T extends { id: string }>(
  service: CrudService<T>
): CrudService<T> {
  return {
    ...service,

    async update(id: string, data: Partial<T>): Promise<T> {
      // For optimistic updates, you'd typically update local state first
      // then call the API and rollback if it fails
      // This requires integration with your state management
      return service.update(id, data)
    },

    async delete(id: string): Promise<void> {
      // Similar to update - optimistically remove from UI
      // then rollback if API call fails
      return service.delete(id)
    },
  }
}


