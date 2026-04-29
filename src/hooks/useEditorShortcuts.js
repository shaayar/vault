import { useEffect } from 'react'

/**
 * Custom hook for editor keyboard shortcuts
 */
export function useEditorShortcuts({ onSave, onSetEditorMode }) {
  useEffect(() => {
    const handleKeydown = (event) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        onSave()
      }

      if (event.shiftKey && key === 'e') {
        event.preventDefault()
        onSetEditorMode('split')
      }

      if (key === 'e') {
        event.preventDefault()
        onSetEditorMode('edit')
      }

      if (key === 'p') {
        event.preventDefault()
        onSetEditorMode('preview')
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [onSave, onSetEditorMode])
}
