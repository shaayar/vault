import { retryFetch, logApiError, showErrorToast, showSuccessToast } from '../utils/errorHandler'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function encodePath(path) {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

/**
 * Fetch recursive note tree for a vault.
 */
export async function getNoteTree(vaultName) {
  try {
    const payload = await retryFetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes`)
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'getNoteTree', vaultName })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to load note tree')
    throw error
  }
}

/**
 * Fetch full note content by path.
 */
export async function getNote(vaultName, notePath) {
  try {
    const encodedPath = encodePath(notePath)
    const payload = await retryFetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes/${encodedPath}`)
    return payload
  } catch (error) {
    logApiError(error, { action: 'getNote', vaultName, notePath })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to load note')
    throw error
  }
}

/**
 * Create a markdown note file.
 */
export async function createNote(vaultName, notePath, content = '') {
  try {
    const payload = await retryFetch(
      `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes/${encodePath(notePath)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      },
    )
    showSuccessToast('Note created successfully')
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'createNote', vaultName, notePath })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to create note')
    throw error
  }
}

/**
 * Update note content.
 */
export async function updateNote(vaultName, notePath, content) {
  try {
    const payload = await retryFetch(
      `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes/${encodePath(notePath)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      },
    )
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'updateNote', vaultName, notePath })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to update note')
    throw error
  }
}

/**
 * Delete a note by relative path.
 */
export async function deleteNote(vaultName, notePath) {
  try {
    const payload = await retryFetch(
      `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes/${encodePath(notePath)}`,
      { method: 'DELETE' },
    )
    showSuccessToast('Note deleted successfully')
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'deleteNote', vaultName, notePath })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to delete note')
    throw error
  }
}


/**
 * Rename a note within its current folder.
 */
export async function renameNote(vaultName, notePath, newName) {
  try {
    const payload = await retryFetch(
      `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes/${encodePath(notePath)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      },
    )
    showSuccessToast('Note renamed successfully')
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'renameNote', vaultName, notePath, newName })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to rename note')
    throw error
  }
}

/**
 * Move a note to a different folder.
 */
export async function moveNote(vaultName, notePath, targetPath) {
  try {
    const payload = await retryFetch(
      `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes/${encodePath(notePath)}/move`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath }),
      },
    )
    showSuccessToast('Note moved successfully')
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'moveNote', vaultName, notePath, targetPath })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to move note')
    throw error
  }
}
