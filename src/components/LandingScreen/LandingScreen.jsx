import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVaultStore } from '../../store/vaultStore'
import { NotebookText, FilePlusCorner, ArrowRight, LogIn, UserPlus } from 'lucide-react'
import { LoginModal, SignupModal } from '../Auth'

// Simple hash function for demo purposes (use bcrypt in production)
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function LandingScreen() {
  const navigate = useNavigate()
  const { vaults, activeVault, isLoading, createVault, setActiveVault, fetchVaults } = useVaultStore()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('vaultnote:user') || null
  })

  useEffect(() => {
    fetchVaults()
  }, [fetchVaults])

  // // Auto-redirect to first vault only if user is logged in and vault is selected
  // useEffect(() => {
  //   if (currentUser && activeVault && vaults.includes(activeVault)) {
  //     navigate(`/${activeVault}`, { replace: true })
  //   }
  // }, [currentUser, activeVault, vaults, navigate])

  const handleCreateVault = async () => {
    const vaultName = window.prompt('Enter a vault name:')
    if (!vaultName?.trim()) return

    await createVault(vaultName.trim())
  }

  const handleSelectVault = (vaultName) => {
    setActiveVault(vaultName)
    navigate(`/${vaultName}`)
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
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Hero Section with staggered animations */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl animate-[slideInLeft_0.4s_ease-out]">
              <NotebookText className="text-white text-3xl" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight animate-[slideInLeft_0.5s_ease-out_0.1s_both]">VaultNote</h1>
          </div>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto animate-[fadeIn_0.6s_ease-out_0.2s_both]">
            Local-first Markdown notes in your browser. Secure, fast, and always with you.
          </p>

          {/* Auth Buttons */}
          <div className="mt-8 flex items-center justify-center gap-4 animate-[fadeIn_0.6s_ease-out_0.3s_both]">
            {currentUser ? (
              <>
                <span className="text-slate-400">Welcome, <span className="text-white font-medium">{currentUser}</span></span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => setIsSignupOpen(true)}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {/* Vault Selection - Only visible when logged in */}
        {currentUser ? (
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
                {vaults.map((vault, index) => (
                  <button
                    key={vault}
                    onClick={() => handleSelectVault(vault)}
                    className="flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 hover:border-indigo-500/50 rounded-xl transition-all group animate-[slideInLeft_0.3s_ease-out_both]"
                    style={{ animationDelay: `${index * 80}ms` }}
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
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl text-center">
            <div className="py-12">
              <NotebookText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Sign in to access your vaults</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Please sign in or create an account to view and manage your vaults.
              </p>
            </div>
          </div>
        )}

        {/* Features with staggered animation */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { icon: 'green', title: 'Local-First', desc: 'Your notes stay on your device. No cloud required.', delay: '0ms' },
            { icon: 'blue', title: 'Markdown', desc: 'Write in Markdown with live preview and rich formatting.', delay: '100ms' },
            { icon: 'purple', title: 'Wiki Links', desc: 'Connect your notes with [[wiki-style]] links and graphs.', delay: '200ms' }
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30 animate-[fadeIn_0.5s_ease-out_both] hover:bg-slate-800/50 transition-colors"
              style={{ animationDelay: feature.delay }}
            >
              <div className={`w-10 h-10 rounded-lg bg-${feature.icon}-500/20 flex items-center justify-center mb-4`}>
                <NotebookText className={`w-5 h-5 text-${feature.icon}-400`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

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
