# VaultNote Development Tracker

> Last updated: 2026-04-18

## Project Overview

A local-first, file-based note-taking application with a clean three-panel workspace. Notes are stored as markdown files in a vault directory structure.

**Tech Stack**: React 19, Vite 8, Tailwind CSS 4, Zustand, PHP 8.1+

---

## Missing Features

### High Priority

| # | Feature | Location | Status | Notes |
|---|---------|----------|--------|-------|
| 1 | Vault deletion UI | VaultSwitcher.jsx | Not implemented | Can create vaults but no delete option |
| 2 | Vault rename UI | VaultSwitcher.jsx | Not implemented | No rename functionality |
| 3 | Folder deletion UI | Sidebar.jsx | Not implemented | API supports it (`DELETE /folders/*`) but no UI |
| 4 | Folder rename UI | Sidebar.jsx | Not implemented | No folder rename |
| 5 | Note rename UI | NoteList.jsx | Not implemented | Cannot rename existing notes |
| 6 | Search all notes | NoteList.jsx | Incomplete | Search only filters current folder |
| 7 | Tag management UI | NoteList.jsx | Not implemented | Tags extracted from frontmatter but cannot add/edit/remove |

### Medium Priority

| # | Feature | Location | Status | Notes |
|---|---------|----------|--------|-------|
| 8 | Keyboard shortcuts | Editor.jsx | Incomplete | Only Ctrl+S and Ctrl+P implemented |
| 9 | Global search shortcut | - | Not implemented | No "search all notes" keybind |
| 10 | New note shortcut (Ctrl+N) | - | Not implemented | Missing |
| 11 | Custom modal dialogs | NoteList, Sidebar, VaultSwitcher | Not implemented | Uses `window.prompt` and `window.confirm` |
| 12 | Attachment support | - | Not implemented | No image/file embedding |
| 13 | Export vault | - | Not implemented | Cannot export notes as zip |
| 14 | Import notes | - | Not implemented | Cannot import external markdown |
| 15 | Vault backup/restore | - | Not implemented | No backup mechanism |

### Low Priority

| # | Feature | Location | Status | Notes |
|---|---------|----------|--------|-------|
| 16 | Code syntax highlighting | Editor.jsx | Not implemented | Code blocks render but no highlighting |
| 17 | Undo/redo history | Editor.jsx | Not implemented | Uses browser textarea undo only |
| 18 | Backlinks panel | - | Not implemented | WikiLinks navigate but no backlink view |
| 19 | Mobile responsiveness | App.jsx | Not implemented | Three-panel desktop layout only |
| 20 | Loading states for actions | All components | Incomplete | Only list loading skeleton, no action feedback |

---

## Bugs & Issues

| # | Issue | Location | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | Hardcoded title "explorer" | index.html:7 | Bug | Title should be "VaultNote" |
| 2 | Pinned notes shown in note list | NoteList.jsx:187-193 | Working | Star icon toggle displayed |
| 3 | Recent notes folder filter | NoteList.jsx:52-55 | Bug | Shows recent notes but filtered to current folder incorrectly |
| 4 | Tag filtering may fail | NoteList.jsx:32 | Potential bug | `meta?.tags` may be undefined |

---

## Technical Debt

| # | Item | Location | Status | Notes |
|---|------|----------|--------|-------|
| 1 | No tests | Entire project | Not implemented | No test files exist |
| 2 | Prose plugin not installed | Editor.jsx:124 | Missing | Uses Tailwind prose but `@tailwindcss/typography` not in package.json |
| 3 | No TypeScript | Entire project | Choice | Project uses plain JS |

---

## API Endpoints Status

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/vaults` | Working |
| POST | `/vaults` | Working |
| GET | `/vaults/:name/meta` | Working |
| PUT | `/vaults/:name/meta` | Working |
| DELETE | `/vaults/:name` | **Not implemented** |
| GET | `/vaults/:name/notes` | Working |
| GET | `/vaults/:name/notes/*` | Working |
| POST | `/vaults/:name/notes/*` | Working |
| PUT | `/vaults/:name/notes/*` | Working |
| DELETE | `/vaults/:name/notes/*` | Working |
| POST | `/vaults/:name/folders` | Working |
| DELETE | `/vaults/:name/folders/*` | Working |

---

## Implementation Notes

- Frontmatter parsing uses `js-yaml` for YAML parsing
- WikiLinks `[[Note Name]]` transformed to `vaultnote://` links in Editor
- Auto-save triggers after 1.5s of inactivity (Editor.jsx:33-36)
- Panel widths stored in localStorage: `vaultnote:sidebarWidth`, `vaultnote:noteListWidth`
- Theme stored in localStorage: `vaultnote:theme`
- Recent notes stored per vault: `vaultnote:recent:{vaultName}`