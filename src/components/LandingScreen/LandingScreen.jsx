import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVaultStore } from '../../store/vaultStore'
import { NotebookText, FilePlusCorner, ArrowRight } from 'lucide-react'

export function LandingScreen() {
  const navigate = useNavigate()
  const { vaults, activeVault, isLoading, createVault, setActiveVault, fetchVaults } = useVaultStore()

  useEffect(() => {
    fetchVaults()
  }, [fetchVaults])

  // Auto-redirect to first vault if already selected
  useEffect(() => {
    if (activeVault && vaults.includes(activeVault)) {
      navigate(`/${activeVault}`, { replace: true })
    }
  }, [activeVault, vaults, navigate])

  const handleCreateVault = async () => {
    const vaultName = window.prompt('Enter a vault name:')
    if (!vaultName?.trim()) return

    await createVault(vaultName.trim())
  }

  const handleSelectVault = (vaultName) => {
    setActiveVault(vaultName)
    navigate(`/${vaultName}`)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <NotebookText className="text-white text-3xl" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight">VaultNote</h1>
          </div>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Local-first Markdown notes in your browser. Secure, fast, and always with you.
          </p>
        </div>

        {/* Vault Selection */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Vaults</h2>
            <button
              onClick={handleCreateVault}
              disabled={isLoading}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FilePlusCorner className="w-4 h-4" />
              Create Vault
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading vaults...</div>
          ) : vaults.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No vaults yet. Create your first vault to get started!</p>
              <button
                onClick={handleCreateVault}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors mx-auto"
              >
                <FilePlusCorner className="w-4 h-4" />
                Create First Vault
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {vaults.map((vault) => (
                <button
                  key={vault}
                  onClick={() => handleSelectVault(vault)}
                  className="flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 hover:border-indigo-500/50 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                      <NotebookText className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-lg font-medium text-white">{vault || 'Default Vault'}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <NotebookText className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Local-First</h3>
            <p className="text-slate-400 text-sm">Your notes stay on your device. No cloud required.</p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <NotebookText className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Markdown</h3>
            <p className="text-slate-400 text-sm">Write in Markdown with live preview and rich formatting.</p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <NotebookText className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Wiki Links</h3>
            <p className="text-slate-400 text-sm">Connect your notes with [[wiki-style]] links and graphs.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
