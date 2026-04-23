/**
 * Mock tree data for testing the Obsidian sidebar
 * Matches the architecture: nodesById + childrenMap
 */

export const mockNodesById = {
  // Root folders
  'folder-1': {
    id: 'folder-1',
    name: 'ANIME',
    type: 'folder',
    parentId: null,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
    order: 1
  },
  'folder-2': {
    id: 'folder-2',
    name: 'Ideas',
    type: 'folder',
    parentId: null,
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-01-20'),
    order: 2
  },
  'folder-3': {
    id: 'folder-3',
    name: 'My Fantasies',
    type: 'folder',
    parentId: null,
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01'),
    order: 3
  },
  'folder-4': {
    id: 'folder-4',
    name: 'Quotes',
    type: 'folder',
    parentId: null,
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-02-10'),
    order: 4
  },
  'folder-5': {
    id: 'folder-5',
    name: 'Stories',
    type: 'folder',
    parentId: null,
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-01-10'),
    order: 5
  },
  
  // Stories subfolders
  'folder-5-1': {
    id: 'folder-5-1',
    name: 'Aarya Gaatha',
    type: 'folder',
    parentId: 'folder-5',
    createdAt: new Date('2023-01-12'),
    updatedAt: new Date('2023-01-12'),
    order: 1
  },
  
  // Aarya Gaatha subfolders
  'folder-5-1-1': {
    id: 'folder-5-1-1',
    name: 'Arc 1',
    type: 'folder',
    parentId: 'folder-5-1',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
    order: 1
  },
  
  // Arc 1 files
  'note-5-1-1-1': {
    id: 'note-5-1-1-1',
    name: 'Index',
    type: 'note',
    parentId: 'folder-5-1-1',
    createdAt: new Date('2023-01-16'),
    updatedAt: new Date('2023-11-20'),
    order: 1
  },
  'note-5-1-1-2': {
    id: 'note-5-1-1-2',
    name: 'Opening Scene',
    type: 'note',
    parentId: 'folder-5-1-1',
    createdAt: new Date('2023-01-17'),
    updatedAt: new Date('2023-01-17'),
    order: 2
  },
  'note-5-1-1-3': {
    id: 'note-5-1-1-3',
    name: 'Planning',
    type: 'note',
    parentId: 'folder-5-1-1',
    createdAt: new Date('2023-01-18'),
    updatedAt: new Date('2023-01-18'),
    order: 3
  }
}

export const mockChildrenMap = {
  null: ['folder-1', 'folder-2', 'folder-3', 'folder-4', 'folder-5'], // Root level
  'folder-1': [], // Empty folder
  'folder-2': [], // Empty folder
  'folder-3': [], // Empty folder
  'folder-4': [], // Empty folder
  'folder-5': ['folder-5-1'],
  'folder-5-1': ['folder-5-1-1'],
  'folder-5-1-1': ['note-5-1-1-1', 'note-5-1-1-2', 'note-5-1-1-3'],
  'note-5-1-1-1': [], // Notes don't have children
  'note-5-1-1-2': [],
  'note-5-1-1-3': []
}

export const mockRootNodes = ['folder-1', 'folder-2', 'folder-3', 'folder-4', 'folder-5']

// Helper functions for tree operations
export const getChildren = (parentId) => {
  return mockChildrenMap[parentId] || []
}

export const getNode = (nodeId) => {
  return mockNodesById[nodeId]
}

export const isFolder = (node) => {
  return node?.type === 'folder'
}

export const isNote = (node) => {
  return node?.type === 'note'
}

export const isEmpty = (nodeId) => {
  const children = mockChildrenMap[nodeId] || []
  return children.length === 0
}
