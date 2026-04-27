import { safeFetch, retryFetch, logApiError, showErrorToast, showSuccessToast } from '../utils/errorHandler'

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
 * Create a folder under notes root.
 */
export async function createFolder(vaultName, folderPath) {
  try {
    const payload = await retryFetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: folderPath }),
    })
    showSuccessToast('Folder created successfully')
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'createFolder', vaultName, folderPath })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to create folder')
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
        body: JSON.stringify({ newName }),
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
 * Rename a folder within its current parent folder.
 */
export async function renameFolder(vaultName, folderPath, newName) {
  try {
    const payload = await retryFetch(
      `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/folders/${encodePath(folderPath)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName }),
      },
    )
    showSuccessToast('Folder renamed successfully')
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'renameFolder', vaultName, folderPath, newName })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to rename folder')
    throw error
  }
}

/**
 * Delete a folder by relative path.
 */
export async function deleteFolder(vaultName, folderPath) {
  try {
    const payload = await retryFetch(
      `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/folders/${encodePath(folderPath)}`,
      { method: 'DELETE' },
    )
    showSuccessToast('Folder deleted successfully')
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'deleteFolder', vaultName, folderPath })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to delete folder')
    throw error
  }
}
