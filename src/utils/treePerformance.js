/**
 * Performance optimization utilities for large folder trees
 */

/**
 * Memoized tree traversal with caching
 */
export class TreeCache {
  constructor(maxSize = 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (LRU)
      const value = this.cache.get(key)
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return null
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  clear() {
    this.cache.clear()
  }
}

/**
 * Debounced function for performance
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttled function for performance
 */
export function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Virtualized tree rendering helper
 */
export function createVirtualizedTree(nodes, containerHeight, itemHeight = 32) {
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 5 // Buffer
  const scrollTop = 0 // Will be updated by scroll event
  
  return {
    getVisibleRange(startIndex) {
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2)
      const end = Math.min(nodes.length, start + visibleCount)
      return { start, end }
    },
    
    getVisibleNodes(startIndex) {
      const { start, end } = this.getVisibleRange(startIndex)
      return nodes.slice(start, end)
    },
    
    updateScrollTop(newScrollTop) {
      scrollTop = newScrollTop
    }
  }
}

/**
 * Efficient tree flattening with memoization
 */
export function flattenTree(nodes, parentId = null, cache = new TreeCache()) {
  const cacheKey = `flatten_${parentId}_${nodes.length}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const result = []
  
  function traverse(nodeArray, currentParentId) {
    nodeArray.forEach(node => {
      result.push({ ...node, parentId: currentParentId })
      if (node.children && node.children.length > 0) {
        traverse(node.children, node.id)
      }
    })
  }
  
  traverse(nodes, parentId)
  cache.set(cacheKey, result)
  return result
}

/**
 * Optimized search with debouncing
 */
export function createOptimizedSearch(nodes, onSearch) {
  const debouncedSearch = debounce((query) => {
    if (!query.trim()) {
      onSearch(nodes)
      return
    }
    
    const lowerQuery = query.toLowerCase()
    const filtered = nodes.filter(node => 
      node.name.toLowerCase().includes(lowerQuery) ||
      (node.content && node.content.toLowerCase().includes(lowerQuery))
    )
    
    onSearch(filtered)
  }, 300)
  
  return debouncedSearch
}

/**
 * Batch DOM updates for better performance
 */
export function batchDOMUpdates(updates) {
  requestAnimationFrame(() => {
    updates.forEach(update => update())
  })
}

/**
 * Intersection Observer for lazy loading
 */
export function createLazyLoader(callback, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target)
      }
    })
  }, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  })
  
  return observer
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {}
  }
  
  startTimer(name) {
    this.metrics[name] = { start: performance.now() }
  }
  
  endTimer(name) {
    if (this.metrics[name]) {
      const duration = performance.now() - this.metrics[name].start
      this.metrics[name] = { ...this.metrics[name], duration }
      
      if (duration > 100) { // Log slow operations
        console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`)
      }
    }
  }
  
  getMetrics() {
    return this.metrics
  }
  
  clear() {
    this.metrics = {}
  }
}

/**
 * Optimized tree expansion state management
 */
export function createExpansionManager() {
  const expandedNodes = new Set()
  const collapsedNodes = new Set()
  
  return {
    isExpanded: (nodeId) => expandedNodes.has(nodeId),
    isCollapsed: (nodeId) => collapsedNodes.has(nodeId),
    
    expand: (nodeId) => {
      expandedNodes.add(nodeId)
      collapsedNodes.delete(nodeId)
    },
    
    collapse: (nodeId) => {
      expandedNodes.delete(nodeId)
      collapsedNodes.add(nodeId)
    },
    
    toggle: (nodeId) => {
      if (expandedNodes.has(nodeId)) {
        this.collapse(nodeId)
      } else {
        this.expand(nodeId)
      }
    },
    
    expandAll: (nodeIds) => {
      nodeIds.forEach(id => this.expand(id))
    },
    
    collapseAll: (nodeIds) => {
      nodeIds.forEach(id => this.collapse(id))
    },
    
    getExpanded: () => Array.from(expandedNodes),
    getCollapsed: () => Array.from(collapsedNodes),
    
    clear: () => {
      expandedNodes.clear()
      collapsedNodes.clear()
    }
  }
}
