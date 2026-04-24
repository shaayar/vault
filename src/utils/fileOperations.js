/**
 * File operations utilities for VaultNote
 * Handles file saving, retrieval, and renaming functionality
 */

import {
  getNote,
  createNote,
  updateNote,
  deleteNote,
  renameNote
} from '../api/noteApi'

/**
 * Save note content to file
 */
export async function saveNoteContent(vaultId, notePath, content) {
  try {
    const response = await updateNote(vaultId, notePath, content)

    if (response.success) {
      return { success: true, data: response.data }
    } else {
      throw new Error(response.error || 'Failed to save note')
    }
  } catch (error) {
    console.error('Save note error:', error)
    throw error
  }
}

/**
 * Get note content from file
 */
export async function getNoteContent(vaultId, notePath) {
  try {
    const response = await getNote(vaultId, notePath)

    if (response.success) {
      return response.data.content
    } else {
      throw new Error(response.error || 'Failed to load note')
    }
  } catch (error) {
    console.error('Load note error:', error)
    throw error
  }
}

/**
 * Rename note file
 */
export async function renameNoteFile(vaultId, oldPath, newPath) {
  try {
    const response = await renameNote(vaultId, oldPath, newPath)

    if (response.success) {
      return { success: true, data: response.data }
    } else {
      throw new Error(response.error || 'Failed to rename note')
    }
  } catch (error) {
    console.error('Rename note error:', error)
    throw error
  }
}

/**
 * Create new note file
 */
export async function createNoteFile(vaultId, folderPath, noteName, isFolder = false) {
  try {
    const response = await createNote(vaultId, folderPath, noteName, '')

    if (response.success) {
      return { success: true, data: response.data }
    } else {
      throw new Error(response.error || 'Failed to create note')
    }
  } catch (error) {
    console.error('Create note error:', error)
    throw error
  }
}

/**
 * Delete note file
 */
export async function deleteNoteFile(vaultId, notePath) {
  try {
    const response = await deleteNote(vaultId, notePath)

    if (response.success) {
      return { success: true, data: response.data }
    } else {
      throw new Error(response.error || 'Failed to delete note')
    }
  } catch (error) {
    console.error('Delete note error:', error)
    throw error
  }
}

/**
 * Get file metadata (size, modified date, etc.)
 */
export async function getFileMetadata(vaultId, notePath) {
  try {
    const response = await getNote(vaultId, notePath)

    if (response.success) {
      return {
        name: response.data.name || notePath.split('/').pop(),
        path: notePath,
        size: response.data.size || 0,
        modified: response.data.updatedAt || new Date(),
        created: response.data.createdAt || new Date()
      }
    } else {
      throw new Error(response.error || 'Failed to get file metadata')
    }
  } catch (error) {
    console.error('Get file metadata error:', error)
    throw error
  }
}

/**
 * Extract file extension from path
 */
export function getFileExtension(path) {
  return path.split('.').pop()?.toLowerCase() || 'md'
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(baseName, extension, existingFiles = []) {
  let counter = 1
  let filename = baseName

  while (existingFiles.includes(`${filename}.${extension}`)) {
    filename = `${baseName} (${counter})`
    counter++
  }

  return `${filename}.${extension}`
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
