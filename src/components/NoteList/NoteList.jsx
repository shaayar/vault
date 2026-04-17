import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'

/**
 * Note list panel placeholder for scaffold.
 */
export function NoteList({ isCollapsed, onToggleCollapse, isLight }) {
  const activeVault = useVaultStore((state) => state.activeVault)
  const selectedFolderPath = useNoteStore((state) => state.selectedFolderPath)
  const notesInFolder = useNoteStore((state) => state.notesInFolder)
  const activeNotePath = useNoteStore((state) => state.activeNotePath)
  const noteIndex = useNoteStore((state) => state.noteIndex)
  const pinnedNotes = useNoteStore((state) => state.pinnedNotes)
  const recentNotes = useNoteStore((state) => state.recentNotes)
  const sortMode = useNoteStore((state) => state.sortMode)
  const setSortMode = useNoteStore((state) => state.setSortMode)
  const togglePinnedNote = useNoteStore((state) => state.togglePinnedNote)
  const searchQuery = useNoteStore((state) => state.searchQuery)
  const setSearchQuery = useNoteStore((state) => state.setSearchQuery)
  const activeTag = useNoteStore((state) => state.activeTag)
  const setActiveTag = useNoteStore((state) => state.setActiveTag)
  const openNote = useNoteStore((state) => state.openNote)
  const createNoteInFolder = useNoteStore((state) => state.createNoteInFolder)
  const deleteNoteByPath = useNoteStore((state) => state.deleteNoteByPath)
  const isLoading = useNoteStore((state) => state.isLoading)
  const lowerQuery = searchQuery.trim().toLowerCase()
  const noteMetaByPath = new Map(noteIndex.map((entry) => [entry.path, entry]))
  const availableTags = [...new Set(noteIndex.flatMap((entry) => entry.tags))].sort((a, b) => a.localeCompare(b))

  const visibleNotes = notesInFolder.filter((note) => {
    const meta = noteMetaByPath.get(note.path)
    const byTag = activeTag ? Boolean(meta?.tags?.includes(activeTag)) : true
    if (!byTag) return false
    if (!lowerQuery) return true
    const title = String(meta?.title ?? note.name).toLowerCase()
    const body = String(meta?.content ?? '').toLowerCase()
    return title.includes(lowerQuery) || body.includes(lowerQuery)
  })

  const sortedVisibleNotes = [...visibleNotes].sort((a, b) => {
    const metaA = noteMetaByPath.get(a.path)
    const metaB = noteMetaByPath.get(b.path)
    if (sortMode === 'alpha') {
      return a.name.localeCompare(b.name)
    }
    if (sortMode === 'created_desc') {
      return String(metaB?.createdAt ?? '').localeCompare(String(metaA?.createdAt ?? ''))
    }
    return String(metaB?.updatedAt ?? '').localeCompare(String(metaA?.updatedAt ?? ''))
  })

  const recentInFolder = recentNotes
    .map((path) => notesInFolder.find((note) => note.path === path))
    .filter(Boolean)

  const handleCreateNote = async () => {
    if (!activeVault) return
    const noteTitle = window.prompt('New note title:')
    if (!noteTitle) return
    await createNoteInFolder(activeVault, selectedFolderPath, noteTitle)
  }

  return (
    <section className={`h-full overflow-hidden border-r ${isLight ? 'border-slate-300 bg-slate-50' : 'border-slate-700 bg-slate-900/30'}`}>
      <div className={`flex items-center gap-2 border-b p-3 ${isLight ? 'border-slate-300' : 'border-slate-700'}`}>
        <h2 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Notes</h2>
        <button
          type="button"
          className={`ml-auto rounded-md border px-2 py-1 text-xs ${
            isLight
              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'border-slate-600 text-slate-200 hover:bg-slate-800'
          }`}
          onClick={onToggleCollapse}
        >
          {isCollapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      {!isCollapsed && (
        <div className={`p-3 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              {selectedFolderPath ? `Folder: ${selectedFolderPath}` : 'Root folder'}
            </span>
            <button
              type="button"
              className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              onClick={handleCreateNote}
              disabled={!activeVault}
            >
              + Note
            </button>
          </div>
          <input
            type="text"
            className={`mb-2 w-full rounded-md border px-2 py-1 text-xs ${
              isLight
                ? 'border-slate-300 bg-white text-slate-700'
                : 'border-slate-600 bg-slate-900 text-slate-200'
            }`}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search titles and content..."
          />
          <div className="mb-3">
            <select
              className={`w-full rounded-md border px-2 py-1 text-xs ${
                isLight
                  ? 'border-slate-300 bg-white text-slate-700'
                  : 'border-slate-600 bg-slate-900 text-slate-200'
              }`}
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
            >
              <option value="updated_desc">Sort: Date Modified</option>
              <option value="created_desc">Sort: Date Created</option>
              <option value="alpha">Sort: Alphabetical</option>
            </select>
          </div>
          {recentInFolder.length > 0 ? (
            <div className="mb-3">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">Recently opened</p>
              <div className="space-y-1">
                {recentInFolder.map((note) => (
                  <button
                    key={`recent-${note.path}`}
                    type="button"
                    className="w-full rounded px-2 py-1 text-left text-xs text-slate-400 hover:bg-slate-800"
                    onClick={() => openNote(activeVault, note.path)}
                  >
                    {note.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mb-3 flex flex-wrap gap-1">
            <button
              type="button"
              className={`rounded px-2 py-1 text-[11px] ${
                activeTag === '' ? 'bg-indigo-600 text-white' : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
              }`}
              onClick={() => setActiveTag('')}
            >
              All tags
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`rounded px-2 py-1 text-[11px] ${
                  activeTag === tag ? 'bg-indigo-600 text-white' : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                }`}
                onClick={() => setActiveTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-6 w-full animate-pulse rounded bg-slate-800" />
              <div className="h-6 w-full animate-pulse rounded bg-slate-800" />
              <div className="h-6 w-10/12 animate-pulse rounded bg-slate-800" />
            </div>
          ) : null}
          {!isLoading && !activeVault ? (
            <p className="text-xs text-slate-500">Select a vault to see notes.</p>
          ) : null}
          <div className="space-y-1">
            {sortedVisibleNotes.map((note) => (
              <div key={note.path} className="flex items-center gap-1">
                <button
                  type="button"
                  className={`flex-1 rounded px-2 py-1 text-left text-xs ${
                    activeNotePath === note.path
                      ? 'bg-slate-700 text-slate-100'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  onClick={() => openNote(activeVault, note.path)}
                >
                  {note.name}
                </button>
                <button
                  type="button"
                  className={`rounded px-2 py-1 text-xs ${
                    pinnedNotes.includes(note.path)
                      ? 'text-amber-300 hover:bg-amber-950/40'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                  onClick={() => togglePinnedNote(activeVault, note.path)}
                >
                  {pinnedNotes.includes(note.path) ? '★' : '☆'}
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs text-rose-300 hover:bg-rose-950/40"
                  onClick={() => {
                    if (!window.confirm(`Delete note "${note.name}"?`)) return
                    deleteNoteByPath(activeVault, note.path)
                  }}
                >
                  Del
                </button>
              </div>
            ))}
            {!isLoading && activeVault && sortedVisibleNotes.length === 0 ? (
              <p className="text-xs text-slate-500">No notes in this folder yet.</p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
