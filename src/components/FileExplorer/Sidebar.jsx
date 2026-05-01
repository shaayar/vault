import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FilePlus,
  FolderPlus,
  ArrowDownUp,
  ListChevronsDownUp,
  Settings,
  Info,
  ChevronRight,
  FolderTree,
  Trash2,
  FilePlusCorner,
} from 'lucide-react'
import { FileExplorer } from './FileExplorer'
import { ContextMenu } from './ContextMenu'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import './Sidebar.css'

function getVaultEditorPath(vaultName) {
  return `/${encodeURIComponent(vaultName)}/`
}

/**
 * Main Sidebar Component
 */
export function Sidebar({ className = '', isMobile = false, isLight = false }) {
  const sidebarRef = useRef(null)
  const navigate = useNavigate()

  const {
    rootNodes,
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
  } = useNoteStore()

  // Re-initialize when vault changes
  const activeVault = useVaultStore((state) => state.activeVault)
  const vaultError = useVaultStore((state) => state.error)
  const noteTreeError = useNoteStore((state) => state.error)
  const noteTree = useNoteStore((state) => state.noteTree)

  // Vault store actions for mobile controls
  const vaults = useVaultStore((state) => state.vaults)
  const isVaultLoading = useVaultStore((state) => state.isLoading)
  const setActiveVault = useVaultStore((state) => state.setActiveVault)
  const createVault = useVaultStore((state) => state.createVault)
  const deleteVault = useVaultStore((state) => state.deleteVault)
  const renameVault = useVaultStore((state) => state.renameVault)
  const { clearNotesForVaultSwitch, loadNoteTreeForVault } = useNoteStore()

  // Mobile vault rename state
  const [isRenamingVault, setIsRenamingVault] = useState(false)
  const [vaultRenameInput, setVaultRenameInput] = useState('')

  useEffect(() => {
    if (activeVault) {
      initialize()
    }
  }, [activeVault, noteTree, initialize])

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

  // Mobile vault handlers
  const handleCreateVault = async () => {
    const vaultName = window.prompt('Enter a vault name:')
    if (!vaultName) return

    const trimmedName = vaultName.trim()
    if (!trimmedName) return

    const createdVault = await createVault(trimmedName)
    navigate(getVaultEditorPath(createdVault))
  }

  const handleDeleteVault = async () => {
    if (!activeVault) {
      alert('No vault selected')
      return
    }
    if (!window.confirm(`Are you sure you want to delete "${activeVault}"? This will permanently delete all notes in this vault.`)) {
      return
    }
    try {
      await deleteVault(activeVault)
      navigate('/')
    } catch (error) {
      console.error('Failed to delete vault:', error)
    }
  }

  const handleVaultDoubleClick = () => {
    if (!activeVault || isVaultLoading) return
    setVaultRenameInput(activeVault)
    setIsRenamingVault(true)
  }

  const handleVaultRenameSubmit = async () => {
    if (!vaultRenameInput.trim() || vaultRenameInput.trim() === activeVault) {
      setIsRenamingVault(false)
      return
    }
    try {
      await renameVault(activeVault, vaultRenameInput.trim())
      navigate(getVaultEditorPath(vaultRenameInput.trim()))
    } catch (error) {
      console.error('Failed to rename vault:', error)
    } finally {
      setIsRenamingVault(false)
    }
  }

  const handleVaultRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleVaultRenameSubmit()
    } else if (e.key === 'Escape') {
      setIsRenamingVault(false)
    }
  }

  const visibleRootNodes = rootNodes

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
      {/* Mobile Vault Controls - Only shown on mobile */}
      {isMobile && (
        <div className={`p-3 border-b border-slate-200 dark:border-slate-700 ${isLight ? 'bg-slate-200/50' : 'bg-slate-800/30'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FolderTree className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              {isRenamingVault ? (
                <input
                  type="text"
                  value={vaultRenameInput}
                  onChange={(e) => setVaultRenameInput(e.target.value)}
                  onBlur={handleVaultRenameSubmit}
                  onKeyDown={handleVaultRenameKeyDown}
                  className={`bg-transparent font-medium focus:outline-none border-b ${isLight ? 'border-indigo-500 text-slate-900' : 'border-indigo-400 text-slate-200'} px-1 w-full text-sm`}
                  autoFocus
                  disabled={isVaultLoading}
                />
              ) : (
                <select
                  className={`bg-transparent font-medium focus:outline-none border-none text-sm w-full ${isLight ? 'text-slate-900' : 'text-slate-200'}`}
                  value={activeVault}
                  onChange={async (e) => {
                    try {
                      const newVault = e.target.value
                      setActiveVault(newVault)
                      clearNotesForVaultSwitch()
                      if (newVault) {
                        await loadNoteTreeForVault(newVault)
                        navigate(getVaultEditorPath(newVault))
                      }
                    } catch (error) {
                      console.error('Failed to switch vault:', error)
                    }
                  }}
                  disabled={isVaultLoading}
                >
                  {vaults.length === 0 ? (
                    <>
                      <option value="">Select a vault...</option>
                      <option value="demo-vault">Demo: Test Vault</option>
                    </>
                  ) : (
                    vaults.map((vault) => (
                      <option key={vault} value={vault}>
                        {vault || 'Default Vault'}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {activeVault && !isRenamingVault && (
                <button
                  className={`p-1.5 hover:${isLight ? 'bg-red-100' : 'bg-red-900/30'} transition-colors rounded text-red-500 hover:text-red-600`}
                  onClick={handleDeleteVault}
                  disabled={isVaultLoading}
                  title="Delete Vault"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                className="bg-indigo-500 text-white px-2 py-1.5 rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-1"
                onClick={handleCreateVault}
                disabled={isVaultLoading}
                title="Create New Vault"
              >
                <FilePlusCorner className="w-3.5 h-3.5" />
                <span className="text-xs">Vault</span>
              </button>
            </div>
          </div>
          {activeVault && !isRenamingVault && (
            <div className="mt-2 flex items-center justify-between">
              <span
                onDoubleClick={handleVaultDoubleClick}
                className={`text-xs px-2 py-0.5 rounded cursor-pointer ${isLight ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50'}`}
                title="Double-click to rename vault"
              >
                {activeVault}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Double-click to rename</span>
            </div>
          )}
        </div>
      )}

      {/* Sidebar Header */}
      <header className="p-3 flex flex-col gap-3 sidebar-header-animate">
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
      <nav className="flex-1 overflow-y-auto px-2 py-1 sidebar-animate-enter" onContextMenu={handleContextMenu}>
        <div className="space-y-0.5">
          {visibleRootNodes.map((nodeId, index) => (
            <FileExplorer
              key={nodeId}
              rootId={nodeId}
              animationIndex={index}
            />
          ))}
        </div>
      </nav>

      {/* Workspace Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 p-2 sidebar-footer-animate">
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
