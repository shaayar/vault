# VaultNote — context for AI coding agents

Update this file when architecture, API contracts, or major workflows change.

## Product

**VaultNote** — local-first Markdown notes in the browser, PHP filesystem API, no database. Notes are `.md` under `vaults/{vault}/notes/`; vault metadata in `vaults/{vault}/meta.json`.

## Stack

| Area | Tech |
|------|------|
| UI | React 19, Vite 8, Tailwind 4 (`@tailwindcss/vite`), Zustand |
| Markdown | `react-markdown`, `remark-gfm` |
| YAML | `js-yaml` via `src/utils/markdownUtils.js` |
| API | PHP 8+ single entry `api/index.php` (JSON `{ success, data \| error }`) |
| Host | Shared PHP (no Node server in prod) |

## Repo layout (high signal)

```markdown
explorer/
├── api/                  # PHP backend API
│   └── index.php        # Vault CRUD, notes & folders API
├── src/
│   ├── api/           # Frontend API clients
│   │   ├── noteApi.js
│   │   └── vaultApi.js
│   ├── components/    # React components
│   │   ├── FileExplorer/  # NEW: Obsidian-style sidebar
│   │   │   ├── ObsidianSidebar.jsx
│   │   │   ├── FolderNode.jsx
│   │   │   ├── ContextMenu.jsx
│   │   │   ├── RenameInput.jsx
│   │   │   ├── fileExplorerStore.js  # Zustand store with real vault integration
│   │   │   ├── interactions.js
│   │   │   └── indexedDB.js
│   │   ├── Editor/  # Enhanced with Obsidian-like features
│   │   ├── NoteList/
│   │   ├── Sidebar/  # ORIGINAL: Basic sidebar (still exists)
│   │   ├── VaultSwitcher/
│   │   ├── GraphViewModal/
│   │   ├── FocusMode/
│   │   └── StatusBar/
│   ├── store/           # Zustand state stores
│   │   ├── noteStore.js    # Manages note tree, active note, editor mode
│   │   └── vaultStore.js   # Manages vaults, active vault
│   ├── utils/           # Utility functions
│   │   ├── fileOperations.js  # NEW: File operations for real vault integration
│   │   ├── treeConverter.js   # NEW: Converts between noteStore and ObsidianSidebar formats
│   │   ├── markdownUtils.js
│   │   ├── fileUtils.js
│   │   └── wikiLinks.js
│   ├── App.jsx           # Root layout component
│   ├── App.css           # Global styles
│   └── main.jsx          # Entry point
├── vaults/                # User data (created at runtime)
│   └── [vault-name]/
│       ├── meta.json      # Vault metadata
│       └── notes/         # Markdown files
└── api/index.php          # PHP backend API
```

## API surface (implemented)

- `GET/POST /api/vaults`, `GET/PUT /api/vaults/{vault}/meta`
- `GET /api/vaults/{vault}/notes` — recursive tree
- `GET/POST/PUT/DELETE /api/vaults/{vault}/notes/{path...}` — `.md` only
- `POST /api/vaults/{vault}/folders`, `PATCH/DELETE .../folders/{path...}` (empty folder only)
- `PATCH /api/vaults/{vault}/notes/{path...}` and `PATCH .../folders/{path...}` — rename in place

## Frontend state

- **vaultStore**: `vaults`, `activeVault`, `isLoading`, `error`
- **noteStore**: `noteTree`, `selectedFolderPath`, `notesInFolder`, `activeNotePath`, `activeNoteContent`, `editorMode`, `saveStatus`, `noteIndex`, `searchQuery`, `activeTag`, `pinnedNotes`, `recentNotes`, `sortMode`, `error`
- **fileExplorerStore** (NEW): `nodesById`, `childrenMap`, `rootNodes`, `expandedNodes`, `selectedNodeId`, `contextMenu`, `renamingNodeId`, `isLoading`, `error`

## Conventions

- Named exports for components; default export only `App`.
- Destructive actions: `window.confirm` before delete vault/note (where applicable).
- Theme: `localStorage` key `vaultnote:theme` (`dark`|`light`); `document.documentElement.classList` toggles `light`.
- Panel widths: `vaultnote:sidebarWidth`, `vaultnote:noteListWidth` (localStorage).

## Wiki links

- `[[Display Name]]` in markdown body → internal navigation; resolution matches `title` or filename stem (see `Editor.jsx` + `wikiLinks.js`).

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Phase 3 (current)

- **Backlinks**: preview pane "Referenced by" uses `findBacklinks()` in `src/utils/wikiLinks.js`.
- **Graph**: `GraphViewModal` + `d3-force` simulation; opened from Editor **Graph** button.
- **Optional AI**: not implemented; add settings + user-supplied API key if needed.

## Hosting note

- Apache rewrite may be required so `/api/*` maps to `api/index.php` on some shared hosts.

When picking up work: read `api/index.php` route order, then the Zustand store, then the component that owns the UX.

## Security (PHP)

- Traversal blocked; only `.md` for note CRUD; `vaults/.htaccess` disables PHP in vault tree.

## Phase 3 (current)

- **Backlinks**: preview pane "Referenced by" uses `findBacklinks()` in `src/utils/wikiLinks.js`.
- **Graph**: `GraphViewModal` + `d3-force` simulation; opened from Editor **Graph** button.
- **Optional AI**: not implemented; add settings + user-supplied API key if needed.

## Recent Major Work

### **✅ COMPLETED: Obsidian-Style Sidebar Integration**
- **FileExplorer Components**: Complete sidebar with hierarchical folder tree, context menus, inline renaming
- **Real Vault Integration**: Connected to existing noteStore/vaultStore for live data
- **Tree Engine**: Advanced CRUD operations with validation and caching
- **Interactions System**: Keyboard navigation, selection patterns, context menus
- **File Operations**: Full CRUD with actual PHP backend API

### **🔧 CURRENT STATUS:**
- **Dynamic Loading**: ✅ ObsidianSidebar loads real vault data (demo-vault files)
- **File Operations**: ✅ Create, rename, delete notes/folders via PHP API
- **UI Features**: ✅ Context menus, inline renaming, expand/collapse all
- **Integration**: ✅ Seamlessly integrated with existing VaultNote architecture
- **Error Handling**: ✅ Proper error states and user feedback

### **🐛 KNOWN LIMITATIONS:**
- **API Dependencies**: Requires PHP backend running for full functionality
- **File Types**: Markdown files only (no binary file support)
- **No Real-time Sync**: Local-first only (no collaboration features)
- **Mobile Support**: Limited touch interactions (desktop-focused)

### **🎯 NEXT STEPS (if needed):**
1. **PHP Backend Setup**: Ensure Apache/nginx routes `/api/*` to `api/index.php`
2. **Enhanced Search**: Implement full-text search across vault content
3. **Mobile Optimization**: Add touch-friendly interactions and responsive design
4. **Advanced Features**: Tags, templates, advanced search, file attachments

The codebase follows clean React patterns with proper separation of concerns and comprehensive Obsidian-style functionality.
