import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Mail, Lock, ArrowRight, Sparkles, AudioLines, Brain,
  Users, GraduationCap, Layers, BarChart3,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import { authApi, setToken } from '../services/api'

export function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email'); return }
    if (!password) { setError('Please enter your password'); return }
    setLoading(true)
    try {
      const res = await authApi.demoLogin()
      setToken(res.access_token)
      onLogin(res.access_token)
      navigate('/dashboard')
    } catch {
      onLogin('demo')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    try {
      const res = await authApi.demoLogin()
      setToken(res.access_token)
      onLogin(res.access_token)
    } catch {
      onLogin('demo')
    }
    navigate('/dashboard')
    setLoading(false)
  }

  const features = [
    { icon: AudioLines, label: 'AI Transcription', color: 'text-cyan-400' },
    { icon: Brain, label: 'Smart Summaries', color: 'text-violet-400' },
    { icon: Users, label: 'Meeting Intelligence', color: 'text-indigo-400' },
    { icon: GraduationCap, label: 'Lecture Notes', color: 'text-pink-400' },
    { icon: Layers, label: 'Flashcards & Quizzes', color: 'text-orange-400' },
    { icon: BarChart3, label: 'Analytics', color: 'text-emerald-400' },
  ]

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f2e 0%, #1a0a3c 50%, #0f1535 100%)' }}
      >
        {/* Animated blobs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', animationDelay: '1.5s' }} />

        {/* Logo */}
        <div className="relative">
          <Logo size="lg" />
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">
              Listen Less.<br />
              <span className="gradient-text">Understand More.</span><br />
              Remember Everything.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              AI Meeting and Lecture Intelligence System — transform your recordings into structured, searchable knowledge.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/5">
                  <Icon size={18} className={f.color} />
                  <span className="text-sm text-slate-300">{f.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative">
          <p className="text-xs text-slate-500">
            Supports meetings, lectures, audio, video, PDF uploads · Demo mode — no setup required
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative"
        style={{ background: '#0a0a1a' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Logo size="lg" />
        </div>

        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Sign in</h2>
            <p className="text-slate-400 text-sm">
              Enter any email and password to access the platform instantly.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-red-400 flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11"
                  placeholder="Any password works"
                  autoComplete="current-password"
                />
              </div>
              <p className="text-xs text-slate-600 mt-1.5">Any password will work — no verification needed.</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-600">or continue without account</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Demo login */}
          <button
            onClick={handleDemo}
            disabled={loading}
            className="btn-secondary w-full py-3 text-base"
          >
            <Sparkles size={18} className="text-violet-400" />
            Try Demo Mode
          </button>

          {/* Switch to signup */}
          <p className="text-sm text-slate-400 text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Create account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
