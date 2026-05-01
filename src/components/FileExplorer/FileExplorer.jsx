import { useEffect, useRef } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { useDragDrop } from '../../utils/dragDrop'
import { TreeNode } from './TreeNode'

/**
 * File Explorer Component - Container with drag-drop setup
 */
export function FileExplorer({ rootId, animationIndex = 0 }) {
  const containerRef = useRef(null)
  const { getNode } = useNoteStore()
  const { moveNoteByPath, moveFolderByPath } = useNoteStore()
  const { activeVault } = useVaultStore()

  const { handleDragStart, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    getNode,
    onMove: async (draggedNode, targetNode) => {
      if (!activeVault) return
      const itemName = draggedNode.path.split('/').pop()
      const targetPath = targetNode.path ? `${targetNode.path}/${itemName}` : itemName
      if (draggedNode.type === 'note') {
        await moveNoteByPath(activeVault.id, draggedNode.path, targetPath)
      } else if (draggedNode.type === 'folder') {
        await moveFolderByPath(activeVault.id, draggedNode.path, targetPath)
      }
      // Reinitialize tree after move
      const { initialize } = useNoteStore.getState()
      await initialize(activeVault.id)
    },
    onError: (message) => console.error('Drag error:', message),
    onSuccess: (message) => console.log('Drag success:', message)
  })

  // Setup drag and drop on container
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    container.addEventListener('dragover', handleDragOver)
    container.addEventListener('dragleave', handleDragLeave)
    container.addEventListener('drop', handleDrop)
    return () => {
      container.removeEventListener('dragover', handleDragOver)
      container.removeEventListener('dragleave', handleDragLeave)
      container.removeEventListener('drop', handleDrop)
    }
  }, [handleDragOver, handleDragLeave, handleDrop])

  return (
    <div ref={containerRef}>
      <TreeNode nodeId={rootId} depth={0} handleDragStart={handleDragStart} animationIndex={animationIndex} />
    </div>
  )
}
