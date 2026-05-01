import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotebookText, Terminal, Folder, Link2, Share, Bolt, Search, Moon, ArrowRight } from 'lucide-react'
import { LoginModal, SignupModal } from '../Auth'
import { useAuth } from '../../hooks/useAuth'
import { Marquee } from './Marquee'
import { Testimonials } from './Testimonials'
import { BentoGrid } from './BentoGrid'
import { Footer } from './Footer'

export function LandingScreen() {
  const navigate = useNavigate()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const { currentUser, logout, handleLogin, handleSignup } = useAuth()

  const handleLoginSuccess = async (username, password) => {
    await handleLogin(username, password)
    setIsLoginOpen(false)
  }

  const handleSignupSuccess = async (username, email, password) => {
    await handleSignup(username, email, password)
    setIsSignupOpen(false)
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* TopAppBar */}
      <nav className="bg-neutral-950/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-neutral-800">
        <div className="flex justify-between items-center h-14 px-6 max-w-[1200px] mx-auto">
          <div className="text-xl font-bold tracking-tighter text-neutral-50 flex items-center gap-2">
            <Terminal className="text-primary-500" />
            VaultNote
          </div>
          <div className="hidden md:flex gap-8 items-center font-sans text-sm tracking-tight">
            <a className="text-neutral-400 hover:text-neutral-50 transition-colors duration-200 cursor-pointer">Features</a>
            <a className="text-neutral-400 hover:text-neutral-50 transition-colors duration-200 cursor-pointer">Docs</a>
            <a className="text-neutral-400 hover:text-neutral-50 transition-colors duration-200 cursor-pointer">API</a>
            <a className="text-neutral-400 hover:text-neutral-50 transition-colors duration-200 cursor-pointer">Security</a>
          </div>
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span className="text-neutral-400">Welcome, <span className="text-neutral-50 font-medium">{currentUser}</span></span>
              <button
                onClick={logout}
                className="text-neutral-400 hover:text-neutral-50 transition-colors text-sm"
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="bg-primary-600 text-neutral-50 px-4 py-1.5 rounded text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Get Started
            </button>
          )}
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 px-6 overflow-hidden">
          <div className="absolute inset-0 blueprint-bg opacity-20 pointer-events-none"></div>
          <div className="absolute inset-0 bg-linear-to-b from-primary-600/10 via-transparent to-neutral-950 pointer-events-none"></div>
          <div className="max-w-[1200px] mx-auto text-center relative z-10">
            <span className="inline-block px-3 py-1 border border-neutral-800 rounded-full font-mono text-primary-500 mb-8 bg-neutral-900">v1.2.0: Now with E2E Encryption</span>
            <h1 className="text-6xl font-semibold max-w-4xl mx-auto mb-8 text-neutral-50 tracking-tight">
              Your notes. Your files. <br /><span className="text-primary-600">Your control.</span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-12">
              A markdown-native precision tool for technical minds. Own your data with local-first architecture and terminal-grade encryption.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {currentUser ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-4 bg-primary-600 text-neutral-50 rounded-lg flex items-center gap-2 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all"
                >
                  Go to Dashboard <ArrowRight className="text-[18px]" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsSignupOpen(true)}
                    className="px-8 py-4 bg-primary-600 text-neutral-50 rounded-lg flex items-center gap-2 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all"
                  >
                    Get Started <ArrowRight className="text-[18px]" />
                  </button>
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="px-8 py-4 bg-neutral-900 border border-neutral-800 text-neutral-50 rounded-lg hover:bg-neutral-800 transition-all"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mt-20 w-full max-w-5xl mx-auto border border-neutral-800 rounded-xl bg-neutral-900 overflow-hidden shadow-2xl relative group">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-800 bg-neutral-950">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40"></div>
              <span className="ml-4 text-[11px] font-mono text-neutral-500">vaultnote://workspace/main.md</span>
            </div>
            <div className="bg-neutral-900 p-8 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <NotebookText className="w-24 h-24 text-primary-500/30 mx-auto mb-4" />
                <p className="text-neutral-500">VaultNote Interface</p>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <Marquee />

        {/* Problem/Solution (OLD DESIGN - for comparison) */}
        <section className="max-w-[1200px] mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 border-y border-neutral-900">
          <div className="p-8 bg-neutral-900/30 border border-neutral-800 rounded">
            <div className="text-neutral-500 font-mono text-sm mb-4">01 / THE OLD WAY</div>
            <h2 className="text-2xl font-medium text-neutral-50 mb-4 italic">The lock-in era</h2>
            <p className="text-neutral-400 mb-6">Proprietary formats, cloud-only access, and subscriptions that hold your knowledge hostage. When the service dies, your data dies with it.</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-tertiary-400/80">
                <span className="w-4 h-4 rounded-full bg-tertiary-500/50"></span>
                <span>Hidden .json structures</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-tertiary-400/80">
                <span className="w-4 h-4 rounded-full bg-tertiary-500/50"></span>
                <span>Cloud-mandatory syncing</span>
              </div>
            </div>
          </div>
          <div className="p-8 bg-primary-950/10 border border-primary-900/30 rounded">
            <div className="text-primary-400 font-mono text-sm mb-4">02 / THE VAULTNOTE WAY</div>
            <h2 className="text-2xl font-medium text-neutral-50 mb-4">The local-first future</h2>
            <p className="text-neutral-400 mb-6">Plain markdown files stored on your disk. You own the files. We provide the tools to navigate them with blinding speed and precision.</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-primary-400">
                <span className="w-4 h-4 rounded-full bg-primary-500/50"></span>
                <span>Open markdown standard</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-primary-400">
                <span className="w-4 h-4 rounded-full bg-primary-500/50"></span>
                <span>Offline by design</span>
              </div>
            </div>
          </div>
        </section>

        {/* OLD Bento Grid Features (for comparison) */}
        <section className="max-w-[1200px] mx-auto px-6 py-32">
          <div className="mb-16">
            <h2 className="text-2xl font-medium text-neutral-50 mb-2">Engineered for utility (OLD).</h2>
            <p className="text-neutral-500 font-mono text-sm uppercase">High-performance knowledge management</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-8 flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <div>
                <Folder className="text-primary-500 mb-6 text-3xl" />
                <h3 className="font-mono text-sm text-neutral-50 mb-2">Vault-based</h3>
                <p className="text-sm text-neutral-400">Organize your life into distinct, isolated local folders. Zero cross-contamination.</p>
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-8 hover:border-neutral-700 transition-colors">
              <Link2 className="text-primary-500 mb-6 text-3xl" />
              <h3 className="font-mono text-sm text-neutral-50 mb-2">Wiki links</h3>
              <p className="text-sm text-neutral-400">Standard [[link]] syntax for effortless bi-directional navigation.</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-8 hover:border-neutral-700 transition-colors">
              <Share className="text-primary-500 mb-6 text-3xl" />
              <h3 className="font-mono text-sm text-neutral-50 mb-2">Graph view</h3>
              <p className="text-sm text-neutral-400">Visualize the map of your second brain.</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-8 hover:border-neutral-700 transition-colors">
              <Bolt className="text-primary-500 mb-6 text-3xl" />
              <h3 className="font-mono text-sm text-neutral-50 mb-2">Auto-save</h3>
              <p className="text-sm text-neutral-400">Your work is committed to disk the moment you pause typing.</p>
            </div>
            <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-8 hover:border-neutral-700 transition-colors">
              <Search className="text-primary-500 mb-6 text-3xl" />
              <h3 className="font-mono text-sm text-neutral-50 mb-2">Full-text search</h3>
              <p className="text-sm text-neutral-400">Blazing fast indexing across thousands of files using our custom search engine.</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-8 hover:border-neutral-700 transition-colors">
              <Moon className="text-primary-500 mb-6 text-3xl" />
              <h3 className="font-mono text-sm text-neutral-50 mb-2">Dark/light mode</h3>
              <p className="text-sm text-neutral-400">Optimized for day or night focus.</p>
            </div>
          </div>
        </section>

        {/* NEW Bento Grid Features */}
        <BentoGrid />

        {/* Testimonials */}
        <Testimonials />

        {/* Philosophy Section */}
        <section className="py-32 px-6 bg-neutral-950 relative overflow-hidden">
          <div className="absolute inset-0 blueprint-bg opacity-10"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <span className="font-mono text-primary-500 uppercase mb-6 block tracking-widest">Digital Sovereignty</span>
            <h2 className="text-6xl font-semibold leading-[1.1] text-neutral-50 mb-16 tracking-tight">Your notes are files, <br /><span className="text-neutral-500">not database entries.</span></h2>
            <div className="grid grid-cols-2 gap-12">
              <div className="text-left border-l border-primary-600 pl-8">
                <span className="text-6xl font-semibold text-neutral-50 block">0%</span>
                <span className="font-mono text-neutral-500 uppercase tracking-widest">Lock-in risk</span>
              </div>
              <div className="text-left border-l border-primary-600 pl-8">
                <span className="text-6xl font-semibold text-neutral-50 block">100%</span>
                <span className="font-mono text-neutral-500 uppercase tracking-widest">File ownership</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-neutral-900 border border-primary-600/30 p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 blur-[100px] rounded-full"></div>
            <div className="relative z-10">
              <h2 className="text-6xl font-semibold text-neutral-50 mb-6 uppercase tracking-tighter">Ready to secure your second brain?</h2>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-10">Download the native client today. Available for macOS, Linux, and Windows.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {currentUser ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-4 bg-primary-600 text-neutral-50 rounded-lg hover:brightness-110 transition-all flex items-center gap-2"
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsSignupOpen(true)}
                      className="px-8 py-4 bg-primary-600 text-neutral-50 rounded-lg hover:brightness-110 transition-all flex items-center gap-2"
                    >
                      Get Started Free
                    </button>
                    <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest">or</span>
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className="text-neutral-50 border-b border-neutral-50 pb-1 font-mono hover:text-primary-400 transition-colors"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLoginSuccess}
        onSwitchToSignup={() => {
          setIsLoginOpen(false)
          setIsSignupOpen(true)
        }}
      />
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSignup={handleSignupSuccess}
        onSwitchToLogin={() => {
          setIsSignupOpen(false)
          setIsLoginOpen(true)
        }}
      />
    </div>
  )
}
