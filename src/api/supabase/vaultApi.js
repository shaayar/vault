import { supabase } from '../../lib/supabase'
import { retryFetch, logApiError, showErrorToast, showSuccessToast } from '../../utils/errorHandler'

/**
 * Fetch all vaults for the authenticated user.
 */
export async function getVaults() {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('vaults')
      .select('*')
      .eq('owner_id', user.user.id)
      .order('name')

    if (error) throw error
    return data
  } catch (error) {
    logApiError(error, { action: 'getVaults' })
    showErrorToast(error.message || 'Failed to load vaults')
    throw error
  }
}

/**
 * Create a new vault for the authenticated user.
 */
export async function createVault(vaultName) {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('vaults')
      .insert({
        name: vaultName.trim(),
        owner_id: user.user.id
      })
      .select()
      .single()

    if (error) throw error

    console.log(`Creating welcome note for vault: ${data.id}`)
    // Create a welcome note in the new vault
    const welcomeNoteContent = `# Welcome to Your New Vault! 🎉

## Getting Started

This is your personal vault for organizing notes, ideas, and knowledge. Here's how to get started:

### 📝 Create Your First Note
1. Click the **"New Note"** button in the sidebar
2. Give your note a title
3. Start writing!

### 🔗 Use Wiki Links
Connect your notes using double brackets: \`[[Another Note]]\`

### 📁 Organize with Folders
- Right-click in the sidebar to create folders
- Drag and drop to organize

### 🎯 Features
- **Markdown Support**: Full markdown formatting
- **Wiki Links**: Connect notes seamlessly
- **Search**: Find anything instantly (Ctrl+K)
- **Graph View**: Visualize connections between notes
- **Dark/Light Theme**: Toggle in the header
- **Pinned Notes**: Keep important notes at the top

### 📚 Keyboard Shortcuts
- \`Ctrl+K\`: Open search
- \`Ctrl+N\`: New note
- \`Ctrl+S\`: Save note
- \`Ctrl+Shift+N\`: New folder

---

Happy note-taking! 🚀

*This welcome note was created automatically. You can delete or edit it anytime.*`

    const noteInsert = await supabase
      .from('notes')
      .insert({
        vault_id: data.id,
        path: 'Welcome.md',
        title: 'Welcome',
        content: welcomeNoteContent,
        is_pinned: true
      })
    console.log(`Welcome note insert result:`, noteInsert)

    showSuccessToast('Vault created successfully')
    return data
  } catch (error) {
    logApiError(error, { action: 'createVault', vaultName })
    showErrorToast(error.message || 'Failed to create vault')
    throw error
  }
}

/**
 * Get vault metadata (including pinned notes).
 */
export async function getVaultMeta(vaultId) {
  try {
    // Get vault info
    const { data: vault, error: vaultError } = await supabase
      .from('vaults')
      .select('*')
      .eq('id', vaultId)
      .single()

    if (vaultError) throw vaultError

    // Get pinned notes
    const { data: pinnedNotes, error: pinnedError } = await supabase
      .from('notes')
      .select('id, path, title, updated_at')
      .eq('vault_id', vaultId)
      .eq('is_pinned', true)
      .order('updated_at', { ascending: false })

    if (pinnedError) throw pinnedError

    return {
      ...vault,
      pinned_notes: pinnedNotes || []
    }
  } catch (error) {
    logApiError(error, { action: 'getVaultMeta', vaultId })
    showErrorToast(error.message || 'Failed to load vault metadata')
    throw error
  }
}

/**
 * Update vault metadata (pinned notes).
 */
export async function updateVaultMeta(vaultId, pinnedNotes) {
  try {
    // Update pinned status for notes
    const promises = pinnedNotes.map(async (noteId) => {
      return supabase
        .from('notes')
        .update({ is_pinned: true })
        .eq('id', noteId)
    })

    await Promise.all(promises)

    return { success: true }
  } catch (error) {
    logApiError(error, { action: 'updateVaultMeta', vaultId, pinnedNotes })
    showErrorToast(error.message || 'Failed to update vault metadata')
    throw error
  }
}

/**
 * Delete a vault and all its data.
 */
export async function deleteVault(vaultId) {
  try {
    const { error } = await supabase
      .from('vaults')
      .delete()
      .eq('id', vaultId)

    if (error) throw error

    showSuccessToast('Vault deleted successfully')
    return { success: true }
  } catch (error) {
    logApiError(error, { action: 'deleteVault', vaultId })
    showErrorToast(error.message || 'Failed to delete vault')
    throw error
  }
}

/**
 * Rename a vault.
 */
export async function renameVault(vaultId, newName) {
  try {
    const { data, error } = await supabase
      .from('vaults')
      .update({
        name: newName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', vaultId)
      .select()
      .single()

    if (error) throw error

    showSuccessToast('Vault renamed successfully')
    return data
  } catch (error) {
    logApiError(error, { action: 'renameVault', vaultId, newName })
    showErrorToast(error.message || 'Failed to rename vault')
    throw error
  }
}
