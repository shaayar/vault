import { create } from 'zustand'
import yaml from 'js-yaml'
import { createFolder, createNote as createNoteApi, deleteFolder, deleteNote, getNote, getNoteTree, moveFolder, moveNote, renameFolder, renameNote, updateNote } from '../api/noteApi'
import { parseFrontmatter } from '../utils/markdownUtils'
import { getVaultMeta, updateVaultMeta } from '../api/vaultApi'
import { toSafePathSegment } from '../utils/fileUtils'
import { useVaultStore } from './vaultStore'

/**
 * Global note state for tree/list selection and editor content.
 **/
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

function findNoteByPath(node, targetPath) {
  if (!node) return null
  const notes = Array.isArray(node.notes) ? node.notes : []
  for (const note of notes) {
    if (note.path === targetPath) return note
  }
  if (node.folders) {
    for (const folder of node.folders) {
      const found = findNoteByPath(folder, targetPath)
      if (found) return found
    }
  }
  return null
}

function flattenNotePaths(node) {
  if (!node || typeof node !== 'object') return []
  const notes = Array.isArray(node.notes) ? node.notes : []
  const ownNotes = notes.map((note) => note.path)
  const childFolders = Array.isArray(node.folders) ? node.folders : []
  return childFolders.reduce((all, folder) => [...all, ...flattenNotePaths(folder)], ownNotes)
}

function normalizeNoteTree(node) {
  if (!node || typeof node !== 'object') {
    return { name: 'Root', path: '', folders: [], notes: [] }
  }

  const notes = Array.isArray(node.notes) ? node.notes : []
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
    frontmatter: {},
  }
}

function buildSafeNoteContent(title, body = '') {
  const frontmatter = yaml.dump(
    { title },
    { sortKeys: false, lineWidth: -1, noRefs: true, quotingType: '"' },
  ).trimEnd()
  return `---\n${frontmatter}\n---\n\n${body}`
}

