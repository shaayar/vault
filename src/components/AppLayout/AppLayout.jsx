// Component: AppLayout
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Editor } from '../Editor/Editor'
import { Sidebar } from '../FileExplorer/Sidebar'
import { FocusMode } from '../FocusMode/FocusMode'

import { Header } from '../VaultSwitcher/Header'
import { SearchModal } from '../Search/SearchModal'
import { ShortcutsModal } from '../Shortcuts/ShortcutsModal'
import { GraphViewModal } from '../GraphViewModal/GraphViewModal'
import { TemplatesModal } from '../Templates/TemplatesModal'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { useResponsive, useResponsiveSidebar } from '../../hooks/useResponsive'
import { decodeNotePath, encodeNotePath, resolveCanonicalNotePath } from '../../utils/notePath'

export function AppLayout() {
  const { vaultName, '*': notePath = '' } = useParams()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => window.localStorage.getItem('vaultnote:theme') || 'dark')
  const isLight = theme === 'light'
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isGraphOpen, setIsGraphOpen] = useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)

  // Responsive hooks
  const { isMobile } = useResponsive()
  const { isCollapsed: sidebarCollapsed, isHidden: sidebarHidden, toggle: toggleSidebar } = useResponsiveSidebar()

  // Desktop-only state
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(window.localStorage.getItem('vaultnote:sidebarWidth')) || 260)
  const vaults = useVaultStore((state) => state.vaults)
  const activeVault = useVaultStore((state) => state.activeVault)
  const fetchVaults = useVaultStore((state) => state.fetchVaults)
  const setActiveVaultFromUrl = useVaultStore((state) => state.setActiveVaultFromUrl)
  const clearNotesForVaultSwitch = useNoteStore((state) => state.clearNotesForVaultSwitch)
  const loadNoteTreeForVault = useNoteStore((state) => state.loadNoteTreeForVault)
  const activeNoteContent = useNoteStore((state) => state.activeNoteContent)
  const noteIndex = useNoteStore((state) => state.noteIndex)
  const openNote = useNoteStore((state) => state.openNote)
  const createNoteInFolder = useNoteStore((state) => state.createNoteInFolder)
  const setActiveNoteFromUrl = useNoteStore((state) => state.setActiveNoteFromUrl)

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    window.localStorage.setItem('vaultnote:theme', newTheme)
    document.documentElement.classList.toggle('light', newTheme === 'light')
  }

  // Sync vault from URL
  useEffect(() => {
    if (vaultName) {
      if (vaults.length > 0 && !vaults.some(v => v.id === vaultName)) {
        console.log('Redirecting to 404: vault not found', vaultName)
        // Vault doesn't exist, redirect to 404
        navigate('/404', { replace: true })
      } else if (vaults.length > 0) {
        setActiveVaultFromUrl(vaultName)
      }
      // If vaults not loaded yet, wait
    }
  }, [vaultName, vaults, setActiveVaultFromUrl, navigate])

  // Sync note from URL
  useEffect(() => {
    if (notePath && activeVault) {
      console.log(`useEffect notePath triggered: ${notePath} in vault: ${activeVault.id}`)
      const decodedPath = decodeNotePath(notePath)
      const resolvedPath = resolveCanonicalNotePath(noteIndex, decodedPath)
      console.log(`Resolved path: ${resolvedPath}`)

      setActiveNoteFromUrl(resolvedPath)
      openNote(activeVault.id, resolvedPath)

      if (resolvedPath !== decodedPath) {
        navigate(`/${activeVault.id}/${encodeNotePath(resolvedPath)}`, { replace: true })
      }
    }
  }, [notePath, activeVault, noteIndex, navigate, setActiveNoteFromUrl, openNote])

  useEffect(() => {
    fetchVaults()
  }, [fetchVaults])

  useEffect(() => {
    clearNotesForVaultSwitch()
    loadNoteTreeForVault(activeVault?.id || '')
  }, [activeVault, clearNotesForVaultSwitch, loadNoteTreeForVault])

  useEffect(() => {
    window.localStorage.setItem('vaultnote:sidebarWidth', String(sidebarWidth))
  }, [sidebarWidth])

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
      // Focus mode: Ctrl+Shift+F
      if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault()
        setIsFocusMode((value) => !value)
      }
      // Search: Ctrl+K
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault()
        setIsSearchOpen(true)
      }
      // Shortcuts: Ctrl+/
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault()
        setIsShortcutsOpen(true)
      }
      // Graph: Ctrl+G
      if (event.ctrlKey && event.key === 'g') {
        event.preventDefault()
        setIsGraphOpen(true)
      }
      // Templates: Ctrl+T
      if (event.ctrlKey && event.key === 't') {
        event.preventDefault()
        setIsTemplatesOpen(true)
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

  // Show loading state while vaults are being fetched
  if (vaults.length === 0 && !activeVault) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
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
            onToggleSidebar={toggleSidebar}
            isMobile={isMobile}
          />

          {/* Main Content */}
          <div className="flex flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 relative">
            {/* Mobile Sidebar Backdrop */}
            {isMobile && !sidebarHidden && (
              <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                onClick={toggleSidebar}
              />
            )}

            {/* Left Sidebar */}
            {!sidebarHidden && (
              <Sidebar
                isLight={isLight}
                isFocusMode={isFocusMode}
                isCollapsed={sidebarCollapsed}
                isMobile={isMobile}
                width={isMobile ? '80%' : sidebarWidth}
                onResize={!isMobile ? startResize('sidebar') : undefined}
                className={isMobile ? 'fixed inset-y-0 left-0 w-[80%] z-50' : ''}
              />
            )}

            {/* Resize Handle: Sidebar <-> Editor */}
            {!sidebarCollapsed && (
              <div
                className="resize-handle w-1 bg-slate-800 cursor-col-resize relative z-10"
                onMouseDown={startResize('sidebar')}
                title="Drag to resize folders panel"
              />
            )}

            {/* Divider Gutter */}
            {sidebarCollapsed && <div className="w-1 bg-slate-950" />}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Editor isLight={isLight} />
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
      <GraphViewModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        noteIndex={noteIndex}
        openNote={openNote}
        activeVault={activeVault}
        isLight={isLight}
      />
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onCreateFromTemplate={async (fileName, content) => {
          if (activeVault) {
            await createNoteInFolder(activeVault, '', fileName.replace('.md', ''), content)
          }
        }}
      />
    </div>
  )
}
