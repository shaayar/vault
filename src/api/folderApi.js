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
 * Rename a folder within its current parent folder.
 */
export async function renameFolder(vaultName, folderPath, newName) {
  try {
    const payload = await retryFetch(
      `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/folders/${encodePath(folderPath)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
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

/**
 * Move a folder to a new parent path.
 */
export async function moveFolder(vaultName, folderPath, newPath) {
  try {
    const payload = await retryFetch(
      `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/folders/${encodePath(folderPath)}/move`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPath }),
      },
    )
    showSuccessToast('Folder moved successfully')
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'moveFolder', vaultName, folderPath, newPath })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to move folder')
    throw error
  }
}
