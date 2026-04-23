import { useEffect, useMemo, useState } from 'react'
import { useNoteStore } from '../../store/noteStore'

/**
 * Focus Mode component for distraction-free writing.
 */
export function FocusMode({ isActive, onExit, activeNoteContent }) {
  const [showStats, setShowStats] = useState(false)
  const activeNotePath = useNoteStore((state) => state.activeNotePath)
  const updateEditorContent = useNoteStore((state) => state.updateEditorContent)
  const saveActiveNote = useNoteStore((state) => state.saveActiveNote)

  const { wordCount, readingTime } = useMemo(() => {
    const text = activeNoteContent || ''
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
    return {
      wordCount: words,
      readingTime: Math.ceil(words / 200),
    }
  }, [activeNoteContent])

  // Keyboard shortcuts for focus mode
  useEffect(() => {
    if (!isActive) return

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onExit()
      }
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        saveActiveNote()
      }
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault()
        setShowStats((value) => !value)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [isActive, onExit, saveActiveNote])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col relative">
      {/* Component Label */}
      <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded z-50 font-mono">FocusMode</div>
      {/* Focus Mode Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-100">Focus Mode</h1>
          <span className="text-xs text-slate-500">
            {activeNotePath?.split('/').pop()?.replace('.md', '') || 'Untitled Note'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
            onClick={() => setShowStats((value) => !value)}
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600"
            onClick={onExit}
          >
            Exit Focus
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {showStats && (
        <div className="px-8 py-2 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span>Words: {wordCount}</span>
            <span>Reading time: {readingTime} min</span>
            <span>Characters: {activeNoteContent?.length || 0}</span>
            <span>Paragraphs: {activeNoteContent?.split('\n\n').filter(p => p.trim()).length || 0}</span>
          </div>
        </div>
      )}

      {/* Writing Area */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-full max-w-4xl">
          <textarea
            className="w-full h-full min-h-[600px] bg-transparent text-slate-200 text-lg leading-relaxed outline-none resize-none font-serif"
            value={activeNoteContent}
            onChange={(event) => updateEditorContent(event.target.value)}
            placeholder="Start writing in focus mode..."
            autoFocus
          />
        </div>
      </div>

      {/* Focus Mode Footer */}
      <div className="px-8 py-4 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>Press <kbd className="px-2 py-1 bg-slate-800 rounded">Esc</kbd> to exit</span>
            <span>Press <kbd className="px-2 py-1 bg-slate-800 rounded">Ctrl+S</kbd> to save</span>
            <span>Press <kbd className="px-2 py-1 bg-slate-800 rounded">Ctrl+Shift+S</kbd> to toggle stats</span>
          </div>
          <span>Distraction-free writing environment</span>
        </div>
      </div>
    </div>
  )
}
