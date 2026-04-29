# VaultNote — context for AI coding agents

Update this file when architecture, API contracts, or major workflows change.

## Product

**VaultNote** — local-first Markdown notes in the browser, PHP filesystem API, no database. Notes are `.md` under `vaults/{vault}/notes/`; vault metadata in `vaults/{vault}/meta.json`.

## Stack

| Area     | Tech                                                                     |
|----------|--------------------------------------------------------------------------|
| UI       | React 19, Vite 8, Tailwind 4 ( `@tailwindcss/vite` ), Zustand          |
| Markdown | `@mdxeditor/editor` (WYSIWYG), `react-markdown`, `remark-gfm`           |
| YAML     | `js-yaml` via `src/utils/markdownUtils.js`                              |
| API      | PHP 8+ single entry `api/index.php` ( JSON `{ success, data \| error }` ) |
| Icons    | `lucide-react`                                                           |
| Graph    | `d3-force` for visualization                                            |
| Host     | Shared PHP (no Node server in prod)                                      |

## Repo layout (high signal)

```markdown
api/index.php          # REST router; vault ops + notes + folders + meta + images
vaults/                # user data; .htaccess blocks PHP execution here
src/
  App.jsx              # theme, focus mode, panel widths, resize handles
  main.jsx             # root + App.css
  App.css              # tailwind import + globals
  api/                 # fetch helpers (vaultApi, noteApi, imageApi)
  store/               # vaultStore, noteStore (Zustand)
  components/
    Editor/            # MDXEditor wrapper, editor styles
    FileExplorer/      # Sidebar with folder tree, context menu, rename
    FocusMode/         # Distraction-free reading mode
    GraphViewModal/    # d3-force note graph visualization
    LandingScreen/     # Welcome/onboarding screen
    NoteList/          # Note list for selected folder
    Search/            # Search modal (Ctrl+K)
    Shortcuts/         # Keyboard shortcuts modal
    Sidebar/           # Legacy sidebar (backup exists)
    StatusBar/         # Bottom status bar
    Templates/         # Note templates modal
    VaultSwitcher/     # Header with vault selector
  hooks/               # useResponsive (mobile/tablet breakpoints)
  utils/
    markdownUtils.js   # frontmatter parsing, YAML handling
    fileUtils.js       # path sanitization, safe segments
    wikiLinks.js       # backlinks, graph edge detection
    imageUtils.js      # image compression/processing
    fileMetadata.js    # file metadata extraction
    fileOperations.js  # file operation helpers
    dragDrop.js        # drag-and-drop handlers
    errorHandler.js    # centralized error handling
    treeConverter.js   # tree structure conversion
    treePerformance.js # tree rendering optimizations
```

## API surface (implemented)

- `GET/POST /api/vaults`, `GET/PUT /api/vaults/{vault}/meta`
- `GET /api/vaults/{vault}/notes` — recursive tree
- `GET/POST/PUT/DELETE /api/vaults/{vault}/notes/{path...}` — `.md` only
- `POST /api/vaults/{vault}/folders`, `DELETE .../folders/{path...}` (empty folder only)
- `PATCH /api/vaults/{vault}/notes/{path...}` and `PATCH .../folders/{path...}` — rename in place
- `POST /api/vaults/{vault}/images/upload` — image upload (max 10MB, jpeg/png/gif/webp)
- `DELETE /api/vaults/{vault}/images/{filename}` — image deletion

Path rules: sanitized segments, `realpath` boundary under `vaults/`.

## Frontend state

- **vaultStore**: `vaults`, `activeVault`, `fetchVaults`, `createVault`, …
- **noteStore**: tree, selection, `noteIndex` (per-note `{ path, title, tags, content, updatedAt, createdAt }` from frontmatter + body), search/tag filters, pins (`meta.json`), recent (localStorage `vaultnote:recent:{vault}`), sort modes, editor autosave. `createNoteInFolder` generates unique filenames (e.g., "Note (1).md") on conflicts.
- **fileExplorerStore**: manages file tree state with `createNode`, `deleteNode`, `renameNode`, `renamingNodeId` (cleared on node creation to prevent spurious rename prompts).

## Conventions

- Named exports for components; default export only `App`.
- Destructive actions: `window.confirm` before delete vault/note (where applicable).
- Theme: `localStorage` key `vaultnote:theme` (`dark`|`light`); `document.documentElement.classList` toggles `light`.
- Panel widths: `vaultnote:sidebarWidth`, `vaultnote:noteListWidth`.

## Wiki links

- `[[Display Name]]` in markdown body → internal navigation; resolution matches `title` or filename stem (see `Editor.jsx` + `wikiLinks.js`).

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Security (PHP)

- Traversal blocked; only `.md` for note CRUD; `vaults/.htaccess` disables PHP in vault tree.

## Phase 3 (current)

- **Backlinks**: preview pane “Referenced by” uses `findBacklinks()` in `src/utils/wikiLinks.js`.
- **Graph**: `GraphViewModal` + `d3-force` simulation; opened from Editor **Graph** button.
- **Optional AI**: not implemented; add settings + user-supplied API key if needed.

## Hosting note

- Apache rewrite may be required so `/api/*` maps to `api/index.php` on some shared hosts.

When picking up work: read `api/index.php` route order, then the Zustand store, then the component that owns the UX.
