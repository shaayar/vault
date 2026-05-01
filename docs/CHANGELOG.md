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

## 2026-04-30 (Evening)

### Added

- **Mobile sidebar vault controls**: Full vault management (create, delete, rename, switch) now available in mobile sidebar
- **MDX editor dialog styling**: Comprehensive dark/light theme styling for link and image dialogs to match app theme
- **Dialog z-index fix**: MDX editor dialogs now properly appear above other UI elements

### Changed

- **StatusBar moved**: StatusBar component moved from AppLayout to Editor component for better component organization
- **Header mobile optimization**: Vault controls hidden on mobile header, moved to sidebar for better mobile UX
- **Editor header mobile**: Editor mode indicator hidden on mobile for cleaner interface
- **AppLayout height**: Editor container height adjusted to `h-auto` for better mobile responsiveness

### Fixed

- **Mobile vault management**: Vault operations now work properly on mobile devices through sidebar controls
- **Dialog theme consistency**: Link and image dialogs now match app's dark/light theme perfectly
- **Component organization**: Better separation of concerns with StatusBar in Editor component

---

## 2026-04-30

### Added

- **New landing page design** with modern marketing sections:
  - Hero section with blueprint background pattern and gradient overlay
  - Marquee section with scrolling feature badges (E2E Encrypted, Markdown-Native, Local-First, Graph-Visualizer, Offline-Sync)
  - New Bento Grid features with vault badges, graph view placeholder, search bar mockup, and auto-save status indicator
  - Testimonials carousel with 3 user testimonial cards
  - Updated Philosophy section with blueprint background and new stats layout
  - Updated CTA section with gradient blur effect and dashboard navigation
  - New Footer component with primary color background, massive "VaultNote" branding, and contact email
- **Dashboard page** (`src/components/Dashboard/`):
  - New dedicated dashboard for vault management
  - Header styled after AppLayout with logo, theme toggle, and logout
  - Vault selection moved from landing page to dashboard
  - Create vault functionality
  - Light/dark theme support
- **New components**:
  - `Marquee.jsx` - Scrolling feature badges with CSS animation
  - `Testimonials.jsx` - Testimonial cards with carousel navigation
  - `BentoGrid.jsx` - Modern bento grid layout for features
  - `Footer.jsx` - Primary-colored footer with branding
- **CSS additions**:
  - Marquee animation (`@keyframes marquee`)
  - Blueprint background pattern (grid lines)
- **Routing**: Added `/dashboard` route protected by authentication

### Changed

- Landing page now navigates to `/dashboard` for logged-in users instead of showing vault selection
- Hero section updated with new styling, version badge, and colored headline span
- Removed vault selection from landing page (moved to Dashboard)
- Both old and new bento grid designs are visible on landing page for comparison
- Problem/Solution section retained for comparison with new design
- **Mobile editor improvements**:
  - Split view disabled on mobile screens (< 768px) - defaults to edit mode
  - Editor/preview containers changed from `h-screen` to `h-full` for proper flex layout
  - Mobile sidebar toggle button in Header now functional - toggles sidebar visibility
  - Mobile sidebar width set to 80% of screen (instead of 100%)
  - Mobile sidebar backdrop added with blur effect - clicking backdrop closes sidebar
  - Editor now always opens with a note (first available note if none specified in URL)

### Removed

- Vault selection UI from landing page (relocated to Dashboard)

### Fixed

- URL now updates when renaming/moving notes or folders so the user stays on the correct URL.
  - `renameNoteByPath` - updates URL after renaming the active note
  - `saveActiveNote` - updates URL when auto-renaming from title change
- Blank page issue when visiting invalid vault URLs - now redirects to 404 page
- React hooks order violation in AppLayout - moved early return after all hooks
- Missing `vaults` variable in AppLayout causing reference error
- Conditional check for `onToggleSidebar` in Header to prevent errors when not provided
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

### Changes

- Added console message in `main.jsx` to show which API server the app is connected to (`VITE_API_BASE_URL` or default `/api`).
- Documented Node.js backend setup: The project can now run with either PHP (`api/index.php`) or Node.js (`nodejs-backend/`) backend. To use Node.js:
  1. Set `VITE_API_BASE_URL=http://localhost:3000` in `.env`
  2. Or update `vite.config.js` proxy to point to `http://localhost:3000`
  3. Run `cd nodejs-backend && npm run dev` before starting the frontend
