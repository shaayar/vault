import { create } from 'zustand'
import yaml from 'js-yaml'
import { createFolder, createNote, deleteFolder, deleteNote, getNote, getNoteTree, renameFolder, renameNote, updateNote } from '../api/noteApi'
import { parseFrontmatter } from '../utils/markdownUtils'
import { getVaultMeta, updateVaultMeta } from '../api/vaultApi'
import { toSafePathSegment } from '../utils/fileUtils'
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
  const notes = Array.isArray(node.notes) ? node.notes : Array.isArray(node.files) ? node.files : []
  const ownNotes = notes.map((note) => note.path)
  const childFolders = Array.isArray(node.folders) ? node.folders : []
  return childFolders.reduce((all, folder) => [...all, ...flattenNotePaths(folder)], ownNotes)
}

function normalizeNoteTree(node) {
  if (!node || typeof node !== 'object') {
    return { name: 'Root', path: '', folders: [], notes: [] }
  }

  const notes = Array.isArray(node.notes) ? node.notes : Array.isArray(node.files) ? node.files : []
  const folders = Array.isArray(node.folders) ? node.folders.map(normalizeNoteTree) : []

  return {
    name: node.name ?? 'Root',
    path: node.path ?? '',
    folders,
    notes,
  }
}

function getFallbackNoteIndexEntry(notePath) {
  return {
    path: notePath,
    title: notePath.split('/').pop()?.replace(/\.md$/i, '') || notePath,
    tags: [],
    content: '',
    updatedAt: '',
    createdAt: '',
  }
}

function buildSafeNoteContent(title, body = '') {
  const frontmatter = yaml.dump(
    { title },
    { sortKeys: false, lineWidth: -1, noRefs: true, quotingType: '"' },
  ).trimEnd()
  return `---\n${frontmatter}\n---\n\n${body}`
}

export const useNoteStore = create((set, get) => ({
  noteTree: { name: 'Root', path: '', folders: [], notes: [] },
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
      noteTree: { name: 'Root', path: '', folders: [], notes: [] },
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
        noteTree: { name: 'Root', path: '', folders: [], notes: [] },
        notesInFolder: [],
        selectedFolderPath: '',
        isLoading: false,
      })
      return
    }

    set({ isLoading: true, error: '' })
    try {
      const noteTree = normalizeNoteTree(await getNoteTree(vaultName))
      const rootPath = noteTree?.path ?? ''
      const selectedPath = get().selectedFolderPath || rootPath
      const selectedNode = findFolderByPath(noteTree, selectedPath) ?? noteTree
      const notePaths = flattenNotePaths(noteTree)
      const noteIndex = await Promise.all(
        notePaths.map(async (notePath) => {
          try {
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
          } catch (error) {
            console.warn(`Failed to index note "${notePath}". Keeping it in the tree.`, error)
            return getFallbackNoteIndexEntry(notePath)
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
      let recentNotes = []
      try {
        recentNotes = recentRaw ? JSON.parse(recentRaw) : []
      } catch {
        recentNotes = []
      }

      set({
        noteTree,
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
    const safeStem = toSafePathSegment(trimmedTitle)
    if (!safeStem) return
    const noteFile = `${safeStem}.md`
    const notePath = folderPath ? `${folderPath}/${noteFile}` : noteFile
    set({ isLoading: true, error: '' })
    try {
      const created = await createNote(vaultName, notePath, buildSafeNoteContent(trimmedTitle))
      await get().loadNoteTreeForVault(vaultName)
      await get().openNote(vaultName, created?.path ?? notePath)
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
    const safeFolder = toSafePathSegment(trimmedFolder)
    if (!safeFolder) return
    const folderPath = currentFolderPath ? `${currentFolderPath}/${safeFolder}` : safeFolder
    set({ isLoading: true, error: '' })
    try {
      const created = await createFolder(vaultName, folderPath)
      await get().loadNoteTreeForVault(vaultName)
      get().setSelectedFolderPath(created?.path ?? folderPath)
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      })
    }
  },
  renameNoteByPath: async (vaultName, notePath, nextName) => {
    const trimmedName = nextName.trim()
    const safeStem = toSafePathSegment(trimmedName)
    if (!vaultName || !notePath || !safeStem) return
    const folderPath = notePath.split('/').slice(0, -1).join('/')
    const nextPath = folderPath ? `${folderPath}/${safeStem}.md` : `${safeStem}.md`
    set({ isLoading: true, error: '' })
    try {
      await renameNote(vaultName, notePath, trimmedName)
      const activeNotePath = get().activeNotePath
      const selectedFolderPath = get().selectedFolderPath
      await get().loadNoteTreeForVault(vaultName)
      if (activeNotePath === notePath) {
        await get().openNote(vaultName, nextPath)
      } else if (selectedFolderPath === folderPath) {
        get().setSelectedFolderPath(folderPath)
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to rename note',
      })
    }
  },
  renameFolderByPath: async (vaultName, folderPath, nextName) => {
    const trimmedName = nextName.trim()
    const safeFolder = toSafePathSegment(trimmedName)
    if (!vaultName || !folderPath || !safeFolder) return
    const parentPath = folderPath.split('/').slice(0, -1).join('/')
    const nextPath = parentPath ? `${parentPath}/${safeFolder}` : safeFolder
    set({ isLoading: true, error: '' })
    try {
      await renameFolder(vaultName, folderPath, trimmedName)
      const activeNotePath = get().activeNotePath
      const selectedFolderPath = get().selectedFolderPath
      const prefix = `${folderPath}/`
      await get().loadNoteTreeForVault(vaultName)
      if (activeNotePath === folderPath || activeNotePath.startsWith(prefix)) {
        const remappedActive = activeNotePath.replace(prefix, `${nextPath}/`)
        await get().openNote(vaultName, remappedActive === activeNotePath ? activeNotePath.replace(folderPath, nextPath) : remappedActive)
      }
      if (selectedFolderPath === folderPath || selectedFolderPath.startsWith(prefix)) {
        get().setSelectedFolderPath(nextPath)
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to rename folder',
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
  deleteFolderByPath: async (vaultName, folderPath) => {
    set({ isLoading: true, error: '' })
    try {
      await deleteFolder(vaultName, folderPath)
      const currentSelectedFolder = get().selectedFolderPath
      await get().loadNoteTreeForVault(vaultName)
      if (currentSelectedFolder === folderPath || currentSelectedFolder.startsWith(`${folderPath}/`)) {
        get().setSelectedFolderPath('')
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete folder',
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
