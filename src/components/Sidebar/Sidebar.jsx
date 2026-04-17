import { useState } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'

function FolderNode({ folder, depth = 0, selectedPath, onSelect }) {
  const [isOpen, setIsOpen] = useState(true)
  const childFolders = Array.isArray(folder.folders) ? folder.folders : []

  return (
    <div>
      <div className="flex items-center gap-1">
        {childFolders.length > 0 ? (
          <button
            type="button"
            className="rounded px-1 text-xs text-slate-400 hover:bg-slate-800"
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-4 text-center text-xs text-slate-600">•</span>
        )}
        <button
          type="button"
          className={`rounded px-2 py-1 text-left text-xs ${
            selectedPath === folder.path ? 'bg-slate-700 text-slate-100' : 'text-slate-300 hover:bg-slate-800'
          }`}
          style={{ marginLeft: `${depth * 6}px` }}
          onClick={() => onSelect(folder.path)}
        >
          {folder.name}
        </button>
      </div>
      {isOpen &&
        childFolders.map((childFolder) => (
          <FolderNode
            key={childFolder.path || childFolder.name}
            folder={childFolder}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
    </div>
  )
}

/**
 * Sidebar wrapper for folder tree panel.
 */
export function Sidebar({ isCollapsed, onToggleCollapse, isLight }) {
  const activeVault = useVaultStore((state) => state.activeVault)
  const noteTree = useNoteStore((state) => state.noteTree)
  const selectedFolderPath = useNoteStore((state) => state.selectedFolderPath)
  const setSelectedFolderPath = useNoteStore((state) => state.setSelectedFolderPath)
  const createFolderInFolder = useNoteStore((state) => state.createFolderInFolder)
  const isLoading = useNoteStore((state) => state.isLoading)
  const error = useNoteStore((state) => state.error)

  const handleCreateFolder = async () => {
    if (!activeVault) return
    const folderName = window.prompt('New folder name:')
    if (!folderName) return
    await createFolderInFolder(activeVault, selectedFolderPath, folderName)
  }

  return (
    <aside className={`h-full overflow-hidden border-r ${isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-900/60'}`}>
      <div className={`flex items-center gap-2 border-b p-3 ${isLight ? 'border-slate-300' : 'border-slate-700'}`}>
        <h2 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Folders</h2>
        <button
          type="button"
          className={`ml-auto rounded-md border px-2 py-1 text-xs ${
            isLight
              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'border-slate-600 text-slate-200 hover:bg-slate-800'
          }`}
          onClick={onToggleCollapse}
        >
          {isCollapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      {!isCollapsed && (
        <div className={`p-3 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">{activeVault ? 'Active vault loaded' : 'Select a vault first'}</span>
            <button
              type="button"
              className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              onClick={handleCreateFolder}
              disabled={!activeVault}
            >
              + Folder
            </button>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 w-11/12 animate-pulse rounded bg-slate-800" />
              <div className="h-4 w-9/12 animate-pulse rounded bg-slate-800" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-slate-800" />
              <div className="h-4 w-7/12 animate-pulse rounded bg-slate-800" />
            </div>
          ) : null}
          {!isLoading && !activeVault ? (
            <p className="text-xs text-slate-500">Choose or create a vault to view folders.</p>
          ) : null}
          {!isLoading && activeVault && noteTree ? (
            <FolderNode
              folder={noteTree}
              selectedPath={selectedFolderPath}
              onSelect={setSelectedFolderPath}
            />
          ) : null}
          {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}
        </div>
      )}
    </aside>
  )
}
