import { create } from 'zustand'
import { createNote as createNoteApi, deleteNote, getNote, getNoteTree, moveNote, renameNote, updateNote } from '../api/supabase/noteApi'
import { createFolder, deleteFolder, moveFolder, renameFolder } from '../api/supabase/folderApi'
import { parseFrontmatter, extractTagsFromFirstHeading, reconstructContentWithTags } from '../utils/markdownUtils'
import { getVaultMeta, updateVaultMeta } from '../api/supabase/vaultApi'
import { toSafePathSegment } from '../utils/fileUtils'
import { useVaultStore } from './vaultStore'
import { findFolderByPath, findNoteByPath, flattenNotePaths, normalizeNoteTree, getFallbackNoteIndexEntry, buildSafeNoteContent, collectAllFolderIds } from '../utils/treeUtils'

/**
 * Global note state for tree/list selection and editor content.
 **/
export const useNoteStore = create((set, get) => ({
  noteTree: { name: 'Root', path: '', folders: [], notes: [] },
  selectedFolderPath: '',
  notesInFolder: [],
  activeNotePath: '',
  activeNoteContent: '',
  activeNoteTags: [],
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
  setActiveNoteTags: (tags) => {
    set({ activeNoteTags: tags })
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
    const vaultId = vault?.id
    if (!vaultId) throw new Error('No active vault')

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
    const vaultId = vault?.id
    if (!vaultId) throw new Error('No active vault')

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
    const vaultId = vault?.id
    if (!vaultId) throw new Error('No active vault')

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
    const vaultId = vault?.id
    if (!vaultId) throw new Error('No active vault')
    const sourceNode = get().getNode(nodeId)
    if (!sourceNode) throw new Error('Source node not found')

    const targetParentId = newParentId || sourceNode.parentId
    const targetParentPath = targetParentId ? targetParentId.replace(/^folder-/, '') : ''

    if (sourceNode.type === 'note') {
      // Fetch original note content
      const noteData = await getNote(vaultId, sourceNode.path)
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
      await createNoteApi(vaultId, newPath, content)
      await get().loadNoteTreeForVault(vaultId)
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
        parentId: folder.path.includes('/') ? `folder-${folder.path.split('/').slice(0, -1).join('/')}` : null,
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
          return parts.length > 1 ? `folder-${parts.slice(0, -1).join('/')}` : null
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
    const activeVaultId = activeVault?.id
    const activeNotePath = get().activeNotePath
    const activeNoteContent = get().activeNoteContent
    const activeNoteTags = get().activeNoteTags
    const lastSavedContent = get().lastSavedContent
    if (!activeVaultId || !activeNotePath || activeNoteContent === lastSavedContent) {
      return
    }

    set({ saveStatus: 'saving', error: '' })
    try {
      // Reconstruct content with tags before saving
      const contentWithTags = reconstructContentWithTags(activeNoteContent, activeNoteTags)

      // Parse frontmatter to get title
      const parsed = parseFrontmatter(contentWithTags)
      const title = parsed.frontmatter?.title

      // If title exists and differs from filename, rename the file
      let renamedPath = null
      if (title) {
        const currentFilename = activeNotePath.split('/').pop().replace(/\.md$/i, '')
        const safeTitle = toSafePathSegment(title)
        if (safeTitle && safeTitle !== currentFilename) {
          const folderPath = activeNotePath.split('/').slice(0, -1).join('/')
          const newPath = folderPath ? `${folderPath}/${safeTitle}.md` : `${safeTitle}.md`
          await renameNote(activeVaultId, activeNotePath, title)
          set({ activeNotePath: newPath })
          // Note: tree will be updated on next navigation or refresh
          renamedPath = newPath
        }
      }

      // Update URL if note was renamed
      if (renamedPath) {
        const encodedPath = renamedPath.split('/').map(encodeURIComponent).join('/')
        window.history.replaceState(null, '', `/${encodeURIComponent(activeVaultId)}/${encodedPath}`)
      }

      await updateNote(activeVaultId, get().activeNotePath, contentWithTags)
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
      activeNoteTags: [],
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
  loadNoteTreeForVault: async (vault) => {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    console.log(`loadNoteTreeForVault called with vault:`, vault, `vaultId: ${vaultId}`)
    if (!vault || !vaultId) {
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
      console.log(`Calling getNoteTree for vaultId: ${vaultId}`)
      const notes = await getNoteTree(vaultId)
      console.log(`Raw notes from getNoteTree:`, notes)
      const noteTree = normalizeNoteTree(notes)
      console.log(`Normalized noteTree:`, noteTree)
      const rootPath = noteTree?.path ?? ''
      const selectedPath = get().selectedFolderPath || rootPath
      const selectedNode = findFolderByPath(noteTree, selectedPath) ?? noteTree
      const notePaths = flattenNotePaths(noteTree)
      const noteIndex = await Promise.all(
        notePaths.map(async (notePath) => {
          try {
            const noteData = await getNote(vaultId, notePath)
            const resolvedPath = noteData.data?.path ?? notePath
            const content = noteData.data?.content ?? ''
            const parsed = parseFrontmatter(content)
            const { tags: extractedTags, cleanContent } = extractTagsFromFirstHeading(content)

            // Combine frontmatter tags with extracted tags, prioritizing extracted tags
            const frontmatterTags = Array.isArray(parsed.frontmatter?.tags) ? parsed.frontmatter.tags.map(String) : []
            const allTags = extractedTags.length > 0 ? extractedTags : frontmatterTags

            const updatedAt = parsed.frontmatter?.updated_at ?? parsed.frontmatter?.updated ?? ''
            const createdAt = parsed.frontmatter?.created_at ?? parsed.frontmatter?.created ?? ''
            return {
              path: resolvedPath,
              title: parsed.frontmatter?.title || resolvedPath.split('/').pop()?.replace(/\.md$/i, '') || resolvedPath,
              tags: allTags,
              content: cleanContent,
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
        const meta = await getVaultMeta(vaultId)
        pinnedNotes = Array.isArray(meta?.pinned_notes) ? meta.pinned_notes : []
      } catch {
        pinnedNotes = []
      }

      const recentKey = `vaultnote:recent:${vaultId}`
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
      console.error('Failed to load note tree for vault:', vaultId, error)
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
  openNote: async (vault, notePath) => {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    console.log(`openNote called with vaultId: ${vaultId}, notePath: ${notePath}`)
    if (!vaultId || !notePath) return
    set({ isLoading: true, error: '' })
    try {
      const note = await getNote(vaultId, notePath)
      console.log(`Note fetched for ${notePath}:`, note.data?.content ? `content length ${note.data.content.length}` : 'no content')
      const content = note.data?.content ?? ''
      const { tags: extractedTags, cleanContent } = extractTagsFromFirstHeading(content)

      console.log('NoteStore Debug - Raw content:', content)
      console.log('NoteStore Debug - Extracted tags:', extractedTags)
      console.log('NoteStore Debug - Clean content:', cleanContent)

      const currentRecent = get().recentNotes.filter((path) => path !== (note.data?.path ?? notePath))
      const nextRecent = [note.data?.path ?? notePath, ...currentRecent].slice(0, 10)
      window.localStorage.setItem(`vaultnote:recent:${vaultId}`, JSON.stringify(nextRecent))
      set({
        activeNotePath: note.data?.path ?? notePath,
        activeNoteContent: cleanContent,
        activeNoteTags: extractedTags,
        lastSavedContent: cleanContent,
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
  createNote: async (vault, notePath, content) => {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    set({ isLoading: true, error: '' })
    try {
      await createNoteApi(vaultId, notePath, content)
      await get().loadNoteTreeForVault(vaultId)
      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create note',
      })
    }
  },
  createNoteInFolder: async (vault, folderPath, noteTitle) => {
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
      // Extract vault ID from vault object or use directly if it's already an ID
      const vaultId = typeof vault === 'string' ? vault : vault.id
      const created = await createNoteApi(vaultId, notePath, buildSafeNoteContent(trimmedTitle))
      await get().loadNoteTreeForVault(vaultId)
      await get().openNote(vaultId, created?.path ?? notePath)
      set({ saveStatus: 'saved' })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create note',
      })
    }
  },
  createFolderInFolder: async (vault, currentFolderPath, folderName) => {
    const trimmedFolder = folderName.trim()
    const safeFolder = toSafePathSegment(trimmedFolder)
    if (!safeFolder) return
    const folderPath = currentFolderPath ? `${currentFolderPath}/${safeFolder}` : safeFolder

    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id

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
        const created = await createFolder(vaultId, finalFolderPath)
        await get().loadNoteTreeForVault(vaultId)
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
      const created = await createFolder(vaultId, folderPath)
      await get().loadNoteTreeForVault(vaultId)
      get().setSelectedFolderPath(created?.path ?? folderPath)
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      })
    }
    return
  },

  renameFolderByPath: async (vault, folderPath, nextName) => {
    const trimmedName = nextName.trim()
    const safeFolder = toSafePathSegment(trimmedName)
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    if (!vaultId || !folderPath || !safeFolder) return
    const parentPath = folderPath.split('/').slice(0, -1).join('/')
    const nextPath = parentPath ? `${parentPath}/${safeFolder}` : safeFolder
    set({ isLoading: true, error: '' })
    try {
      await renameFolder(vaultId, folderPath, trimmedName)
      const activeNotePath = get().activeNotePath
      const selectedFolderPath = get().selectedFolderPath
      const prefix = `${folderPath}/`
      await get().loadNoteTreeForVault(vaultId)
      if (activeNotePath === folderPath || activeNotePath.startsWith(prefix)) {
        const remappedActive = activeNotePath.replace(prefix, `${nextPath}/`)
        const finalPath = remappedActive === activeNotePath ? activeNotePath.replace(folderPath, nextPath) : remappedActive
        await get().openNote(vaultId, finalPath)
        // Update URL to reflect new path
        const encodedPath = finalPath.split('/').map(encodeURIComponent).join('/')
        window.history.replaceState(null, '', `/${encodeURIComponent(vaultId)}/${encodedPath}`)
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
  renameNoteByPath: async (vault, notePath, nextName) => {
    const trimmedName = nextName.trim()
    const safeStem = toSafePathSegment(trimmedName)
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    if (!vaultId || !notePath || !safeStem) return
    const folderPath = notePath.split('/').slice(0, -1).join('/')
    const nextPath = folderPath ? `${folderPath}/${safeStem}.md` : `${safeStem}.md`
    set({ isLoading: true, error: '' })
    try {
      await renameNote(vaultId, notePath, trimmedName)
      const activeNotePath = get().activeNotePath
      const selectedFolderPath = get().selectedFolderPath
      await get().loadNoteTreeForVault(vaultId)
      if (activeNotePath === notePath) {
        await get().openNote(vaultId, nextPath)
        // Update URL to reflect new path
        const encodedPath = nextPath.split('/').map(encodeURIComponent).join('/')
        window.history.replaceState(null, '', `/${encodeURIComponent(vaultId)}/${encodedPath}`)
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
  deleteNoteByPath: async (vault, notePath) => {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    set({ isLoading: true, error: '' })
    try {
      await deleteNote(vaultId, notePath)
      const currentPath = get().activeNotePath
      await get().loadNoteTreeForVault(vaultId)
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
  moveNoteByPath: async (vault, notePath, targetPath) => {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    if (!vaultId || !notePath || !targetPath) return
    set({ isLoading: true, error: '' })
    try {
      await moveNote(vaultId, notePath, targetPath)
      const activeNotePath = get().activeNotePath
      await get().loadNoteTreeForVault(vaultId)
      if (activeNotePath === notePath) {
        const noteName = notePath.split('/').pop()
        const newPath = targetPath ? `${targetPath}/${noteName}` : noteName
        await get().openNote(vaultId, newPath)
      }
      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to move note',
      })
    }
  },
  moveFolderByPath: async (vault, folderPath, targetPath) => {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    if (!vaultId || !folderPath || !targetPath) return
    set({ isLoading: true, error: '' })
    try {
      await moveFolder(vaultId, folderPath, targetPath)
      const activeNotePath = get().activeNotePath
      const selectedFolderPath = get().selectedFolderPath
      const prefix = `${folderPath}/`
      await get().loadNoteTreeForVault(vaultId)
      if (activeNotePath === folderPath || activeNotePath.startsWith(prefix)) {
        const folderName = folderPath.split('/').pop()
        const newPrefix = targetPath ? `${targetPath}/${folderName}/` : `${folderName}/`
        const remappedActive = activeNotePath.replace(prefix, newPrefix)
        await get().openNote(vaultId, remappedActive)
        // Update URL to reflect new path
        const encodedPath = remappedActive.split('/').map(encodeURIComponent).join('/')
        window.history.replaceState(null, '', `/${encodeURIComponent(vaultId)}/${encodedPath}`)
      }
      if (selectedFolderPath === folderPath || selectedFolderPath.startsWith(prefix)) {
        get().setSelectedFolderPath(targetPath)
      }
      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to move folder',
      })
    }
  },
  deleteFolderByPath: async (vault, folderPath) => {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    set({ isLoading: true, error: '' })
    try {
      await deleteFolder(vaultId, folderPath)
      const currentSelectedFolder = get().selectedFolderPath
      await get().loadNoteTreeForVault(vaultId)
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
  togglePinnedNote: async (vault, notePath) => {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    const currentPins = get().pinnedNotes
    const nextPins = currentPins.includes(notePath)
      ? currentPins.filter((path) => path !== notePath)
      : [...currentPins, notePath]
    try {
      await updateVaultMeta(vaultId, nextPins)
      set({ pinnedNotes: nextPins })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update pinned notes',
      })
    }
  },
}))
