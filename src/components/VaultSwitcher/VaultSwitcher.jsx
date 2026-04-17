import { useState } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'

/**
 * Vault selection and creation controls.
 */
export function VaultSwitcher({ theme, onToggleTheme, isLight }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { vaults, activeVault, isLoading, error, setActiveVault, createVault } = useVaultStore()
  const clearNotesForVaultSwitch = useNoteStore((state) => state.clearNotesForVaultSwitch)

  const handleCreateVault = async () => {
    const vaultName = window.prompt('Enter a vault name:')
    if (!vaultName) {
      return
    }

    await createVault(vaultName.trim())
  }

  return (
    <div className={isLight ? 'border-b border-slate-300' : 'border-b border-slate-700'}>
      <div className="flex items-center gap-2 p-3">
        <h2 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Vaults</h2>
        <button
          type="button"
          className={`rounded-md border px-2 py-1 text-xs ${
            isLight
              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'border-slate-600 text-slate-200 hover:bg-slate-800'
          }`}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button
          type="button"
          className={`ml-auto rounded-md border px-2 py-1 text-xs ${
            isLight
              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'border-slate-600 text-slate-200 hover:bg-slate-800'
          }`}
          onClick={() => setIsCollapsed((value) => !value)}
        >
          {isCollapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <select
            className={`min-w-40 flex-1 rounded-md border px-2 py-1 text-sm ${
              isLight
                ? 'border-slate-300 bg-white text-slate-800'
                : 'border-slate-600 bg-slate-900 text-slate-100'
            }`}
            value={activeVault}
            onChange={(event) => {
              clearNotesForVaultSwitch()
              setActiveVault(event.target.value)
            }}
            disabled={isLoading}
          >
            <option value="">Select vault</option>
            {vaults.map((vaultName) => (
              <option key={vaultName} value={vaultName}>
                {vaultName}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`rounded-md border px-2 py-1 text-xs disabled:opacity-60 ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-slate-600 text-slate-100 hover:bg-slate-800'
            }`}
            onClick={handleCreateVault}
            disabled={isLoading}
          >
            New Vault
          </button>
          {isLoading ? <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading...</span> : null}
          {error ? <span className="w-full text-xs text-rose-400">{error}</span> : null}
        </div>
      )}
    </div>
  )
}
