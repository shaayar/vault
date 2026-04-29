import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { encodeNotePath } from '../../utils/notePath'

/**
 * Note list panel placeholder for scaffold.
 */
export function NoteList({ isCollapsed, onToggleCollapse, isLight, noteListWidth, integratedMode = false, onNoteContextMenu }) {
  const navigate = useNavigate()
  const activeVault = useVaultStore((state) => state.activeVault)
  const selectedFolderPath = useNoteStore((state) => state.selectedFolderPath)
  const notesInFolder = useNoteStore((state) => state.notesInFolder)
  const activeNotePath = useNoteStore((state) => state.activeNotePath)
  const noteIndex = useNoteStore((state) => state.noteIndex)
  const pinnedNotes = useNoteStore((state) => state.pinnedNotes)
  const sortMode = useNoteStore((state) => state.sortMode)
  const togglePinnedNote = useNoteStore((state) => state.togglePinnedNote)
  const searchQuery = useNoteStore((state) => state.searchQuery)
  const setSearchQuery = useNoteStore((state) => state.setSearchQuery)
  const activeTag = useNoteStore((state) => state.activeTag)
  const setActiveTag = useNoteStore((state) => state.setActiveTag)
  const openNote = useNoteStore((state) => state.openNote)
  const createNoteInFolder = useNoteStore((state) => state.createNoteInFolder)
  const deleteNoteByPath = useNoteStore((state) => state.deleteNoteByPath)
  const isLoading = useNoteStore((state) => state.isLoading)
  const lowerQuery = integratedMode ? '' : searchQuery.trim().toLowerCase()
  const noteMetaByPath = new Map(noteIndex.map((entry) => [entry.path, entry]))
  const availableTags = [...new Set(noteIndex.flatMap((entry) => entry.tags))].sort((a, b) => a.localeCompare(b))
  const effectiveActiveTag = integratedMode ? '' : activeTag

  const visibleNotes = notesInFolder.filter((note) => {
    const meta = noteMetaByPath.get(note.path)
    const byTag = effectiveActiveTag ? Boolean(meta?.tags?.includes(effectiveActiveTag)) : true
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

  const handleCreateNote = async () => {
    if (!activeVault) return
    const noteTitle = window.prompt('New note title:')
    if (!noteTitle) return
    await createNoteInFolder(activeVault, selectedFolderPath, noteTitle)
  }

  return (
    <section className={`h-full overflow-hidden ${integratedMode ? '' : 'border-r'} ${isLight ? (integratedMode ? '' : 'border-slate-300 bg-slate-50') : (integratedMode ? '' : 'border-slate-700 bg-slate-900/30')} relative`} style={isCollapsed ? {} : (integratedMode ? {} : { width: `${noteListWidth}px` })}>


      {!integratedMode ? (
        <div className="p-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-slate-800/50 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              placeholder="Search the Vault..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="bg-indigo-500/20 text-indigo-400 px-3 py-2 rounded-lg">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Notes Header */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-slate-800`}>
        <h2 className={`font-bold text-sm text-slate-600 uppercase tracking-[0.2em]`}>Notes</h2>
        <span className="text-slate-500">({sortedVisibleNotes.length})</span>
        {!integratedMode && (
          <button
            type="button"
            className="ml-auto rounded-md border px-2 py-1 border-slate-600 text-slate-200 hover:bg-slate-800"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className={`p-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {!integratedMode ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-slate-500">
                  {selectedFolderPath ? `Folder: ${selectedFolderPath}` : 'Root folder'}
                </span>
                <button
                  type="button"
                  className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                  onClick={handleCreateNote}
                  disabled={!activeVault}
                >
                  New Note
                </button>
              </div>
              <input
                type="text"
                className={`mb-2 w-full rounded-md border px-2 py-1 ${isLight
                  ? 'border-slate-300 bg-white text-slate-700'
                  : 'border-slate-600 bg-slate-900 text-slate-200'
                  }`}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search titles and content..."
              />
              <div className="mb-3 flex flex-wrap gap-1">
                <button
                  type="button"
                  className={`rounded px-2 py-1 ${effectiveActiveTag === '' ? 'bg-indigo-600 text-white' : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                    }`}
                  onClick={() => setActiveTag('')}
                >
                  All tags
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`rounded px-2 py-1 ${effectiveActiveTag === tag ? 'bg-indigo-600 text-white' : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}
                    onClick={() => setActiveTag(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-6 w-full animate-pulse rounded bg-slate-800" />
              <div className="h-6 w-full animate-pulse rounded bg-slate-800" />
              <div className="h-6 w-10/12 animate-pulse rounded bg-slate-800" />
            </div>
          ) : null}
          {!isLoading && !activeVault ? (
            <p className="text-slate-500">Select a vault to see notes.</p>
          ) : null}
          <div className="space-y-1">
            {sortedVisibleNotes.map((note) => (
              <div key={note.path} className="flex items-center gap-1">
                <button
                  type="button"
                  className={`flex-1 rounded px-2 py-1 text-left ${activeNotePath === note.path
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  onClick={() => {
                    openNote(activeVault, note.path)
                    const encodedPath = encodeNotePath(note.path)
                    navigate(`/${activeVault}/${encodedPath}`)
                  }}
                  onContextMenu={(event) => {
                    if (!onNoteContextMenu) return
                    event.preventDefault()
                    onNoteContextMenu({ path: note.path, name: note.name, parentPath: note.path.split('/').slice(0, -1).join('/') }, event)
                  }}
                >
                  {note.name}
                </button>
                {!integratedMode ? (
                  <>
                    <button
                      type="button"
                      className={`rounded px-2 py-1 ${pinnedNotes.includes(note.path)
                        ? 'text-amber-300 hover:bg-amber-950/40'
                        : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      onClick={() => togglePinnedNote(activeVault, note.path)}
                    >
                      {pinnedNotes.includes(note.path) ? '★' : '☆'}
                    </button>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-rose-300 hover:bg-rose-950/40"
                      onClick={() => {
                        if (!window.confirm(`Delete note "${note.name}"?`)) return
                        deleteNoteByPath(activeVault, note.path)
                      }}
                    >
                      Del
                    </button>
                  </>
                ) : null}
              </div>
            ))}
            {!isLoading && activeVault && sortedVisibleNotes.length === 0 ? (
              <p className="text-slate-500">No notes in this folder yet.</p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
