import { create } from 'zustand'

/**
 * UI state management for File Explorer and global UI
 */
export const useUIStore = create((set, get) => ({
  // Tree expansion state
  expandedNodes: new Set(),

  // Selection state
  selectedNodeId: null,

  // Renaming state
  renamingNodeId: null,

  // Context menu state
  contextMenu: {
    isOpen: false,
    nodeId: null,
    position: { x: 0, y: 0 }
  },

  // Editor state
  editorMode: 'split',

  // Actions
  toggleExpand: (nodeId) => {
    const current = get().expandedNodes
    const next = new Set(current)
    if (next.has(nodeId)) {
      next.delete(nodeId)
    } else {
      next.add(nodeId)
    }
    set({ expandedNodes: next })
  },

  expandAll: (allNodeIds) => {
    set({ expandedNodes: new Set(allNodeIds) })
  },

  collapseAll: () => {
    set({ expandedNodes: new Set() })
  },

  isExpanded: (nodeId) => {
    return get().expandedNodes.has(nodeId)
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId })
  },

  isSelected: (nodeId) => {
    return get().selectedNodeId === nodeId
  },

  startRenaming: (nodeId) => {
    set({ renamingNodeId: nodeId })
  },

  stopRenaming: () => {
    set({ renamingNodeId: null })
  },

  isRenaming: (nodeId) => {
    return get().renamingNodeId === nodeId
  },

  showContextMenu: (nodeId, x, y) => {
    set({
      contextMenu: {
        isOpen: true,
        nodeId,
        position: { x, y }
      }
    })
  },

  hideContextMenu: () => {
    set({
      contextMenu: {
        isOpen: false,
        nodeId: null,
        position: { x: 0, y: 0 }
      }
    })
  },

  setEditorMode: (mode) => {
    set({ editorMode: mode })
  },
}))
