const API_BASE = '/api'

/**
 * Fetch all vault names.
 */
export async function getVaults() {
  const response = await fetch(`${API_BASE}/vaults`)
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to fetch vaults')
  }
  return payload.data
}

/**
 * Create a new vault by name.
 */
export async function createVault(vaultName) {
  const response = await fetch(`${API_BASE}/vaults`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: vaultName }),
  })
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to create vault')
  }
  return payload.data
}

/**
 * Fetch meta.json for a vault.
 */
export async function getVaultMeta(vaultName) {
  const response = await fetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}/meta`)
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to fetch vault metadata')
  }
  return payload.data
}

/**
 * Update pinned notes in vault metadata.
 */
export async function updateVaultMeta(vaultName, pinnedNotes) {
  const response = await fetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}/meta`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinned_notes: pinnedNotes }),
  })
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to update vault metadata')
  }
  return payload.data
}
