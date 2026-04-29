import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import {
  FilePlus,
  FolderPlus,
  ArrowDownUp,
  ListChevronsDownUp,
  Settings,
  Info,
  ChevronRight,
} from 'lucide-react'
import { FileExplorer } from './FolderNode'
import { ContextMenu } from './ContextMenu'
import { useFileExplorerStore } from './fileExplorerStore'
import { InteractionManager } from './interactions'
import { useVaultStore } from '../../store/vaultStore'
import { useNoteStore } from '../../store/noteStore'
import './Sidebar.css'

/**
 * Main Sidebar Component
 */
export function Sidebar({ className = '' }) {
  const sidebarRef = useRef(null)
  const interactionManagerRef = useRef(null)

  const {
    rootNodes,
    nodesById,
    childrenMap,
    isLoading,
    error,
    initialize,
    expandAll,
    collapseAll,
    createNode,
    showContextMenu,
    hideContextMenu,
    contextMenu,
    selectedNodeId
  } = useFileExplorerStore()

  // Initialize interactions on mount. Data sync happens below once noteStore is ready.
  useEffect(() => {
    if (sidebarRef.current) {
      interactionManagerRef.current = new InteractionManager(useFileExplorerStore.getState())
      interactionManagerRef.current.initialize()
    }

    // Cleanup on unmount
    return () => {
      if (interactionManagerRef.current) {
        interactionManagerRef.current.cleanup()
      }
    }
  }, [])

  // Re-initialize when vault changes
  const activeVault = useVaultStore((state) => state.activeVault)
  const vaultError = useVaultStore((state) => state.error)
  const noteTree = useNoteStore((state) => state.noteTree)
  const noteTreeLoading = useNoteStore((state) => state.isLoading)
  const noteTreeError = useNoteStore((state) => state.error)

  useEffect(() => {
    if (activeVault && !noteTreeLoading) {
      console.log('Sidebar init - activeVault:', activeVault, 'noteTree:', noteTree)
      initialize(noteTree, activeVault)
    }
  }, [activeVault, noteTree, noteTreeLoading, initialize])

  const handleNewNote = () => {
    createNode(selectedNodeId, 'note', 'Untitled Note')
  }

  const handleNewFolder = () => {
    createNode(selectedNodeId, 'folder', 'New Folder')
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    showContextMenu(null, e.clientX, e.clientY)
  }

  const visibleRootNodes = rootNodes.length === 1 && nodesById[rootNodes[0]]?.path === ''
    ? childrenMap[rootNodes[0]] ?? []
    : rootNodes

  if (isLoading) {
    return (
      <aside className=" w-60 bg-slate-100 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-700 z-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-500 dark:text-slate-400">Loading...</div>
        </div>
      </aside>
    )
  }

  if (error) {
    return (
      <aside className="flex flex-col w-60 bg-slate-100 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-700 z-10">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 dark:text-red-400">Error: {error}</div>
        </div>
      </aside>
    )
  }

  const loadError = vaultError || noteTreeError
  if (loadError) {
    return (
      <aside className="flex flex-col w-60 bg-slate-100 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-700 z-10">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-sm text-red-500 dark:text-red-400">{loadError}</div>
        </div>
      </aside>
    )
  }

  if (!activeVault) {
    return (
      <aside className="flex flex-col w-60 bg-slate-100 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-700 z-10">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">No vault selected</div>
        </div>
      </aside>
    )
  }

  return (
    <aside
      ref={sidebarRef}
      className={`flex flex-col w-60 bg-slate-100 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-700 z-10 ${className}`}
      tabIndex={0} // Make focusable for keyboard navigation
    >
      {/* Sidebar Header */}
      <header className="p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Explorer
          </span>
          <div className="flex items-center gap-1">
            <button
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="New note"
              onClick={handleNewNote}
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="New folder"
              onClick={handleNewFolder}
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Sort"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Collapse all"
              onClick={collapseAll}
            >
              <ListChevronsDownUp className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Expand all"
              onClick={expandAll}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tree */}
      <nav className="flex-1 overflow-y-auto px-2 py-1" onContextMenu={handleContextMenu}>
        <div className="space-y-0.5">
          {visibleRootNodes.map(nodeId => (
            <FileExplorer
              key={nodeId}
              rootId={nodeId}
            />
          ))}
        </div>
      </nav>

      {/* Workspace Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 p-2">
        <div className="flex items-center justify-between p-2 rounded-sm bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-slate-600 dark:bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white dark:text-slate-900 uppercase tracking-tighter">
              OB
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 leading-none font-bold">
                Workspace
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Obsidian
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
        </div>
      </footer>

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <ContextMenu
          nodeId={contextMenu.nodeId}
          position={contextMenu.position}
          onClose={hideContextMenu}
        />
      )}
    </aside>
  )
}
