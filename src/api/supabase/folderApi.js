import { supabase } from '../../lib/supabase'

/**
 * Create a new folder in a vault.
 */
export async function createFolder(vaultId, folderPath) {
  try {
    // Extract parent path from folder path
    const pathSegments = folderPath.split('/').filter(Boolean)
    const parentPath = pathSegments.length > 1
      ? pathSegments.slice(0, -1).join('/')
      : null

    const { data, error } = await supabase
      .from('folders')
      .insert({
        vault_id: vaultId,
        path: folderPath,
        parent_path: parentPath
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Failed to create folder:', error)
    throw error
  }
}

/**
 * Delete a folder (only if empty).
 */
export async function deleteFolder(vaultId, folderPath) {
  try {
    // Check if folder has any notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id')
      .eq('vault_id', vaultId)
      .like('path', `${folderPath}/%`)

    if (notesError) throw notesError

    if (notes && notes.length > 0) {
      throw new Error('Cannot delete folder: folder is not empty')
    }

    // Check if folder has any subfolders
    const { data: subfolders, error: subfoldersError } = await supabase
      .from('folders')
      .select('id')
      .eq('vault_id', vaultId)
      .like('path', `${folderPath}/%`)

    if (subfoldersError) throw subfoldersError

    if (subfolders && subfolders.length > 0) {
      throw new Error('Cannot delete folder: folder contains subfolders')
    }

    // Delete the folder
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('vault_id', vaultId)
      .eq('path', folderPath)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Failed to delete folder:', error)
    throw error
  }
}

/**
 * Rename a folder (and update all notes/subfolders within it).
 */
export async function renameFolder(vaultId, oldPath, newPath) {
  try {
    // Update the folder itself
    const { data: folderData, error: folderError } = await supabase
      .from('folders')
      .update({
        path: newPath,
        parent_path: newPath.split('/').slice(0, -1).join('/') || null
      })
      .eq('vault_id', vaultId)
      .eq('path', oldPath)
      .select()
      .single()

    if (folderError) throw folderError

    // Update all notes in this folder and subfolders
    const { error: notesError } = await supabase
      .from('notes')
      .update({
        path: supabase.raw(`REPLACE(path, '${oldPath}', '${newPath}')`),
        updated_at: new Date().toISOString()
      })
      .eq('vault_id', vaultId)
      .like('path', `${oldPath}/%`)

    if (notesError) throw notesError

    // Update all subfolders
    const { error: subfoldersError } = await supabase
      .from('folders')
      .update({
        path: supabase.raw(`REPLACE(path, '${oldPath}', '${newPath}')`),
        parent_path: supabase.raw(`REPLACE(parent_path, '${oldPath}', '${newPath}')`)
      })
      .eq('vault_id', vaultId)
      .like('path', `${oldPath}/%`)

    if (subfoldersError) throw subfoldersError

    return folderData
  } catch (error) {
    console.error('Failed to rename folder:', error)
    throw error
  }
}

/**
 * Move a folder to a different vault.
 */
export async function moveFolder(vaultId, folderPath, targetVaultId, targetPath) {
  try {
    // Update the folder itself
    const { data: folderData, error: folderError } = await supabase
      .from('folders')
      .update({
        vault_id: targetVaultId,
        path: targetPath,
        parent_path: targetPath.split('/').slice(0, -1).join('/') || null
      })
      .eq('vault_id', vaultId)
      .eq('path', folderPath)
      .select()
      .single()

    if (folderError) throw folderError

    // Move all notes in this folder and subfolders
    const { error: notesError } = await supabase
      .from('notes')
      .update({
        vault_id: targetVaultId,
        path: supabase.raw(`REPLACE(path, '${folderPath}', '${targetPath}')`),
        updated_at: new Date().toISOString()
      })
      .eq('vault_id', vaultId)
      .like('path', `${folderPath}/%`)

    if (notesError) throw notesError

    // Move all subfolders
    const { error: subfoldersError } = await supabase
      .from('folders')
      .update({
        vault_id: targetVaultId,
        path: supabase.raw(`REPLACE(path, '${folderPath}', '${targetPath}')`),
        parent_path: supabase.raw(`REPLACE(parent_path, '${folderPath}', '${targetPath}')`)
      })
      .eq('vault_id', vaultId)
      .like('path', `${folderPath}/%`)

    if (subfoldersError) throw subfoldersError

    return folderData
  } catch (error) {
    console.error('Failed to move folder:', error)
    throw error
  }
}

/**
 * Get all folders in a vault.
 */
export async function getFolders(vaultId) {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('vault_id', vaultId)
      .order('path')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to load folders:', error)
    throw error
  }
}
