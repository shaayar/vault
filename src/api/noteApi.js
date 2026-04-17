const API_BASE = '/api'

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
  const response = await fetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes`)
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to fetch note tree')
  }
  return payload.data
}

/**
 * Fetch full note content by path.
 */
export async function getNote(vaultName, notePath) {
  const encodedPath = encodePath(notePath)
  const response = await fetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes/${encodedPath}`)
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to fetch note')
  }
  return payload.data
}

/**
 * Create a markdown note file.
 */
export async function createNote(vaultName, notePath, content = '') {
  const response = await fetch(
    `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes/${encodePath(notePath)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  )
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to create note')
  }
  return payload.data
}

/**
 * Update note content.
 */
export async function updateNote(vaultName, notePath, content) {
  const response = await fetch(
    `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes/${encodePath(notePath)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  )
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to update note')
  }
  return payload.data
}

/**
 * Delete a note by relative path.
 */
export async function deleteNote(vaultName, notePath) {
  const response = await fetch(
    `${API_BASE}/vaults/${encodeURIComponent(vaultName)}/notes/${encodePath(notePath)}`,
    { method: 'DELETE' },
  )
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to delete note')
  }
  return payload.data
}

/**
 * Create a folder under notes root.
 */
export async function createFolder(vaultName, folderPath) {
  const response = await fetch(`${API_BASE}/vaults/${encodeURIComponent(vaultName)}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: folderPath }),
  })
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to create folder')
  }
  return payload.data
}
