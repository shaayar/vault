/**
 * Tree converter utilities
 * Converts between noteStore format and ObsidianSidebar format
 */

/**
 * Convert noteStore tree to ObsidianSidebar format
 */
export function convertNoteTreeToObsidianFormat(noteTree) {
  if (!noteTree || typeof noteTree !== 'object') {
    return {
      nodesById: {},
      childrenMap: {},
      rootNodes: []
    }
  }

  const nodesById = {}
  const childrenMap = {}
  const rootNodes = []

  // Helper function to process folders recursively
  function processFolder(folder, parentId = null) {
    const folderId = `folder-${folder.path || 'root'}`
    
    // Create folder node
    nodesById[folderId] = {
      id: folderId,
      name: folder.name || folder.path?.split('/').pop() || 'Root',
      type: 'folder',
      parentId: parentId,
      path: folder.path || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to children map
    if (parentId) {
      if (!childrenMap[parentId]) {
        childrenMap[parentId] = []
      }
      childrenMap[parentId].push(folderId)
    } else {
      rootNodes.push(folderId)
    }

    // Process notes in this folder. Some local mock APIs still return `files`.
    const notes = Array.isArray(folder.notes)
      ? folder.notes
      : Array.isArray(folder.files)
        ? folder.files
        : []

    if (notes.length > 0) {
      notes.forEach(note => {
        const noteId = `note-${note.path}`
        
        nodesById[noteId] = {
          id: noteId,
          name: note.name || note.path?.split('/').pop() || 'Untitled',
          type: 'note',
          parentId: folderId,
          path: note.path || '',
          createdAt: note.createdAt || new Date(),
          updatedAt: note.updatedAt || new Date()
        }

        if (!childrenMap[folderId]) {
          childrenMap[folderId] = []
        }
        childrenMap[folderId].push(noteId)
      })
    }

    // Process subfolders recursively
    if (folder.folders && Array.isArray(folder.folders)) {
      folder.folders.forEach(subfolder => {
        processFolder(subfolder, folderId)
      })
    }
  }

  // Start processing from root
  processFolder(noteTree)

  return {
    nodesById,
    childrenMap,
    rootNodes
  }
}

/**
 * Convert ObsidianSidebar format back to noteStore format
 */
export function convertObsidianFormatToNoteTree(nodesById, childrenMap, rootNodes) {
  function buildNode(nodeId) {
    const node = nodesById[nodeId]
    if (!node) return null

    const result = {
      name: node.name,
      path: node.path
    }

    // Add children
    const children = childrenMap[nodeId] || []
    
    if (node.type === 'folder') {
      result.folders = []
      result.notes = []

      children.forEach(childId => {
        const child = buildNode(childId)
        if (child) {
          if (nodesById[childId].type === 'folder') {
            result.folders.push(child)
          } else {
            result.notes.push(child)
          }
        }
      })
    }

    return result
  }

  // Build root structure
  const rootFolders = []
  const rootNotes = []

  rootNodes.forEach(rootId => {
    const node = buildNode(rootId)
    if (node) {
      if (nodesById[rootId].type === 'folder') {
        rootFolders.push(node)
      } else {
        rootNotes.push(node)
      }
    }
  })

  return {
    name: 'Root',
    path: '',
    folders: rootFolders,
    notes: rootNotes
  }
}

/**
 * Get node by path from ObsidianSidebar format
 */
export function getNodeByPath(nodesById, childrenMap, targetPath) {
  for (const nodeId in nodesById) {
    const node = nodesById[nodeId]
    if (node.path === targetPath) {
      return node
    }
  }
  return null
}

/**
 * Get parent path from a node path
 */
export function getParentPath(nodePath) {
  if (!nodePath || nodePath === '') return null
  const parts = nodePath.split('/')
  return parts.slice(0, -1).join('/')
}

/**
 * Generate unique ID for new nodes
 */
export function generateNodeId(type, path) {
  const safePath = path.replace(/[^a-zA-Z0-9]/g, '-')
  return `${type}-${safePath}-${Date.now()}`
}
