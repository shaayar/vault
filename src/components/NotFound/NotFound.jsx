import { useNavigate } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
        </div>
        <h1 className="text-6xl font-black text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-300 mb-4">Page Not Found</h2>
        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors mx-auto"
        >
          <Home className="w-4 h-4" />
          Go Home
        </button>
      </div>
    </div>
  )
}
