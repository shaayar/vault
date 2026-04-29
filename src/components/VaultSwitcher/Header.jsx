import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { GraphViewModal } from '../GraphViewModal/GraphViewModal'
import { SearchModal } from '../Search/SearchModal'
import { ShortcutsModal } from '../Shortcuts/ShortcutsModal'
import { TemplatesModal } from '../Templates/TemplatesModal'
import { SquareSplitHorizontal, Share2, ScanEye, FolderTree, Moon, Sun, Menu, NotebookText, Search, Keyboard, FileText, FilePlusCorner } from 'lucide-react';

/**
 * Dashboard header with vault switching, navigation, and controls.
 */
export function Header({ theme, onToggleTheme, isLight, onToggleFocusMode }) {
  const navigate = useNavigate()
  const { vaults, activeVault, isLoading, setActiveVault, createVault } = useVaultStore()
  const { clearNotesForVaultSwitch, loadNoteTreeForVault } = useNoteStore()
  const editorMode = useNoteStore((state) => state.editorMode)
  const setEditorMode = useNoteStore((state) => state.setEditorMode)
  const noteIndex = useNoteStore((state) => state.noteIndex)
  const openNote = useNoteStore((state) => state.openNote)
  const createNote = useNoteStore((state) => state.createNote)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false)
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)
  const [showGraph, setShowGraph] = useState(false)

  const handleCreateVault = async () => {
    const vaultName = window.prompt('Enter a vault name:')
    if (!vaultName) {
      return
    }

    const trimmedName = vaultName.trim()
    await createVault(trimmedName)
    navigate(`/${trimmedName}`)
  }

  const handleCreateNote = async () => {
    if (!activeVault) {
      alert('Please select a vault first')
      return
    }
    const noteTitle = window.prompt('Enter note title:')
    if (!noteTitle) {
      return
    }
    await createNote(activeVault, `${noteTitle.trim()}.md`, '')
  }


  return (
    <>
      {/* New Header Design */}
      <header className={`flex items-center justify-between px-8 w-full h-16 ${isLight ? 'bg-linear-to-r from-slate-100 via-white to-slate-100 border-b border-slate-300/50' : 'bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50'} shadow-lg relative`}>

        <div className="flex items-center gap-8">
          {/* Logo/Brand */}
          <Link className="flex items-center gap-3" to="/">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <NotebookText className="text-white text-xl" />
            </div>
            <div>
              <h1 className={`text-2xl font-black hidden md:block tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Vault Note</h1>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1 font-sans tracking-tight">
            {/* Editor Mode Controls */}
            <div className="flex items-center bg-slate-800/50 rounded-lg px-2 py-1">
              <button
                className={`px-3 py-1 rounded-lg transition-all ${editorMode === 'edit'
                  ? 'bg-indigo-500 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                onClick={() => setEditorMode('edit')}
                title="Edit Mode (Ctrl+E)"
              >
                <span className="material-symbols-outlined text-[14px]">Edit</span>
              </button>
              <button
                className={`px-3 py-2 transition-all ${editorMode === 'split'
                  ? 'bg-indigo-500 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                onClick={() => setEditorMode('split')}
                title="Split Mode (Ctrl+Shift+S)"
              >
                <SquareSplitHorizontal className="w-4 h-4" />
              </button>
              <button
                className={`px-3 py-1 rounded-lg transition-all ${editorMode === 'preview'
                  ? 'bg-indigo-500 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                onClick={() => setEditorMode('preview')}
                title="Preview Mode (Ctrl+P)"
              >
                <span className="material-symbols-outlined text-[14px]">Preview</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-green-500/30 transition-all duration-200"
                onClick={() => setIsSearchModalOpen(true)}
                title="Open Search (Ctrl+Shift+F)"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                className="bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-indigo-500/30 transition-all duration-200"
                onClick={() => setShowGraph(true)}
                title="Open Graph View (Ctrl+G)"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Graph</span>
              </button>
              <button
                className="bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-purple-500/30 transition-all duration-200"
                onClick={onToggleFocusMode}
                title="Toggle Focus Mode (Ctrl+Shift+F)"
              >
                <ScanEye className="w-4 h-4" />
                <span className="hidden sm:inline">Focus</span>
              </button>
              <button
                className="bg-slate-500/20 text-slate-400 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-500/30 transition-all duration-200"
                onClick={() => setIsShortcutsModalOpen(true)}
                title="Keyboard Shortcuts (Ctrl+Shift+P)"
              >
                <Keyboard className="w-4 h-4" />
                <span className="hidden sm:inline">Shortcuts</span>
              </button>
              <button
                className="bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-amber-500/30 transition-all duration-200"
                onClick={() => setIsTemplatesModalOpen(true)}
                title="File Templates (Ctrl+Shift+T)"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Vault Selection */}
          <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isLight ? 'bg-slate-200/50' : 'bg-slate-800/30'}`}>
            <FolderTree className="w-4 h-4" />
            <select
              className={`bg-transparent font-medium focus:outline-none border-none ${isLight ? 'text-slate-900 focus:text-slate-900' : 'text-slate-200 focus:text-white'}`}
              value={activeVault}
              onChange={async (e) => {
                try {
                  const newVault = e.target.value
                  setActiveVault(newVault)
                  clearNotesForVaultSwitch()
                  if (newVault) {
                    await loadNoteTreeForVault(newVault)
                    navigate(`/${newVault}`)
                  }
                } catch (error) {
                  console.error('Failed to switch vault:', error)
                  // Show error toast if available
                  if (typeof showErrorToast === 'function') {
                    showErrorToast('Failed to load vault. Please try again.')
                  }
                }
              }}
              disabled={isLoading}
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
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              className={`p-2 hover:${isLight ? 'bg-slate-500/50' : 'bg-slate-800/50'} transition-colors rounded-lg text-slate-400`}
              onClick={onToggleTheme}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>


            <button
              className="bg-indigo-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2"
              onClick={handleCreateVault}
              disabled={isLoading}
              title="Create New Vault"
            >
              <FilePlusCorner className="w-4 h-4" />
              <span className="hidden md:inline">Vault</span>
            </button>

            {/* Mobile Menu */}
            <button
              className="lg:hidden p-2 hover:bg-slate-800/50 transition-colors rounded-lg text-slate-400"
              title="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onCreateFromTemplate={async (fileName, content) => {
          await createNote(activeVault, fileName, content)
        }}
      />

      {/* Graph View Modal */}
      <GraphViewModal
        isOpen={showGraph}
        onClose={() => setShowGraph(false)}
        noteIndex={noteIndex}
        openNote={openNote}
        activeVault={activeVault}
        isLight={isLight}
      />
    </>
  )
}
