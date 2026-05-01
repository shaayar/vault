// Component: Dashboard
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVaultStore } from '../../store/vaultStore'
import { NotebookText, FilePlusCorner, ArrowRight, Moon, Sun, Terminal, LogOut, Trash2 } from 'lucide-react'
import { LoginModal, SignupModal } from '../Auth'

// Simple hash function for demo purposes (use bcrypt in production)
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function Dashboard({ theme, onToggleTheme, isLight }) {
  const navigate = useNavigate()
  const { vaults, activeVault, isLoading, createVault, deleteVault, setActiveVault, fetchVaults } = useVaultStore()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('vaultnote:user') || null
  })

  useEffect(() => {
    fetchVaults()
  }, [fetchVaults])

  const handleCreateVault = async () => {
    const vaultName = window.prompt('Enter a vault name:')
    if (!vaultName?.trim()) return

    await createVault(vaultName.trim())
  }

  const handleDeleteVault = async (vault) => {
    if (!window.confirm(`Are you sure you want to delete "${vault.name}"? This will permanently delete all notes and data in this vault.`)) {
      return
    }

    try {
      await deleteVault(vault.id)
      // If the deleted vault was the active vault, redirect to dashboard
      const { activeVault } = useVaultStore.getState()
      if (activeVault?.id === vault.id) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Failed to delete vault:', error)
    }
  }

  const handleSelectVault = (vault) => {
    setActiveVault(vault)
    navigate(`/${vault.id}`)
  }

  const handleLogin = async (username, password) => {
    const users = JSON.parse(localStorage.getItem('vaultnote:users') || '{}')
    const hashedPassword = await hashPassword(password)

    if (!users[username] || users[username].password !== hashedPassword) {
      throw new Error('Invalid username or password')
    }

    localStorage.setItem('vaultnote:user', username)
    setCurrentUser(username)
    setIsLoginOpen(false)
  }

  const handleSignup = async (username, email, password) => {
    const users = JSON.parse(localStorage.getItem('vaultnote:users') || '{}')

    if (users[username]) {
      throw new Error('Username already exists')
    }

    const hashedPassword = await hashPassword(password)
    users[username] = { email, password: hashedPassword }
    localStorage.setItem('vaultnote:users', JSON.stringify(users))

    localStorage.setItem('vaultnote:user', username)
    setCurrentUser(username)
    setIsSignupOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('vaultnote:user')
    setCurrentUser(null)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header - Simplified version of AppLayout Header */}
      <header className={`flex items-center justify-between px-8 w-full h-16 ${isLight ? 'bg-linear-to-r from-slate-100 via-white to-slate-100 border-b border-slate-300/50' : 'bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50'} shadow-lg relative`}>
        <div className="flex items-center gap-8">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Terminal className="text-white text-xl" />
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>VaultNote</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User Info */}
          {currentUser && (
            <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Welcome, <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-slate-50'}`}>{currentUser}</span>
            </span>
          )}

          {/* Theme Toggle */}
          <button
            className={`p-2 hover:${isLight ? 'bg-slate-500/50' : 'bg-slate-800/50'} transition-colors rounded-lg ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
            onClick={onToggleTheme}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Logout */}
          {currentUser && (
            <button
              className={`p-2 hover:${isLight ? 'bg-red-100' : 'bg-red-900/30'} transition-colors rounded-lg ${isLight ? 'text-red-600' : 'text-red-500'}`}
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="mb-8">
          <h1 className={`text-4xl font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-neutral-50'}`}>Your Vaults</h1>
          <p className={`font-mono text-sm uppercase ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>Manage your knowledge bases</p>
        </div>

        {/* Vault Selection */}
        {isLoading ? (
          <div className={`text-center py-12 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Loading vaults...</div>
        ) : vaults.length === 0 ? (
          <div className={`text-center py-12 ${isLight ? 'bg-slate-100' : 'bg-neutral-900/50'} rounded-2xl border ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
            <NotebookText className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-slate-400' : 'text-neutral-600'}`} />
            <h2 className={`text-2xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>No vaults yet</h2>
            <p className={`mb-4 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Create your first vault to get started!</p>
            <button
              onClick={handleCreateVault}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-neutral-50 px-6 py-3 rounded-lg font-medium transition-colors mx-auto"
            >
              <FilePlusCorner className="w-4 h-4" />
              Create First Vault
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {vaults.map((vault, index) => (
              <div
                key={vault.id}
                className={`flex items-center justify-between p-6 ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800'} border rounded-xl transition-all group`}
              >
                <button
                  onClick={() => handleSelectVault(vault)}
                  className="flex items-center gap-4 flex-1 text-left"
                >
                  <div className={`w-12 h-12 rounded-lg ${isLight ? 'bg-primary-100' : 'bg-primary-500/20'} flex items-center justify-center`}>
                    <NotebookText className={`w-6 h-6 ${isLight ? 'text-primary-600' : 'text-primary-400'}`} />
                  </div>
                  <div className="text-left">
                    <span className={`text-lg font-medium ${isLight ? 'text-slate-900' : 'text-neutral-50'}`}>{vault.name || 'Default Vault'}</span>
                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>Cloud markdown vault</p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectVault(vault)}
                    className={`p-2 rounded-lg ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-neutral-400 hover:text-neutral-200'} transition-colors`}
                    title="Open vault"
                  >
                    <ArrowRight className={`w-5 h-5 group-hover:text-primary-400 group-hover:translate-x-1 transition-all`} />
                  </button>
                  <button
                    onClick={() => handleDeleteVault(vault)}
                    disabled={isLoading}
                    className={`p-2 rounded-lg ${isLight ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Delete vault"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Vault Button */}
        {vaults.length > 0 && (
          <div className="mt-8">
            <button
              onClick={handleCreateVault}
              disabled={isLoading}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-neutral-50 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FilePlusCorner className="w-4 h-4" />
              Create New Vault
            </button>
          </div>
        )}
      </main>

      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
        onSwitchToSignup={() => {
          setIsLoginOpen(false)
          setIsSignupOpen(true)
        }}
      />
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSignup={handleSignup}
        onSwitchToLogin={() => {
          setIsSignupOpen(false)
          setIsLoginOpen(true)
        }}
      />
    </div>
  )
}
