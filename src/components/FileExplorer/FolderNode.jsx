import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Folder, FileText } from 'lucide-react'
import { useNoteStore } from '../../store/noteStore'
import { useDragDrop } from '../../utils/dragDrop'
import { RenameInput } from './RenameInput'
import { useVaultStore } from '../../store/vaultStore'
import { encodeNotePath } from '../../utils/notePath'

export function FileExplorer({ rootId }) {
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
        await moveNoteByPath(activeVault, draggedNode.path, targetPath)
      } else if (draggedNode.type === 'folder') {
        await moveFolderByPath(activeVault, draggedNode.path, targetPath)
      }
      // Reinitialize tree after move
      const { initialize } = useNoteStore.getState()
      await initialize(activeVault)
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
      <TreeNode nodeId={rootId} depth={0} handleDragStart={handleDragStart} />
    </div>
  )
}

/* =========================
   TREE NODE (RECURSIVE)
========================= */
function TreeNode({ nodeId, depth, handleDragStart }) {
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
      <FolderRow node={node} depth={depth} handleDragStart={handleDragStart}>
        {getChildren(nodeId).map(childId => (
          <TreeNode
            key={childId}
            nodeId={childId}
            depth={depth + 1}
            handleDragStart={handleDragStart}
          />
        ))}
      </FolderRow>
    )
  }

  if (isNote(nodeId)) {
    return <FileRow node={node} depth={depth} handleDragStart={handleDragStart} />
  }

  return null
}

/* =========================
   FOLDER ROW
========================= */
function FolderRow({ node, depth, children, handleDragStart }) {
  const ref = useRef(null)

  const {
    isExpanded,
    toggleExpand,
    isEmpty,
    showContextMenu,
    renameNode,
    stopRenaming,
    selectNode,
    isSelected
  } = useNoteStore()

  const isRenaming = useNoteStore(
    s => s.renamingNodeId === node.id
  )

  const expanded = isExpanded(node.id)
  const selected = isSelected(node.id)

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50')
  }

  const onDragStart = (e) => {
    handleDragStart(e, node)
  }

  return (
    <div>
      {/* Header */}
      <div
        ref={ref}
        data-node-id={node.id}
        data-drop-zone={node.id}
        draggable
        onDragStart={onDragStart}
        onDragEnd={handleDragEnd}
        style={{ marginLeft: depth * 16 }}
        onClick={(e) => {
          e.stopPropagation()
          selectNode(node.id)
          if (!isEmpty(node.id)) {
            toggleExpand(node.id)
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          showContextMenu(node.id, e.clientX, e.clientY)
        }}
        className={`
          flex items-center py-1 px-2 rounded-sm cursor-pointer
          ${selected
            ? 'bg-blue-100 text-blue-600'
            : expanded
              ? 'bg-slate-200 dark:bg-slate-700'
              : 'hover:bg-slate-200 dark:hover:bg-slate-700'}
        `}
      >
        <ChevronRight
          className={`w-3.5 h-3.5 mr-2 transition-transform ${expanded ? 'rotate-90' : ''
            }`}
        />

        <Folder className="w-4 h-4 mr-2 text-amber-500" />

        {isRenaming ? (
          <RenameInput
            initialValue={node.name}
            onSave={(name) => {
              renameNode(node.id, name)
              stopRenaming()
            }}
            onCancel={stopRenaming}
          />
        ) : (
          <span className="text-sm font-medium">{node.name}</span>
        )}
      </div>

      {/* Children */}
      {expanded && (
        <div className="ml-2">
          {children.length === 0 ? (
            <div className="text-xs text-slate-400 px-2 py-1 italic">
              Empty folder
            </div>
          ) : (
            <>
              {children}

              {/* Stats */}
              {/* <div className="mt-2 px-2 py-1 text-xs text-slate-400 border-t">
                <div className="flex justify-between">
                  <span>{children.length} items</span>
                  <span>{formatFileSize(0)}</span>
                </div>
                <div>
                  Last updated:{' '}
                  {formatRelativeDate(new Date().toISOString())}
                </div>
              </div> */}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* =========================
   FILE ROW
========================= */
function FileRow({ node, depth, handleDragStart }) {
  const navigate = useNavigate()
  const {
    isSelected,
    selectNode,
    showContextMenu,
    renameNode,
    stopRenaming
  } = useNoteStore()

  const activeVault = useVaultStore(s => s.activeVault)
  const openNote = useNoteStore(s => s.openNote)

  const isRenaming = useNoteStore(
    s => s.renamingNodeId === node.id
  )

  const active = isSelected(node.id)

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50')
  }

  const onDragStart = (e) => {
    handleDragStart(e, node)
  }

  return (
    <div
      data-node-id={node.id}
      data-drop-zone={node.id}
      draggable
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      style={{ marginLeft: depth * 16 }}
      onClick={() => {
        selectNode(node.id)
        if (activeVault && node.path) {
          // Ensure path has .md extension for API compatibility
          const notePath = node.path.endsWith('.md') ? node.path : `${node.path}.md`
          openNote(activeVault, notePath)
          const encodedPath = encodeNotePath(notePath)
          navigate(`/${activeVault}/${encodedPath}`)
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        showContextMenu(node.id, e.clientX, e.clientY)
      }}
      className={`
        flex items-center py-1 px-2 mt-0.5 cursor-pointer
        ${active
          ? 'bg-blue-100 text-blue-600'
          : 'hover:bg-slate-200 dark:hover:bg-slate-700'}
      `}
    >
      <FileText className="w-4 h-4 mr-2 opacity-70" />

      {isRenaming ? (
        <RenameInput
          initialValue={node.name}
          onSave={(name) => {
            renameNode(node.id, name)
            stopRenaming()
          }}
          onCancel={stopRenaming}
        />
      ) : (
        <span className="text-sm">{node.name}</span>
      )}
    </div>
  )
}
