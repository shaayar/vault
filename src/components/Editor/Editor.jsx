// Component: Editor
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MDXEditorComponent } from './MDXEditor'
import { EditorHeader } from './EditorHeader'
import { EditorTags } from './EditorTags'
import { EditorPreview } from './EditorPreview'
import { EditorBacklinks } from './EditorBacklinks'

import { GraphViewModal } from '../GraphViewModal/GraphViewModal'
import { useEditorShortcuts } from '../../hooks/useEditorShortcuts'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { parseFrontmatter } from '../../utils/markdownUtils'

const MAX_TAGS = 6

/**
 * Enhanced Editor with Obsidian-like features and file operations
 */
export function Editor({ isLight }) {
  const editorMode = useNoteStore((state) => state.editorMode)
  const setEditorMode = useNoteStore((state) => state.setEditorMode)
  const activeNotePath = useNoteStore((state) => state.activeNotePath)
  const activeNoteContent = useNoteStore((state) => state.activeNoteContent)
  const activeNoteTags = useNoteStore((state) => state.activeNoteTags)
  const noteIndex = useNoteStore((state) => state.noteIndex)
  const openNote = useNoteStore((state) => state.openNote)
  const updateEditorContent = useNoteStore((state) => state.updateEditorContent)
  const setActiveNoteTags = useNoteStore((state) => state.setActiveNoteTags)
  const saveActiveNote = useNoteStore((state) => state.saveActiveNote)
  const saveStatus = useNoteStore((state) => state.saveStatus)
  const activeVault = useVaultStore((state) => state.activeVault)
  const [newTagInput, setNewTagInput] = useState('')
  const [isGraphOpen, setIsGraphOpen] = useState(false)

  // Keyboard shortcuts
  useEditorShortcuts({
    onSave: () => saveActiveNote(),
    onSetEditorMode: setEditorMode
  })

  // Auto-save with debouncing
  useEffect(() => {
    if (!activeNotePath) return
    const timer = window.setTimeout(() => {
      saveActiveNote()
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [activeNoteContent, activeNotePath, saveActiveNote])

  const currentNote = useMemo(() => noteIndex.find(n => n.path === activeNotePath), [noteIndex, activeNotePath])
  const currentTags = activeNoteTags || []

  // Debug logging
  console.log('Editor Debug - activeNoteTags:', activeNoteTags)
  console.log('Editor Debug - currentTags:', currentTags)
  console.log('Editor Debug - activeNotePath:', activeNotePath)

  // Use frontmatter from noteIndex for faster access, fallback to parsing
  const frontmatter = useMemo(() => currentNote?.frontmatter || {}, [currentNote])
  // Parse content to separate frontmatter from body (for editor display)
  const parsed = useMemo(() => parseFrontmatter(activeNoteContent || ''), [activeNoteContent])
  const bodyContent = parsed.body
  console.log('Editor bodyContent length:', bodyContent.length, 'activeNoteContent length:', activeNoteContent?.length)
  const delimiter = parsed.delimiter || '---'

  // Force single column on mobile (no split view)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const effectiveEditorMode = isMobile && editorMode === 'split' ? 'edit' : editorMode
  const effectiveShowEditor = effectiveEditorMode === 'edit' || effectiveEditorMode === 'split'
  const effectiveShowPreview = effectiveEditorMode === 'preview' || effectiveEditorMode === 'split'

  // Helper to reassemble frontmatter + body
  const assembleContent = (fm, body, delim = '---') => {
    if (Object.keys(fm).length === 0) {
      return body
    }
    let newContent = `${delim}\n`
    Object.entries(fm).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        newContent += `${key}:\n`
        value.forEach(item => {
          newContent += `  - ${item}\n`
        })
      } else {
        newContent += `${key}: ${value}\n`
      }
    })
    newContent += `${delim}\n\n` + body
    return newContent
  }

  // Handle editor changes - preserve frontmatter
  const handleEditorChange = useCallback((newBody) => {
    updateEditorContent(assembleContent(frontmatter, newBody, delimiter))
  }, [updateEditorContent, frontmatter, delimiter])

  const addTagToNote = (tagName) => {
    const cleanTag = tagName.trim().toLowerCase().replace(/\s+/g, '-')
    if (!cleanTag || currentTags.includes(cleanTag)) return

    const updatedTags = [...currentTags, cleanTag]
    setActiveNoteTags(updatedTags)
    setNewTagInput('')
  }

  const removeTagFromNote = (tagName) => {
    const updatedTags = currentTags.filter(t => t !== tagName)
    setActiveNoteTags(updatedTags)
  }

  return (
    <section className={`flex flex-col h-full flex-1 overflow-hidden ${isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-100'} relative`}>
      <EditorHeader
        activeVault={activeVault}
        activeNotePath={activeNotePath}
        saveStatus={saveStatus}
        editorMode={editorMode}
        onSave={() => saveActiveNote()}
        onOpenGraph={() => setIsGraphOpen(true)}
        isLight={isLight}
      />

      {activeNotePath && (
        <EditorTags
          currentTags={currentTags}
          newTagInput={newTagInput}
          setNewTagInput={setNewTagInput}
          onAddTag={addTagToNote}
          onRemoveTag={removeTagFromNote}
          isLight={isLight}
          maxTags={MAX_TAGS}
        />
      )}

      <div className={`grid flex-1 overflow-hidden ${effectiveEditorMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {effectiveShowEditor ? (
          <div className={`h-full overflow-hidden ${effectiveShowPreview ? (isLight ? 'border-r border-slate-300' : 'border-r border-slate-700') : ''}`}>
            <MDXEditorComponent
              value={bodyContent}
              onChange={handleEditorChange}
              isLight={isLight}
            />
          </div>
        ) : null}
        {effectiveShowPreview ? (
          <div className={`h-full overflow-auto p-3 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            <article
              className={`max-w-none prose ${isLight
                ? 'prose-slate'
                : 'prose-invert prose-headings:text-slate-100 prose-p:text-slate-200'
                }`}
            >
              <EditorPreview
                bodyContent={bodyContent}
                noteIndex={noteIndex}
                activeNotePath={activeNotePath}
                activeVault={activeVault}
                openNote={openNote}
                isLight={isLight}
              />
            </article>
            <EditorBacklinks
              noteIndex={noteIndex}
              activeNotePath={activeNotePath}
              activeVault={activeVault}
              openNote={openNote}
              isLight={isLight}
            />
          </div>
        ) : null}
      </div>

      {/* Graph View Modal */}
      <GraphViewModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        noteIndex={noteIndex}
        openNote={openNote}
        activeVault={activeVault}
        isLight={isLight}
      />
    </section>
  )
}
