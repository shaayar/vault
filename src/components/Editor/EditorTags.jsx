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
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${isLight
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                } transition-colors duration-200`}
            >
              #{tag}
              <button
                type="button"
                className={`ml-1 hover:text-red-200 transition-colors duration-200`}
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
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${isLight
            ? 'border-slate-300 bg-white text-slate-700 placeholder-slate-400'
            : 'border-slate-600 bg-slate-800 text-slate-200 placeholder-slate-500'
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
