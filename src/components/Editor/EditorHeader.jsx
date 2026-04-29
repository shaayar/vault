import { ChevronRight, Save } from 'lucide-react'

/**
 * Editor header with breadcrumbs, save status, and mode indicator
 */
export function EditorHeader({ activeVault, activeNotePath, saveStatus, editorMode, onSave, isLight }) {
  const breadcrumbs = activeNotePath ? activeNotePath.split('/').filter(Boolean) : []

  return (
    <header className={`border-b p-3 ${isLight ? 'border-slate-300' : 'border-slate-700'}`}>
      <div className="flex items-center justify-between gap-2">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          <span className={`font-medium truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeVault}</span>
          {breadcrumbs.length > 0 && <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />}
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className={`text-sm truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {crumb.replace('.md', '')}
              {index < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 inline mx-1 flex-shrink-0" />}
            </span>
          ))}
        </div>

        {/* Save Status & Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-sm font-medium whitespace-nowrap ${saveStatus === 'saving' ? 'text-blue-500' : saveStatus === 'unsaved' ? 'text-orange-500' : 'text-green-500'}`}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : 'Saved'}
          </span>
          <button
            className={`p-2 rounded-lg ${isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'}`}
            onClick={onSave}
            disabled={saveStatus === 'saving'}
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>

        {/* Editor Mode */}
        <span className={`${isLight ? 'text-slate-400' : 'text-slate-500'} font-mono whitespace-nowrap flex-shrink-0`}>
          {editorMode.toUpperCase()} MODE
        </span>
      </div>
    </header>
  )
}
