import { create } from 'zustand'
import { parseFrontmatter } from '../utils/markdownUtils'
import { toSafePathSegment } from '../utils/fileUtils'
import { renameNote, updateNote } from '../api/supabase/noteApi'
import { useVaultStore } from './vaultStore'
import { useIndexStore } from './indexStore'

/**
 * Mini note store - Only active note management
 * Reduced from 720 lines to ~150 lines
 */
export const useNoteStore = create((set, get) => ({
  // Active note state only
  activeNotePath: '',
  activeNoteContent: '',
  lastSavedContent: '',
  saveStatus: 'idle',
  isLoading: false,
  error: '',

  // Actions
  setActiveNotePath: (path) => {
    set({ activeNotePath: path })
  },

  setActiveNoteContent: (content) => {
    set({ activeNoteContent: content })
  },

  setSaveStatus: (status) => {
    set({ saveStatus: status })
  },

  // Core note operations
  openNote: async (vault, notePath) => {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    if (!vaultId || !notePath) return
    set({ isLoading: true, error: '' })
    try {
      const { getNote } = await import('../api/supabase/noteApi')
      const note = await getNote(vaultId, notePath)

      // Add to recent notes
      const { addRecentNote } = useIndexStore.getState()
      addRecentNote(vaultId, note.data?.path ?? notePath)

      set({
        activeNotePath: note.data?.path ?? notePath,
        activeNoteContent: note.data?.content ?? '',
        lastSavedContent: note.data?.content ?? '',
        saveStatus: 'idle',
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to open note',
      })
    }
  },

  saveActiveNote: async () => {
    const activeVault = useVaultStore.getState().activeVault
    const activeNotePath = get().activeNotePath
    const activeNoteContent = get().activeNoteContent
    const lastSavedContent = get().lastSavedContent
    if (!activeVault || !activeNotePath || activeNoteContent === lastSavedContent) {
      return
    }

    set({ saveStatus: 'saving', error: '' })
    try {
      // Parse frontmatter to get title
      const parsed = parseFrontmatter(activeNoteContent)
      const title = parsed.frontmatter?.title

      // If title exists and differs from filename, rename the file
      let renamedPath = null
      if (title) {
        const currentFilename = activeNotePath.split('/').pop().replace(/\.md$/i, '')
        const safeTitle = toSafePathSegment(title)
        if (safeTitle && safeTitle !== currentFilename) {
          const folderPath = activeNotePath.split('/').slice(0, -1).join('/')
          const newPath = folderPath ? `${folderPath}/${safeTitle}.md` : `${safeTitle}.md`
          await renameNote(activeVault.id, activeNotePath, title)
          set({ activeNotePath: newPath })
          renamedPath = newPath
        }
      }

      // Save the content
      await updateNote(activeVault.id, renamedPath || activeNotePath, activeNoteContent)

      set({
        lastSavedContent: activeNoteContent,
        saveStatus: 'saved',
      })

      // Clear saved status after 2 seconds
      setTimeout(() => {
        set({ saveStatus: 'saved' })
      }, 2000)
    } catch (error) {
      set({
        saveStatus: 'error',
        error: error instanceof Error ? error.message : 'Failed to save note',
      })
    }
  },

  clearActiveNote: () => {
    set({
      activeNotePath: '',
      activeNoteContent: '',
      lastSavedContent: '',
      saveStatus: 'idle',
    })
  },

  // Legacy compatibility (will be removed after migration)
  // These methods delegate to the new stores
  loadNoteTreeForVault: async (vaultName) => {
    const { loadTree } = (await import('./treeStore')).useTreeStore.getState()
    await loadTree(vaultName)
  },

  setSelectedFolderPath: async (path) => {
    const { setSelectedFolderPath } = (await import('./treeStore')).useTreeStore.getState()
    setSelectedFolderPath(path)
  },

  // Auto-save debounce
  debouncedSave: (() => {
    let timeoutId = null
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        get().saveActiveNote()
      }, 1000)
    }
  })(),
}))
