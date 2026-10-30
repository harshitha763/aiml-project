import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="text-8xl font-bold text-brand-600/20">404</div>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-navy-400 mb-6">The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/dashboard')} className="btn-primary">
        <Home size={16} /> Back to Dashboard
      </button>
    </div>
  )
}
