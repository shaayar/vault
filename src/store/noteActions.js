import { createNote as createNoteApi, deleteNote, renameNote, updateNote, moveNote } from '../api/supabase/noteApi'
import { createFolder, deleteFolder, renameFolder, moveFolder } from '../api/supabase/folderApi'
import { toSafePathSegment } from '../utils/fileUtils'
import { buildSafeNoteContent, findFolderByPath } from '../utils/treeUtils'

/**
 * Note and folder CRUD actions
 */
export class NoteActions {
  constructor(noteStore, vaultStore) {
    this.noteStore = noteStore
    this.vaultStore = vaultStore
  }

  async createNote(vault, notePath, content = '') {
    this.noteStore.setState({ isLoading: true, error: '' })
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    try {
      const created = await createNoteApi(vaultId, notePath, content)
      await this.noteStore.loadNoteTreeForVault(vaultId)
      this.noteStore.setState({ isLoading: false })
      return created
    } catch (error) {
      this.noteStore.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create note',
      })
      throw error
    }
  }

  async createNoteInFolder(vault, folderPath, noteTitle) {
    const trimmedTitle = noteTitle.trim()
    if (!trimmedTitle) return
    const safeStem = toSafePathSegment(trimmedTitle)
    if (!safeStem) return

    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id

    // Generate unique filename if note already exists
    const noteIndex = this.noteStore.getState().noteIndex
    const notesInFolder = noteIndex.filter(n => {
      if (!folderPath) return !n.path.includes('/')
      return n.path.startsWith(`${folderPath}/`)
    })
    const existingNames = notesInFolder.map(n => n.path.split('/').pop())

    let noteFile = `${safeStem}.md`
    let counter = 1
    while (existingNames.includes(noteFile)) {
      noteFile = `${safeStem} (${counter}).md`
      counter++
    }

    const notePath = folderPath ? `${folderPath}/${noteFile}` : noteFile
    this.noteStore.setState({ isLoading: true, error: '' })
    try {
      const created = await createNoteApi(vaultId, notePath, buildSafeNoteContent(trimmedTitle))
      await this.noteStore.loadNoteTreeForVault(vaultId)
      await this.noteStore.openNote(vaultId, created?.path ?? notePath)
      this.noteStore.setState({ saveStatus: 'saved' })
      return created
    } catch (error) {
      this.noteStore.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create note',
      })
      throw error
    }
  }

  async createFolder(vault, currentFolderPath, folderName) {
    const trimmedFolder = folderName.trim()
    const safeFolder = toSafePathSegment(trimmedFolder)
    if (!safeFolder) return

    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    const folderPath = currentFolderPath ? `${currentFolderPath}/${safeFolder}` : safeFolder

    // Check if folder already exists
    const noteTree = this.noteStore.getState().noteTree
    function findExistingFolder(node, targetPath) {
      if (!node) return false
      if (node.path === targetPath) return true
      if (node.folders && Array.isArray(node.folders)) {
        return node.folders.some(folder => findExistingFolder(folder, targetPath))
      }
      return false
    }

    if (findExistingFolder(noteTree, folderPath)) {
      // Generate unique name by appending a counter
      const parentPath = currentFolderPath || ''
      const siblingFolders = parentPath
        ? findFolderByPath(noteTree, parentPath)?.folders || []
        : noteTree.folders || []
      const existingNames = siblingFolders.map(f => f.name)
      let counter = 1
      let uniqueName = trimmedFolder
      while (existingNames.includes(uniqueName)) {
        uniqueName = `${trimmedFolder} (${counter})`
        counter++
      }
      const uniqueSafeFolder = toSafePathSegment(uniqueName)
      const finalFolderPath = parentPath ? `${parentPath}/${uniqueSafeFolder}` : uniqueSafeFolder

      this.noteStore.setState({ isLoading: true, error: '' })
      try {
        const created = await createFolder(vaultId, finalFolderPath)
        await this.noteStore.loadNoteTreeForVault(vaultId)
        this.noteStore.setSelectedFolderPath(created?.path ?? finalFolderPath)
        return created
      } catch (error) {
        this.noteStore.setState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to create folder',
        })
        throw error
      }
    }

    this.noteStore.setState({ isLoading: true, error: '' })
    try {
      const created = await createFolder(vaultId, folderPath)
      await this.noteStore.loadNoteTreeForVault(vaultId)
      this.noteStore.setSelectedFolderPath(created?.path ?? folderPath)
      return created
    } catch (error) {
      this.noteStore.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      })
      throw error
    }
  }

  async renameNote(vault, notePath, nextName) {
    const trimmedName = nextName.trim()
    const safeStem = toSafePathSegment(trimmedName)
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    if (!vaultId || !notePath || !safeStem) return
    const folderPath = notePath.split('/').slice(0, -1).join('/')
    const nextPath = folderPath ? `${folderPath}/${safeStem}.md` : `${safeStem}.md`

    this.noteStore.setState({ isLoading: true, error: '' })
    try {
      await renameNote(vaultId, notePath, trimmedName)
      await this.noteStore.loadNoteTreeForVault(vaultId)
      return nextPath
    } catch (error) {
      this.noteStore.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to rename note',
      })
      throw error
    }
  }

  async renameFolder(vault, folderPath, nextName) {
    const trimmedName = nextName.trim()
    const safeFolder = toSafePathSegment(trimmedName)
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    if (!vaultId || !folderPath || !safeFolder) return
    const parentPath = folderPath.split('/').slice(0, -1).join('/')
    const nextPath = parentPath ? `${parentPath}/${safeFolder}` : safeFolder

    this.noteStore.setState({ isLoading: true, error: '' })
    try {
      await renameFolder(vaultId, folderPath, trimmedName)
      await this.noteStore.loadNoteTreeForVault(vaultId)
      return nextPath
    } catch (error) {
      this.noteStore.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to rename folder',
      })
      throw error
    }
  }

  async moveNote(vault, notePath, targetPath) {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    if (!vaultId || !notePath) return

    this.noteStore.setState({ isLoading: true, error: '' })
    try {
      await moveNote(vaultId, notePath, targetPath)
      await this.noteStore.loadNoteTreeForVault(vaultId)
    } catch (error) {
      this.noteStore.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to move note',
      })
      throw error
    }
  }

  async moveFolder(vault, folderPath, targetPath) {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    if (!vaultId || !folderPath) return

    this.noteStore.setState({ isLoading: true, error: '' })
    try {
      await moveFolder(vaultId, folderPath, targetPath)
      await this.noteStore.loadNoteTreeForVault(vaultId)
    } catch (error) {
      this.noteStore.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to move folder',
      })
      throw error
    }
  }

  async deleteNote(vault, notePath) {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    this.noteStore.setState({ isLoading: true, error: '' })
    try {
      await deleteNote(vaultId, notePath)
      const currentPath = this.noteStore.getState().activeNotePath
      await this.noteStore.loadNoteTreeForVault(vaultId)
      if (currentPath === notePath) {
        this.noteStore.setState({
          activeNotePath: '',
          activeNoteContent: '',
          lastSavedContent: '',
          saveStatus: 'idle'
        })
      }
    } catch (error) {
      this.noteStore.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete note',
      })
      throw error
    }
  }

  async deleteFolder(vault, folderPath) {
    // Extract vault ID from vault object or use directly if it's already an ID
    const vaultId = typeof vault === 'string' ? vault : vault.id
    this.noteStore.setState({ isLoading: true, error: '' })
    try {
      await deleteFolder(vaultId, folderPath)
      const currentSelectedFolder = this.noteStore.getState().selectedFolderPath
      await this.noteStore.loadNoteTreeForVault(vaultId)
      if (currentSelectedFolder === folderPath || currentSelectedFolder.startsWith(`${folderPath}/`)) {
        this.noteStore.setSelectedFolderPath('')
      }
    } catch (error) {
      this.noteStore.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete folder',
      })
      throw error
    }
  }
}
