import { create } from 'zustand'
import { createFolder, createNote, deleteNote, getNote, getNoteTree, updateNote } from '../api/noteApi'
import { parseFrontmatter } from '../utils/markdownUtils'
import { getVaultMeta, updateVaultMeta } from '../api/vaultApi'
import { useVaultStore } from './vaultStore'

/**
 * Global note state for tree/list selection and editor content.
 *
 */
function findFolderByPath(node, targetPath) {
  if (!node) return null
  if ((node.path ?? '') === targetPath) return node
  const folders = Array.isArray(node.folders) ? node.folders : []
  for (const folder of folders) {
    const found = findFolderByPath(folder, targetPath)
    if (found) return found
  }
  return null
}

function flattenNotePaths(node) {
  if (!node || typeof node !== 'object') return []
  const ownNotes = Array.isArray(node.notes) ? node.notes.map((note) => note.path) : []
  const childFolders = Array.isArray(node.folders) ? node.folders : []
  return childFolders.reduce((all, folder) => [...all, ...flattenNotePaths(folder)], ownNotes)
}

export const useNoteStore = create((set, get) => ({
  noteTree: [],
  selectedFolderPath: '',
  notesInFolder: [],
  activeNotePath: '',
  activeNoteContent: '',
  lastSavedContent: '',
  editorMode: 'split',
  saveStatus: 'idle',
  isLoading: false,
  error: '',
  noteIndex: [],
  searchQuery: '',
  activeTag: '',
  pinnedNotes: [],
  recentNotes: [],
  sortMode: 'updated_desc',
  setEditorMode: (mode) => {
    set({ editorMode: mode })
  },
  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },
  setActiveTag: (tag) => {
    set({ activeTag: tag })
  },
  setSortMode: (sortMode) => {
    set({ sortMode })
  },
  setSelectedFolderPath: (folderPath) => {
    const tree = get().noteTree
    const folderNode = findFolderByPath(tree, folderPath)
    set({
      selectedFolderPath: folderPath,
      notesInFolder: folderNode?.notes ?? [],
    })
  },
  setActiveNote: (notePath) => {
    set({ activeNotePath: notePath })
  },
  updateEditorContent: (content) => {
    set({ activeNoteContent: content, saveStatus: 'idle' })
  },
  fetchNoteTree: async () => {
    set({ isLoading: true, error: '' })
    try {
      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notes',
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
      await updateNote(activeVault, activeNotePath, activeNoteContent)
      set({ saveStatus: 'saved', lastSavedContent: activeNoteContent })
    } catch (error) {
      set({
        saveStatus: 'error',
        error: error instanceof Error ? error.message : 'Failed to save note',
      })
    }
  },
  clearNotesForVaultSwitch: () => {
    set({
      noteTree: [],
      selectedFolderPath: '',
      notesInFolder: [],
      activeNotePath: '',
      activeNoteContent: '',
      lastSavedContent: '',
      isLoading: false,
      saveStatus: 'idle',
      noteIndex: [],
      searchQuery: '',
      activeTag: '',
      pinnedNotes: [],
      recentNotes: [],
      sortMode: 'updated_desc',
      error: '',
    })
  },
  loadNoteTreeForVault: async (vaultName) => {
    if (!vaultName) {
      set({
        noteTree: [],
        notesInFolder: [],
        selectedFolderPath: '',
        isLoading: false,
      })
      return
    }

    set({ isLoading: true, error: '' })
    try {
      const noteTree = await getNoteTree(vaultName)
      const rootPath = noteTree?.path ?? ''
      const selectedPath = get().selectedFolderPath || rootPath
      const selectedNode = findFolderByPath(noteTree, selectedPath) ?? noteTree
      const notePaths = flattenNotePaths(noteTree)
      const noteIndex = await Promise.all(
        notePaths.map(async (notePath) => {
          const noteData = await getNote(vaultName, notePath)
          const parsed = parseFrontmatter(noteData.content ?? '')
          const updatedAt = parsed.frontmatter?.updated_at ?? ''
          const createdAt = parsed.frontmatter?.created_at ?? ''
          return {
            path: notePath,
            title: parsed.frontmatter?.title || notePath.split('/').pop()?.replace(/\.md$/i, '') || notePath,
            tags: Array.isArray(parsed.frontmatter?.tags) ? parsed.frontmatter.tags.map(String) : [],
            content: parsed.body ?? '',
            updatedAt,
            createdAt,
          }
        }),
      )

      let pinnedNotes = []
      try {
        const meta = await getVaultMeta(vaultName)
        pinnedNotes = Array.isArray(meta?.pinned_notes) ? meta.pinned_notes : []
      } catch {
        pinnedNotes = []
      }

      const recentKey = `vaultnote:recent:${vaultName}`
      const recentRaw = window.localStorage.getItem(recentKey)
      const recentNotes = recentRaw ? JSON.parse(recentRaw) : []

      set({
        noteTree: noteTree && typeof noteTree === 'object' ? noteTree : { name: 'Root', path: '', folders: [], notes: [] },
        selectedFolderPath: selectedNode?.path ?? '',
        notesInFolder: Array.isArray(selectedNode?.notes) ? selectedNode.notes : [],
        noteIndex,
        pinnedNotes,
        recentNotes: Array.isArray(recentNotes) ? recentNotes : [],
        isLoading: false,
      })
    } catch (error) {
      set({
        noteTree: { name: 'Root', path: '', folders: [], notes: [] },
        selectedFolderPath: '',
        notesInFolder: [],
        noteIndex: [],
        pinnedNotes: [],
        recentNotes: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notes',
      })
    }
  },
  openNote: async (vaultName, notePath) => {
    if (!vaultName || !notePath) return
    set({ isLoading: true, error: '' })
    try {
      const note = await getNote(vaultName, notePath)
      const currentRecent = get().recentNotes.filter((path) => path !== (note.path ?? notePath))
      const nextRecent = [note.path ?? notePath, ...currentRecent].slice(0, 10)
      window.localStorage.setItem(`vaultnote:recent:${vaultName}`, JSON.stringify(nextRecent))
      set({
        activeNotePath: note.path ?? notePath,
        activeNoteContent: note.content ?? '',
        lastSavedContent: note.content ?? '',
        recentNotes: nextRecent,
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
  createNoteInFolder: async (vaultName, folderPath, noteTitle) => {
    const trimmedTitle = noteTitle.trim()
    if (!trimmedTitle) return
    const noteFile = `${trimmedTitle}.md`
    const notePath = folderPath ? `${folderPath}/${noteFile}` : noteFile
    set({ isLoading: true, error: '' })
    try {
      await createNote(vaultName, notePath, `---\ntitle: ${trimmedTitle}\n---\n\n`)
      await get().loadNoteTreeForVault(vaultName)
      await get().openNote(vaultName, notePath)
      set({ saveStatus: 'saved' })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create note',
      })
    }
  },
  createFolderInFolder: async (vaultName, currentFolderPath, folderName) => {
    const trimmedFolder = folderName.trim()
    if (!trimmedFolder) return
    const folderPath = currentFolderPath ? `${currentFolderPath}/${trimmedFolder}` : trimmedFolder
    set({ isLoading: true, error: '' })
    try {
      await createFolder(vaultName, folderPath)
      await get().loadNoteTreeForVault(vaultName)
      get().setSelectedFolderPath(folderPath)
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      })
    }
  },
  deleteNoteByPath: async (vaultName, notePath) => {
    set({ isLoading: true, error: '' })
    try {
      await deleteNote(vaultName, notePath)
      const currentPath = get().activeNotePath
      await get().loadNoteTreeForVault(vaultName)
      if (currentPath === notePath) {
        set({ activeNotePath: '', activeNoteContent: '', lastSavedContent: '', saveStatus: 'idle' })
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete note',
      })
    }
  },
  togglePinnedNote: async (vaultName, notePath) => {
    const currentPins = get().pinnedNotes
    const nextPins = currentPins.includes(notePath)
      ? currentPins.filter((path) => path !== notePath)
      : [...currentPins, notePath]
    try {
      await updateVaultMeta(vaultName, nextPins)
      set({ pinnedNotes: nextPins })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update pinned notes',
      })
    }
  },
}))
