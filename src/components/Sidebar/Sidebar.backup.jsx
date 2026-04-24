import { useState } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { NoteList } from '../NoteList/NoteList'
import { Files, ChevronsLeft, Sparkles } from 'lucide-react'

function FolderNode({ folder, depth = 0, selectedPath, onSelect }) {
  const [isOpen, setIsOpen] = useState(true)
  const childFolders = Array.isArray(folder.folders) ? folder.folders : []

  return (
    <div>
      <div className="flex items-center gap-1">
        {childFolders.length > 0 ? (
          <button
            className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="material-symbols-outlined text-[14px]">
              {isOpen ? 'expand_more' : 'chevron_right'}
            </span>
          </button>
        ) : (
          <div className="w-4" />
        )}
        <span className="material-symbols-outlined text-[14px] text-slate-400">folder</span>
        <button
          className={`text-xs hover:text-slate-200 ${selectedPath === folder.path ? 'text-indigo-400 font-medium' : ''}`}
          onClick={() => onSelect(folder.path)}
        >
          {folder.name}
        </button>
      </div>
      {isOpen && childFolders.length > 0 && (
        <div className="ml-4">
          {childFolders.map((childFolder) => (
            <FolderNode
              key={childFolder.path}
              folder={childFolder}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
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
  const isLoading = useNoteStore((state) => state.isLoading)
  const error = useNoteStore((state) => state.error)

  const handleCreateFolder = async () => {
    if (!activeVault) return
    const folderName = window.prompt('New folder name:')
    if (!folderName) return
    await createFolderInFolder(activeVault, selectedFolderPath, folderName)
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
          <div className="px-6 pt-4 py-2 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="font-black text-slate-100 leading-none">
                    {activeVault || 'Personal Vault'}
                  </h2>
                  <span className="font-mono uppercase tracking-widest text-sm">
                    {activeVault ? activeVault.notes.length + ' notes' : 'No vault selected'}
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
            {/* Navigation Items */}
            <div className="p-2 space-y-1 border-b border-slate-800">
              <div className="bg-indigo-500/10 text-indigo-400 rounded-lg px-3 py-1 flex items-center gap-3 group transition-all duration-200 ease-in-out cursor-pointer">
                <span className="material-symbols-outlined text-[18px]"> <Files className='h-9' /> </span>
                <span className="text-sm font-medium uppercase tracking-widest">All Notes</span>
              </div>

              <div className="text-slate-400 hover:text-slate-200 px-3 py-1 rounded-lg hover:bg-slate-800 flex items-center gap-3 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[18px]"> <Sparkles className='h-9' /> </span>
                <span className="text-sm font-medium uppercase tracking-widest">Favorites</span>
              </div>
            </div>

            {/* Folders Section */}
            <div className="shrink-0">
              <div className="px-4 py-2 border-b border-slate-800">
                <span className="font-bold text-sm text-slate-600 uppercase tracking-[0.2em]">Folders</span>
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
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {noteTree?.folders?.map((folder) => (
                    <FolderNode
                      key={folder.path}
                      folder={folder}
                      depth={0}
                      selectedPath={selectedFolderPath}
                      onSelect={setSelectedFolderPath}
                    />
                  ))}
                  {(!noteTree?.folders || noteTree.folders.length === 0) && (
                    <div className="px-4 pt-1 text-slate-500">No folders yet</div>
                  )}
                </div>
              )}
            </div>

            {/* Integrated NoteList */}
            <div className="flex-1 overflow-hidden">
              <NoteList
                isSidebarCollapsed={false}
                isCollapsed={false}
                onToggleCollapse={() => { }}
                isLight={false}
                noteListWidth={sidebarWidth}
                integratedMode={true}
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-slate-800 space-y-2">
            <button
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold tracking-widest uppercase transition-all duration-200"
              onClick={handleCreateFolder}
              disabled={!activeVault}
            >
              New Folder
            </button>
            <div className="flex gap-2">
              <div className="px-3 py-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 flex items-center gap-2 transition-all cursor-pointer flex-1 justify-center">
                <span className="material-symbols-outlined text-[16px]">archive</span>
                <span className="font-medium uppercase tracking-widest">Archive</span>
              </div>
              <div className="px-3 py-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 flex items-center gap-2 transition-all cursor-pointer flex-1 justify-center">
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span className="font-medium uppercase tracking-widest">Trash</span>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
