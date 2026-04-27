import React, { useEffect, useRef } from 'react'
import { ChevronRight, Folder, FileText } from 'lucide-react'
import { useFileExplorerStore } from './fileExplorerStore'
import { useDragDrop } from '../../utils/dragDrop'
import { RenameInput } from './RenameInput'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { formatFileSize, formatRelativeDate } from '../../utils/fileMetadata'

export function FileExplorer({ rootId }) {
  const containerRef = useRef(null)
  const { initializeDragDrop, cleanup } = useDragDrop()

  useEffect(() => {
    if (!containerRef.current) return
    initializeDragDrop(containerRef.current)
    return cleanup
  }, [])

  return (
    <div ref={containerRef}>
      <TreeNode nodeId={rootId} depth={0} />
    </div>
  )
}

/* =========================
   TREE NODE (RECURSIVE)
========================= */
function TreeNode({ nodeId, depth }) {
  const {
    getNode,
    getChildren,
    isFolder,
    isNote
  } = useFileExplorerStore()

  const node = getNode(nodeId)
  if (!node) return null

  if (isFolder(nodeId)) {
    return (
      <FolderRow node={node} depth={depth}>
        {getChildren(nodeId).map(childId => (
          <TreeNode
            key={childId}
            nodeId={childId}
            depth={depth + 1}
          />
        ))}
      </FolderRow>
    )
  }

  if (isNote(nodeId)) {
    return <FileRow node={node} depth={depth} />
  }

  return null
}

/* =========================
   FOLDER ROW
========================= */
function FolderRow({ node, depth, children }) {
  const ref = useRef(null)

  const {
    isExpanded,
    toggleExpand,
    isEmpty,
    showContextMenu,
    renameNode,
    stopRenaming
  } = useFileExplorerStore()

  const isRenaming = useFileExplorerStore(
    s => s.renamingNodeId === node.id
  )

  const expanded = isExpanded(node.id)

  return (
    <div>
      {/* Header */}
      <div
        ref={ref}
        data-node-id={node.id}
        data-drop-zone={node.id}
        style={{ marginLeft: depth * 16 }}
        onClick={() => !isEmpty(node.id) && toggleExpand(node.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          showContextMenu(node.id, e.clientX, e.clientY)
        }}
        className={`
          flex items-center py-1 px-2 rounded-sm cursor-pointer
          ${expanded
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
              <div className="mt-2 px-2 py-1 text-xs text-slate-400 border-t">
                <div className="flex justify-between">
                  <span>{children.length} items</span>
                  <span>{formatFileSize(0)}</span>
                </div>
                <div>
                  Last updated:{' '}
                  {formatRelativeDate(new Date().toISOString())}
                </div>
              </div>
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
function FileRow({ node, depth }) {
  const {
    isSelected,
    selectNode,
    showContextMenu,
    renameNode,
    stopRenaming
  } = useFileExplorerStore()

  const activeVault = useVaultStore(s => s.activeVault)
  const openNote = useNoteStore(s => s.openNote)

  const isRenaming = useFileExplorerStore(
    s => s.renamingNodeId === node.id
  )

  const active = isSelected(node.id)

  return (
    <div
      data-node-id={node.id}
      style={{ marginLeft: depth * 16 }}
      onClick={() => {
        selectNode(node.id)
        if (activeVault && node.path) {
          // Ensure path has .md extension for API compatibility
          const notePath = node.path.endsWith('.md') ? node.path : `${node.path}.md`
          openNote(activeVault, notePath)
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
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