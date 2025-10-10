/**
 * useCrud - React Hook for CRUD Operations
 * Provides full Create/Read/Update/Delete with optimistic updates and error handling
 */

import { useState, useCallback, useEffect } from 'react'
import { createCrudService, CrudService, CrudState } from '../services/crudService'

interface UseCrudOptions {
  endpoint: string
  apiBase?: string
  autoLoad?: boolean
  optimistic?: boolean
}

interface UseCrudResult<T> {
  // State
  items: T[]
  loading: boolean
  error: string | null
  selectedItem: T | null

  // CRUD Operations
  create: (data: Partial<T>) => Promise<T>
  read: (id: string) => Promise<T>
  update: (id: string, data: Partial<T>) => Promise<T>
  deleteItem: (id: string) => Promise<void>
  list: (filters?: Record<string, any>) => Promise<T[]>
  search: (query: string) => Promise<T[]>

  // UI Helpers
  selectItem: (item: T | null) => void
  refresh: () => Promise<void>
  clearError: () => void

  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function useCrud<T extends { id: string }>(
  options: UseCrudOptions
): UseCrudResult<T> {
  const { endpoint, apiBase, autoLoad = true, optimistic = true } = options

  const [state, setState] = useState<CrudState<T>>({
    items: [],
    loading: false,
    error: null,
    selectedItem: null,
  })

  // History for undo/redo
  const [history, setHistory] = useState<CrudState<T>[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Create service instance
  const service = createCrudService<T>({ endpoint, apiBase, optimistic })

  // Save state to history
  const saveToHistory = useCallback((newState: CrudState<T>) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newState)
      return newHistory.slice(-50) // Keep last 50 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [historyIndex])

  // Load items
  const list = useCallback(async (filters?: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const items = await service.list(filters)
      setState(prev => {
        const newState = { ...prev, items, loading: false }
        saveToHistory(newState)
        return newState
      })
      return items
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load items'
      setState(prev => ({ ...prev, loading: false, error: errorMsg }))
      throw error
    }
  }, [service, saveToHistory])

  // Create item
  const create = useCallback(async (data: Partial<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const created = await service.create(data)
      setState(prev => {
        const newState = {
          ...prev,
          items: [...prev.items, created],
          loading: false,
        }
        saveToHistory(newState)
        return newState
      })
      return created
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create item'
      setState(prev => ({ ...prev, loading: false, error: errorMsg }))
      throw error
    }
  }, [service, saveToHistory])

  // Read item
  const read = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const item = await service.read(id)
      setState(prev => ({ ...prev, selectedItem: item, loading: false }))
      return item
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to read item'
      setState(prev => ({ ...prev, loading: false, error: errorMsg }))
      throw error
    }
  }, [service])

  // Update item
  const update = useCallback(async (id: string, data: Partial<T>) => {
    // Optimistic update
    if (optimistic) {
      setState(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === id ? { ...item, ...data } : item
        ),
      }))
    }

    try {
      const updated = await service.update(id, data)
      setState(prev => {
        const newState = {
          ...prev,
          items: prev.items.map(item => (item.id === id ? updated : item)),
          selectedItem: prev.selectedItem?.id === id ? updated : prev.selectedItem,
          loading: false,
        }
        saveToHistory(newState)
        return newState
      })
      return updated
    } catch (error) {
      // Rollback on error
      await list()
      const errorMsg = error instanceof Error ? error.message : 'Failed to update item'
      setState(prev => ({ ...prev, error: errorMsg }))
      throw error
    }
  }, [service, optimistic, list, saveToHistory])

  // Delete item
  const deleteItem = useCallback(async (id: string) => {
    // Optimistic delete
    const backup = state.items
    if (optimistic) {
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id),
      }))
    }

    try {
      await service.delete(id)
      setState(prev => {
        const newState = {
          ...prev,
          items: prev.items.filter(item => item.id !== id),
          selectedItem: prev.selectedItem?.id === id ? null : prev.selectedItem,
        }
        saveToHistory(newState)
        return newState
      })
    } catch (error) {
      // Rollback on error
      setState(prev => ({ ...prev, items: backup }))
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete item'
      setState(prev => ({ ...prev, error: errorMsg }))
      throw error
    }
  }, [service, state.items, optimistic, saveToHistory])

  // Search items
  const search = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const results = await service.search(query)
      setState(prev => ({ ...prev, items: results, loading: false }))
      return results
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to search'
      setState(prev => ({ ...prev, loading: false, error: errorMsg }))
      throw error
    }
  }, [service])

  // UI Helpers
  const selectItem = useCallback((item: T | null) => {
    setState(prev => ({ ...prev, selectedItem: item }))
  }, [])

  const refresh = useCallback(() => list(), [list])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setState(history[historyIndex - 1])
    }
  }, [historyIndex, history])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setState(history[historyIndex + 1])
    }
  }, [historyIndex, history])

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      list()
    }
  }, []) // Only run once on mount

  return {
    // State
    items: state.items,
    loading: state.loading,
    error: state.error,
    selectedItem: state.selectedItem,

    // CRUD Operations
    create,
    read,
    update,
    deleteItem,
    list,
    search,

    // UI Helpers
    selectItem,
    refresh,
    clearError,

    // Undo/Redo
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  }
}


