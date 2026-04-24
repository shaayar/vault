/**
 * Interaction utilities for File Explorer
 * Handles keyboard navigation, selection patterns, and user interactions
 */

/**
 * Keyboard navigation handler
 */
export class KeyboardNavigator {
  constructor(store) {
    this.store = store
    this.keyMap = {
      'ArrowUp': this.navigateUp.bind(this),
      'ArrowDown': this.navigateDown.bind(this),
      'ArrowLeft': this.navigateLeft.bind(this),
      'ArrowRight': this.navigateRight.bind(this),
      'Enter': this.handleEnter.bind(this),
      'F2': this.startRenaming.bind(this),
      'Delete': this.handleDelete.bind(this),
      'Escape': this.cancelAction.bind(this),
      ' ': this.toggleExpand.bind(this),
      'Home': this.navigateToFirst.bind(this),
      'End': this.navigateToLast.bind(this),
      'PageUp': this.navigatePageUp.bind(this),
      'PageDown': this.navigatePageDown.bind(this),
      'a': this.selectAll.bind(this),
      'c': this.copySelection.bind(this),
      'x': this.cutSelection.bind(this),
      'v': this.pasteSelection.bind(this),
      'n': this.createNewNode.bind(this),
      'f': this.startSearch.bind(this)
    }
  }

  handleKeyDown(event) {
    const key = event.key
    const handler = this.keyMap[key]
    
    if (handler && this.shouldHandleKey(event)) {
      event.preventDefault()
      event.stopPropagation()
      
      try {
        handler(event)
      } catch (error) {
        console.error('Keyboard navigation error:', error)
      }
    }
  }

  shouldHandleKey(event) {
    // Don't handle when typing in input fields
    const target = event.target
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return false
    }
    
