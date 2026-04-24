/**
 * IndexedDB implementation for File Explorer
 * Follows the architecture: nodesById + childrenMap
 */

const DB_NAME = 'VaultNoteDB'
const DB_VERSION = 1
const STORE_NAME = 'fileNodes'

/**
 * Initialize IndexedDB database
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create object store for nodes
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        
        // Create indexes for efficient queries
        store.createIndex('parentId', 'parentId', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('order', ['parentId', 'order'], { unique: false })
      }
    }
  })
}

/**
 * Get database instance
 */
let dbInstance = null
async function getDB() {
  if (!dbInstance) {
    dbInstance = await initDB()
  }
  return dbInstance
}

/**
 * Add or update a node
 */
export async function saveNode(node) {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(node)
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Failed to save node'))
  })
}

/**
 * Get a single node by ID
 */
export async function getNode(nodeId) {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(nodeId)
    
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(new Error('Failed to get node'))
  })
}

/**
 * Get all nodes
 */
export async function getAllNodes() {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()
    
    request.onsuccess = () => {
      const nodes = request.result || []
      resolve(nodes)
    }
    request.onerror = () => reject(new Error('Failed to get all nodes'))
  })
}

/**
 * Get children of a parent node
 */
export async function getChildren(parentId) {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('parentId')
    const request = index.getAll(parentId)
    
    request.onsuccess = () => {
      const children = request.result || []
      // Sort by order field
      children.sort((a, b) => (a.order || 0) - (b.order || 0))
      resolve(children.map(child => child.id))
    }
    request.onerror = () => reject(new Error('Failed to get children'))
  })
}

/**
 * Delete a node (and all its children recursively)
 */
export async function deleteNode(nodeId) {
  const db = await getDB()
  
  // First get all children recursively
  const childrenToDelete = await getAllDescendants(nodeId)
  const allNodesToDelete = [nodeId, ...childrenToDelete]
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    let deletedCount = 0
    const totalToDelete = allNodesToDelete.length
    
    allNodesToDelete.forEach(id => {
      const request = store.delete(id)
      
      request.onsuccess = () => {
        deletedCount++
        if (deletedCount === totalToDelete) {
          resolve(deletedCount)
        }
      }
      
      request.onerror = () => {
        reject(new Error('Failed to delete node'))
      }
    })
  })
}

/**
 * Get all descendants of a node recursively
 */
async function getAllDescendants(parentId) {
  const directChildren = await getChildren(parentId)
  const allDescendants = []
  
  for (const childId of directChildren) {
    allDescendants.push(childId)
    const grandChildren = await getAllDescendants(childId)
    allDescendants.push(...grandChildren)
  }
  
  return allDescendants
}

/**
 * Build children map from all nodes
 */
export async function buildChildrenMap() {
  const allNodes = await getAllNodes()
  const childrenMap = {}
  
  // Initialize all nodes with empty children arrays
  allNodes.forEach(node => {
    childrenMap[node.id] = []
  })
  
  // Add null for root level
  childrenMap[null] = []
  
  // Populate children arrays
  allNodes.forEach(node => {
    const parentId = node.parentId || null
    if (!childrenMap[parentId]) {
      childrenMap[parentId] = []
    }
    childrenMap[parentId].push(node.id)
  })
  
  // Sort children by order
  Object.keys(childrenMap).forEach(parentId => {
    childrenMap[parentId].sort((a, b) => {
      const nodeA = allNodes.find(n => n.id === a)
      const nodeB = allNodes.find(n => n.id === b)
      return (nodeA?.order || 0) - (nodeB?.order || 0)
    })
  })
  
  return childrenMap
}

/**
 * Get root nodes (nodes with no parent)
 */
export async function getRootNodes() {
  return getChildren(null)
}

/**
 * Initialize with default data if database is empty
 */
export async function initializeDefaultData() {
  const existingNodes = await getAllNodes()
  
  if (existingNodes.length === 0) {
    // Import mock data as initial data
    const { mockNodesById } = await import('./mockData')
    
    for (const node of Object.values(mockNodesById)) {
      await saveNode(node)
    }
    
    return true // Data was initialized
  }
  
  return false // Data already exists
}

/**
 * Clear all data (for testing/reset)
 */
export async function clearAllData() {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()
    
    request.onsuccess = () => resolve(true)
    request.onerror = () => reject(new Error('Failed to clear data'))
  })
}
