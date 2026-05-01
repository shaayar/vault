# VaultNote

A local-first, file-based note-taking application with a clean three-panel workspace. Notes are stored as markdown files in a vault directory structure, making them portable and version-controllable.

## Features

- **Multiple vaults** — Create and switch between independent note collections
- **Folder hierarchy** — Organize notes in nested folders
- **Markdown editor** — Write notes with full markdown support (GFM) using MDXEditor
- **Frontmatter support** — Add title, tags, and timestamps to notes
- **Pinned notes** — Pin important notes for quick access
- **Recent notes** — Track and quickly reopen recently edited notes
- **Dark/Light theme** — Toggle between dark and light modes
- **Focus mode** — Hide sidebars for distraction-free writing (Ctrl+Shift+F)
- **Resizable panels** — Adjust folder, note list, and editor widths
- **Image support** — Upload and manage images in notes (jpeg, png, gif, webp, max 10MB)
- **Graph view** — Visualize note connections via wiki links
- **Advanced search** — Search across titles, content, and tags (Ctrl+K)
- **Keyboard shortcuts** — View all available keyboard shortcuts
- **Note templates** — Create notes from predefined templates
- **Wiki links** — Link notes using `[[Note Name]]` syntax
- **Backlinks** — See which notes reference the current note

## Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS 4, Zustand
- **Markdown**: MDXEditor (WYSIWYG), react-markdown, remark-gfm
- **Icons**: lucide-react
- **Graph Visualization**: d3-force
- **Backend**: Node.js Express
- **Storage**: Filesystem (vaults directory)

## Project Structure

```text
explorer/
├── api/                  # PHP backend API
│   └── index.php        # Vault CRUD, notes, folders, images API
├── src/
│   ├── api/           # Frontend API clients
│   │   ├── noteApi.js
│   │   ├── vaultApi.js
│   │   └── imageApi.js
│   ├── components/    # React components
│   │   ├── Editor/            # MDXEditor wrapper
│   │   ├── FileExplorer/      # Sidebar with folder tree
│   │   ├── FocusMode/         # Distraction-free mode
│   │   ├── GraphViewModal/    # Note graph visualization
│   │   ├── LandingScreen/     # Welcome screen
│   │   ├── NoteList/          # Note list for folder
│   │   ├── Search/            # Search modal (Ctrl+K)
│   │   ├── Shortcuts/         # Keyboard shortcuts modal
│   │   ├── StatusBar/         # Bottom status bar
│   │   ├── Templates/         # Note templates modal
│   │   └── VaultSwitcher/     # Header with vault selector
│   ├── store/         # Zustand state stores
│   │   ├── noteStore.js
│   │   └── vaultStore.js
│   ├── utils/         # Utility functions
│   │   ├── markdownUtils.js   # Frontmatter parsing
│   │   ├── fileUtils.js       # Path sanitization
│   │   ├── wikiLinks.js       # Backlinks & graph edges
│   │   ├── imageUtils.js      # Image processing
│   │   └── ...
│   ├── App.jsx        # Root component
│   ├── App.css        # Global styles
│   └── main.jsx       # Entry point
├── vaults/            # Vault storage (created at runtime)
│   └── [vault-name]/
│       ├── meta.json  # Vault metadata
│       ├── notes/     # Note files (.md)
│       └── images/    # Uploaded images
├── package.json
└── vite.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- PHP 8.1+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server. The PHP API should be served separately (see Production).

### Build

```bash
npm run build
```

### Production

```bash
# Build frontend
npm run build

# Start backend in production mode
cd nodejs-backend && npm start
```

## Vault Storage

Each vault is a directory under `vaults/`:

```text
vaults/
└── MyVault/
    ├── meta.json
    └── notes/
        ├── folder1/
        │   └── note.md
        └── note.md
```

Notes are `.md` files with optional YAML frontmatter:

```markdown
---
title: My Note
tags:
  - tag1
  - tag2
created_at: 2024-01-01T00:00:00Z
updated_at: 2024-01-02T00:00:00Z
---

Note content here...
```

## Keyboard Shortcuts

| Shortcut        | Action                          |
|-----------------|---------------------------------|
| `Ctrl+K`        | Open search modal               |
| `Ctrl+Shift+F`  | Toggle focus mode               |
| `Ctrl+G`        | Open graph view                 |
| `Ctrl+/`        | View keyboard shortcuts         |
| `Ctrl+S`        | Save current note               |
| `Ctrl+N`        | Create new note                 |
| `Escape`        | Close modals                    |

## Wiki Links

Link between notes using the `[[Note Name]]` syntax. The link will resolve to notes matching the title or filename. The graph view visualizes these connections, and the backlinks panel shows which notes reference the current note.

## API Endpoints

| Method   | Path                                   | Description                      |
|----------|----------------------------------------|----------------------------------|
| GET      | `/vaults`                              | List all vaults                  |
| POST     | `/vaults`                              | Create a vault                   |
| GET      | `/vaults/:vault/meta`                  | Get vault metadata               |
| PUT      | `/vaults/:vault/meta`                  | Update vault metadata            |
| GET      | `/vaults/:vault/notes`                 | Get note tree                    |
| GET      | `/vaults/:vault/notes/*`               | Get note content                 |
| POST     | `/vaults/:vault/notes/*`               | Create a note                    |
| PUT      | `/vaults/:vault/notes/*`               | Update a note                    |
| DELETE   | `/vaults/:vault/notes/*`               | Delete a note                    |
| PATCH    | `/vaults/:vault/notes/*`               | Rename a note                    |
| POST     | `/vaults/:vault/folders`               | Create a folder                  |
| DELETE   | `/vaults/:vault/folders/*`             | Delete a folder                  |
| PATCH    | `/vaults/:vault/folders/*`             | Rename a folder                  |
| POST     | `/vaults/:vault/images/upload`         | Upload image (max 10MB)          |
| DELETE   | `/vaults/:vault/images/:filename`      | Delete an image                  |

## License

MIT
