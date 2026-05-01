/**
 * Store Index - Central exports for all stores
 */

// Core stores
export { useNoteStore } from './miniNoteStore'
export { useTreeStore } from './treeStore'
export { useSearchStore } from './searchStore'
export { useUIStore } from './uiStore'
export { useIndexStore } from './indexStore'

// Legacy exports (for gradual migration)
export { useNoteStore as useLegacyNoteStore } from './noteStore'

// Actions class
export { NoteActions } from './noteActions'

// Vault store (unchanged)
export { useVaultStore } from './vaultStore'
