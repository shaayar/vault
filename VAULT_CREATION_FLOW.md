# VaultNote Full Flow: Vault Creation and Note Operations

This document outlines the complete flow for vault creation, default note creation, and general note operations in VaultNote, assuming Supabase backend is used.

## Vault Creation Flow

### Step 1: User Initiates Vault Creation

- **UI Trigger**: User clicks "Create Vault" button in `Dashboard.jsx` or `VaultSwitcher/Header.jsx`.
- **Function**: `handleCreateVault` (in respective component).
  - Prompts user for vault name using `window.prompt`.
  - Validates input (non-empty, trimmed).
  - Calls `createVault(vaultName)` from `useVaultStore()`.

### Step 2: Vault Store Handles Creation

- **Function**: `vaultStore.createVault(vaultName)` in `src/store/vaultStore.js`.
  - Sets loading state: `set({ isLoading: true, error: '' })`.
  - Calls `createVaultRequest(vaultName)` (imported from `src/api/supabase/vaultApi.js`).
  - On success: Refreshes vaults list via `fetchVaults()`, sets `activeVault` to created vault, navigates to vault URL.
  - On error: Sets error state, throws error.

### Step 3: Supabase API Creates Vault and Default Note

- **Function**: `createVault(vaultName)` in `src/api/supabase/vaultApi.js`.
  - Authenticates user with `supabase.auth.getUser()`.
  - Inserts vault into `vaults` table: `{ name: vaultName.trim(), owner_id: user.id }`.
  - Inserts default "Welcome" note into `notes` table:
    - `vault_id`: new vault ID.
    - `path`: 'Welcome.md'.
    - `title`: 'Welcome'.
    - `content`: long welcome markdown string.
    - `is_pinned`: true.
  - Shows success toast.
  - Returns vault object `{ id, name, owner_id, created_at, updated_at }`.

### Step 4: Navigation and Note Opening

- **Navigation**: `navigate(\`/${createdVault.id}/Welcome.md\`)` in vault creation handler.
- **URL Update**: React Router updates to `/vaultId/Welcome.md`.
- **Effect Trigger**: `useEffect` in `AppLayout.jsx` detects `notePath` ('Welcome.md') and `activeVault`.
  - Calls `decodeNotePath(notePath)` → 'Welcome.md'.
  - Calls `resolveCanonicalNotePath(noteIndex, 'Welcome.md')` → 'Welcome.md' (assuming note exists).
  - Calls `setActiveNoteFromUrl('Welcome.md')` (updates URL if needed).
  - Calls `openNote(activeVault.id, 'Welcome.md')` from `useNoteStore()`.

### Step 5: Note Opening

- **Function**: `noteStore.openNote(vaultId, notePath)` in `src/store/noteStore.js`.
  - Sets loading: `set({ isLoading: true, error: '' })`.
  - Calls `getNote(vaultId, notePath)` (from `src/api/supabase/noteApi.js`).
  - On success: Parses recent notes, updates state with `activeNotePath`, `activeNoteContent`, `lastSavedContent`, etc.
  - On error: Sets error state.

### Step 6: Supabase API Fetches Note

- **Function**: `getNote(vaultId, notePath)` in `src/api/supabase/noteApi.js`.
  - Queries `notes` table: `select * where vault_id = vaultId and path = notePath`.
  - Returns `{ data: { path, title, content, frontmatter, tags, is_pinned, ... } }`.

### Step 7: UI Updates

- Editor renders with `activeNoteContent`.
- Status bar shows vault name and note title.
- Sidebar loads note tree via `loadNoteTreeForVault(activeVault.id)`.

## General Note Creation Flow

### Step 1: User Initiates Note Creation

- **UI Trigger**: User clicks "New Note" in `Sidebar.jsx`, `NoteList.jsx`, or `AppLayout.jsx`.
- **Function**: Respective handler (e.g., `handleCreateNote`).
  - Prompts for title or uses default.
  - Calls `createNoteInFolder(vaultId, folderPath, title, content)` from `useNoteStore()`.

### Step 2: Note Store Handles Creation

- **Function**: `noteStore.createNoteInFolder(vaultId, folderPath, title, content)` in `src/store/noteStore.js`.
  - Generates unique path (e.g., 'Note.md', 'Note (1).md').
  - Calls `createNoteApi(vaultId, path, content)` (from `src/api/supabase/noteApi.js`).
  - On success: Calls `openNote(vaultId, path)` to open the new note.
  - Reloads note tree: `loadNoteTreeForVault(vaultId)`.

### Step 3: Supabase API Creates Note

- **Function**: `createNote(vaultId, notePath, content)` in `src/api/supabase/noteApi.js`.
  - Inserts into `notes` table: `{ vault_id, path, title, content }`.
  - Shows success toast.
  - Returns note data.

### Step 4: Note Opening (Same as Step 5 in Vault Creation)

## Note Saving Flow

### Step 1: User Saves Note

- **UI Trigger**: Auto-save on content change (debounced), or manual save button.
- **Function**: `saveActiveNote()` from `useNoteStore()`.

### Step 2: Note Store Handles Saving

- **Function**: `noteStore.saveActiveNote()` in `src/store/noteStore.js`.
  - Checks for changes, vault/note existence.
  - Parses frontmatter for title rename logic.
  - Calls `updateNote(vaultId, path, content)` (from `src/api/supabase/noteApi.js`).
  - Updates state: `saveStatus`, `lastSavedContent`.

### Step 3: Supabase API Updates Note

- **Function**: `updateNote(vaultId, notePath, content)` in `src/api/supabase/noteApi.js`.
  - Updates `notes` table where `vault_id` and `path` match.

## Note Deletion Flow

### Step 1: User Deletes Note

- **UI Trigger**: Right-click > Delete in `FileExplorer/FileNode.jsx` or `NoteList.jsx`.
- **Function**: Handler calls `deleteNoteByPath(vaultId, path)` from `useNoteStore()`.

### Step 2: Note Store Handles Deletion

- **Function**: `noteStore.deleteNoteByPath(vaultId, path)` in `src/store/noteStore.js`.
  - Calls `deleteNote(vaultId, path)` (API).
  - Clears active note if deleted.
  - Reloads tree.

### Step 3: Supabase API Deletes Note

- **Function**: `deleteNote(vaultId, notePath)` in `src/api/supabase/noteApi.js`.
  - Deletes from `notes` table.

## Other Key Functions

- **loadNoteTreeForVault(vaultId)**: Calls `getNoteTree(vaultId)` API, normalizes tree, sets `noteIndex`.
- **getNoteTree(vaultId)**: Selects notes from DB, returns array of note objects.
- **resolveCanonicalNotePath(noteIndex, path)**: Finds exact match or handles redirects.
- **parseFrontmatter(content)**: Extracts YAML frontmatter and body.

## Assumptions

- Supabase backend is used (tables: vaults, notes).
- User is authenticated.
- No errors in API calls (add try/catch as needed).
- Note paths are unique within vault.

This flow ensures default notes are created and opened correctly.</content>
<parameter name="filePath">VAULT_CREATION_FLOW.md
