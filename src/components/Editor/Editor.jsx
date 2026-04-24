import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { GraphViewModal } from '../GraphViewModal/GraphViewModal'
import { MDXEditorComponent } from './MDXEditor'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { findBacklinks } from '../../utils/wikiLinks'
import { parseFrontmatter } from '../../utils/markdownUtils'
import {
  saveNoteContent,
  getNoteContent,
  renameNoteFile,
  createNoteFile,
  deleteNoteFile,
  getFileMetadata,
  getFileExtension,
  generateUniqueFilename,
  formatFileSize
} from '../../utils/fileOperations'

function transformWikiLinks(markdown) {
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (_match, noteName) => {
    const label = String(noteName).trim()
    return `[${label}](vaultnote://${encodeURIComponent(label)})`
  })
}

/**
 * Enhanced Editor with Obsidian-like features and file operations
 */
export function Editor({ isLight }) {
  const [showGraph, setShowGraph] = useState(false)
  const [isSplitView, setIsSplitView] = useState(false)
  const [previewMode, setPreviewMode] = useState('preview') // 'preview' | 'source'
  const editorMode = useNoteStore((state) => state.editorMode)
  const setEditorMode = useNoteStore((state) => state.setEditorMode)
  const activeNotePath = useNoteStore((state) => state.activeNotePath)
  const activeNoteContent = useNoteStore((state) => state.activeNoteContent)
  const noteIndex = useNoteStore((state) => state.noteIndex)
  const openNote = useNoteStore((state) => state.openNote)
  const updateEditorContent = useNoteStore((state) => state.updateEditorContent)
  const saveActiveNote = useNoteStore((state) => state.saveActiveNote)
  const activeVault = useVaultStore((state) => state.activeVault)
  const [newTagInput, setNewTagInput] = useState('')

  // Enhanced save functionality with file operations
  const handleSaveNote = async () => {
    if (!activeNotePath) return

    try {
      await saveActiveNote()
      // Show success feedback
      console.log('Note saved successfully')
    } catch (error) {
      console.error('Failed to save note:', error)
      // Show error feedback
      alert('Failed to save note: ' + error.message)
    }
  }

  // Enhanced rename functionality
  const handleRenameNote = async () => {
    if (!activeNotePath) return

    const newName = prompt('Enter new name:', activeNotePath.split('/').pop())
    if (!newName || newName === activeNotePath.split('/').pop()) return

    try {
      const folderPath = activeNotePath.split('/').slice(0, -1).join('/')
      await renameNoteFile(activeVault, activeNotePath, `${folderPath}/${newName}.md`)
      // Update note path in store
      openNote(`${folderPath}/${newName}.md`)
      console.log('Note renamed successfully')
    } catch (error) {
      console.error('Failed to rename note:', error)
      alert('Failed to rename note: ' + error.message)
    }
  }

  // Auto-save with debouncing
  useEffect(() => {
    if (!activeNotePath) return
    const timer = window.setTimeout(() => {
      saveActiveNote()
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [activeNoteContent, activeNotePath, saveActiveNote])

  // Enhanced split view functionality
  const toggleSplitView = () => {
    setIsSplitView(!isSplitView)
    setPreviewMode(isSplitView ? 'preview' : 'source')
  }

  // Enhanced preview toggle
  const togglePreviewMode = () => {
    setPreviewMode(previewMode === 'preview' ? 'source' : 'preview')
  }

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
      if (key === 'e' && toggleSplitView) {
        event.preventDefault()
        toggleSplitView()
      }
      if (key === 'p' && togglePreviewMode) {
        event.preventDefault()
        togglePreviewMode()
      }
      if (key === 'r' && handleRenameNote) {
        event.preventDefault()
        handleRenameNote()
      }
      // Additional Obsidian-like shortcuts
      if (key === 'o') {
        event.preventDefault()
        showGraph(true)
      }
      if (key === 'ctrl+n' || key === 'cmd+n') {
        event.preventDefault()
        // Create new note in current folder
        const folderPath = activeNotePath.split('/').slice(0, -1).join('/')
        createNoteFile(activeVault, folderPath, 'Untitled Note')
      }
      if (key === 'ctrl+shift+n' || key === 'cmd+shift+n') {
        event.preventDefault()
        // Create new folder in current folder
        const folderPath = activeNotePath.split('/').slice(0, -1).join('/')
        createNoteFile(activeVault, folderPath, 'New Folder', true)
      }
      if (key === 'ctrl+s' || key === 'cmd+s') {
        event.preventDefault()
        handleSaveNote()
      }
      if (key === 'ctrl+o' || key === 'cmd+o') {
        event.preventDefault()
        // Quick open command palette
        console.log('Quick open: Not implemented yet')
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [editorMode, saveActiveNote, setEditorMode, toggleSplitView, togglePreviewMode, handleRenameNote, activeNotePath, activeVault])

const showEditor = editorMode === 'edit' || editorMode === 'split'
const showPreview = editorMode === 'preview' || editorMode === 'split'
const markdownWithInternalLinks = transformWikiLinks(activeNoteContent || '')
const backlinks = useMemo(
  () => findBacklinks(noteIndex, activeNotePath),
  [noteIndex, activeNotePath],
)

const currentNote = noteIndex.find(n => n.path === activeNotePath)
const currentTags = currentNote?.tags || []

const addTagToNote = (tagName) => {
  const cleanTag = tagName.trim().toLowerCase().replace(/\s+/g, '-')
  if (!cleanTag || currentTags.includes(cleanTag)) return

  const parsed = parseFrontmatter(activeNoteContent)
  const updatedFrontmatter = {
    ...parsed.frontmatter,
    tags: [...currentTags, cleanTag]
  }

  let newContent = '---\n'
  Object.entries(updatedFrontmatter).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      newContent += `${key}:\n`
      value.forEach(item => {
        newContent += `  - ${item}\n`
      })
    } else {
      newContent += `${key}: ${value}\n`
    }
  })
  newContent += '---\n\n' + parsed.body

  updateEditorContent(newContent)
  setNewTagInput('')
}

const removeTagFromNote = (tagName) => {
  const parsed = parseFrontmatter(activeNoteContent)
  const updatedFrontmatter = {
    ...parsed.frontmatter,
    tags: currentTags.filter(t => t !== tagName)
  }

  if (updatedFrontmatter.tags.length === 0) {
    delete updatedFrontmatter.tags
  }

  let newContent = '---\n'
  Object.entries(updatedFrontmatter).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      newContent += `${key}:\n`
      value.forEach(item => {
        newContent += `  - ${item}\n`
      })
    } else {
      newContent += `${key}: ${value}\n`
    }
  })
  newContent += '---\n\n' + parsed.body

  updateEditorContent(newContent)
}

