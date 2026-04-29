import React, { useState, useEffect } from 'react'
import { X, Keyboard, Search, FilePlus, Save, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Command, ArrowBigUp, Option, CommandIcon } from 'lucide-react'

/**
 * Keyboard Shortcuts Help Modal
 */
export function ShortcutsModal({ isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState('navigation')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const categories = [
    { id: 'navigation', name: 'Navigation', icon: ArrowLeft },
    { id: 'file', name: 'File Operations', icon: FilePlus },
    { id: 'edit', name: 'Editing', icon: Save },
    { id: 'view', name: 'View & Display', icon: Search },
    { id: 'advanced', name: 'Advanced', icon: Keyboard }
  ]

  const shortcuts = {
    navigation: [
      { key: '↑↓', description: 'Navigate file list', platform: 'all' },
      { key: '←→', description: 'Expand/collapse folders', platform: 'all' },
      { key: 'Enter', description: 'Open selected file', platform: 'all' },
      { key: 'Space', description: 'Toggle folder expansion', platform: 'all' },
      { key: 'Home', description: 'Jump to first item', platform: 'all' },
      { key: 'End', description: 'Jump to last item', platform: 'all' },
      { key: 'PageUp', description: 'Page up in file list', platform: 'all' },
      { key: 'PageDown', description: 'Page down in file list', platform: 'all' }
    ],
    file: [
      { key: 'Ctrl+N', description: 'New note', platform: 'win', mac: '⌘N' },
      { key: 'Ctrl+Shift+N', description: 'New folder', platform: 'win', mac: '⌘⇧N' },
      { key: 'Ctrl+S', description: 'Save current note', platform: 'win', mac: '⌘S' },
      { key: 'Ctrl+O', description: 'Open file', platform: 'win', mac: '⌘O' },
      { key: 'Ctrl+Shift+O', description: 'Open vault', platform: 'win', mac: '⌘⇧O' },
      { key: 'Delete', description: 'Delete selected item', platform: 'all' },
      { key: 'F2', description: 'Rename selected item', platform: 'all' },
      { key: 'Ctrl+C', description: 'Copy file', platform: 'win', mac: '⌘C' },
      { key: 'Ctrl+V', description: 'Paste file', platform: 'win', mac: '⌘V' },
      { key: 'Ctrl+X', description: 'Cut file', platform: 'win', mac: '⌘X' }
    ],
    edit: [
      { key: 'Ctrl+Z', description: 'Undo', platform: 'win', mac: '⌘Z' },
      { key: 'Ctrl+Y', description: 'Redo', platform: 'win', mac: '⌘Y' },
      { key: 'Ctrl+F', description: 'Find in note', platform: 'win', mac: '⌘F' },
      { key: 'Ctrl+H', description: 'Replace in note', platform: 'win', mac: '⌘H' },
      { key: 'Ctrl+A', description: 'Select all', platform: 'win', mac: '⌘A' },
      { key: 'Tab', description: 'Indent text', platform: 'all' },
      { key: 'Shift+Tab', description: 'Unindent text', platform: 'all' },
      { key: 'Ctrl+B', description: 'Bold text', platform: 'win', mac: '⌘B' },
      { key: 'Ctrl+I', description: 'Italic text', platform: 'win', mac: '⌘I' },
      { key: 'Ctrl+K', description: 'Insert link', platform: 'win', mac: '⌘K' }
    ],
    view: [
      { key: 'Ctrl+/', description: 'Toggle sidebar', platform: 'win', mac: '⌘/' },
      { key: 'Ctrl+Shift+F', description: 'Toggle focus mode', platform: 'win', mac: '⌘⇧F' },
      { key: 'Ctrl+G', description: 'Open graph view', platform: 'win', mac: '⌘G' },
      { key: 'Ctrl+Shift+S', description: 'Split view mode', platform: 'win', mac: '⌘⇧S' },
      { key: 'Ctrl+P', description: 'Preview mode', platform: 'win', mac: '⌘P' },
      { key: 'F11', description: 'Toggle fullscreen', platform: 'all' },
      { key: 'Ctrl+0', description: 'Reset zoom', platform: 'win', mac: '⌘0' },
      { key: 'Ctrl++', description: 'Zoom in', platform: 'win', mac: '⌘+' },
      { key: 'Ctrl+-', description: 'Zoom out', platform: 'win', mac: '⌘-' }
    ],
    advanced: [
      { key: 'Ctrl+Shift+P', description: 'Command palette', platform: 'win', mac: '⌘⇧P' },
      { key: 'Ctrl+K', description: 'Quick switcher', platform: 'win', mac: '⌘K' },
      { key: 'Ctrl+Shift+L', description: 'Toggle line numbers', platform: 'win', mac: '⌘⇧L' },
      { key: 'Ctrl+Shift+W', description: 'Toggle word wrap', platform: 'win', mac: '⌘⇧W' },
      { key: 'Ctrl+\\', description: 'Toggle panel', platform: 'win', mac: '⌘\\' },
      { key: 'Ctrl+1', description: 'Focus sidebar', platform: 'win', mac: '⌘1' },
      { key: 'Ctrl+2', description: 'Focus note list', platform: 'win', mac: '⌘2' },
      { key: 'Ctrl+3', description: 'Focus editor', platform: 'win', mac: '⌘3' },
      { key: 'Ctrl+Shift+T', description: 'Reopen closed tab', platform: 'win', mac: '⌘⇧T' },
      { key: 'Ctrl+Alt+R', description: 'Reload vault', platform: 'win', mac: '⌘⌥R' }
    ]
  }

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const formatKey = (shortcut) => {
    if (shortcut.platform === 'all') {
      return shortcut.key
    }

    const key = isMac && shortcut.mac ? shortcut.mac : shortcut.key
    return key
      .replace('Ctrl', isMac ? '⌘' : 'Ctrl')
      .replace('Shift', isMac ? '⇧' : 'Shift')
      .replace('Alt', isMac ? '⌥' : 'Alt')
      .replace('Option', isMac ? '⌥' : 'Option')
      .replace('Command', isMac ? '⌘' : 'Ctrl')
      .replace('Control', isMac ? '⌃' : 'Ctrl')
  }

  const filteredShortcuts = shortcuts[activeCategory]?.filter(shortcut => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return shortcut.description.toLowerCase().includes(query) ||
      shortcut.key.toLowerCase().includes(query)
  }) || []

  const KeyIcon = ({ keyCombo }) => {
    const getIcon = (keyChar) => {
      switch (keyChar) {
        case '↑': return <ArrowUp className="w-3 h-3" />
        case '↓': return <ArrowDown className="w-3 h-3" />
        case '←': return <ArrowLeft className="w-3 h-3" />
        case '→': return <ArrowRight className="w-3 h-3" />
        case '⌘': return <Command className="w-3 h-3" />
        case '⇧': return <ArrowBigUp className="w-3 h-3" />
        case '⌥': return <Option className="w-3 h-3" />
        case '⌃': return <CommandIcon className="w-3 h-3" />
        default: return null
      }
    }

    const parts = keyCombo.split(/([+⌘⇧⌥⌃])/)

    return (
      <div className="flex items-center gap-1">
        {parts.map((part, index) => {
          if (part === '+' || part === '') return null
          const icon = getIcon(part)
          return (
            <div key={index} className="flex items-center">
              {index > 0 && part !== '+' && <span className="mx-1 text-xs">+</span>}
              {icon ? (
                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center">
                  {icon}
                </div>
              ) : (
                <div className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  {part}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 p-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {categories.map(category => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            )
          })}
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredShortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {shortcut.description}
                  </div>
                </div>
                <KeyIcon keyCombo={formatKey(shortcut)} />
              </div>
            ))}
          </div>

          {filteredShortcuts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p>No shortcuts found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <div>
              {isMac ? 'macOS shortcuts shown' : 'Windows/Linux shortcuts shown'}
            </div>
            <div>
              Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs">Esc</kbd> to close
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
