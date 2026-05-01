import { create } from 'zustand'
import { createFolder, deleteFolder, getNoteTree, moveFolder, renameFolder } from '../api/noteApi'
import { findFolderByPath, flattenNotePaths, normalizeNoteTree, collectAllFolderIds } from '../utils/treeUtils'
import { toSafePathSegment } from '../utils/fileUtils'

/**
 * Tree state management for folder structure and navigation
 */
export const useTreeStore = create((set, get) => ({
  // State
  noteTree: { name: 'Root', path: '', folders: [], notes: [] },
  selectedFolderPath: '',
  notesInFolder: [],
  expandedFolders: new Set(),
  isLoading: false,
  error: '',

  // Actions
  setSelectedFolderPath: (path) => {
    set({ selectedFolderPath: path })
  },

  toggleExpand: (folderId) => {
    const current = get().expandedFolders
    const next = new Set(current)
    if (next.has(folderId)) {
      next.delete(folderId)
    } else {
      next.add(folderId)
    }
    set({ expandedFolders: next })
  },

  expandAll: () => {
    const allIds = collectAllFolderIds(get().noteTree)
    set({ expandedFolders: new Set(allIds) })
  },

  collapseAll: () => {
    set({ expandedFolders: new Set() })
  },

  isExpanded: (folderId) => {
    return get().expandedFolders.has(folderId)
  },

  // Tree node accessors (for FileExplorer)
  getNode: (nodeId) => {
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
      const notes = flattenNotePaths(tree)
      const notePath = notes.find(n => n === path)
      if (!notePath) return null
      return {
        id: nodeId,
        type: 'note',
        name: path.split('/').pop(),
        path: notePath,
        parentId: (() => {
          const parts = path.split('/')
          return parts.length > 1 ? `folder-${parts.slice(0, -1).join('/')}` : null
        })(),
      }
    }
    return null
  },

  getChildren: (parentId) => {
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

  // Tree loading
  loadTree: async (vaultName) => {
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

      set({
        noteTree,
        selectedFolderPath: selectedNode?.path ?? '',
        notesInFolder: Array.isArray(selectedNode?.notes) ? selectedNode.notes : [],
        isLoading: false,
      })
    } catch (error) {
      console.error('Failed to load tree:', error)
      set({
        noteTree: { name: 'Root', path: '', folders: [], notes: [] },
        selectedFolderPath: '',
        notesInFolder: [],
        isLoading: false,
        error: error.message || 'Failed to load tree',
      })
    }
  },

  // Folder operations
  createFolder: async (vaultName, currentFolderPath, folderName) => {
    const trimmedFolder = folderName.trim()
    const safeFolder = toSafePathSegment(trimmedFolder)
    if (!safeFolder) return
    const folderPath = currentFolderPath ? `${currentFolderPath}/${safeFolder}` : safeFolder

    // Check if folder already exists
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
      // Generate unique name
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
        await get().loadTree(vaultName)
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
      await get().loadTree(vaultName)
      get().setSelectedFolderPath(created?.path ?? folderPath)
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      })
    }
  },

  renameFolder: async (vaultName, folderPath, nextName) => {
    const trimmedName = nextName.trim()
    const safeFolder = toSafePathSegment(trimmedName)
    if (!vaultName || !folderPath || !safeFolder) return
    const parentPath = folderPath.split('/').slice(0, -1).join('/')
    const nextPath = parentPath ? `${parentPath}/${safeFolder}` : safeFolder

    set({ isLoading: true, error: '' })
    try {
      await renameFolder(vaultName, folderPath, trimmedName)
      await get().loadTree(vaultName)
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to rename folder',
      })
    }
  },

  moveFolder: async (vaultName, folderPath, targetPath) => {
    if (!vaultName || !folderPath) return
    const folderName = folderPath.split('/').pop()
    const nextPath = targetPath ? `${targetPath}/${folderName}` : folderName

    set({ isLoading: true, error: '' })
    try {
      await moveFolder(vaultName, folderPath, nextPath)
      await get().loadTree(vaultName)
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to move folder',
      })
    }
  },

  deleteFolder: async (vaultName, folderPath) => {
    set({ isLoading: true, error: '' })
    try {
      await deleteFolder(vaultName, folderPath)
      const currentSelected = get().selectedFolderPath
      await get().loadTree(vaultName)
      if (currentSelected === folderPath || currentSelected.startsWith(`${folderPath}/`)) {
        get().setSelectedFolderPath('')
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete folder',
      })
    }
  },
}))