return (
  <section className={`flex flex-col h-full flex-1 ${isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-100'} relative`}>

    <header className={`border-b p-3 ${isLight ? 'border-slate-300' : 'border-slate-700'}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={`${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{activeNotePath || 'No note selected'}</h2>
        <span className={`${isLight ? 'text-slate-400' : 'text-slate-500'} font-mono`}>
          {editorMode.toUpperCase()} MODE
        </span>
      </div>

      {activeNotePath && (
        <div className="mt-3">
          <p className={`mb-2 uppercase tracking-wide ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>Tags</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {currentTags.length === 0 ? (
              <span className={`${isLight ? 'text-slate-400' : 'text-slate-600'}`}>No tags</span>
            ) : (
              currentTags.map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'}`}
                >
                  #{tag}
                  <button
                    type="button"
                    className="hover:text-rose-400 ml-1"
                    onClick={() => removeTagFromNote(tag)}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className={`flex-1 rounded-md border px-2 py-1 ${isLight
                ? 'border-slate-300 bg-white text-slate-700'
                : 'border-slate-600 bg-slate-900 text-slate-200'
                }`}
              placeholder="Add tag..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTagToNote(newTagInput)
                }
              }}
            />
            <button
              type="button"
              className={`rounded-md border px-2 py-1 ${isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-slate-600 text-slate-200 hover:bg-slate-800'
                }`}
              onClick={() => addTagToNote(newTagInput)}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </header>
    <div className={`grid h-[calc(100%-73px)] ${editorMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
       {showEditor ? (
         <div className={`h-full ${showPreview ? (isLight ? 'border-r border-slate-300' : 'border-r border-slate-700') : ''}`}>
           <MDXEditorComponent
             key={activeNotePath}
             value={activeNoteContent}
             onChange={updateEditorContent}
             isLight={isLight}
           // disabled={!activeNotePath}
           />
           {/* MDXEditor will be restored here when ready */}
         </div>
       ) : null}
      {showPreview ? (
        <div className={`overflow-auto p-3 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
          <article
            className={`max-w-none prose ${isLight
              ? 'prose-slate'
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
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt ?? ''}
                    loading="lazy"
                    className="max-w-full rounded-lg border border-slate-700/60 shadow-sm"
                  />
                ),
              }}
            >
              {markdownWithInternalLinks || '*No content yet.*'}
            </ReactMarkdown>
          </article>
          {activeNotePath ? (
            <div className={`mt-6 border-t pt-4 ${isLight ? 'border-slate-300' : 'border-slate-600'}`}>
              <h3 className={`mb-2 font-semibold uppercase tracking-wide ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                Referenced by
              </h3>
              {backlinks.length === 0 ? (
                <p className={`${isLight ? 'text-slate-500' : 'text-slate-500'}`}>No other notes link here yet.</p>
              ) : (
                <ul className="space-y-1">
                  {backlinks.map((b) => (
                    <li key={b.path}>
                      <button
                        type="button"
                        className={`text-left underline ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}
                        onClick={() => openNote(activeVault, b.path)}
                      >
                        {b.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
    <GraphViewModal
      isOpen={showGraph}
      onClose={() => setShowGraph(false)}
      noteIndex={noteIndex}
      openNote={openNote}
      activeVault={activeVault}
      isLight={isLight}
    />
  </section>
)
}
