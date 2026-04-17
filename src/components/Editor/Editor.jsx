import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'

function transformWikiLinks(markdown) {
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (_match, noteName) => {
    const label = String(noteName).trim()
    return `[${label}](vaultnote://${encodeURIComponent(label)})`
  })
}

/**
 * Editor and preview panel placeholder.
 */
export function Editor({ isLight }) {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false)
  const editorMode = useNoteStore((state) => state.editorMode)
  const setEditorMode = useNoteStore((state) => state.setEditorMode)
  const activeNotePath = useNoteStore((state) => state.activeNotePath)
  const activeNoteContent = useNoteStore((state) => state.activeNoteContent)
  const lastSavedContent = useNoteStore((state) => state.lastSavedContent)
  const saveStatus = useNoteStore((state) => state.saveStatus)
  const noteIndex = useNoteStore((state) => state.noteIndex)
  const openNote = useNoteStore((state) => state.openNote)
  const updateEditorContent = useNoteStore((state) => state.updateEditorContent)
  const saveActiveNote = useNoteStore((state) => state.saveActiveNote)
  const activeVault = useVaultStore((state) => state.activeVault)

  useEffect(() => {
    if (!activeNotePath) return
    const timer = window.setTimeout(() => {
      saveActiveNote()
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [activeNoteContent, activeNotePath, saveActiveNote])

  useEffect(() => {
    const handleKeydown = (event) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        saveActiveNote()
      }

      if (key === 'p') {
        event.preventDefault()
        setEditorMode(editorMode === 'preview' ? 'split' : 'preview')
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [editorMode, saveActiveNote, setEditorMode])

  const showEditor = editorMode === 'edit' || editorMode === 'split'
  const showPreview = editorMode === 'preview' || editorMode === 'split'
  const hasUnsavedChanges = activeNoteContent !== lastSavedContent
  const markdownWithInternalLinks = transformWikiLinks(activeNoteContent || '')

  return (
    <section className={`h-full ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
      <header className={`border-b p-3 ${isLight ? 'border-slate-300' : 'border-slate-700'}`}>
        <div className="flex items-center gap-2">
          <h2 className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{activeNotePath || 'No note selected'}</h2>
          <button
            type="button"
            className={`ml-auto rounded-md border px-2 py-1 text-xs ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-slate-600 text-slate-200 hover:bg-slate-800'
            }`}
            onClick={() => setIsMenuCollapsed((value) => !value)}
          >
            {isMenuCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
        {!isMenuCollapsed && (
          <div className="mt-2 flex items-center gap-2">
            {['edit', 'split', 'preview'].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-md border px-2 py-1 text-xs ${
                  editorMode === mode
                    ? 'border-slate-500 bg-slate-700 text-slate-100'
                    : isLight
                      ? 'border-slate-300 text-slate-700'
                      : 'border-slate-600 text-slate-200'
                }`}
                onClick={() => setEditorMode(mode)}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
            <span className={`ml-auto text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {saveStatus === 'saving' ? 'Saving...' : hasUnsavedChanges ? 'Unsaved' : 'Saved'}
            </span>
          </div>
        )}
      </header>
      <div className={`grid h-[calc(100%-73px)] ${editorMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {showEditor ? (
          <div className={showPreview ? (isLight ? 'border-r border-slate-300' : 'border-r border-slate-700') : ''}>
            <textarea
              className={`h-full w-full resize-none p-3 font-mono text-sm outline-none ${
                isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-200'
              }`}
              value={activeNoteContent}
              onChange={(event) => updateEditorContent(event.target.value)}
              placeholder="Open or create a note to start writing..."
              disabled={!activeNotePath}
            />
          </div>
        ) : null}
        {showPreview ? (
          <div className={`overflow-auto p-3 text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            <article
              className={`max-w-none prose ${
                isLight
                  ? 'prose-headings:text-slate-900 prose-p:text-slate-800'
                  : 'prose-invert prose-headings:text-slate-100 prose-p:text-slate-200'
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => {
                    if (!href?.startsWith('vaultnote://')) {
                      return (
                        <a href={href} target="_blank" rel="noreferrer">
                          {children}
                        </a>
                      )
                    }

                    const requested = decodeURIComponent(href.replace('vaultnote://', '')).toLowerCase()
                    const match = noteIndex.find((note) => {
                      const title = String(note.title ?? '').toLowerCase()
                      const base = String(note.path ?? '')
                        .split('/')
                        .pop()
                        ?.replace(/\.md$/i, '')
                        .toLowerCase()
                      return title === requested || base === requested
                    })

                    if (!match) {
                      return <span className="text-rose-400">{children}</span>
                    }

                    return (
                      <button
                        type="button"
                        className="cursor-pointer text-indigo-400 underline"
                        onClick={() => openNote(activeVault, match.path)}
                      >
                        {children}
                      </button>
                    )
                  },
                }}
              >
                {markdownWithInternalLinks || '*No content yet.*'}
              </ReactMarkdown>
            </article>
          </div>
        ) : null}
      </div>
    </section>
  )
}
