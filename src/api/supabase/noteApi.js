import { supabase } from '../../lib/supabase'
import { logApiError, showErrorToast, showSuccessToast } from '../../utils/errorHandler'
import { parseFrontmatter } from '../../utils/markdownUtils'


/**
 * Fetch recursive note tree for a vault.
 */
export async function getNoteTree(vaultId) {
  try {
    console.log(`Fetching note tree for vault: ${vaultId}`)
    const { data, error } = await supabase
      .from('notes')
      .select('id, path, title, updated_at')
      .eq('vault_id', vaultId)
      .order('path')

    console.log(`Note tree data:`, data)
    if (error) {
      console.error(`Note tree error:`, error)
      throw error
    }
    return data
  } catch (error) {
    logApiError(error, { action: 'getNoteTree', vaultId })
    showErrorToast(error.getUserMessage?.() || error.message || 'Failed to load note tree')
    throw error
  }
}


/**
 * Fetch full note content by path.
 */
export async function getNote(vaultId, notePath) {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('vault_id', vaultId)
      .eq('path', notePath)
      .single()

    if (error) throw error

    return {
      data: {
        path: data.path,
        content: data.content,
        title: data.title,
        frontmatter: data.frontmatter,
        tags: data.tags,
        is_pinned: data.is_pinned,
        updated_at: data.updated_at,
        created_at: data.created_at
      }
    }
  } catch (error) {
    logApiError(error, { action: 'getNote', vaultId, notePath })
    showErrorToast(error.message || 'Failed to load note')
    throw error
  }
}

/**
 * Create a markdown note file.
 */
export async function createNote(vaultId, notePath, content = '') {
  try {
    // Parse content to extract title from frontmatter or filename
    const parsed = parseFrontmatter(content)
    const title = parsed.frontmatter?.title || notePath.split('/').pop().replace('.md', '')

    const { data, error } = await supabase
      .from('notes')
      .insert({
        vault_id: vaultId,
        path: notePath,
        title,
        content,
        frontmatter: parsed.frontmatter,
        tags: parsed.frontmatter?.tags || [],
        is_pinned: false
      })
      .select()
      .single()

    if (error) throw error

    showSuccessToast('Note created successfully')
    return {
      data: {
        path: data.path,
        content: data.content,
        title: data.title,
        frontmatter: data.frontmatter,
        tags: data.tags,
        is_pinned: data.is_pinned,
        updated_at: data.updated_at,
        created_at: data.created_at
      }
    }
  } catch (error) {
    logApiError(error, { action: 'createNote', vaultId, notePath })
    showErrorToast(error.message || 'Failed to create note')
    throw error
  }
}

/**
 * Update note content.
 */
export async function updateNote(vaultId, notePath, content) {
  try {
    // Parse content to extract frontmatter
    const parsed = parseFrontmatter(content)
    const title = parsed.frontmatter?.title || notePath.split('/').pop().replace('.md', '')

    const { data, error } = await supabase
      .from('notes')
      .update({
        content,
        title,
        frontmatter: parsed.frontmatter,
        tags: parsed.frontmatter?.tags || [],
        updated_at: new Date().toISOString()
      })
      .eq('vault_id', vaultId)
      .eq('path', notePath)
      .select()
      .single()

    if (error) throw error

    return {
      data: {
        path: data.path,
        content: data.content,
        title: data.title,
        frontmatter: data.frontmatter,
        tags: data.tags,
        is_pinned: data.is_pinned,
        updated_at: data.updated_at,
        created_at: data.created_at
      }
    }
  } catch (error) {
    logApiError(error, { action: 'updateNote', vaultId, notePath })
    showErrorToast(error.message || 'Failed to update note')
    throw error
  }
}

/**
 * Delete a note.
 */
export async function deleteNote(vaultId, notePath) {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('vault_id', vaultId)
      .eq('path', notePath)

    if (error) throw error

    showSuccessToast('Note deleted successfully')
    return { success: true }
  } catch (error) {
    logApiError(error, { action: 'deleteNote', vaultId, notePath })
    showErrorToast(error.message || 'Failed to delete note')
    throw error
  }
}

/**
 * Rename a note (move to new path).
 */
export async function renameNote(vaultId, oldPath, newPath) {
  try {
    const { data, error } = await supabase
      .from('notes')
      .update({
        path: newPath,
        title: newPath.split('/').pop().replace('.md', ''),
        updated_at: new Date().toISOString()
      })
      .eq('vault_id', vaultId)
      .eq('path', oldPath)
      .select()
      .single()

    if (error) throw error

    showSuccessToast('Note renamed successfully')
    return {
      data: {
        path: data.path,
        content: data.content,
        title: data.title,
        frontmatter: data.frontmatter,
        tags: data.tags,
        is_pinned: data.is_pinned,
        updated_at: data.updated_at,
        created_at: data.created_at
      }
    }
  } catch (error) {
    logApiError(error, { action: 'renameNote', vaultId, oldPath, newPath })
    showErrorToast(error.message || 'Failed to rename note')
    throw error
  }
}

/**
 * Move a note to a different vault.
 */
export async function moveNote(vaultId, notePath, targetVaultId, targetPath) {
  try {
    const { data, error } = await supabase
      .from('notes')
      .update({
        vault_id: targetVaultId,
        path: targetPath,
        title: targetPath.split('/').pop().replace('.md', ''),
        updated_at: new Date().toISOString()
      })
      .eq('vault_id', vaultId)
      .eq('path', notePath)
      .select()
      .single()

    if (error) throw error

    showSuccessToast('Note moved successfully')
    return {
      data: {
        path: data.path,
        content: data.content,
        title: data.title,
        frontmatter: data.frontmatter,
        tags: data.tags,
        is_pinned: data.is_pinned,
        updated_at: data.updated_at,
        created_at: data.created_at
      }
    }
  } catch (error) {
    logApiError(error, { action: 'moveNote', vaultId, notePath, targetVaultId, targetPath })
    showErrorToast(error.message || 'Failed to move note')
    throw error
  }
}