    // Only handle with modifiers for specific keys
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return ['a', 'c', 'x', 'v', 'n', 'f'].includes(event.key.toLowerCase())
    }
    
    return true
  }

  navigateUp(event) {
    const { selectedNodeId, nodesById, childrenMap } = this.store.getState()
    
    if (!selectedNodeId) {
      this.selectFirstNode()
      return
    }
    
    const previousNode = this.getPreviousNode(selectedNodeId)
    if (previousNode) {
      this.store.getState().selectNode(previousNode)
      this.ensureNodeVisible(previousNode)
    }
  }

  navigateDown(event) {
    const { selectedNodeId } = this.store.getState()
    
    if (!selectedNodeId) {
      this.selectFirstNode()
      return
    }
    
    const nextNode = this.getNextNode(selectedNodeId)
    if (nextNode) {
      this.store.getState().selectNode(nextNode)
      this.ensureNodeVisible(nextNode)
    }
  }

  navigateLeft(event) {
    const { selectedNodeId, expandedNodes, isFolder } = this.store.getState()
    
    if (!selectedNodeId) return
    
    if (isFolder(selectedNodeId) && expandedNodes.has(selectedNodeId)) {
      // Collapse folder
      this.store.getState().toggleExpand(selectedNodeId)
    } else {
      // Navigate to parent
      this.navigateToParent(selectedNodeId)
    }
  }

  navigateRight(event) {
    const { selectedNodeId, expandedNodes, isFolder, isEmpty } = this.store.getState()
    
    if (!selectedNodeId) return
    
    if (isFolder(selectedNodeId)) {
      if (!expandedNodes.has(selectedNodeId) && !isEmpty(selectedNodeId)) {
        // Expand folder
        this.store.getState().toggleExpand(selectedNodeId)
      } else {
        // Navigate to first child
        this.navigateToFirstChild(selectedNodeId)
      }
    }
  }

  handleEnter(event) {
    const { selectedNodeId, isFolder, expandedNodes, isEmpty } = this.store.getState()
    
    if (!selectedNodeId) return
    
    if (isFolder(selectedNodeId) && !isEmpty(selectedNodeId)) {
      this.store.getState().toggleExpand(selectedNodeId)
    }
  }

  startRenaming(event) {
    const { selectedNodeId, startRenaming } = this.store.getState()
    
    if (selectedNodeId) {
      startRenaming(selectedNodeId)
    }
  }

  handleDelete(event) {
    const { selectedNodeId, deleteNode } = this.store.getState()
    
    if (selectedNodeId) {
      if (event.shiftKey) {
        // Force delete (skip confirmation for large deletions)
        deleteNode(selectedNodeId, { force: true })
      } else {
        deleteNode(selectedNodeId)
      }
    }
  }

  cancelAction(event) {
    const { stopRenaming, hideContextMenu } = this.store.getState()
    
    stopRenaming()
    hideContextMenu()
  }

  toggleExpand(event) {
    const { selectedNodeId, isFolder, toggleExpand } = this.store.getState()
    
    if (selectedNodeId && isFolder(selectedNodeId)) {
      toggleExpand(selectedNodeId)
    }
  }

  navigateToFirst(event) {
    this.selectFirstNode()
  }

  navigateToLast(event) {
    this.selectLastNode()
  }

  navigatePageUp(event) {
    // Navigate up by visible items (approximate)
    for (let i = 0; i < 10; i++) {
      this.navigateUp(event)
    }
  }

  navigatePageDown(event) {
    // Navigate down by visible items (approximate)
    for (let i = 0; i < 10; i++) {
      this.navigateDown(event)
    }
  }

  selectAll(event) {
    if (event.ctrlKey || event.metaKey) {
      // Select all visible nodes (implementation depends on selection model)
      console.log('Select all not implemented yet')
    }
  }

  copySelection(event) {
    if (event.ctrlKey || event.metaKey) {
      // Copy selected nodes to clipboard
      console.log('Copy not implemented yet')
    }
  }

  cutSelection(event) {
    if (event.ctrlKey || event.metaKey) {
      // Cut selected nodes
      console.log('Cut not implemented yet')
    }
  }

  pasteSelection(event) {
    if (event.ctrlKey || event.metaKey) {
      // Paste nodes from clipboard
      console.log('Paste not implemented yet')
    }
  }

  createNewNode(event) {
    if (event.ctrlKey || event.metaKey) {
      const { selectedNodeId, createNode } = this.store.getState()
      
      // Create new note in current folder or root
      const parentId = selectedNodeId && this.store.getState().isFolder(selectedNodeId) 
        ? selectedNodeId 
        : null
      
      createNode(parentId, 'note', 'Untitled Note')
    }
  }

  startSearch(event) {
    if (event.ctrlKey || event.metaKey) {
      // Focus search input
      console.log('Search not implemented yet')
    }
  }

  // Helper methods
  selectFirstNode() {
    const { rootNodes, selectNode } = this.store.getState()
    if (rootNodes.length > 0) {
      selectNode(rootNodes[0])
    }
  }

  selectLastNode() {
    const lastNode = this.getLastNode()
    if (lastNode) {
      this.store.getState().selectNode(lastNode)
    }
  }

  getPreviousNode(nodeId) {
    const { nodesById, childrenMap } = this.store.getState()
    const node = nodesById[nodeId]
    if (!node) return null

    const siblings = childrenMap[node.parentId] || []
    const currentIndex = siblings.indexOf(nodeId)
    
    if (currentIndex > 0) {
      // Get previous sibling
      const prevSiblingId = siblings[currentIndex - 1]
      const prevSibling = nodesById[prevSiblingId]
      
      // If previous sibling is an expanded folder, get its last descendant
      if (prevSibling.type === 'folder' && this.store.getState().expandedNodes.has(prevSiblingId)) {
        return this.getLastDescendant(prevSiblingId)
      }
      
      return prevSiblingId
    } else {
      // Navigate to parent
      return node.parentId
    }
  }

  getNextNode(nodeId) {
    const { nodesById, childrenMap, expandedNodes } = this.store.getState()
    const node = nodesById[nodeId]
    if (!node) return null

    // If node is an expanded folder, navigate to first child
    if (node.type === 'folder' && expandedNodes.has(nodeId)) {
      const children = childrenMap[nodeId] || []
      return children[0] || null
    }

    // Try to navigate to next sibling
    const siblings = childrenMap[node.parentId] || []
    const currentIndex = siblings.indexOf(nodeId)
    
    if (currentIndex < siblings.length - 1) {
      return siblings[currentIndex + 1]
    }

    // Navigate to parent's next sibling
    return this.getParentNextSibling(node.parentId)
  }

  getLastDescendant(nodeId) {
    const { childrenMap, expandedNodes } = this.store.getState()
    const children = childrenMap[nodeId] || []
    
    if (children.length === 0 || !expandedNodes.has(nodeId)) {
      return nodeId
    }
    
    // Recursively get last descendant
    return this.getLastDescendant(children[children.length - 1])
  }

  getLastNode() {
    const { rootNodes } = this.store.getState()
    if (rootNodes.length === 0) return null
    
    const lastRoot = rootNodes[rootNodes.length - 1]
    return this.getLastDescendant(lastRoot)
  }

  getParentNextSibling(parentId) {
    if (!parentId) return null
    
    const { nodesById, childrenMap } = this.store.getState()
    const parent = nodesById[parentId]
    if (!parent) return null
    
    const siblings = childrenMap[parent.parentId] || []
    const currentIndex = siblings.indexOf(parentId)
    
    if (currentIndex < siblings.length - 1) {
      return siblings[currentIndex + 1]
    }
    
    return this.getParentNextSibling(parent.parentId)
  }

  navigateToParent(nodeId) {
    const { nodesById, selectNode } = this.store.getState()
    const node = nodesById[nodeId]
    
    if (node && node.parentId) {
      selectNode(node.parentId)
      this.ensureNodeVisible(node.parentId)
    }
  }

  navigateToFirstChild(nodeId) {
    const { childrenMap, selectNode } = this.store.getState()
    const children = childrenMap[nodeId] || []
    
    if (children.length > 0) {
      selectNode(children[0])
      this.ensureNodeVisible(children[0])
    }
  }

  ensureNodeVisible(nodeId) {
    // Scroll node into view if needed
    const element = document.querySelector(`[data-node-id="${nodeId}"]`)
    if (element) {
      element.scrollIntoView({ 
        block: 'nearest', 
        behavior: 'smooth' 
      })
    }
  }
}

