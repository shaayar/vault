import { useNoteStore } from '../../store/noteStore'
import { FolderRow } from './FolderRow'
import { FileNode } from './FileNode'

/**
 * Tree Node Component - Recursive wrapper that decides Folder vs File
 */
export function TreeNode({ nodeId, depth, handleDragStart, animationIndex = 0 }) {
  const {
    getNode,
    getChildren,
    isFolder,
    isNote
  } = useNoteStore()

  const node = getNode(nodeId)
  if (!node) return null

  if (isFolder(nodeId)) {
    return (
      <FolderRow node={node} depth={depth} handleDragStart={handleDragStart} animationIndex={animationIndex}>
        {getChildren(nodeId).map((childId, childIndex) => (
          <TreeNode
            key={childId}
            nodeId={childId}
            depth={depth + 1}
            handleDragStart={handleDragStart}
            animationIndex={animationIndex + childIndex + 1}
          />
        ))}
      </FolderRow>
    )
  }

  if (isNote(nodeId)) {
    return <FileNode node={node} depth={depth} handleDragStart={handleDragStart} animationIndex={animationIndex} />
  }

  return null
}
