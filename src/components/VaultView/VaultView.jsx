import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sidebar } from '../FileExplorer/Sidebar'
import { NoteList } from '../NoteList/NoteList'
import { useVaultStore } from '../../store/vaultStore'
import { useNoteStore } from '../../store/noteStore'
import { useResponsive, useResponsiveSidebar } from '../../hooks/useResponsive'
import { useState } from 'react'
import { NotebookText, Moon, Sun, Menu, ArrowLeft } from 'lucide-react'

export function VaultView() {
  const { vaultName } = useParams()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => window.localStorage.getItem('vaultnote:theme') || 'dark')
  const isLight = theme === 'light'
  const [isResizing, setIsResizing] = useState(false)

  // Responsive hooks
  const { isMobile, isTablet, breakpoint } = useResponsive()
  const { isCollapsed: sidebarCollapsed, isHidden: sidebarHidden, toggle: toggleSidebar, show: showSidebar, hide: hideSidebar } = useResponsiveSidebar()

  // Desktop-only state
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(window.localStorage.getItem('vaultnote:sidebarWidth')) || 260)

  const { vaults, activeVault, setActiveVault, fetchVaults } = useVaultStore()
  const { selectedFolderPath, setSelectedFolderPath, notesInFolder, noteTree, loadNoteTreeForVault, clearNotesForVaultSwitch } = useNoteStore()

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    window.localStorage.setItem('vaultnote:theme', newTheme)
    document.documentElement.classList.toggle('light', newTheme === 'light')
  }

  // Sync vault from URL
  useEffect(() => {
    if (vaultName && vaults.length > 0) {
      if (vaults.includes(vaultName)) {
        setActiveVault(vaultName)
      } else {
        // Vault doesn't exist, redirect to 404
        navigate('/404', { replace: true })
      }
    }
  }, [vaultName, vaults, setActiveVault, navigate])

  // Load note tree when vault changes
  useEffect(() => {
    if (activeVault) {
      clearNotesForVaultSwitch()
      loadNoteTreeForVault(activeVault)
    }
  }, [activeVault, clearNotesForVaultSwitch, loadNoteTreeForVault])

  // Persist sidebar width
  useEffect(() => {
    window.localStorage.setItem('vaultnote:sidebarWidth', String(sidebarWidth))
  }, [sidebarWidth])

  // Persist theme
  useEffect(() => {
    window.localStorage.setItem('vaultnote:theme', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [theme])

  // Fetch vaults on mount
  useEffect(() => {
    fetchVaults()
  }, [fetchVaults])

  const startResize = (panel) => (event) => {
    event.preventDefault()
    setIsResizing(true)
    const startX = event.clientX
    const startSidebar = sidebarWidth
    const minWidth = 180
    const maxWidth = 560

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX

      if (panel === 'sidebar') {
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startSidebar + delta))
        setSidebarWidth(newWidth)
        window.localStorage.setItem('vaultnote:sidebarWidth', newWidth)
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

  if (!activeVault) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading vault...</div>
      </div>
    )
  }

  return (
    <div className={`bg-surface text-on-surface select-none overflow-hidden h-screen w-screen ${isResizing ? 'resizing' : ''}`}>
      {/* Header */}
      <header className={`flex items-center justify-between px-8 w-full h-16 ${isLight ? 'bg-linear-to-r from-slate-100 via-white to-slate-100 border-b border-slate-300/50' : 'bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50'} shadow-lg relative`}>
        <div className="flex items-center gap-8">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <NotebookText className="text-white text-xl" />
              </div>
              <div>
                <h1 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>VaultNote</h1>
              </div>
            </button>
          </div>

          {/* Vault Name */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isLight ? 'bg-slate-200/50' : 'bg-slate-800/30'}`}>
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{activeVault}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`p-2 hover:${isLight ? 'bg-slate-500/50' : 'bg-slate-800/50'} transition-colors rounded-lg text-slate-400`}
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Mobile Menu */}
          <button
            className="lg:hidden p-2 hover:bg-slate-800/50 transition-colors rounded-lg text-slate-400"
            onClick={toggleSidebar}
            title="Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {/* Left Sidebar */}
        {!sidebarHidden && (
          <>
            <Sidebar
              isLight={isLight}
              isFocusMode={false}
              isCollapsed={sidebarCollapsed}
              width={isMobile ? window.innerWidth : sidebarWidth}
              onResize={!isMobile ? startResize('sidebar') : undefined}
            />
          </>
        )}

        {/* Resize Handle: Sidebar <-> Note List */}
        {!sidebarCollapsed && (
          <div
            className="resize-handle w-1 bg-slate-800 cursor-col-resize relative z-10"
            onMouseDown={startResize('sidebar')}
            title="Drag to resize folders panel"
          />
        )}

        {/* Divider Gutter */}
        {sidebarCollapsed && <div className="w-1 bg-slate-950" />}

        {/* Note List Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {selectedFolderPath || 'Root'}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <NoteList />
          </div>
        </div>
      </div>
    </div>
  )
}