/**
 * Selection manager for handling complex selection patterns
 */
export class SelectionManager {
  constructor(store) {
    this.store = store
    this.selectionMode = 'single' // 'single' | 'multiple' | 'range'
    this.lastSelectedNode = null
    this.selectionAnchor = null
  }

  selectNode(nodeId, mode = 'replace') {
    const { selectedNodeId, selectNode } = this.store.getState()
    
    switch (mode) {
      case 'replace':
        this.lastSelectedNode = nodeId
        this.selectionAnchor = nodeId
        selectNode(nodeId)
        break
        
      case 'add':
        // For multiple selection (future enhancement)
        this.lastSelectedNode = nodeId
        break
        
      case 'toggle':
        // Toggle selection (future enhancement)
        this.lastSelectedNode = nodeId
        break
        
      case 'range':
        // Range selection (future enhancement)
        if (this.selectionAnchor) {
          this.selectRange(this.selectionAnchor, nodeId)
        }
        break
    }
  }

  selectRange(startNodeId, endNodeId) {
    // Implementation for range selection
    console.log('Range selection not implemented yet')
  }

  clearSelection() {
    this.lastSelectedNode = null
    this.selectionAnchor = null
    this.store.getState().selectNode(null)
  }

  getSelectedNodes() {
    // For multiple selection support
    const { selectedNodeId } = this.store.getState()
    return selectedNodeId ? [selectedNodeId] : []
  }

  hasSelection() {
    const { selectedNodeId } = this.store.getState()
    return !!selectedNodeId
  }
}

/**
 * Interaction manager that coordinates all interactions
 */
export class InteractionManager {
  constructor(store) {
    this.store = store
    this.keyboardNavigator = new KeyboardNavigator(store)
    this.selectionManager = new SelectionManager(store)
    this.eventListeners = new Map()
  }

  initialize() {
    this.setupKeyboardNavigation()
    this.setupMouseInteractions()
    this.setupTouchInteractions()
  }

  setupKeyboardNavigation() {
    const handleKeyDown = (event) => {
      this.keyboardNavigator.handleKeyDown(event)
    }

    document.addEventListener('keydown', handleKeyDown)
    this.eventListeners.set('keydown', handleKeyDown)
  }

  setupMouseInteractions() {
    // Setup mouse event handlers for drag-drop, multi-selection, etc.
    console.log('Mouse interactions setup not fully implemented')
  }

  setupTouchInteractions() {
    // Setup touch event handlers for mobile devices
    console.log('Touch interactions setup not implemented')
  }

  cleanup() {
    // Remove all event listeners
    this.eventListeners.forEach((handler, event) => {
      document.removeEventListener(event, handler)
    })
    this.eventListeners.clear()
  }

  // Public API
  selectNode(nodeId, mode = 'replace') {
    this.selectionManager.selectNode(nodeId, mode)
  }

  clearSelection() {
    this.selectionManager.clearSelection()
  }

  getSelectedNodes() {
    return this.selectionManager.getSelectedNodes()
  }

  hasSelection() {
    return this.selectionManager.hasSelection()
  }
}
