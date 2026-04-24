import { create } from 'zustand'
import { createVault as createVaultRequest, getVaults } from '../api/vaultApi'

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
      const createdVault = await createVaultRequest(vaultName)
      set((state) => ({
        isLoading: false,
        vaults: state.vaults.includes(createdVault) ? state.vaults : [...state.vaults, createdVault],
        activeVault: createdVault,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create vault',
      })
    }
  },
}))
