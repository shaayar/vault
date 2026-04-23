import { useEffect, useState } from 'react'
import { Editor } from './components/Editor/Editor'
import { NoteList } from './components/NoteList/NoteList'
import { ObsidianSidebar } from './components/FileExplorer/ObsidianSidebar'
import { FocusMode } from './components/FocusMode/FocusMode'
import { StatusBar } from './components/StatusBar/StatusBar'
import { Header } from './components/VaultSwitcher/Header'
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
  const [isResizing, setIsResizing] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(window.localStorage.getItem('vaultnote:sidebarWidth')) || 260) // Wider for ObsidianSidebar
  const [noteListWidth, setNoteListWidth] = useState(() => Number(window.localStorage.getItem('vaultnote:noteListWidth')) || 320)
  const activeVault = useVaultStore((state) => state.activeVault)
  const fetchVaults = useVaultStore((state) => state.fetchVaults)
  const clearNotesForVaultSwitch = useNoteStore((state) => state.clearNotesForVaultSwitch)
  const loadNoteTreeForVault = useNoteStore((state) => state.loadNoteTreeForVault)
  const activeNoteContent = useNoteStore((state) => state.activeNoteContent)

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    window.localStorage.setItem('vaultnote:theme', newTheme)
    document.documentElement.classList.toggle('light', newTheme === 'light')
  }

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

  // Keyboard shortcut for focus mode (Ctrl+Shift+F)
  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault()
        setIsFocusMode((value) => !value)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  const startResize = (panel) => (event) => {
    event.preventDefault()
    setIsResizing(true)
    const startX = event.clientX
    const startSidebar = sidebarWidth
    const startNoteList = noteListWidth
    const minWidth = 180
    const maxWidth = 560

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX

      if (panel === 'sidebar') {
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startSidebar + delta))
        setSidebarWidth(newWidth)
        window.localStorage.setItem('vaultnote:sidebarWidth', newWidth)
      } else if (panel === 'notes') {
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startNoteList + delta))
        setNoteListWidth(newWidth)
        window.localStorage.setItem('vaultnote:noteListWidth', newWidth)
      }
    }

    const onMouseUp = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className={`bg-surface text-on-surface select-none overflow-hidden h-screen w-screen ${isResizing ? 'resizing' : ''}`}>
      {/* Focus Mode Component */}
      <FocusMode
        isActive={isFocusMode}
        onExit={() => setIsFocusMode(false)}
        activeNoteContent={activeNoteContent}
      />

      {!isFocusMode && (
        <>
          {/* TopAppBar */}
          <Header
            theme={theme}
            onToggleTheme={toggleTheme}
            isLight={isLight}
            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          />

          {/* Main Content */}
          <div className="flex h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            {/* Left Sidebar - Obsidian-style */}
            <ObsidianSidebar
              isLight={isLight}
              isFocusMode={isFocusMode}
              isCollapsed={isSidebarCollapsed}
              width={sidebarWidth}
              onWidthChange={setSidebarWidth}
              onCollapseChange={setIsSidebarCollapsed}
            />

            {/* Resize Handle: Sidebar <-> Editor */}
            {!isSidebarCollapsed && (
              <div
                className="resize-handle w-1 bg-slate-800 cursor-col-resize relative z-10"
                onMouseDown={startResize('sidebar')}
                title="Drag to resize folders panel"
              />
            )}

            {/* Divider Gutter */}
            {isSidebarCollapsed && <div className="w-1 bg-slate-950" />}
            <Editor isLight={isLight} />
          </div>

          {/* StatusBar */}
          <StatusBar isLight={isLight} />
        </>
      )}
    </div>
  )
}

export default App
