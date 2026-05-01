import { create } from 'zustand'

/**
 * Search state management for note filtering and indexing
 */
export const useSearchStore = create((set, get) => ({
  // State
  noteIndex: [],
  searchQuery: '',
  activeTag: '',
  sortMode: 'updated_desc',

  // Actions
  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  setActiveTag: (tag) => {
    set({ activeTag: tag })
  },

  setSortMode: (sortMode) => {
    set({ sortMode })
  },

  updateNoteIndex: (noteIndex) => {
    set({ noteIndex })
  },

  // Getters
  getAvailableTags: () => {
    const { noteIndex } = get()
    return [...new Set(noteIndex.flatMap((entry) => entry.tags))].sort((a, b) => a.localeCompare(b))
  },

  getFilteredNotes: (notesInFolder) => {
    const { noteIndex, searchQuery, activeTag, sortMode } = get()
    const lowerQuery = searchQuery.trim().toLowerCase()
    const noteMetaByPath = new Map(noteIndex.map((entry) => [entry.path, entry]))

    let filtered = notesInFolder.filter((note) => {
      const meta = noteMetaByPath.get(note.path)
      const byTag = activeTag ? Boolean(meta?.tags?.includes(activeTag)) : true
      if (!byTag) return false
      if (!lowerQuery) return true
      const title = String(meta?.title ?? note.name).toLowerCase()
      const body = String(meta?.content ?? '').toLowerCase()
      return title.includes(lowerQuery) || body.includes(lowerQuery)
    })

    // Sort
    filtered.sort((a, b) => {
      const metaA = noteMetaByPath.get(a.path)
      const metaB = noteMetaByPath.get(b.path)
      if (sortMode === 'alpha') {
        return a.name.localeCompare(b.name)
      }
      if (sortMode === 'created_desc') {
        return String(metaB?.createdAt ?? '').localeCompare(String(metaA?.createdAt ?? ''))
      }
      return String(metaB?.updatedAt ?? '').localeCompare(String(metaA?.updatedAt ?? ''))
    })

    return filtered
  },
}))
