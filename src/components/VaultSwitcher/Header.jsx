import { useState } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { GraphViewModal } from '../GraphViewModal/GraphViewModal'
import { SquareSplitHorizontal, Share2, ScanEye, FolderTree, Moon, Sun, FilePlusCorner, Menu, NotebookText } from 'lucide-react';

/**
 * Dashboard header with vault switching, navigation, and controls.
 */
export function Header({ theme, onToggleTheme, isLight, onToggleFocusMode }) {
  const { vaults, activeVault, isLoading, setActiveVault, createVault } = useVaultStore()
  const { clearNotesForVaultSwitch, loadNoteTreeForVault, createNoteInFolder, selectedFolderPath } = useNoteStore()
  const editorMode = useNoteStore((state) => state.editorMode)
  const setEditorMode = useNoteStore((state) => state.setEditorMode)
  const noteIndex = useNoteStore((state) => state.noteIndex)
  const openNote = useNoteStore((state) => state.openNote)
  const [showGraph, setShowGraph] = useState(false)

  const handleCreateVault = async () => {
    const vaultName = window.prompt('Enter a vault name:')
    if (!vaultName) {
      return
    }

    await createVault(vaultName.trim())
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
    await createNoteInFolder(activeVault, selectedFolderPath, noteTitle.trim())
  }

  return (
    <>
      {/* Original Header - Commented Out */}
      {/* <header className="flex items-center justify-between px-6 w-full sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl h-14 border-b border-white/[0.03] relative">
        <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded z-50 font-mono">VaultSwitcher</div>
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold tracking-tighter text-slate-100">VaultNote</span>
          <nav className="hidden md:flex items-center gap-6 font-sans text-sm tracking-tight font-medium"> */}

      {/* New Header Design */}
      <header className={`flex items-center justify-between px-8 w-full h-16 ${isLight ? 'bg-linear-to-r from-slate-100 via-white to-slate-100 border-b border-slate-300/50' : 'bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50'} shadow-lg relative`}>


        <div className="flex items-center gap-8">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <NotebookText className="text-white text-xl" />
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>VaultNote</h1>
            </div>
          </div>

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
                const newVault = e.target.value
                setActiveVault(newVault)
                clearNotesForVaultSwitch()
                if (newVault) {
                  await loadNoteTreeForVault(newVault)
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
              onClick={handleCreateNote}
              disabled={!activeVault || isLoading}
              title="Create New Note"
            >
              <span className="material-symbols-outlined text-[14px]"> <NotebookText className="w-4 h-4" /> </span>
              <span className="hidden sm:inline">Note</span>
            </button>
            <button
              className="bg-indigo-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2"
              onClick={handleCreateVault}
              disabled={isLoading}
              title="Create New Vault"
            >
              <span className="material-symbols-outlined text-[14px]"> <FilePlusCorner className="w-4 h-4" /> </span>
              <span className="hidden sm:inline">Vault</span>
            </button>

            {/* Mobile Menu */}
            <button
              className="lg:hidden p-2 hover:bg-slate-800/50 transition-colors rounded-lg text-slate-400"
              title="Menu"
            >
              <span className="material-symbols-outlined text-[16px]"> <Menu className="w-4 h-4" /> </span>
            </button>
          </div>
        </div>
      </header>

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
