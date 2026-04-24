/**
 * Drag and drop utilities for file organization
 */

import { useRef, useCallback } from "react"

/**
 * Drag and drop manager for tree operations
 */
export class DragDropManager {
  constructor() {
    this.draggedNode = null
    this.dropZones = new Map()
    this.dragOverZone = null
    this.callbacks = {}
  }

  /**
   * Initialize drag and drop on a container
   */
  initialize(container, callbacks = {}) {
    this.callbacks = callbacks
    
    // Prevent default drag behaviors
    container.addEventListener('dragover', this.handleDragOver.bind(this))
    container.addEventListener('drop', this.handleDrop.bind(this))
    container.addEventListener('dragleave', this.handleDragLeave.bind(this))
    
    // Register drop zones
    this.registerDropZones(container)
  }

  /**
   * Register drop zones in the tree
   */
  registerDropZones(container) {
    const dropZones = container.querySelectorAll('[data-drop-zone]')
    dropZones.forEach(zone => {
      const nodeId = zone.dataset.dropZone
      this.dropZones.set(nodeId, zone)
    })
  }

  /**
   * Handle drag start
   */
  handleDragStart(event, node) {
    this.draggedNode = node
    
    // Set drag data
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify(node))
    
    // Add drag styles
    event.target.classList.add('opacity-50')
    document.body.classList.add('dragging')
  }

  /**
   * Handle drag over
   */
  handleDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    
    // Find drop zone
    const dropZone = event.target.closest('[data-drop-zone]')
    if (dropZone) {
      // Remove previous highlight
      this.clearDropHighlights()
      
      // Highlight current drop zone
      dropZone.classList.add('bg-blue-100', 'dark:bg-blue-900', 'border-blue-500')
      this.dragOverZone = dropZone
    }
  }

  /**
   * Handle drag leave
   */
  handleDragLeave(event) {
    // Check if we're actually leaving a drop zone
    const dropZone = event.target.closest('[data-drop-zone]')
    if (!dropZone || !this.dragOverZone) return
    
    // Clear highlights if leaving the current zone
    if (this.dragOverZone === dropZone) {
      dropZone.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'border-blue-500')
      this.dragOverZone = null
    }
  }

  /**
   * Handle drop
   */
  async handleDrop(event) {
    event.preventDefault()
    event.stopPropagation()
    
    // Clear all highlights
    this.clearDropHighlights()
    document.body.classList.remove('dragging')
    
    // Find drop target
    const dropZone = event.target.closest('[data-drop-zone]')
    if (!dropZone || !this.draggedNode) return
    
    const targetNodeId = dropZone.dataset.dropZone
    const targetNode = this.callbacks.getNode?.(targetNodeId)
    
    if (!targetNode) return
    
    // Prevent dropping on self
    if (targetNodeId === this.draggedNode.id) return
    
    // Prevent dropping folder into its own children
    if (this.isDescendant(this.draggedNode, targetNode)) {
      this.callbacks.onError?.('Cannot move folder into its own contents')
      return
    }
    
    try {
      await this.callbacks.onMove?.(this.draggedNode, targetNode)
      this.callbacks.onSuccess?.(`Moved ${this.draggedNode.name} to ${targetNode.name}`)
    } catch (error) {
      this.callbacks.onError?.(`Failed to move ${this.draggedNode.name}: ${error.message}`)
    } finally {
      this.cleanup()
    }
  }

  /**
   * Check if node is descendant of target
   */
  isDescendant(draggedNode, targetNode) {
    if (targetNode.type !== 'folder') return false
    if (draggedNode.type !== 'folder') return false
    
    // Check if dragged folder is contained within target folder
    const targetPath = targetNode.path
    const draggedPath = draggedNode.path
    
    return targetPath.startsWith(draggedPath + '/')
  }

  /**
   * Clear all drop zone highlights
   */
  clearDropHighlights() {
    this.dropZones.forEach(zone => {
      zone.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'border-blue-500')
    })
    this.dragOverZone = null
  }

  /**
   * Cleanup drag state
   */
  cleanup() {
    this.clearDropHighlights()
    document.body.classList.remove('dragging')
    
    // Remove drag styles from dragged element
    const draggedElement = document.querySelector('.dragging')
    if (draggedElement) {
      draggedElement.classList.remove('opacity-50')
    }
    
    this.draggedNode = null
    this.dragOverZone = null
  }

  /**
   * Destroy event listeners
   */
  destroy() {
    // Remove event listeners if needed
    this.cleanup()
  }
}

/**
 * React hook for drag and drop
 */
export function useDragDrop(options = {}) {
  const dragDropRef = useRef(null)
  
  const initializeDragDrop = useCallback((container) => {
    if (dragDropRef.current) {
      dragDropRef.current.destroy()
    }
    
    dragDropRef.current = new DragDropManager()
    dragDropRef.current.initialize(container, options)
  }, [])
  
  const cleanup = useCallback(() => {
    if (dragDropRef.current) {
      dragDropRef.current.destroy()
      dragDropRef.current = null
    }
  }, [])
  
  return {
    initializeDragDrop,
    cleanup,
    isDragging: () => dragDropRef.current?.draggedNode !== null
  }
}

/**
 * Visual feedback utilities
 */
export const DragDropVisuals = {
  /**
   * Add drag styles to element
   */
  makeDraggable(element) {
    element.draggable = true
    element.classList.add('cursor-move', 'hover:bg-slate-100', 'dark:hover:bg-slate-700')
    element.setAttribute('title', 'Drag to move')
  },

  /**
   * Add drop zone styles
   */
  makeDropZone(element, nodeId) {
    element.setAttribute('data-drop-zone', nodeId)
    element.classList.add('drop-zone', 'border-2', 'border-dashed', 'border-transparent', 'transition-all')
    element.setAttribute('title', 'Drop files here')
  },

  /**
   * Create drag ghost image
   */
  createDragImage(element) {
    const rect = element.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = rect.width
    canvas.height = rect.height
    
    // Clone element styles
    const computedStyle = window.getComputedStyle(element)
    ctx.fillStyle = computedStyle.backgroundColor
    ctx.fillRect(0, 0, rect.width, rect.height)
    
    // Add text
    ctx.fillStyle = computedStyle.color
    ctx.font = computedStyle.font
    ctx.fillText(element.textContent, 10, 20)
    
    return canvas.toDataURL()
  }
}

/**
 * Validation utilities
 */
export const DragDropValidation = {
  /**
   * Validate drop target
   */
  canDrop(draggedNode, targetNode) {
    // Cannot drop on self
    if (draggedNode.id === targetNode.id) return false
    
    // Cannot drop folder into its own descendants
    if (draggedNode.type === 'folder' && targetNode.type === 'folder') {
      const targetPath = targetNode.path
      const draggedPath = draggedNode.path
      if (targetPath.startsWith(draggedPath + '/')) return false
    }
    
    // Can drop notes anywhere
    if (draggedNode.type === 'note') return true
    
    // Can drop folders in other folders
    if (draggedNode.type === 'folder' && targetNode.type === 'folder') return true
    
    return false
  },

  /**
   * Get drop validation message
   */
  getValidationMessage(draggedNode, targetNode) {
    if (draggedNode.id === targetNode.id) {
      return 'Cannot drop item on itself'
    }
    
    if (draggedNode.type === 'folder' && targetNode.type === 'folder') {
      const targetPath = targetNode.path
      const draggedPath = draggedNode.path
      if (targetPath.startsWith(draggedPath + '/')) {
        return 'Cannot move folder into its own contents'
      }
    }
    
    return null
  }
}
