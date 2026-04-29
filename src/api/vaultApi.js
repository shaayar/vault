import { retryFetch, logApiError, showErrorToast, showSuccessToast } from '../utils/errorHandler'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Fetch all vault names.
 */
export async function getVaults() {
  try {
    const payload = await retryFetch(`${API_BASE}/vaults`)
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'getVaults' })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to load vaults')
    throw error
  }
}

/**
 * Create a new vault by name.
 */
export async function createVault(vaultName) {
  try {
    const payload = await retryFetch(`${API_BASE}/vaults`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: vaultName }),
    })
    showSuccessToast('Vault created successfully')
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'createVault', vaultName })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to create vault')
    throw error
  }
}

/**
 * Fetch meta.json for a vault.
 */
export async function getVaultMeta(vaultName) {
  try {
    const payload = await retryFetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}/meta`)
    return payload
  } catch (error) {
    logApiError(error, { action: 'getVaultMeta', vaultName })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to load vault metadata')
    throw error
  }
}

/**
 * Update pinned notes in vault metadata.
 */
export async function updateVaultMeta(vaultName, pinnedNotes) {
  try {
    const payload = await retryFetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}/meta`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned_notes: pinnedNotes }),
    })
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'updateVaultMeta', vaultName, pinnedNotes })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to update vault metadata')
    throw error
  }
}

/**
 * Delete a vault by name.
 */
export async function deleteVault(vaultName) {
  try {
    const payload = await retryFetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}`, {
      method: 'DELETE',
    })
    showSuccessToast('Vault deleted successfully')
    return payload.data
  } catch (error) {
    logApiError(error, { action: 'deleteVault', vaultName })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to delete vault')
    throw error
  }
}
