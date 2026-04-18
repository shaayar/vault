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
api/index.php          # REST router; vault ops + notes + folders + meta
vaults/                # user data; .htaccess blocks PHP execution here
src/
  App.jsx              # theme, focus mode, panel widths, resize handles
  main.jsx             # root + App.css
  App.css              # tailwind import + globals
  api/                 # fetch helpers (vaultApi, noteApi)
  store/               # vaultStore, noteStore (Zustand)
  components/        # VaultSwitcher, Sidebar, NoteList, Editor, GraphViewModal
  utils/               # markdownUtils, fileUtils, wikiLinks (backlinks + graph edges)
```

## API surface (implemented)

- `GET/POST /api/vaults`, `GET/PUT /api/vaults/{vault}/meta`
- `GET /api/vaults/{vault}/notes` — recursive tree
- `GET/POST/PUT/DELETE /api/vaults/{vault}/notes/{path...}` — `.md` only
- `POST /api/vaults/{vault}/folders`, `DELETE .../folders/{path...}` (empty folder only)

Path rules: sanitized segments, `realpath` boundary under `vaults/`.

## Frontend state

- **vaultStore**: `vaults`, `activeVault`, `fetchVaults`, `createVault`, …
- **noteStore**: tree, selection, `noteIndex` (per-note `{ path, title, tags, content, updatedAt, createdAt }` from frontmatter + body), search/tag filters, pins (`meta.json`), recent (localStorage `vaultnote:recent:{vault}`), sort modes, editor autosave.

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
