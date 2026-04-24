/**
 * File metadata utilities for displaying file information
 */

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const threshold = 1024
  let unitIndex = 0
  
  while (bytes >= threshold && unitIndex < units.length - 1) {
    bytes /= threshold
    unitIndex++
  }
  
  return `${bytes.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

/**
 * Get file extension from path
 */
export function getFileExtension(path) {
  const lastDot = path.lastIndexOf('.')
  return lastDot === -1 ? '' : path.substring(lastDot + 1).toLowerCase()
}

/**
 * Get file type icon based on extension
 */
export function getFileTypeIcon(extension) {
  const iconMap = {
    // Documents
    'md': '📝',
    'txt': '📄',
    'doc': '📄',
    'docx': '📄',
    'pdf': '📄',
    'rtf': '📄',
    
    // Images
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'svg': '🖼️',
    'webp': '🖼️',
    'ico': '🖼️',
    
    // Archives
    'zip': '📦',
    'rar': '📦',
    '7z': '📦',
    'tar': '📦',
    'gz': '📦',
    
    // Code
    'js': '📜',
    'ts': '📜',
    'jsx': '📜',
    'css': '🎨',
    'html': '🌐',
    'json': '📋',
    'xml': '📋',
    
    // Media
    'mp3': '🎵',
    'mp4': '🎬',
    'avi': '🎬',
    'mov': '🎬',
    'wav': '🎵',
    
    // Other
    'default': '📄'
  }
  
  return iconMap[extension] || iconMap.default
}

/**
 * Get file type color based on extension
 */
export function getFileTypeColor(extension) {
  const colorMap = {
    // Documents
    'md': 'text-blue-600',
    'txt': 'text-gray-600',
    'doc': 'text-blue-600',
    'docx': 'text-blue-600',
    'pdf': 'text-red-600',
    'rtf': 'text-gray-600',
    
    // Images
    'jpg': 'text-green-600',
    'jpeg': 'text-green-600',
    'png': 'text-green-600',
    'gif': 'text-green-600',
    'svg': 'text-green-600',
    'webp': 'text-green-600',
    'ico': 'text-green-600',
    
    // Archives
    'zip': 'text-orange-600',
    'rar': 'text-orange-600',
    '7z': 'text-orange-600',
    'tar': 'text-orange-600',
    'gz': 'text-orange-600',
    
    // Code
    'js': 'text-yellow-600',
    'ts': 'text-yellow-600',
    'jsx': 'text-yellow-600',
    'css': 'text-purple-600',
    'html': 'text-orange-600',
    'json': 'text-gray-600',
    'xml': 'text-gray-600',
    
    // Media
    'mp3': 'text-pink-600',
    'mp4': 'text-pink-600',
    'avi': 'text-pink-600',
    'mov': 'text-pink-600',
    'wav': 'text-pink-600',
    
    // Other
    'default': 'text-gray-600'
  }
  
  return colorMap[extension] || colorMap.default
}

/**
 * Format relative date
 */
export function formatRelativeDate(dateString) {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)
  
  if (diffSeconds < 60) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`
  } else {
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`
  }
}

/**
 * Format absolute date
 */
export function formatAbsoluteDate(dateString) {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get file statistics for a folder
 */
export async function getFolderStats(folderPath, noteIndex) {
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {},
    largestFile: null,
    oldestFile: null,
    newestFile: null
  }
  
  // Find all notes in this folder and subfolders
  const folderNotes = noteIndex.filter(note => {
    const notePath = note.path || ''
    return notePath === folderPath || notePath.startsWith(folderPath + '/')
  })
  
  for (const note of folderNotes) {
    stats.totalFiles++
    
    // Estimate file size (in a real app, this would come from the file system)
    const estimatedSize = note.content ? note.content.length * 2 : 0 // Rough estimate
    stats.totalSize += estimatedSize
    
    // Track file types
    const extension = getFileExtension(note.path || '')
    stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1
    
    // Track largest file
    if (!stats.largestFile || estimatedSize > stats.largestFile.size) {
      stats.largestFile = {
        name: note.title || note.path,
        path: note.path,
        size: estimatedSize
      }
    }
    
    // Track oldest and newest
    const noteDate = note.updatedAt || note.createdAt
    if (noteDate) {
      const noteDateTime = new Date(noteDate)
      
      if (!stats.oldestFile || noteDateTime < stats.oldestFile.date) {
        stats.oldestFile = {
          name: note.title || note.path,
          path: note.path,
          date: noteDateTime
        }
      }
      
      if (!stats.newestFile || noteDateTime > stats.newestFile.date) {
        stats.newestFile = {
          name: note.title || note.path,
          path: note.path,
          date: noteDateTime
        }
      }
    }
  }
  
  return stats
}

/**
 * Get metadata for a single file
 */
export function getFileMetadata(note, includeContent = false) {
  const extension = getFileExtension(note.path || '')
  const estimatedSize = note.content ? note.content.length : 0
  
  return {
    name: note.title || note.path,
    path: note.path,
    extension,
    type: extension || 'unknown',
    icon: getFileTypeIcon(extension),
    color: getFileTypeColor(extension),
    size: estimatedSize,
    formattedSize: formatFileSize(estimatedSize),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    formattedCreatedAt: formatRelativeDate(note.createdAt),
    formattedUpdatedAt: formatRelativeDate(note.updatedAt),
    absoluteCreatedAt: formatAbsoluteDate(note.createdAt),
    absoluteUpdatedAt: formatAbsoluteDate(note.updatedAt),
    content: includeContent ? note.content : undefined,
    tags: note.tags || [],
    wordCount: note.content ? note.content.split(/\s+/).length : 0,
    lineCount: note.content ? note.content.split('\n').length : 0
  }
}
