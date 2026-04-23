/**
 * Advanced Tree Engine for File Explorer
 * Handles complex tree operations, validation, and business logic
 */

import { 
  saveNode, 
  deleteNode, 
  getNode as getNodeFromDB,
  getChildren as getChildrenFromDB,
  getAllNodes,
  buildChildrenMap
} from './indexedDB'

/**
 * Tree Engine Class
 */
export class TreeEngine {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5000 // 5 seconds cache
  }

  /**
   * Get cached data or fetch fresh data
   */
  async getCachedData(key, fetchFn) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    const data = await fetchFn()
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    return data
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Validate node name
   */
  validateName(name, type, parentId = null) {
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      throw new Error(`${type} name cannot be empty`)
    }
    
    if (trimmedName.length > 255) {
      throw new Error(`${type} name cannot exceed 255 characters`)
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
    if (invalidChars.test(trimmedName)) {
      throw new Error(`${type} name contains invalid characters`)
    }
    
    // Check for reserved names
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    if (reservedNames.includes(trimmedName.toUpperCase())) {
      throw new Error(`${type} name is reserved`)
    }
    
    return trimmedName
  }

  /**
   * Check if name is unique within parent
   */
  async isNameUnique(name, parentId, excludeNodeId = null) {
    const siblings = await getChildrenFromDB(parentId)
    
    for (const siblingId of siblings) {
      if (siblingId === excludeNodeId) continue
      
      const sibling = await getNodeFromDB(siblingId)
      if (sibling && sibling.name.toLowerCase() === name.toLowerCase()) {
        return false
      }
    }
    
    return true
  }

  /**
   * Generate unique name within parent
   */
  async generateUniqueName(baseName, parentId, type) {
    let name = baseName
    let counter = 1
    
    while (!(await this.isNameUnique(name, parentId))) {
      name = `${baseName} (${counter})`
      counter++
    }
    
    return name
  }

  /**
   * Create a new node with validation
   */
  async createNode(parentId, type, name, options = {}) {
    try {
      // Validate inputs
      const validatedName = this.validateName(name, type)
      
      // Check name uniqueness
      if (!(await this.isNameUnique(validatedName, parentId))) {
        const uniqueName = await this.generateUniqueName(validatedName, parentId, type)
        name = uniqueName
      } else {
        name = validatedName
      }
      
      // Generate unique ID
      const id = options.id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Calculate order
      const siblings = await getChildrenFromDB(parentId)
      const order = options.order !== undefined ? options.order : siblings.length
      
      // Create node object
      const newNode = {
        id,
        name,
        type,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        order,
        ...options.metadata
      }
      
      // Save to database
      await saveNode(newNode)
      
      // Clear cache
      this.clearCache()
      
      return newNode
    } catch (error) {
      throw new Error(`Failed to create ${type}: ${error.message}`)
    }
  }

  /**
   * Update node with validation
   */
  async updateNode(nodeId, updates) {
    try {
      const existingNode = await getNodeFromDB(nodeId)
      if (!existingNode) {
        throw new Error('Node not found')
      }
      
      let updatedNode = { ...existingNode }
      
      // Handle name change
      if (updates.name !== undefined) {
        const validatedName = this.validateName(updates.name, existingNode.type)
        
        if (validatedName !== existingNode.name) {
          // Check name uniqueness
          if (!(await this.isNameUnique(validatedName, existingNode.parentId, nodeId))) {
            throw new Error('A node with this name already exists in this location')
          }
          updatedNode.name = validatedName
        }
      }
      
      // Handle parent change (move operation)
      if (updates.parentId !== undefined && updates.parentId !== existingNode.parentId) {
        // Validate move operation
        await this.validateMove(nodeId, updates.parentId)
        updatedNode.parentId = updates.parentId
        
        // Recalculate order
        const newSiblings = await getChildrenFromDB(updates.parentId)
        updatedNode.order = updates.order !== undefined ? updates.order : newSiblings.length
      }
      
      // Update other properties
      if (updates.order !== undefined) {
        updatedNode.order = updates.order
      }
      
      updatedNode.updatedAt = new Date()
      
      // Save to database
      await saveNode(updatedNode)
      
      // Clear cache
      this.clearCache()
      
      return updatedNode
    } catch (error) {
      throw new Error(`Failed to update node: ${error.message}`)
    }
  }

  /**
   * Validate move operation
   */
  async validateMove(nodeId, newParentId) {
    // Can't move to self
    if (nodeId === newParentId) {
      throw new Error('Cannot move a node to itself')
    }
    
    // Can't move to descendant
    const descendants = await this.getAllDescendants(nodeId)
    if (descendants.includes(newParentId)) {
      throw new Error('Cannot move a node to its own descendant')
    }
    
    // Check if new parent exists and is a folder
    if (newParentId !== null) {
      const newParent = await getNodeFromDB(newParentId)
      if (!newParent) {
        throw new Error('Target folder not found')
      }
      if (newParent.type !== 'folder') {
        throw new Error('Can only move nodes into folders')
      }
    }
  }

  /**
   * Delete node with safety checks
   */
  async deleteNode(nodeId, options = {}) {
    try {
      const node = await getNodeFromDB(nodeId)
      if (!node) {
        throw new Error('Node not found')
      }
      
      // Get all descendants
      const descendants = await this.getAllDescendants(nodeId)
      const allNodesToDelete = [nodeId, ...descendants]
      
      // Safety check for large deletions
      if (allNodesToDelete.length > 100 && !options.force) {
        throw new Error(`Cannot delete ${allNodesToDelete.length} items at once. Use force option to proceed.`)
      }
      
      // Check for protected nodes (optional)
      if (options.skipProtected) {
        const protectedNodes = allNodesToDelete.filter(id => this.isProtectedNode(id))
        if (protectedNodes.length > 0) {
          throw new Error('Cannot delete protected nodes')
        }
      }
      
      // Perform deletion
      await deleteNode(nodeId)
      
      // Clear cache
      this.clearCache()
      
      return {
        deletedCount: allNodesToDelete.length,
        deletedNodes: allNodesToDelete
      }
    } catch (error) {
      throw new Error(`Failed to delete node: ${error.message}`)
    }
  }

  /**
   * Get all descendants of a node
   */
  async getAllDescendants(nodeId) {
    const descendants = []
    const visited = new Set()
    
    const collectDescendants = async (parentId) => {
      if (visited.has(parentId)) return
      visited.add(parentId)
      
      const children = await getChildrenFromDB(parentId)
      
      for (const childId of children) {
        descendants.push(childId)
        await collectDescendants(childId)
      }
    }
    
    await collectDescendants(nodeId)
    return descendants
  }

  /**
   * Check if node is protected (can be customized)
   */
  isProtectedNode(nodeId) {
    // Example: protect root nodes or specific IDs
    const protectedIds = ['root', 'system']
    return protectedIds.includes(nodeId)
  }

  /**
   * Search nodes by name
   */
  async searchNodes(query, options = {}) {
    try {
      const allNodes = await getAllNodes()
      const searchTerm = query.toLowerCase().trim()
      
      if (!searchTerm) {
        return []
      }
      
      const results = allNodes.filter(node => {
        const nameMatch = node.name.toLowerCase().includes(searchTerm)
        
        if (options.type && node.type !== options.type) {
          return false
        }
        
        if (options.parentId && node.parentId !== options.parentId) {
          return false
        }
        
        return nameMatch
      })
      
      // Sort by relevance (exact matches first, then starts with, then contains)
      results.sort((a, b) => {
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()
        
        const aExact = aName === searchTerm
        const bExact = bName === searchTerm
        if (aExact !== bExact) return bExact - aExact
        
        const aStarts = aName.startsWith(searchTerm)
        const bStarts = bName.startsWith(searchTerm)
        if (aStarts !== bStarts) return bStarts - aStarts
        
        return aName.localeCompare(bName)
      })
      
      return results
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`)
    }
  }

  /**
   * Get node path (breadcrumb)
   */
  async getNodePath(nodeId) {
    const path = []
    let currentId = nodeId
    
    while (currentId !== null) {
      const node = await getNodeFromDB(currentId)
      if (!node) break
      
      path.unshift(node)
      currentId = node.parentId
    }
    
    return path
  }

  /**
   * Duplicate a node (with all descendants)
   */
  async duplicateNode(nodeId, newParentId = null, newName = null) {
    try {
      const originalNode = await getNodeFromDB(nodeId)
      if (!originalNode) {
        throw new Error('Node not found')
      }
      
      const descendants = await this.getAllDescendants(nodeId)
      const allNodes = [originalNode, ...descendants.map(id => getNodeFromDB(id)).filter(Boolean)]
      
      // Create mapping from old IDs to new IDs
      const idMap = new Map()
      const duplicatedNodes = []
      
      // Create duplicated nodes
      for (const node of allNodes) {
        const oldId = node.id
        const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        idMap.set(oldId, newId)
        
        let parentId = node.parentId
        if (parentId !== null) {
          parentId = idMap.get(parentId) || newParentId
        } else if (newParentId !== null && oldId === nodeId) {
          parentId = newParentId
        }
        
        const name = (oldId === nodeId && newName) ? newName : node.name
        
        const duplicatedNode = await this.createNode(
          parentId,
          node.type,
          name,
          {
            order: node.order,
            metadata: {
              ...node,
              id: newId, // Remove old ID from metadata
              parentId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        )
        
        duplicatedNodes.push(duplicatedNode)
      }
      
      return duplicatedNodes
    } catch (error) {
      throw new Error(`Failed to duplicate node: ${error.message}`)
    }
  }

  /**
   * Get tree statistics
   */
  async getTreeStats() {
    try {
      const allNodes = await getAllNodes()
      const childrenMap = await buildChildrenMap()
      
      const stats = {
        totalNodes: allNodes.length,
        folders: allNodes.filter(n => n.type === 'folder').length,
        notes: allNodes.filter(n => n.type === 'note').length,
        rootNodes: childrenMap[null]?.length || 0,
        maxDepth: 0,
        emptyFolders: 0
      }
      
      // Calculate max depth and empty folders
      const calculateDepth = (nodeId, depth = 0) => {
        stats.maxDepth = Math.max(stats.maxDepth, depth)
        
        const children = childrenMap[nodeId] || []
        if (children.length === 0 && allNodes.find(n => n.id === nodeId)?.type === 'folder') {
          stats.emptyFolders++
        }
        
        for (const childId of children) {
          calculateDepth(childId, depth + 1)
        }
      }
      
      for (const rootId of childrenMap[null] || []) {
        calculateDepth(rootId, 1)
      }
      
      return stats
    } catch (error) {
      throw new Error(`Failed to get tree stats: ${error.message}`)
    }
  }
}

// Export singleton instance
export const treeEngine = new TreeEngine()
