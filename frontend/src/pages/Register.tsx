import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2,
  AudioLines, FileText, Brain, Layers, BarChart3, CalendarDays,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import { authApi, setToken } from '../services/api'

export function Register({ onRegister }: { onRegister: (token: string) => void }) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email'); return }
    if (!password) { setError('Please enter a password'); return }
    setLoading(true)
    try {
      const res = await authApi.demoLogin()
      setToken(res.access_token)
      onRegister(res.access_token)
      navigate('/dashboard')
    } catch {
      onRegister('demo')
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
      onRegister(res.access_token)
    } catch {
      onRegister('demo')
    }
    navigate('/dashboard')
    setLoading(false)
  }

  const perks = [
    'AI-powered speech-to-text transcription',
    'Auto-generated meeting summaries & action items',
    'Study notes, flashcards, and quizzes from lectures',
    'AI assistant to answer questions from your content',
    'Smart search across all transcripts and notes',
    'Analytics dashboard with real data insights',
    'Calendar, Pomodoro timer, Revision Hub & more',
  ]

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ── Left panel — perks ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f2e 0%, #160a35 50%, #0a1535 100%)' }}
      >
        {/* Blobs */}
        <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)', animationDelay: '2s' }} />

        {/* Logo */}
        <div className="relative"><Logo size="lg" /></div>

        {/* Perks list */}
        <div className="relative space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Everything you need for<br />
              <span className="gradient-text">meetings & lectures</span>
            </h2>
            <p className="text-slate-400">Join IntelliMeet AI for free. No credit card required.</p>
          </div>

          <ul className="space-y-3">
            {perks.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 size={17} className="text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-300">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-3">
          {[
            { value: '20+', label: 'Features' },
            { value: '93', label: 'API Routes' },
            { value: '6', label: 'AI Workflows' },
          ].map((s, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="text-xl font-bold gradient-text">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto"
        style={{ background: '#0a0a1a' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-8"><Logo size="lg" /></div>

        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
            <p className="text-slate-400 text-sm">
              Get instant access with any email and password — no verification needed.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-red-400 flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name <span className="text-slate-600">(optional)</span></label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input pl-11"
                  placeholder="Harshitha V"
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address <span className="text-red-400">*</span></label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <p className="text-xs text-slate-600 mt-1.5">Any password works — instant access, no email confirmation.</p>
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
                  Creating account…
                </span>
              ) : (
                <>Get Started Free <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-600">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Demo login */}
          <button
            onClick={handleDemo}
            disabled={loading}
            className="btn-secondary w-full py-3 text-base"
          >
            <Sparkles size={18} className="text-violet-400" />
            Try Demo Mode (no signup)
          </button>

          {/* Features row */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[
              { icon: AudioLines, label: 'Transcription', color: 'text-cyan-400' },
              { icon: Brain, label: 'AI Summaries', color: 'text-violet-400' },
              { icon: Layers, label: 'Study Tools', color: 'text-pink-400' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Icon size={16} className={f.color} />
                  <span className="text-[10px] text-slate-500">{f.label}</span>
                </div>
              )
            })}
          </div>

          {/* Sign in link */}
          <p className="text-sm text-slate-400 text-center mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
