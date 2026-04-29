/**
 * Simplified drag and drop utilities for file organization
 */

import { useRef, useCallback } from "react"

/**
 * Check if draggedNode is a descendant of targetNode
 * (i.e., draggedNode is inside targetNode's folder tree)
 */
export function isDescendant(draggedNode, targetNode) {
  if (targetNode.type !== 'folder') return false
  if (draggedNode.type !== 'folder') return false

  const targetPath = targetNode.path
  const draggedPath = draggedNode.path

  // Compare path segments to avoid "test2/sub" matching "test"
  const targetSegments = targetPath.split('/')
  const draggedSegments = draggedPath.split('/')

  // dragged must be deeper than target
  if (draggedSegments.length <= targetSegments.length) return false

  // Check if all target segments match the start of dragged segments
  for (let i = 0; i < targetSegments.length; i++) {
    if (targetSegments[i] !== draggedSegments[i]) return false
  }

  return true
}

/**
 * React hook for drag and drop
 */
export function useDragDrop(options = {}) {
  const dragDropRef = useRef({
    draggedNode: null,
    dragOverZone: null
  })

  const handleDragStart = useCallback((event, node) => {
    dragDropRef.current.draggedNode = node
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify(node))
    event.target.classList.add('opacity-50')
    document.body.classList.add('dragging')
  }, [])

  const handleDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    const dropZone = event.target.closest('[data-drop-zone]')
    if (dropZone) {
      // Clear previous highlight
      if (dragDropRef.current.dragOverZone) {
        dragDropRef.current.dragOverZone.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'border-blue-500')
      }

      // Highlight current drop zone
      dropZone.classList.add('bg-blue-100', 'dark:bg-blue-900', 'border-blue-500')
      dragDropRef.current.dragOverZone = dropZone
    }
  }, [])

  const handleDragLeave = useCallback((event) => {
    const dropZone = event.target.closest('[data-drop-zone]')
    if (!dropZone || !dragDropRef.current.dragOverZone) return

    if (dragDropRef.current.dragOverZone === dropZone) {
      dropZone.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'border-blue-500')
      dragDropRef.current.dragOverZone = null
    }
  }, [])

  const handleDrop = useCallback(async (event) => {
    event.preventDefault()
    event.stopPropagation()

    // Clear highlights
    if (dragDropRef.current.dragOverZone) {
      dragDropRef.current.dragOverZone.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'border-blue-500')
      dragDropRef.current.dragOverZone = null
    }
    document.body.classList.remove('dragging')

    const dropZone = event.target.closest('[data-drop-zone]')
    if (!dropZone || !dragDropRef.current.draggedNode) return

    const targetNodeId = dropZone.dataset.dropZone
    const targetNode = options.getNode?.(targetNodeId)

    if (!targetNode) return

    // Prevent dropping on self
    if (targetNodeId === dragDropRef.current.draggedNode.id) return

    // Prevent dropping folder into its own children
    if (isDescendant(dragDropRef.current.draggedNode, targetNode)) {
      options.onError?.('Cannot move folder into its own contents')
      return
    }

    try {
      await options.onMove?.(dragDropRef.current.draggedNode, targetNode)
      options.onSuccess?.(`Moved ${dragDropRef.current.draggedNode.name} to ${targetNode.name}`)
    } catch (error) {
      options.onError?.(`Failed to move ${dragDropRef.current.draggedNode.name}: ${error.message}`)
    } finally {
      // Cleanup
      const draggedElement = document.querySelector('.opacity-50')
      if (draggedElement) {
        draggedElement.classList.remove('opacity-50')
      }
      dragDropRef.current.draggedNode = null
    }
  }, [options])

  return {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging: () => dragDropRef.current.draggedNode !== null
  }
}
