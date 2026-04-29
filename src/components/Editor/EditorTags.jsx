/**
 * Editor tags section for adding/removing tags
 */
export function EditorTags({ currentTags, newTagInput, setNewTagInput, onAddTag, onRemoveTag, isLight, maxTags = 6 }) {
  return (
    <div className={`border-b p-3 ${isLight ? 'border-slate-300 bg-slate-50' : 'border-slate-700 bg-slate-900'}`}>
      <div className="flex flex-wrap gap-2 mb-2">
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
                onClick={() => onRemoveTag(tag)}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
      {currentTags.length < maxTags && (
        <input
          type="text"
          className={`w-full rounded-md border px-2 py-1 ${isLight
            ? 'border-slate-300 bg-white text-slate-700'
            : 'border-slate-600 bg-slate-950 text-slate-200'
            }`}
          placeholder={`Add tag (press Enter to add)... Max ${maxTags} tags`}
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAddTag(newTagInput)
            }
          }}
        />
      )}
    </div>
  )
}
