import yaml from 'js-yaml'

/**
 * Tree traversal utilities for note tree operations
 */

export function findFolderByPath(node, targetPath) {
  if (!node) return null
  if ((node.path ?? '') === targetPath) return node
  const folders = Array.isArray(node.folders) ? node.folders : []
  for (const folder of folders) {
    const found = findFolderByPath(folder, targetPath)
    if (found) return found
  }
  return null
}

export function findNoteByPath(node, targetPath) {
  if (!node) return null
  const notes = Array.isArray(node.notes) ? node.notes : []
  for (const note of notes) {
    if (note.path === targetPath) return note
  }
  if (node.folders) {
    for (const folder of node.folders) {
      const found = findNoteByPath(folder, targetPath)
      if (found) return found
    }
  }
  return null
}

export function flattenNotePaths(node) {
  if (!node || typeof node !== 'object') return []
  const notes = Array.isArray(node.notes) ? node.notes : []
  const ownNotes = notes.map((note) => note.path)
  const childFolders = Array.isArray(node.folders) ? node.folders : []
  return childFolders.reduce((all, folder) => [...all, ...flattenNotePaths(folder)], ownNotes)
}

export function normalizeNoteTree(node) {
  if (!node || typeof node !== 'object') {
    return { name: 'Root', path: '', folders: [], notes: [] }
  }

  const notes = Array.isArray(node.notes) ? node.notes : []
  const folders = Array.isArray(node.folders) ? node.folders.map(normalizeNoteTree) : []

  return {
    name: node.name ?? 'Root',
    path: node.path ?? '',
    folders,
    notes,
  }
}

export function getFallbackNoteIndexEntry(notePath) {
  return {
    path: notePath,
    title: notePath.split('/').pop()?.replace(/\.md$/i, '') || notePath,
    tags: [],
    content: '',
    updatedAt: '',
    createdAt: '',
    frontmatter: {},
  }
}

export function buildSafeNoteContent(title, body = '') {
  const frontmatter = yaml.dump(
    { title },
    { sortKeys: false, lineWidth: -1, noRefs: true, quotingType: '"' },
  ).trimEnd()
  return `---\n${frontmatter}\n---\n\n${body}`
}

export function collectAllFolderIds(node) {
  const ids = []
  if (node.folders && Array.isArray(node.folders)) {
    for (const folder of node.folders) {
      const folderId = `folder-${folder.path}`
      ids.push(folderId)
      ids.push(...collectAllFolderIds(folder))
    }
  }
  return ids
}
