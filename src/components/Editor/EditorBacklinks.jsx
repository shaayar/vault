import { findBacklinks } from '../../utils/wikiLinks'

/**
 * Editor backlinks section showing which notes reference the current note
 */
export function EditorBacklinks({ noteIndex, activeNotePath, activeVault, openNote, isLight }) {
  const backlinks = findBacklinks(noteIndex, activeNotePath)

  if (!activeNotePath) return null

  return (
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
                onClick={() => openNote(activeVault.id, b.path)}
              >
                {b.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
