import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'

/**
 * StatusBar component for displaying file status and vault information.
 */
export function StatusBar({ isLight }) {
  const activeVault = useVaultStore((state) => state.activeVault)
  const activeNotePath = useNoteStore((state) => state.activeNotePath)
  const noteIndex = useNoteStore((state) => state.noteIndex)
  const saveStatus = useNoteStore((state) => state.saveStatus)
  const activeNoteContent = useNoteStore((state) => state.activeNoteContent)
  const lastSavedContent = useNoteStore((state) => state.lastSavedContent)

  // Calculate word count and character count
  const wordCount = activeNoteContent ? activeNoteContent.trim().split(/\s+/).filter(word => word.length > 0).length : 0
  const charCount = activeNoteContent ? activeNoteContent.length : 0
  const hasUnsavedChanges = activeNoteContent !== lastSavedContent

  return (
    <footer className={`flex items-center justify-between px-4 py-1.5 border-t relative ${isLight
        ? 'bg-slate-50 border-slate-200 text-slate-600'
        : 'bg-slate-900 border-slate-700 text-slate-400'
      }`}>
      <div className="flex items-center gap-4">
        {/* File Status */}
        <div className="flex items-center gap-2">
          <span className={`font-medium ${saveStatus === 'saving'
              ? 'text-blue-500'
              : hasUnsavedChanges
                ? 'text-orange-500'
                : 'text-white'
            }`}>
            {saveStatus === 'saving'
              ? 'Saving...'
              : hasUnsavedChanges
                ? 'Unsaved'
                : 'Saved'
            }
          </span>
          {activeNotePath && (
            <>
              <span className="text-slate-500">|</span>
              <span className="truncate max-w-32" title={activeNotePath}>
                {activeNotePath.split('/').pop()?.replace('.md', '') || 'Untitled'}
              </span>
            </>
          )}
        </div>

        {/* Document Stats */}
        {activeNotePath && (
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Vault Info */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">account_tree</span>
          <span>{activeVault || 'No vault'}</span>
          <span className="text-slate-500">({noteIndex.length} notes)</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-2 py-1 rounded text-xs ${isLight
                ? 'hover:bg-slate-200 text-slate-600'
                : 'hover:bg-slate-800 text-slate-400'
              }`}
            title="New Note (Ctrl+N)"
          >
            <span className="material-symbols-outlined text-[14px]">note_add</span>
          </button>
          <button
            type="button"
            className={`px-2 py-1 rounded text-xs ${isLight
                ? 'hover:bg-slate-200 text-slate-600'
                : 'hover:bg-slate-800 text-slate-400'
              }`}
            title="Search (Ctrl+F)"
          >
            <span className="material-symbols-outlined text-[14px]">search</span>
          </button>
          <button
            type="button"
            className={`px-2 py-1 rounded text-xs ${isLight
                ? 'hover:bg-slate-200 text-slate-600'
                : 'hover:bg-slate-800 text-slate-400'
              }`}
            title="Settings"
          >
            <span className="material-symbols-outlined text-[14px]">settings</span>
          </button>
        </div>
      </div>
    </footer>
  )
}
