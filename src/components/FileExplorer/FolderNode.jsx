import React from 'react'
import { ChevronRight, Folder, FolderOpen, Activity } from 'lucide-react'
import { useFileExplorerStore, useFileExplorerHelpers } from './fileExplorerStore'
import { RenameInput } from './RenameInput'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'

/**
 * Folder Node Component - Recursive with Dynamic Data
 */
export function FolderNode({
  nodeId,
  depth = 0
}) {
  const {
    getNode,
    getChildren,
    isFolder,
    isNote,
    isEmpty,
    isExpanded,
    toggleExpand,
    selectNode,
    showContextMenu,
    renameNode,
    stopRenaming
  } = useFileExplorerHelpers()
  const isRenaming = useFileExplorerStore((state) => state.renamingNodeId === nodeId)

  const node = getNode(nodeId)
  if (!node) return null

  const children = getChildren(nodeId)
  const expanded = isExpanded(nodeId)

  const handleToggle = () => {
    if (isFolder(nodeId) && !isEmpty(nodeId)) {
      toggleExpand(nodeId)
    }
    selectNode(nodeId)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    showContextMenu(nodeId, e.clientX, e.clientY)
  }

  const handleRename = (newName) => {
    renameNode(nodeId, newName)
    stopRenaming()
  }

  const handleRenameCancel = () => {
    stopRenaming()
  }

  return (
    <div className="folder-container">
      {/* Folder Header */}
      <div
        data-node-id={nodeId}
        className={`
          flex items-center py-1 px-2 rounded-sm cursor-pointer transition-colors
          ${expanded
            ? 'text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
          }
        `}
        onClick={handleToggle}
        onContextMenu={handleContextMenu}
        style={{ marginLeft: `${depth * 16}px` }}
        tabIndex={-1} // Not directly focusable, but selectable via keyboard
      >
        <ChevronRight
          className={`
            w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500 transition-transform
            ${expanded ? 'rotate-90' : ''}
          `}
        />
        <Folder className={`w-4 h-4 mr-2 ${expanded ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500'}`} />
        {isRenaming ? (
          <RenameInput
            initialValue={node.name}
            onSave={handleRename}
            onCancel={handleRenameCancel}
            className="text-sm font-medium"
          />
        ) : (
          <span className="text-sm font-medium">
            {node.name}
          </span>
        )}
      </div>

      {/* Folder Content */}
      <div className={`
        folder-content ml-4 pl-1 relative overflow-hidden transition-all duration-200
        ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
      `}>
        {/* Visual guide line */}
        <div className="file-guide absolute left-2 top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-600 opacity-40" />

        <div className="pt-1">
          {isEmpty(nodeId) || children.length === 0 ? (
            <div className="py-1 px-2 text-sm text-slate-400 dark:text-slate-500 italic">
              Empty folder
            </div>
          ) : (
            children.map(childId => {
              if (isFolder(childId)) {
                return (
                  <FolderNode
                    key={childId}
                    nodeId={childId}
                    depth={depth + 1}
                  />
                )
              } else if (isNote(childId)) {
                return (
                  <FileNode
                    key={childId}
                    nodeId={childId}
                    depth={depth + 1}
                  />
                )
              }
              return null
            })
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * File Node Component
 */
function FileNode({ nodeId, depth = 0 }) {
  const {
    getNode,
    isSelected,
    selectNode,
    showContextMenu,
    renameNode,
    stopRenaming
  } = useFileExplorerHelpers()
  const activeVault = useVaultStore((state) => state.activeVault)
  const openNote = useNoteStore((state) => state.openNote)
  const isRenaming = useFileExplorerStore((state) => state.renamingNodeId === nodeId)

  const node = getNode(nodeId)
  if (!node) return null

  const active = isSelected(nodeId)

  const handleClick = () => {
    selectNode(nodeId)
    if (activeVault && node.path) {
      openNote(activeVault, node.path)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    showContextMenu(nodeId, e.clientX, e.clientY)
  }

  const handleRename = (newName) => {
    renameNode(nodeId, newName)
    stopRenaming()
  }

  const handleRenameCancel = () => {
    stopRenaming()
  }

  return (
    <div
      data-node-id={nodeId}
      className={`
        flex items-center py-1 px-2 rounded-sm cursor-pointer mt-0.5 transition-colors
        ${active
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-600 dark:border-blue-400'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
        }
      `}
      style={{ marginLeft: `${depth * 16}px` }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      tabIndex={-1} // Not directly focusable, but selectable via keyboard
    >
      <Activity className="w-3.5 h-3.5 mr-2 opacity-60" />
      {isRenaming ? (
        <RenameInput
          initialValue={node.name}
          onSave={handleRename}
          onCancel={handleRenameCancel}
          className="text-sm"
        />
      ) : (
        <span className="text-sm">{node.name}</span>
      )}
    </div>
  )
}
