import React from 'react'
import { ChevronRight, File, Folder, FolderOpen, Plus, MoreVertical } from 'lucide-react'

/**
 * Main Sidebar Component - Static Layout Only
 */
export function Sidebar() {
  return (
    <aside className="flex flex-col w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 h-full">
      {/* Header */}
      <header className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Explorer
          </h2>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors">
              <Plus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </button>
            <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors">
              <MoreVertical className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Tree Container */}
      <div className="flex-1 overflow-y-auto">
        <Tree />
      </div>
    </aside>
  )
}

/**
 * Tree Component - Static Structure Only
 */
function Tree() {
  return (
    <div className="p-2">
      {/* Static mock structure for visual design */}
      <TreeNode 
        node={{ id: '1', name: 'Documents', type: 'folder' }}
        depth={0}
      />
      <TreeNode 
        node={{ id: '2', name: 'Projects', type: 'folder' }}
        depth={0}
      />
      <TreeNode 
        node={{ id: '3', name: 'README.md', type: 'note' }}
        depth={0}
      />
    </div>
  )
}

/**
 * TreeNode Component - Static Visual Only
 */
function TreeNode({ node, depth = 0 }) {
  const isFolder = node.type === 'folder'
  const hasChildren = isFolder // Static - will be dynamic in Phase 2
  
  return (
    <div className="select-none">
      {/* Node Content */}
      <div 
        className={`
          flex items-center gap-1 px-2 py-1 rounded-sm transition-colors cursor-pointer
          hover:bg-slate-200 dark:hover:bg-slate-700
          text-slate-700 dark:text-slate-300
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Expand/Collapse Icon for folders */}
        {isFolder && (
          <div className="w-3 h-3 flex items-center justify-center">
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </div>
        )}
        
        {/* Spacer for notes */}
        {!isFolder && <div className="w-3" />}
        
        {/* Node Icon */}
        {isFolder ? (
          <Folder className="w-4 h-4 text-amber-500" />
        ) : (
          <File className="w-4 h-4 text-slate-400" />
        )}
        
        {/* Node Name */}
        <span className="text-sm flex-1 truncate">
          {node.name}
        </span>
      </div>
      
      {/* Children Container (Static for now) */}
      {isFolder && hasChildren && (
        <div className="ml-2">
          {/* Static children for visual testing */}
          <TreeNode 
            node={{ id: '1-1', name: 'Work', type: 'folder' }}
            depth={depth + 1}
          />
          <TreeNode 
            node={{ id: '1-2', name: 'Personal', type: 'folder' }}
            depth={depth + 1}
          />
          <TreeNode 
            node={{ id: '1-3', name: 'notes.txt', type: 'note' }}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  )
}

/**
 * ContextMenu Component - Static Structure Only
 */
export function ContextMenu() {
  return (
    <div className="fixed z-50 hidden min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
      <div className="px-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
          <File className="w-4 h-4" />
          New Note
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
          <Folder className="w-4 h-4" />
          New Folder
        </button>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
      <div className="px-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
          Rename
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
          Delete
        </button>
      </div>
    </div>
  )
}
