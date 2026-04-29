import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, FileText, Folder, Hash, Calendar, Filter } from 'lucide-react'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { encodeNotePath } from '../../utils/notePath'

/**
 * Advanced search modal with multiple search modes
 */
export function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('all') // all, titles, content, tags
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const searchInputRef = useRef(null)

  const noteIndex = useNoteStore((state) => state.noteIndex)
  const openNote = useNoteStore((state) => state.openNote)
  const activeVault = useVaultStore((state) => state.activeVault)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.select()
    }
  }, [isOpen])

  // Close on Escape key
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

  // Advanced search implementation
  const performSearch = useMemo(
    () => {
      let timeout
      return async (searchQuery) => {
        clearTimeout(timeout)
        timeout = setTimeout(async () => {
          if (!searchQuery.trim() || !activeVault) {
            setResults([])
            return
          }

          setIsSearching(true)
          try {
            const searchResults = await searchVaultContent(searchQuery, searchMode, noteIndex)
            setResults(searchResults)
          } catch (error) {
            console.error('Search failed:', error)
            setResults([])
          } finally {
            setIsSearching(false)
          }
        }, 300)
      }
    },
    [activeVault, noteIndex, searchMode],
  )

  // Update search when query or mode changes
  useEffect(() => {
    if (isOpen) {
      performSearch(query)
    }
  }, [query, searchMode, isOpen, performSearch])

  // Memoized search results with highlighting
  const highlightedResults = useMemo(() => {
    return results.map(result => ({
      ...result,
      highlightedTitle: highlightText(result.title, query),
      highlightedContent: highlightText(result.content, query),
      highlightedTags: result.tags.map(tag => ({
        ...tag,
        highlighted: highlightText(tag, query)
      }))
    }))
  }, [results, query])

  const handleResultClick = (result) => {
    setSelectedResult(result)
    // Open the note in editor
    if (result.type === 'note' && activeVault) {
      openNote(activeVault, result.path)
      const encodedPath = encodeNotePath(result.path)
      navigate(`/${activeVault}/${encodedPath}`)
    }
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && highlightedResults.length > 0) {
      handleResultClick(highlightedResults[0])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const currentIndex = highlightedResults.findIndex(r => r.id === selectedResult?.id)
      const nextIndex = (currentIndex + 1) % highlightedResults.length
      setSelectedResult(highlightedResults[nextIndex])
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const currentIndex = highlightedResults.findIndex(r => r.id === selectedResult?.id)
      const prevIndex = currentIndex === -1 ? highlightedResults.length - 1 : (currentIndex - 1 + highlightedResults.length) % highlightedResults.length
      setSelectedResult(highlightedResults[prevIndex])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Search Vault
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-4 items-center">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search notes, folders, tags..."
                className="w-full px-4 py-2 pl-10 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Search Mode Selector */}
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
            >
              <option value="all">All Content</option>
              <option value="titles">Titles Only</option>
              <option value="content">Content Only</option>
              <option value="tags">Tags Only</option>
            </select>
          </div>

          {/* Search Stats */}
          {query && (
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {isSearching ? (
                <span>Searching...</span>
              ) : (
                <span>Found {results.length} results</span>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : results.length === 0 && query ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or search modes</p>
            </div>
          ) : (
            <div className="p-2">
              {highlightedResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedResult?.id === result.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                    } border mb-2`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-1">
                      {result.type === 'note' ? (
                        <FileText className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                        <span dangerouslySetInnerHTML={{ __html: result.highlightedTitle }} />
                      </div>

                      {/* Path */}
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {result.path}
                      </div>

                      {/* Tags */}
                      {result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {result.highlightedTags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-xs rounded-md"
                            >
                              <Hash className="w-3 h-3" />
                              <span dangerouslySetInnerHTML={{ __html: tag.highlighted }} />
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Content Preview */}
                      {searchMode !== 'titles' && result.content && (
                        <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          <span dangerouslySetInnerHTML={{ __html: result.highlightedContent }} />
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(result.updatedAt)}</span>
                        </div>
                        {result.matchType && (
                          <div className="flex items-center gap-1">
                            <Filter className="w-3 h-3" />
                            <span>{result.matchType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Advanced search implementation
 */
async function searchVaultContent(query, mode, noteIndex) {
  const lowerQuery = query.toLowerCase()
  const results = []

  // Search through note index
  for (const note of noteIndex) {
    const matches = []
    let matchType = null

    // Title search
    if (mode === 'all' || mode === 'titles') {
      if (note.title.toLowerCase().includes(lowerQuery)) {
        matches.push({
          type: 'title',
          text: note.title,
          startIndex: note.title.toLowerCase().indexOf(lowerQuery)
        })
        matchType = 'title'
      }
    }

    // Content search
    if (mode === 'all' || mode === 'content') {
      const contentMatch = note.content.toLowerCase().indexOf(lowerQuery)
      if (contentMatch !== -1) {
        const contextStart = Math.max(0, contentMatch - 50)
        const contextEnd = Math.min(note.content.length, contentMatch + 100)
        const context = note.content.substring(contextStart, contextEnd)

        matches.push({
          type: 'content',
          text: context,
          startIndex: contentMatch
        })
        matchType = 'content'
      }
    }

    // Tag search
    if (mode === 'all' || mode === 'tags') {
      for (const tag of note.tags) {
        if (tag.toLowerCase().includes(lowerQuery)) {
          matches.push({
            type: 'tag',
            text: tag,
            startIndex: tag.toLowerCase().indexOf(lowerQuery)
          })
          matchType = 'tag'
          break
        }
      }
    }

    // Add result if matches found
    if (matches.length > 0) {
      results.push({
        id: note.path,
        title: note.title,
        path: note.path,
        content: note.content,
        tags: note.tags,
        updatedAt: note.updatedAt,
        createdAt: note.createdAt,
        type: 'note',
        matches,
        matchType
      })
    }
  }

  // Sort results by relevance
  return results.sort((a, b) => {
    // Prioritize title matches
    if (a.matchType === 'title' && b.matchType !== 'title') return -1
    if (b.matchType === 'title' && a.matchType !== 'title') return 1

    // Then by recency
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })
}

/**
 * Text highlighting for search results
 */
function highlightText(text, query) {
  if (!query || !text) return text

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
}

/**
 * Escape regex special characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return 'Unknown'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
