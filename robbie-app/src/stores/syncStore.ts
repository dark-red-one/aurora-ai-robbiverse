import { create } from 'zustand'

interface SyncState {
  lastSync: Date | null
  syncStatus: 'idle' | 'syncing' | 'error'
  error: string | null
  pendingChanges: number
  
  setLastSync: (date: Date) => void
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void
  setError: (error: string | null) => void
  addPendingChange: () => void
  clearPendingChanges: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  lastSync: null,
  syncStatus: 'idle',
  error: null,
  pendingChanges: 0,
  
  setLastSync: (date) => set({ lastSync: date }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setError: (error) => set({ error }),
  addPendingChange: () => set((state) => ({ pendingChanges: state.pendingChanges + 1 })),
  clearPendingChanges: () => set({ pendingChanges: 0 }),
}))
