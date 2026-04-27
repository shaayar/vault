/**
 * Zustand store for File Explorer
 * Manages both data state (nodes) and UI state (expansion, selection, etc.)
 */

import { create } from 'zustand'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { convertNoteTreeToObsidianFormat, generateNodeId } from '../../utils/treeConverter'
import { treeEngine } from './treeEngine'
import { buildChildrenMap } from './indexedDB'

/**
 * File Explorer Store
 */
export const useFileExplorerStore = create((set, get) => ({
  // Data state
  nodesById: {},
  childrenMap: {},
  rootNodes: [],
  isLoading: true,
  error: null,

  // UI state
  expandedNodes: new Set(),
  selectedNodeId: null,
  contextMenu: {
    isOpen: false,
    nodeId: null,
    position: { x: 0, y: 0 }
  },
  renamingNodeId: null,

  // Actions
  initialize: async (noteTreeOverride = null, activeVaultOverride = null) => {
    try {
      set({ isLoading: true, error: null })

      // Get data from real vault
      const noteStore = useNoteStore.getState()
      const vaultStore = useVaultStore.getState()
      const activeVault = activeVaultOverride ?? vaultStore.activeVault
      const noteTree = noteTreeOverride ?? noteStore.noteTree

      if (!activeVault) {
        set({ error: 'No active vault selected', isLoading: false })
        return
      }

      // Convert noteTree to ObsidianSidebar format
      const convertedData = convertNoteTreeToObsidianFormat(noteTree)

      set({
        nodesById: convertedData.nodesById,
        childrenMap: convertedData.childrenMap,
        rootNodes: convertedData.rootNodes,
        isLoading: false
      })
    } catch (error) {
      console.error('Failed to initialize file explorer:', error)
      set({ error: error.message, isLoading: false })
    }
  },

  // Node operations
  createNode: async (parentId, type, name) => {
    try {
      // Set loading state
      set({ isLoading: true, error: null })

      // Get parent node path
      const parentNode = parentId ? get().nodesById[parentId] : null
      const parentPath = parentNode ? parentNode.path : ''

      // Get data from real vault
      const noteStore = useNoteStore.getState()
      const vaultStore = useVaultStore.getState()
      const activeVault = vaultStore.activeVault

      if (!activeVault) {
        set({ isLoading: false, error: 'No active vault selected' })
        throw new Error('No active vault selected')
      }

      // Call API first - don't update local state yet
      if (type === 'note') {
        await noteStore.createNoteInFolder(activeVault, parentPath, name)
      } else if (type === 'folder') {
        await noteStore.createFolderInFolder(activeVault, parentPath, name)
      } else {
        throw new Error('Unsupported node type')
      }

      // Auto-expand parent if it's a folder
      if (parentId) {
        set(state => ({
          expandedNodes: new Set([...state.expandedNodes, parentId])
        }))
      }

      // Re-initialize tree from server to get accurate state
      await get().initialize(useNoteStore.getState().noteTree, activeVault)

      // Clear loading state
      set({ isLoading: false })

      return true
    } catch (error) {
      console.error('Failed to create node:', error)
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  deleteNode: async (nodeId) => {
    try {
      // Set loading state
      set({ isLoading: true, error: null })

      const { nodesById } = get()
      const node = nodesById[nodeId]

      if (!node) {
        set({ isLoading: false, error: 'Node not found' })
        throw new Error('Node not found')
      }

      // Delete via real vault
      const noteStore = useNoteStore.getState()
      const vaultStore = useVaultStore.getState()
      const activeVault = vaultStore.activeVault

      if (node.type === 'note') {
        await noteStore.deleteNoteByPath(activeVault, node.path)
      } else if (node.type === 'folder') {
        await noteStore.deleteFolderByPath(activeVault, node.path)
      }

      // Re-initialize and clear loading state
      await get().initialize(useNoteStore.getState().noteTree, activeVault)
      set({ isLoading: false })

      return [nodeId]
    } catch (error) {
      console.error('Failed to delete node:', error)
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  renameNode: async (nodeId, newName) => {
    try {
      const { nodesById } = get()
      const node = nodesById[nodeId]

      if (!node) {
        throw new Error('Node not found')
      }

      // Use noteStore API to rename real file/folder
      const noteStore = useNoteStore.getState()
      const vaultStore = useVaultStore.getState()
      const activeVault = vaultStore.activeVault

      if (!activeVault) {
        throw new Error('No active vault selected')
      }

      if (node.type === 'note') {
        await noteStore.renameNoteByPath(activeVault, node.path, newName)
      } else if (node.type === 'folder') {
        await noteStore.renameFolderByPath(activeVault, node.path, newName)
      }

      await get().initialize(useNoteStore.getState().noteTree, activeVault)
      return get().nodesById[nodeId] ?? null
    } catch (error) {
      console.error('Failed to rename node:', error)
      set({ error: error.message })
      throw error
    }
  },

  // UI state actions
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
    const { nodesById } = get()
    const folderIds = Object.values(nodesById)
      .filter(node => node.type === 'folder')
      .map(node => node.id)

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

  // Helper functions
  getNode: (nodeId) => {
    return get().nodesById[nodeId] || null
  },

  getChildren: (parentId) => {
    return get().childrenMap[parentId] || []
  },

  isFolder: (nodeId) => {
    const node = get().nodesById[nodeId]
    return node?.type === 'folder'
  },

  isNote: (nodeId) => {
    const node = get().nodesById[nodeId]
    return node?.type === 'note'
  },

  isEmpty: (nodeId) => {
    const children = get().childrenMap[nodeId] || []
    return children.length === 0
  },

  isExpanded: (nodeId) => {
    return get().expandedNodes.has(nodeId)
  },

  isSelected: (nodeId) => {
    return get().selectedNodeId === nodeId
  },

  // Advanced Tree Engine operations
  moveNode: async (nodeId, newParentId, options = {}) => {
    try {
      const updatedNode = await treeEngine.updateNode(nodeId, {
        parentId: newParentId,
        order: options.order
      })

      // Rebuild children map since move affects relationships
      const newChildrenMap = await buildChildrenMap()

      set(state => ({
        nodesById: {
          ...state.nodesById,
          [nodeId]: updatedNode
        },
        childrenMap: newChildrenMap
      }))

      return updatedNode
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  duplicateNode: async (nodeId, newParentId = null, newName = null) => {
    try {
      const duplicatedNodes = await treeEngine.duplicateNode(nodeId, newParentId, newName)

      // Update local state with new nodes
      const newNodesById = { ...get().nodesById }
      const newRootNodes = [...get().rootNodes]

      duplicatedNodes.forEach(node => {
        newNodesById[node.id] = node

        if (node.parentId === null) {
          newRootNodes.push(node.id)
        }
      })

      // Rebuild children map
      const rebuiltChildrenMap = await buildChildrenMap()

      set({
        nodesById: newNodesById,
        childrenMap: rebuiltChildrenMap,
        rootNodes: newRootNodes
      })

      return duplicatedNodes
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  searchNodes: async (query, options = {}) => {
    try {
      return await treeEngine.searchNodes(query, options)
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  getNodePath: async (nodeId) => {
    try {
      return await treeEngine.getNodePath(nodeId)
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  getTreeStats: async () => {
    try {
      return await treeEngine.getTreeStats()
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  }
}))

// Helper functions for components
export const useFileExplorerHelpers = () => {
  const store = useFileExplorerStore()

  return {
    // Data helpers
    getNode: store.getNode,
    getChildren: store.getChildren,
    isFolder: store.isFolder,
    isNote: store.isNote,
    isEmpty: store.isEmpty,

    // UI helpers
    isExpanded: store.isExpanded,
    isSelected: store.isSelected,

    // Actions
    toggleExpand: store.toggleExpand,
    selectNode: store.selectNode,
    showContextMenu: store.showContextMenu,
    hideContextMenu: store.hideContextMenu,
    startRenaming: store.startRenaming,
    stopRenaming: store.stopRenaming,

    // CRUD
    createNode: store.createNode,
    deleteNode: store.deleteNode,
    renameNode: store.renameNode,
    moveNode: store.moveNode,
    duplicateNode: store.duplicateNode,
    searchNodes: store.searchNodes,
    getNodePath: store.getNodePath,
    getTreeStats: store.getTreeStats
  }
}
