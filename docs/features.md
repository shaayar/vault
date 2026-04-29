# VaultNote Features

## Core Features

### Vault Management

- [x] Create new vault from header button
- [x] List all vaults in sidebar
- [x] Switch between vaults
- [x] Auto-redirect to vault on creation
- [x] Delete vault (with confirmation)
- [x] Rename vault (double-click vault name)

### File Explorer

- [x] Display folder tree structure
- [x] Expand/collapse folders
- [x] Create new note in folder
- [x] Create new subfolder
- [x] Delete note
- [x] Delete empty folder
- [x] Rename note (via context menu)
- [x] Rename folder (via context menu)
- [x] Right-click context menu
- [x] Copy note/folder path
- [x] Drag and drop notes to move between folders
- [x] Drag and drop folders to move (basic)

### Note Editor

- [x] WYSIWYG markdown editing (MDXEditor)
- [x] Split view mode (edit + preview)
- [x] Preview mode only
- [x] Edit mode only
- [x] Auto-save after 1.5s delay
- [x] Manual save (Ctrl+S)
- [x] Keyboard shortcuts for mode switching
- [x] Frontmatter parsing (title, tags, dates)
- [x] Tag input with MAX_TAGS limit (10)
- [x] Tag removal
- [x] Wiki links `[[Note Name]]` support
- [x] Backlinks display ("Referenced by")

### Search

- [x] Global search modal (Ctrl+K)
- [x] Search by title
- [x] Search by content
- [x] Search by tags
- [x] Keyboard navigation in results
- [x] Escape to close

### UI/UX

- [x] Dark/Light theme toggle
- [x] Responsive sidebar (resizable panels)
- [x] Focus mode (distraction-free reading)
- [x] Keyboard shortcuts help modal
- [x] Templates modal (basic structure)
- [x] Graph view (d3-force visualization)
- [x] Status bar with save status

### Note Operations

- [x] Sync note filename with title
- [x] Auto-generate unique filenames on conflicts
- [x] Image upload (drag & drop)
- [x] Image compression
- [x] Note pinning (via meta.json)
- [x] Recent notes tracking

## Technical Features

### API

- [x] RESTful PHP API
- [x] JSON response format
- [x] Path sanitization
- [x] Directory traversal protection
- [x] URL encoding for paths with spaces

### State Management

- [x] Zustand stores (vaultStore, noteStore, fileExplorerStore)
- [x] URL-based routing for notes
- [x] Deep linking to specific notes

### Deployment

- [x] Docker support (PHP + Apache)
- [x] Render.com deployment config
- [x] Vercel frontend deployment
- [x] Environment variable configuration

### Security

- [x] .htaccess blocks PHP in vaults
- [x] Path validation
- [x] File type restrictions (.md only)
- [x] Size limits for uploads

## Missing/Incomplete Features

### Planned but Not Implemented

- [ ] Full vault delete with confirmation
- [ ] Vault rename
- [ ] Note templates (currently placeholder)
- [ ] Full mobile responsive layout
- [ ] Collaborative editing
- [ ] Version history / git integration
- [ ] Export to PDF/HTML
- [ ] Import from Obsidian/Notion
- [ ] Plugin system
- [ ] AI features (settings prepared, not implemented)

### Known Issues

- [ ] Drag and drop folder moves may have edge cases
- [ ] Sidebar performance utilities are over-engineered
- [ ] Error handling could be simplified