// Collect all folder IDs (as "folder-{path}" strings) from a tree
function collectAllFolderIds(node) {
  const ids = []
  if (node.folders && Array.isArray(node.folders)) {
    for (const folder of node.folders) {
      const folderId = `folder-${folder.path}`
      ids.push(folderId)
      ids.push(...collectAllFolderIds(folder))
    }
  }
  return ids
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
  // File Explorer UI state
  expandedNodes: new Set(),
  selectedNodeId: null,
  renamingNodeId: null,
  rootNodes: [],
  contextMenu: {
    isOpen: false,
    nodeId: null,
    position: { x: 0, y: 0 }
  },
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
  setActiveNoteFromUrl: (notePath) => {
    set({ activeNotePath: notePath })
  },
  updateEditorContent: (content) => {
    set({ activeNoteContent: content, saveStatus: 'idle' })
  },
  // --- FileExplorer UI actions ---
  toggleExpand: (nodeId) => {
    set(state => {
      const newExpanded = new Set(state.expandedNodes)
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId)
      } else {
        newExpanded.add(nodeId)
      }
      return { expandedNodes: newExpanded }
    })
  },
  expandAll: () => {
    const { noteTree } = get()
    const folderIds = collectAllFolderIds(noteTree)
    set({ expandedNodes: new Set(folderIds) })
  },
  collapseAll: () => {
    set({ expandedNodes: new Set() })
  },
  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId })
  },
  showContextMenu: (nodeId, x, y) => {
    set({ contextMenu: { isOpen: true, nodeId, position: { x, y } } })
  },
  hideContextMenu: () => {
    set({ contextMenu: { isOpen: false, nodeId: null, position: { x: 0, y: 0 } } })
  },
  startRenaming: (nodeId) => {
    set({ renamingNodeId: nodeId })
  },
  stopRenaming: () => {
    set({ renamingNodeId: null })
  },
  // Initialize file explorer UI nodes from the already-loaded note tree.
  initialize: () => {
    const noteTreeData = get().noteTree
    const folderIds = (noteTreeData.folders || []).map(f => `folder-${f.path}`)
    const noteIds = (noteTreeData.notes || []).map(n => `note-${n.path}`)
    set({ rootNodes: [...folderIds, ...noteIds], expandedNodes: new Set(), selectedNodeId: null })
  },
  isExpanded: (nodeId) => {
    return get().expandedNodes.has(nodeId)
  },
  isSelected: (nodeId) => {
    return get().selectedNodeId === nodeId
  },

  // --- CRUD operations (compatibility layer replacing fileExplorerStore) ---
  createNode: async (parentId, type, name) => {
    const vault = useVaultStore.getState().activeVault
    if (!vault) throw new Error('No active vault')

    const parentPath = parentId ? parentId.replace(/^folder-/, '') : ''
    if (type === 'note') {
      await get().createNoteInFolder(vault, parentPath, name)
    } else if (type === 'folder') {
      await get().createFolderInFolder(vault, parentPath, name)
    } else {
      throw new Error('Invalid node type')
    }

    // Expand parent folder if it's a folder
    if (parentId) {
      get().toggleExpand(parentId)
    }
  },

  deleteNode: async (nodeId) => {
    const vault = useVaultStore.getState().activeVault
    if (!vault) throw new Error('No active vault')

    const node = get().getNode(nodeId)
    if (!node) throw new Error('Node not found')

    if (node.type === 'note') {
      await get().deleteNoteByPath(vault, node.path)
    } else if (node.type === 'folder') {
      await get().deleteFolderByPath(vault, node.path)
    }
  },

  renameNode: async (nodeId, newName) => {
    const vault = useVaultStore.getState().activeVault
    if (!vault) throw new Error('No active vault')

    const node = get().getNode(nodeId)
    if (!node) throw new Error('Node not found')

    if (node.type === 'note') {
      await get().renameNoteByPath(vault, node.path, newName)
    } else if (node.type === 'folder') {
      await get().renameFolderByPath(vault, node.path, newName)
    }
  },

  duplicateNode: async (nodeId, newParentId = null, newName = null) => {
    const vault = useVaultStore.getState().activeVault
    if (!vault) throw new Error('No active vault')
    const sourceNode = get().getNode(nodeId)
    if (!sourceNode) throw new Error('Source node not found')

    const targetParentId = newParentId || sourceNode.parentId
    const targetParentPath = targetParentId ? targetParentId.replace(/^folder-/, '') : ''

    if (sourceNode.type === 'note') {
      // Fetch original note content
      const noteData = await getNote(vault, sourceNode.path)
        const content = noteData.data?.content || ''
        const baseName = newName || sourceNode.name.replace(/\.md$/i, '') + ' (copy)'
        const fullBase = baseName.endsWith('.md') ? baseName : baseName + '.md'

      // Ensure unique filename in target folder
      let uniqueName = fullBase
      let counter = 1
      const candidatePath = (p) => p ? `${p}/${uniqueName}` : uniqueName
      while (get().noteIndex.some(n => n.path === candidatePath(targetParentPath))) {
        uniqueName = `${baseName.replace(/\.md$/i, '')} (${counter}).md`
        counter++
      }

      const newPath = candidatePath(targetParentPath)
      await createNoteApi(vault, newPath, content)
      await get().loadNoteTreeForVault(vault)
    } else if (sourceNode.type === 'folder') {
      throw new Error('Folder duplication not yet implemented')
    }
  },

    // --- Helper methods ---
    getNode: (nodeId) => {
      // nodeId format: "folder-{path}" or "note-{path}"
      const parts = nodeId.split('-', 2)
      if (parts.length < 2) return null
      const [type, path] = [parts[0], parts[1]]
      const tree = get().noteTree

      if (type === 'folder') {
        const folder = findFolderByPath(tree, path)
        if (!folder) return null
        return {
          id: nodeId,
          type: 'folder',
          name: folder.name || path.split('/').pop(),
          path: folder.path,
          parentId: folder.path.includes('/') ? `folder-${folder.path.split('/').slice(0,-1).join('/')}` : null,
          folders: folder.folders,
          notes: folder.notes,
        }
      } else if (type === 'note') {
        const note = findNoteByPath(tree, path)
        if (!note) return null
        return {
          id: nodeId,
          type: 'note',
          name: note.title || path.split('/').pop(),
          path: note.path,
          parentId: (() => {
            const parts = path.split('/')
            return parts.length > 1 ? `folder-${parts.slice(0,-1).join('/')}` : null
          })(),
        }
      }
      return null
    },
  getChildren: (parentId) => {
    // parentId format: "folder-{path}" or null/empty for root
    const parentPath = parentId ? parentId.replace(/^folder-/, '') : ''
    const parentNode = parentPath ? findFolderByPath(get().noteTree, parentPath) : get().noteTree
    if (!parentNode) return []

    const children = []
    if (parentNode.folders && Array.isArray(parentNode.folders)) {
      parentNode.folders.forEach(f => children.push(`folder-${f.path}`))
    }
    if (parentNode.notes && Array.isArray(parentNode.notes)) {
      parentNode.notes.forEach(n => children.push(`note-${n.path}`))
    }
    return children
  },
  isFolder: (nodeId) => {
    const node = get().getNode(nodeId)
    return node && node.type === 'folder'
  },
  isNote: (nodeId) => {
    const node = get().getNode(nodeId)
    return node && node.type === 'note'
  },
  isEmpty: (nodeId) => {
    const children = get().getChildren(nodeId)
    return children.length === 0
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
      // Parse frontmatter to get title
      const parsed = parseFrontmatter(activeNoteContent)
      const title = parsed.frontmatter?.title

      // If title exists and differs from filename, rename the file
      if (title) {
        const currentFilename = activeNotePath.split('/').pop().replace(/\.md$/i, '')
        const safeTitle = toSafePathSegment(title)
        if (safeTitle && safeTitle !== currentFilename) {
          const folderPath = activeNotePath.split('/').slice(0, -1).join('/')
          const newPath = folderPath ? `${folderPath}/${safeTitle}.md` : `${safeTitle}.md`
          await renameNote(activeVault, activeNotePath, title)
          set({ activeNotePath: newPath })
          await get().loadNoteTreeForVault(activeVault)
        }
      }

      await updateNote(activeVault, get().activeNotePath, activeNoteContent)
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
      rootNodes: [],
      expandedNodes: new Set(),
      selectedNodeId: null,
      renamingNodeId: null,
      contextMenu: {
        isOpen: false,
        nodeId: null,
        position: { x: 0, y: 0 },
      },
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
            const resolvedPath = noteData.data?.path ?? notePath
            const content = noteData.data?.content ?? ''
            const parsed = parseFrontmatter(content)
            const updatedAt = parsed.frontmatter?.updated_at ?? parsed.frontmatter?.updated ?? ''
            const createdAt = parsed.frontmatter?.created_at ?? parsed.frontmatter?.created ?? ''
            return {
              path: resolvedPath,
              title: parsed.frontmatter?.title || resolvedPath.split('/').pop()?.replace(/\.md$/i, '') || resolvedPath,
              tags: Array.isArray(parsed.frontmatter?.tags) ? parsed.frontmatter.tags.map(String) : [],
              content: content,
              updatedAt,
              createdAt,
              frontmatter: parsed.frontmatter ?? {},
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
      console.error('Failed to load note tree for vault:', vaultName, error)
      set({
        noteTree: { name: 'Root', path: '', folders: [], notes: [] },
        selectedFolderPath: '',
        notesInFolder: [],
        noteIndex: [],
        pinnedNotes: [],
        recentNotes: [],
        isLoading: false,
        error: error.message || 'Failed to load vault'
      })
    }
  },
   openNote: async (vaultName, notePath) => {
     if (!vaultName || !notePath) return
     set({ isLoading: true, error: '' })
     try {
       const note = await getNote(vaultName, notePath)
       const currentRecent = get().recentNotes.filter((path) => path !== (note.data?.path ?? notePath))
       const nextRecent = [note.data?.path ?? notePath, ...currentRecent].slice(0, 10)
       window.localStorage.setItem(`vaultnote:recent:${vaultName}`, JSON.stringify(nextRecent))
       set({
         activeNotePath: note.data?.path ?? notePath,
         activeNoteContent: note.data?.content ?? '',
         lastSavedContent: note.data?.content ?? '',
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

   // Create a note directly (used by Header)
   createNote: async (vaultName, notePath, content) => {
     set({ isLoading: true, error: '' })
     try {
       await createNoteApi(vaultName, notePath, content)
       await get().loadNoteTreeForVault(vaultName)
       set({ isLoading: false })
     } catch (error) {
       set({
         isLoading: false,
         error: error instanceof Error ? error.message : 'Failed to create note',
       })
     }
   },
   createNoteInFolder: async (vaultName, folderPath, noteTitle) => {
     const trimmedTitle = noteTitle.trim()
     if (!trimmedTitle) return
     const safeStem = toSafePathSegment(trimmedTitle)
     if (!safeStem) return

     // Generate unique filename if note already exists
     const noteIndex = get().noteIndex
     const notesInFolder = noteIndex.filter(n => {
       if (!folderPath) return !n.path.includes('/')
       return n.path.startsWith(`${folderPath}/`)
     })
     const existingNames = notesInFolder.map(n => n.path.split('/').pop())

     let noteFile = `${safeStem}.md`
     let counter = 1
     while (existingNames.includes(noteFile)) {
       noteFile = `${safeStem} (${counter}).md`
       counter++
     }

     const notePath = folderPath ? `${folderPath}/${noteFile}` : noteFile
     set({ isLoading: true, error: '' })
     try {
       const created = await createNoteApi(vaultName, notePath, buildSafeNoteContent(trimmedTitle))
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

    // Check if folder already exists in the same parent
    const noteTree = get().noteTree
    function findExistingFolder(node, targetPath) {
      if (!node) return false
      if (node.path === targetPath) return true
      if (node.folders && Array.isArray(node.folders)) {
        return node.folders.some(folder => findExistingFolder(folder, targetPath))
      }
      return false
    }

    if (findExistingFolder(noteTree, folderPath)) {
      // Generate unique name by appending a counter
      const parentPath = currentFolderPath || ''
      const siblingFolders = parentPath
        ? findFolderByPath(noteTree, parentPath)?.folders || []
        : noteTree.folders || []
      const existingNames = siblingFolders.map(f => f.name)
      let counter = 1
      let uniqueName = trimmedFolder
      while (existingNames.includes(uniqueName)) {
        uniqueName = `${trimmedFolder} (${counter})`
        counter++
      }
      const uniqueSafeFolder = toSafePathSegment(uniqueName)
      const finalFolderPath = parentPath ? `${parentPath}/${uniqueSafeFolder}` : uniqueSafeFolder
      set({ isLoading: true, error: '' })
      try {
        const created = await createFolder(vaultName, finalFolderPath)
        await get().loadNoteTreeForVault(vaultName)
        get().setSelectedFolderPath(created?.path ?? finalFolderPath)
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to create folder',
        })
      }
      return
    }

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
  moveNoteByPath: async (vaultName, notePath, targetPath) => {
    if (!vaultName || !notePath || !targetPath) return
    set({ isLoading: true, error: '' })
    try {
      await moveNote(vaultName, notePath, targetPath)
      const activeNotePath = get().activeNotePath
      await get().loadNoteTreeForVault(vaultName)
      if (activeNotePath === notePath) {
        const noteName = notePath.split('/').pop()
        const newPath = targetPath ? `${targetPath}/${noteName}` : noteName
        await get().openNote(vaultName, newPath)
      }
      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to move note',
      })
    }
  },
  moveFolderByPath: async (vaultName, folderPath, targetPath) => {
    if (!vaultName || !folderPath || !targetPath) return
    set({ isLoading: true, error: '' })
    try {
      await moveFolder(vaultName, folderPath, targetPath)
      const activeNotePath = get().activeNotePath
      const selectedFolderPath = get().selectedFolderPath
      const prefix = `${folderPath}/`
      await get().loadNoteTreeForVault(vaultName)
      if (activeNotePath === folderPath || activeNotePath.startsWith(prefix)) {
        const folderName = folderPath.split('/').pop()
        const newPrefix = targetPath ? `${targetPath}/${folderName}/` : `${folderName}/`
        const remappedActive = activeNotePath.replace(prefix, newPrefix)
        await get().openNote(vaultName, remappedActive)
      }
      if (selectedFolderPath === folderPath || selectedFolderPath.startsWith(prefix)) {
        const folderName = folderPath.split('/').pop()
        get().setSelectedFolderPath(targetPath ? `${targetPath}/${folderName}` : folderName)
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to move folder',
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
