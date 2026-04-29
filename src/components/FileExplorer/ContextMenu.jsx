import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Ambulance,
  Activity,
  Copy,
  Search,
  ClipboardPaste,
  Edit,
  Trash2,
  FolderPlus,
  ChevronRight,
} from 'lucide-react'
import { useFileExplorerHelpers } from './fileExplorerStore'

// Helper to check if node is a folder
const isFolder = (node) => node?.type === 'folder'

/**
 * Context Menu Component - Portal-based
 */
export function ContextMenu({ nodeId, position, onClose }) {
  const menuRef = useRef(null)
  const {
    getNode,
    createNode,
    deleteNode,
    duplicateNode,
    startRenaming,
  } = useFileExplorerHelpers()

  const node = nodeId ? getNode(nodeId) : null

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [onClose])

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => onClose()
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [onClose])

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Action handlers
  const handleNewNote = () => {
    createNode(nodeId, 'note', 'Untitled Note')
    onClose()
  }

  const handleNewSubFolder = () => {
    if (node && isFolder(node)) {
      createNode(nodeId, 'folder', 'New Folder')
      onClose()
    }
  }

  const handleNewFolder = () => {
    createNode(nodeId, 'folder', 'New Folder')
    onClose()
  }

  const handleRename = () => {
    if (node) {
      startRenaming(nodeId)
      onClose()
    }
  }

  const handleDelete = () => {
    if (node && window.confirm(`Are you sure you want to delete "${node.name}"?`)) {
      deleteNode(nodeId)
      onClose()
    }
  }

  const handleDuplicate = () => {
    if (node) {
      duplicateNode(nodeId, node.parentId)
      onClose()
    }
  }

  const handleCopyPath = () => {
    // Copy path to clipboard
    console.log('Copy path not fully implemented yet')
    onClose()
  }

  // Dynamic menu items based on context
  const getMenuItems = () => {
    const items = []

    // Create actions - only available when right-clicking on folders or empty space
    if (!node || (node && node.type === 'folder')) {
      items.push([
        { icon: Ambulance, label: 'New note', action: handleNewNote },
        { icon: Activity, label: 'New folder', action: handleNewFolder }
      ])
    }

    if (node) {
      // Node-specific operations
      const nodeOps = []

      // Duplicate available for both folders and notes
      nodeOps.push(
        { icon: Copy, label: 'Duplicate', action: handleDuplicate }
      )

      // Add search for folders only
      if (node.type === 'folder') {
        nodeOps.push(
          { icon: Search, label: 'Search in folder', action: () => { console.log('Search not implemented'); onClose() } }
        )
      }

      // Add sub-folder creation for folders only
      if (node.type === 'folder') {
        nodeOps.push(
          { icon: FolderPlus, label: 'New subfolder', action: handleNewSubFolder }
        )
      }

      if (nodeOps.length > 0) {
        items.push(nodeOps)
      }

      // Modify actions
      items.push([
        { icon: Edit, label: node.type === 'folder' ? 'Rename folder' : 'Rename file', action: handleRename },
        { icon: Trash2, label: 'Delete', action: handleDelete, isDestructive: true }
      ])

      // System actions (copy path)
      items.push([
        { icon: ClipboardPaste, label: 'Copy path', action: handleCopyPath }
      ])
    }

    return items
  }

  const menuItems = getMenuItems()

  if (!position) return null

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[220px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl py-1.5 text-slate-700 dark:text-slate-300 text-sm"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}
    >
      {menuItems.map((group, groupIndex) => (
        <div key={groupIndex}>
          <div className="px-1.5">
            {group.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className={`
                  flex items-center gap-3 px-3 py-1.5 rounded cursor-pointer group transition-colors
                  ${item.isDestructive
                    ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }
                `}
                onClick={item.action}
              >
                <item.icon className="w-[18px] opacity-70 group-hover:opacity-100" />
                <span>{item.label}</span>
                {item.hasSubmenu && (
                  <span className="ml-auto opacity-40">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            ))}
          </div>

          {groupIndex < menuItems.length - 1 && (
            <div className="my-1.5 border-t border-slate-200 dark:border-slate-700" />
          )}
        </div>
      ))}
    </div>,
    document.body
  )
}

