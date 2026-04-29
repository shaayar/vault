import { create } from 'zustand'
import { createVault as createVaultRequest, getVaults, deleteVault as deleteVaultRequest } from '../api/vaultApi'

/**
 * Global vault state for listing, selecting, and creating vaults.
 */
export const useVaultStore = create((set, get) => ({
  vaults: [],
  activeVault: '',
  isLoading: false,
  error: '',
  setActiveVault: (vaultName) => {
    set({ activeVault: vaultName })
  },
  setActiveVaultFromUrl: (vaultName) => {
    set({ activeVault: vaultName })
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
      const hasCurrentVault = normalizedVaults.includes(currentActiveVault)

      set({
        vaults: normalizedVaults,
        activeVault: hasCurrentVault ? currentActiveVault : normalizedVaults[0] ?? 'demo-vault',
        isLoading: false,
      })
    } catch (error) {
      set({
        vaults: [],
        activeVault: '',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch vaults',
      })
    }
  },
  createVault: async (vaultName) => {
    set({ isLoading: true, error: '' })
    try {
      const response = await createVaultRequest(vaultName)
      const createdVault = typeof response === 'string' ? response : response?.name || vaultName
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
        const updatedVaults = [...new Set([...currentVaults, createdVault])]
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

  deleteVault: async (vaultName) => {
    set({ isLoading: true, error: '' })
    try {
      await deleteVaultRequest(vaultName)
      // Refresh vaults list to ensure sync with server
      try {
        const refreshedVaults = await getVaults()
        const normalizedVaults = Array.isArray(refreshedVaults) ? refreshedVaults : []
        const activeVault = get().activeVault
        // If deleted vault was active, clear it
        const newActiveVault = activeVault === vaultName ? '' : activeVault
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
        const updatedVaults = currentVaults.filter(v => v !== vaultName)
        const newActiveVault = activeVault === vaultName ? '' : activeVault
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
}))
