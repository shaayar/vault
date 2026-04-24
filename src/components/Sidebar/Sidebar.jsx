import { useEffect, useState } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { NoteList } from '../NoteList/NoteList'
import { Files, ChevronsLeft, Sparkles, FilePlus2, FolderPlus, ChevronRight, ChevronDown, Folder } from 'lucide-react'

function FolderNode({ folder, depth = 0, selectedPath, onSelect, onMenu, isLight }) {
  const [isOpen, setIsOpen] = useState(true)
  const childFolders = Array.isArray(folder.folders) ? folder.folders : []

  return (
    <div className="select-none">
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${selectedPath === folder.path
          ? isLight
            ? 'bg-slate-200 text-slate-900'
            : 'bg-slate-800 text-slate-100'
          : isLight
            ? 'text-slate-700 hover:bg-slate-100'
            : 'text-slate-300 hover:bg-slate-800'
          }`}
        onContextMenu={(event) => {
          event.preventDefault()
          onMenu?.({ type: 'folder', folder, depth, parentPath: folder.path.split('/').slice(0, -1).join('/') }, event)
        }}
      >
        {childFolders.length > 0 ? (
          <button
            type="button"
            className={`w-4 h-4 flex items-center justify-center ${isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-500 hover:text-slate-200'}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <Folder className="h-3.5 w-3.5 text-amber-400/90" />
        <button
          type="button"
          className={`text-sm text-left ${selectedPath === folder.path ? 'font-medium text-indigo-400' : ''}`}
          onClick={() => onSelect(folder.path)}
        >
          {folder.name}
        </button>
      </div>
      {isOpen && childFolders.length > 0 && (
        <div className="ml-4 border-l border-slate-700/60 pl-3">
          {childFolders.map((childFolder) => (
            <FolderNode
              key={childFolder.path}
              folder={childFolder}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onMenu={onMenu}
              isLight={isLight}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Dashboard SideNavBar with vault info and folder tree.
 */
export function Sidebar({ isCollapsed, onToggleCollapse, isLight, sidebarWidth }) {
  const activeVault = useVaultStore((state) => state.activeVault)
  const selectedFolderPath = useNoteStore((state) => state.selectedFolderPath)
  const noteTree = useNoteStore((state) => state.noteTree)
  const setSelectedFolderPath = useNoteStore((state) => state.setSelectedFolderPath)
  const createFolderInFolder = useNoteStore((state) => state.createFolderInFolder)
  const createNoteInFolder = useNoteStore((state) => state.createNoteInFolder)
  const renameFolderByPath = useNoteStore((state) => state.renameFolderByPath)
  const renameNoteByPath = useNoteStore((state) => state.renameNoteByPath)
  const deleteFolderByPath = useNoteStore((state) => state.deleteFolderByPath)
  const deleteNoteByPath = useNoteStore((state) => state.deleteNoteByPath)
  const openNote = useNoteStore((state) => state.openNote)
  const isLoading = useNoteStore((state) => state.isLoading)
  const error = useNoteStore((state) => state.error)
  const [contextMenu, setContextMenu] = useState(null)

  useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    window.addEventListener('mousedown', closeMenu)
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('mousedown', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [])

  const rootNode = noteTree && typeof noteTree === 'object'
    ? noteTree
    : { name: 'Root', path: '', folders: [], notes: [] }

  const handleCreateFolder = async () => {
    if (!activeVault) return
    const folderName = window.prompt('New folder name:')
    if (!folderName) return
    await createFolderInFolder(activeVault, selectedFolderPath, folderName)
  }

  const handleCreateNote = async (folderPath = selectedFolderPath) => {
    if (!activeVault) return
    const noteTitle = window.prompt('New note title:')
    if (!noteTitle) return
    await createNoteInFolder(activeVault, folderPath, noteTitle)
  }

  const handleRenameFolder = async (folderPath, currentName) => {
    if (!activeVault) return
    const nextName = window.prompt('Rename folder:', currentName)
    if (!nextName || nextName.trim() === currentName) return
    await renameFolderByPath(activeVault, folderPath, nextName)
  }

  const handleRenameNote = async (notePath, currentName) => {
    if (!activeVault) return
    const nextName = window.prompt('Rename note:', currentName)
    if (!nextName || nextName.trim() === currentName) return
    await renameNoteByPath(activeVault, notePath, nextName)
  }

  const handleDeleteFolder = async (folderPath, folderName) => {
    if (!activeVault) return
    if (!window.confirm(`Delete folder "${folderName}"?`)) return
    await deleteFolderByPath(activeVault, folderPath)
  }

  const handleDeleteNote = async (notePath, noteName) => {
    if (!activeVault) return
    if (!window.confirm(`Delete note "${noteName}"?`)) return
    await deleteNoteByPath(activeVault, notePath)
  }

  const showContextMenu = (menu, event) => {
    event.preventDefault()
    setContextMenu({
      ...menu,
      x: event.clientX,
      y: event.clientY,
    })
  }

  return (
    <aside className={`${isCollapsed ? 'flex-col items-center w-12 py-6' : 'flex-col h-full'} ${isLight ? 'bg-white border-r border-slate-200' : 'bg-slate-900'} relative z-40 shrink-0`} style={isCollapsed ? {} : { width: `${sidebarWidth}px` }}>

      {/* Collapsed State - Vertical Strip */}
      {isCollapsed ? (
        <>
          <div className="[writing-mode:vertical-lr] rotate-180 ps-5 py-3 flex items-center gap-2 font-medium uppercase tracking-widest">
            <span>Folders</span>
            <button
              className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
              onClick={onToggleCollapse}
            >
              <ChevronsLeft className='h-4 w-4' />
            </button>
          </div>
          <div className="mt-auto flex flex-col items-center gap-6 mb-8">
            <span className={`material-symbols-outlined text-lg ${isLight ? 'text-slate-600' : 'text-slate-500'}`}><Files className='h-9' /> </span>
            <span className={`material-symbols-outlined text-lg ${isLight ? 'text-slate-600' : 'text-slate-500'}`}> <Sparkles className='h-9' /> </span>
          </div>
          
        </>
      ) : (
        <>
          {/* Expanded State - Full Sidebar */}
          {/* Vault Info Header */}
          <div className={`px-4 pt-4 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Folder className="h-4 w-4" />
                </div>
                <div>
                  <h2 className={`font-bold leading-none ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {activeVault || 'Personal Vault'}
                  </h2>
                  <span className={`font-mono uppercase tracking-widest text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                    {activeVault ? 'Vault open' : 'No vault selected'}
                  </span>
                </div>
              </div>
              <button
                className={`p-2 rounded-lg transition-all ${isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-700 text-slate-400'}`}
                onClick={onToggleCollapse}
                title="Collapse sidebar"
              >
                <ChevronsLeft className='h-5 w-5' />
              </button>
            </div>
          </div>

          {/* Integrated Content: Folders + Notes */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className={`p-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
                  onClick={() => handleCreateNote()}
                  disabled={!activeVault}
                >
                  <FilePlus2 className="h-4 w-4" />
                  Note
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                  onClick={handleCreateFolder}
                  disabled={!activeVault}
                >
                  <FolderPlus className="h-4 w-4" />
                  Folder
                </button>
              </div>
            </div>

            {/* Folders Section */}
            <div className="shrink-0">
              <div className={`px-4 py-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <span className="font-bold text-sm text-slate-500 uppercase tracking-[0.2em]">Folders</span>
              </div>

              {isLoading ? (
                <div className="space-y-2 px-4 py-2">
                  <div className="h-4 w-11/12 animate-pulse rounded bg-slate-800" />
                  <div className="h-4 w-9/12 animate-pulse rounded bg-slate-800" />
                  <div className="h-4 w-10/12 animate-pulse rounded bg-slate-800" />
                </div>
              ) : error ? (
                <div className="px-4 py-2">
                  <p className="text-red-400">Error loading folders</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar px-2 py-2">
                  {rootNode.folders.map((folder) => (
                    <FolderNode
                      key={folder.path}
                      folder={folder}
                      depth={0}
                      selectedPath={selectedFolderPath}
                      onSelect={setSelectedFolderPath}
                      onMenu={(menu, event) => showContextMenu(menu, event)}
                      isLight={isLight}
                    />
                  ))}
                  {rootNode.folders.length === 0 && (
                    <div className="px-4 pt-1 text-slate-500">No folders yet</div>
                  )}
                </div>
              )}
            </div>

            {/* Integrated NoteList */}
            <div className="flex-1 overflow-hidden">
              <NoteList
                isCollapsed={false}
                onToggleCollapse={() => { }}
                isLight={isLight}
                noteListWidth={sidebarWidth}
                integratedMode={true}
                onNoteContextMenu={(note, event) => showContextMenu({
                  type: 'note',
                  note,
                }, event)}
              />
            </div>
          </div>

          {contextMenu ? (
            <div
              className={`fixed z-50 min-w-48 rounded-lg border shadow-2xl backdrop-blur ${isLight ? 'border-slate-200 bg-white text-slate-700' : 'border-slate-700 bg-slate-950 text-slate-200'}`}
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {contextMenu.type === 'folder' ? (
                <>
                  <button type="button" className={`block w-full px-3 py-2 text-left ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/60'}`} onClick={() => { setSelectedFolderPath(contextMenu.folder.path); setContextMenu(null) }}>Open folder</button>
                  <button type="button" className={`block w-full px-3 py-2 text-left ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/60'}`} onClick={() => { handleCreateNote(contextMenu.folder.path); setContextMenu(null) }}>New note here</button>
                  <button type="button" className={`block w-full px-3 py-2 text-left ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/60'}`} onClick={async () => { const folderName = window.prompt('Sub-folder name:'); if (folderName) await createFolderInFolder(activeVault, contextMenu.folder.path, folderName); setContextMenu(null) }}>New subfolder</button>
                  <button type="button" className={`block w-full px-3 py-2 text-left ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/60'}`} onClick={() => { handleRenameFolder(contextMenu.folder.path, contextMenu.folder.name); setContextMenu(null) }}>Rename folder</button>
                  <button type="button" className={`block w-full px-3 py-2 text-left text-rose-400 ${isLight ? 'hover:bg-rose-50' : 'hover:bg-rose-500/10'}`} onClick={() => { handleDeleteFolder(contextMenu.folder.path, contextMenu.folder.name); setContextMenu(null) }}>Delete folder</button>
                </>
              ) : (
                <>
                  <button type="button" className={`block w-full px-3 py-2 text-left ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/60'}`} onClick={async () => { await openNote(activeVault, contextMenu.note.path); setContextMenu(null) }}>Open note</button>
                  <button type="button" className={`block w-full px-3 py-2 text-left ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/60'}`} onClick={() => { handleRenameNote(contextMenu.note.path, contextMenu.note.name); setContextMenu(null) }}>Rename note</button>
                  <button type="button" className={`block w-full px-3 py-2 text-left text-rose-400 ${isLight ? 'hover:bg-rose-50' : 'hover:bg-rose-500/10'}`} onClick={() => { handleDeleteNote(contextMenu.note.path, contextMenu.note.name); setContextMenu(null) }}>Delete note</button>
                </>
              )}
            </div>
          ) : null}

          <div className={`p-3 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'}`}>
              <div className="flex items-center gap-2">
                <Files className="h-4 w-4" />
                <span className="text-sm font-medium uppercase tracking-widest">All notes</span>
              </div>
              <button
                type="button"
                className={`rounded-md px-2 py-1 text-xs ${isLight ? 'hover:bg-slate-200' : 'hover:bg-slate-700'}`}
                onClick={() => handleCreateNote()}
                disabled={!activeVault}
              >
                Quick note
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
