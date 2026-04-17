import { useEffect, useState } from 'react'
import { Editor } from './components/Editor/Editor'
import { NoteList } from './components/NoteList/NoteList'
import { Sidebar } from './components/Sidebar/Sidebar'
import { VaultSwitcher } from './components/VaultSwitcher/VaultSwitcher'
import { useNoteStore } from './store/noteStore'
import { useVaultStore } from './store/vaultStore'

/**
 * VaultNote root layout with vault switcher and three-panel workspace.
 */
function App() {
  const [theme, setTheme] = useState(() => window.localStorage.getItem('vaultnote:theme') || 'dark')
  const isLight = theme === 'light'
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isNoteListCollapsed, setIsNoteListCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(window.localStorage.getItem('vaultnote:sidebarWidth')) || 240)
  const [noteListWidth, setNoteListWidth] = useState(() => Number(window.localStorage.getItem('vaultnote:noteListWidth')) || 320)
  const activeVault = useVaultStore((state) => state.activeVault)
  const fetchVaults = useVaultStore((state) => state.fetchVaults)
  const clearNotesForVaultSwitch = useNoteStore((state) => state.clearNotesForVaultSwitch)
  const loadNoteTreeForVault = useNoteStore((state) => state.loadNoteTreeForVault)

  useEffect(() => {
    fetchVaults()
  }, [fetchVaults])

  useEffect(() => {
    clearNotesForVaultSwitch()
    loadNoteTreeForVault(activeVault)
  }, [activeVault, clearNotesForVaultSwitch, loadNoteTreeForVault])

  useEffect(() => {
    window.localStorage.setItem('vaultnote:sidebarWidth', String(sidebarWidth))
  }, [sidebarWidth])

  useEffect(() => {
    window.localStorage.setItem('vaultnote:noteListWidth', String(noteListWidth))
  }, [noteListWidth])

  useEffect(() => {
    window.localStorage.setItem('vaultnote:theme', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [theme])

  const startResize = (panel) => (event) => {
    event.preventDefault()
    const startX = event.clientX
    const startSidebar = sidebarWidth
    const startNoteList = noteListWidth
    const minWidth = 180
    const maxWidth = 560

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      if (panel === 'sidebar') {
        const next = Math.max(minWidth, Math.min(maxWidth, startSidebar + delta))
        setSidebarWidth(next)
      } else {
        const next = Math.max(minWidth, Math.min(maxWidth, startNoteList + delta))
        setNoteListWidth(next)
      }
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className={`h-screen ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <div className={isLight ? 'border-b border-slate-300' : 'border-b border-slate-700'}>
        <VaultSwitcher
          theme={theme}
          onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
          isLight={isLight}
        />
      </div>
      <main
        className="relative grid h-[calc(100vh-57px)]"
        style={{
          gridTemplateColumns: `${isSidebarCollapsed || isFocusMode ? '0px' : `${sidebarWidth}px`} ${isNoteListCollapsed || isFocusMode ? '0px' : `${noteListWidth}px`} minmax(0, 1fr)`,
        }}
      >
        {(isSidebarCollapsed || isNoteListCollapsed) && (
          <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
            {isSidebarCollapsed ? (
              <button
                type="button"
                className={`rounded-md border px-2 py-1 text-xs ${
                  isLight
                    ? 'border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100'
                    : 'border-slate-600 bg-slate-900/90 text-slate-200 hover:bg-slate-800'
                }`}
                onClick={() => setIsSidebarCollapsed(false)}
              >
                Show Folders
              </button>
            ) : null}
            {isNoteListCollapsed ? (
              <button
                type="button"
                className={`rounded-md border px-2 py-1 text-xs ${
                  isLight
                    ? 'border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100'
                    : 'border-slate-600 bg-slate-900/90 text-slate-200 hover:bg-slate-800'
                }`}
                onClick={() => setIsNoteListCollapsed(false)}
              >
                Show Notes
              </button>
            ) : null}
          </div>
        )}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
          isLight={isLight}
        />
        <NoteList
          isCollapsed={isNoteListCollapsed}
          onToggleCollapse={() => setIsNoteListCollapsed((value) => !value)}
          isLight={isLight}
        />
        {!isSidebarCollapsed && !isFocusMode ? (
          <button
            type="button"
            className="absolute bottom-0 top-0 z-20 w-1 cursor-col-resize bg-slate-800/60 hover:bg-slate-700"
            style={{ left: `${sidebarWidth}px` }}
            onMouseDown={startResize('sidebar')}
            aria-label="Resize folders panel"
          />
        ) : null}
        {!isNoteListCollapsed && !isFocusMode ? (
          <button
            type="button"
            className="absolute bottom-0 top-0 z-20 w-1 cursor-col-resize bg-slate-800/60 hover:bg-slate-700"
            style={{ left: `${(isSidebarCollapsed ? 0 : sidebarWidth) + noteListWidth}px` }}
            onMouseDown={startResize('notes')}
            aria-label="Resize notes panel"
          />
        ) : null}
        <div className="absolute right-2 top-2 z-10">
          <button
            type="button"
            className={`rounded-md border px-2 py-1 text-xs ${
              isLight
                ? 'border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100'
                : 'border-slate-600 bg-slate-900/90 text-slate-200 hover:bg-slate-800'
            }`}
            onClick={() => setIsFocusMode((value) => !value)}
          >
            {isFocusMode ? 'Exit Focus' : 'Focus Mode'}
          </button>
        </div>
        <Editor isLight={isLight} />
      </main>
    </div>
  )
}

export default App
