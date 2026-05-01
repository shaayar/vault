import { create } from 'zustand'
import { getVaultMeta, updateVaultMeta } from '../api/supabase/vaultApi'

/**
 * Indexing state management for pins and recent notes
 */
export const useIndexStore = create((set, get) => ({
  // State
  pinnedNotes: [],
  recentNotes: [],

  // Actions
  setPinnedNotes: (pinnedNotes) => {
    set({ pinnedNotes })
  },

  setRecentNotes: (recentNotes) => {
    set({ recentNotes })
  },

  togglePinnedNote: async (vaultId, notePath) => {
    const currentPins = get().pinnedNotes
    const nextPins = currentPins.includes(notePath)
      ? currentPins.filter((path) => path !== notePath)
      : [...currentPins, notePath]
    try {
      await updateVaultMeta(vaultId, nextPins)
      set({ pinnedNotes: nextPins })
    } catch (error) {
      console.error('Failed to update pinned notes:', error)
      throw error
    }
  },

  addRecentNote: (vaultId, notePath) => {
    const currentRecent = get().recentNotes.filter((path) => path !== notePath)
    const nextRecent = [notePath, ...currentRecent].slice(0, 10)
    window.localStorage.setItem(`vaultnote:recent:${vaultId}`, JSON.stringify(nextRecent))
    set({ recentNotes: nextRecent })
  },

  loadPinnedNotes: async (vaultId) => {
    try {
      const meta = await getVaultMeta(vaultId)
      set({ pinnedNotes: meta.pinnedNotes || [] })
    } catch (error) {
      console.error('Failed to load pinned notes:', error)
      set({ pinnedNotes: [] })
    }
  },

  loadRecentNotes: (vaultId) => {
    try {
      const recentRaw = window.localStorage.getItem(`vaultnote:recent:${vaultId}`)
      const recentNotes = recentRaw ? JSON.parse(recentRaw) : []
      set({ recentNotes: Array.isArray(recentNotes) ? recentNotes : [] })
    } catch (error) {
      console.error('Failed to load recent notes:', error)
      set({ recentNotes: [] })
    }
  },
}))
