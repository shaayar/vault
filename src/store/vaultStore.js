import { create } from 'zustand'
import { createVault as createVaultRequest, getVaults, deleteVault as deleteVaultRequest, renameVault as renameVaultRequest } from '../api/supabase/vaultApi'

/**
 * Global vault state for listing, selecting, and creating vaults.
 */
export const useVaultStore = create((set, get) => ({
  vaults: [],
  activeVault: null,
  isLoading: false,
  error: '',
  setActiveVault: (vault) => {
    set({ activeVault: vault })
  },
  setActiveVaultFromUrl: (vaultId) => {
    const vaults = get().vaults
    const vault = vaults.find(v => v.id === vaultId)
    set({ activeVault: vault || null })
  },
  setVaults: (vaults) => {
    set({ vaults })
  },
  fetchVaults: async () => {
    set({ isLoading: true, error: '' })
    try {
      const vaults = await getVaults()
      const normalizedVaults = Array.isArray(vaults) ? vaults : []
      const currentActiveVault = get().activeVault
      const hasCurrentVault = currentActiveVault && normalizedVaults.some(v => v.id === currentActiveVault.id)

      set({
        vaults: normalizedVaults,
        activeVault: hasCurrentVault ? currentActiveVault : normalizedVaults[0] || null,
        isLoading: false,
      })
    } catch (error) {
      set({
        vaults: [],
        activeVault: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch vaults',
      })
    }
  },
  createVault: async (vaultName) => {
    set({ isLoading: true, error: '' })
    console.log(`Creating vault: ${vaultName}`)
    try {
      const createdVault = await createVaultRequest(vaultName)
      console.log(`Vault created:`, createdVault)
      // Refresh vaults list to ensure sync with server
      try {
        const refreshedVaults = await getVaults()
        const normalizedVaults = Array.isArray(refreshedVaults) ? refreshedVaults : []
        set({
          isLoading: false,
          vaults: normalizedVaults,
          activeVault: createdVault,
        })
      } catch (refreshError) {
        // If refresh fails, add the new vault to existing list
        console.error('Failed to refresh vaults list after creation:', refreshError)
        const currentVaults = get().vaults
        const updatedVaults = [...currentVaults, createdVault]
        set({
          isLoading: false,
          vaults: updatedVaults,
          activeVault: createdVault,
        })
      }
      return createdVault
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create vault',
      })
      throw error
    }
  },

  deleteVault: async (vaultId) => {
    set({ isLoading: true, error: '' })
    try {
      await deleteVaultRequest(vaultId)
      // Refresh vaults list to ensure sync with server
      try {
        const refreshedVaults = await getVaults()
        const normalizedVaults = Array.isArray(refreshedVaults) ? refreshedVaults : []
        const activeVault = get().activeVault
        // If deleted vault was active, clear it
        const newActiveVault = activeVault?.id === vaultId ? null : activeVault
        set({
          isLoading: false,
          vaults: normalizedVaults,
          activeVault: newActiveVault,
        })
      } catch (refreshError) {
        // If refresh fails, remove from existing list
        console.error('Failed to refresh vaults list after deletion:', refreshError)
        const currentVaults = get().vaults
        const activeVault = get().activeVault
        const updatedVaults = currentVaults.filter(v => v.id !== vaultId)
        const newActiveVault = activeVault?.id === vaultId ? null : activeVault
        set({
          isLoading: false,
          vaults: updatedVaults,
          activeVault: newActiveVault,
        })
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete vault',
      })
      throw error
    }
  },

  renameVault: async (vaultId, newName) => {
    set({ isLoading: true, error: '' })
    try {
      const renamedVault = await renameVaultRequest(vaultId, newName)
      // Refresh vaults list to ensure sync with server
      try {
        const refreshedVaults = await getVaults()
        const normalizedVaults = Array.isArray(refreshedVaults) ? refreshedVaults : []
        const activeVault = get().activeVault
        // If renamed vault was active, update to new vault object
        const newActiveVault = activeVault?.id === vaultId ? renamedVault : activeVault
        set({
          isLoading: false,
          vaults: normalizedVaults,
          activeVault: newActiveVault,
        })
      } catch (refreshError) {
        // If refresh fails, replace old vault with new in existing list
        console.error('Failed to refresh vaults list after rename:', refreshError)
        const currentVaults = get().vaults
        const activeVault = get().activeVault
        const updatedVaults = currentVaults.map(v => v.id === vaultId ? renamedVault : v)
        const newActiveVault = activeVault?.id === vaultId ? renamedVault : activeVault
        set({
          isLoading: false,
          vaults: updatedVaults,
          activeVault: newActiveVault,
        })
      }
      return renamedVault
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to rename vault',
      })
      throw error
    }
  },
}))
