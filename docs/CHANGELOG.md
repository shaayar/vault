# Changelog

All notable changes to VaultNote are documented in this file.

## Format

```text
## YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features
```

---

## 2026-04-30

### Added

- Created this changelog file to track daily development changes.

### Fixed

- URL now updates when renaming/moving notes or folders so the user stays on the correct URL.
  - `renameNoteByPath` - updates URL after renaming the active note
  - `saveActiveNote` - updates URL when auto-renaming from title change
  - `renameFolderByPath` - updates URL when parent folder of active note is renamed
  - `moveNoteByPath` - updates URL when active note is moved
  - `moveFolderByPath` - updates URL when parent folder of active note is moved
- Fixed race condition in sidebar where clicking a note during/after rename could cause "Path not found" error. The `onSave` handler in `FolderNode.jsx` now properly awaits the rename operation before exiting rename mode.
- Fixed double-save issue in `RenameInput.jsx` that caused API calls with old path after rename. Added `hasSavedRef` guard to prevent duplicate save operations.
- Fixed auto-redirect to only occur when user is logged in. Landing page now stays visible for unauthenticated users.
- **Protected routes**: All vault routes (`/:vaultName`) now require authentication. Unauthenticated users are redirected to landing page.
- **Vault visibility**: Vault list is now hidden on landing page until user signs in. Shows "Sign in to access your vaults" message instead.

### Added

- **`useAuth` hook** (`src/hooks/useAuth.js`): Centralized authentication state management using localStorage.
- **`ProtectedRoute` component** (`src/components/ProtectedRoute.jsx`): Route wrapper that redirects unauthenticated users to landing page.
- **Sidebar entrance animations**: Tree nodes now animate in with staggered slide-in-left effect on page load. Each folder/file animates with 50ms delay cascade. Header and footer have fade-in animations. Respects `prefers-reduced-motion` for accessibility.
- **Landing screen enhancements**:
  - Hero section now has staggered entrance animations (logo → title → tagline fade in sequence)
  - Vault cards animate in with staggered delay based on index
  - Feature cards now have fade-in animations with 100ms stagger
  - Added Sign In / Sign Up buttons in hero section
- **Basic local authentication system**:
  - `LoginModal` and `SignupModal` components for user auth
  - Users stored in localStorage with SHA-256 hashed passwords
  - Current user session persisted in localStorage
  - Logout functionality available on landing screen
  - Auth state displayed (shows "Welcome, {username}" when logged in)

### Changed

- Added console message in `main.jsx` to show which API server the app is connected to (`VITE_API_BASE_URL` or default `/api`).
- Documented Node.js backend setup: The project can now run with either PHP (`api/index.php`) or Node.js (`nodejs-backend/`) backend. To use Node.js:
  1. Set `VITE_API_BASE_URL=http://localhost:3000` in `.env`
  2. Or update `vite.config.js` proxy to point to `http://localhost:3000`
  3. Run `cd nodejs-backend && npm run dev` before starting the frontend
