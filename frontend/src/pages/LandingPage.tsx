import { useNavigate } from 'react-router-dom'
import {
  AudioLines, Lightbulb, Users, GraduationCap, Sparkles,
  Search, BarChart3, Layers, Shield, ArrowRight, Upload,
  FileText, Brain, CheckCircle2, Zap, Star, Play,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import type { AppConfig } from '../types'
import { authApi, setToken } from '../services/api'

export function LandingPage({ config }: { config: AppConfig | null }) {
  const navigate = useNavigate()

  const handleDemo = async () => {
    try {
      const token = await authApi.demoLogin()
      setToken(token.access_token)
      navigate('/dashboard')
    } catch {
      navigate('/dashboard')
    }
  }

  const features = [
    { icon: Users, title: 'Meeting Intelligence', desc: 'AI summaries, decisions, action items, follow-up drafts, and structured reports.', gradient: 'from-indigo-500/20 to-blue-500/20', iconColor: 'text-indigo-400' },
    { icon: GraduationCap, title: 'Lecture Intelligence', desc: 'Chapter-wise notes, flashcards, quizzes, and revision guides from your lectures.', gradient: 'from-violet-500/20 to-fuchsia-500/20', iconColor: 'text-violet-400' },
    { icon: Sparkles, title: 'AI Assistant', desc: 'Ask questions about any meeting or lecture with source-backed answers and timestamps.', gradient: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
    { icon: Search, title: 'Smart Search', desc: 'Search across all your transcripts, notes, summaries, and action items instantly.', gradient: 'from-teal-500/20 to-cyan-500/20', iconColor: 'text-teal-400' },
    { icon: BarChart3, title: 'Analytics', desc: 'Track meeting duration, task completion, study progress, and quiz performance.', gradient: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400' },
    { icon: Layers, title: 'Flashcards & Quizzes', desc: 'Auto-generated study materials with spaced repetition and self-assessment.', gradient: 'from-pink-500/20 to-rose-500/20', iconColor: 'text-pink-400' },
  ]

  const steps = [
    { icon: Upload, title: 'Upload', desc: 'Drag and drop audio or video recordings, or import documents.', color: '#06b6d4' },
    { icon: AudioLines, title: 'Transcribe', desc: 'AI speech-to-text with timestamps and speaker identification.', color: '#6366f1' },
    { icon: Brain, title: 'Analyze', desc: 'Generate summaries, notes, flashcards, and quizzes automatically.', color: '#8b5cf6' },
    { icon: CheckCircle2, title: 'Learn', desc: 'Study with spaced repetition, ask questions, and track your progress.', color: '#ec4899' },
  ]

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 px-4 sm:px-6 py-3.5 flex items-center justify-between" style={{ background: 'rgba(10,10,26,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Logo size="md" />
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
          <a href="#how" className="text-sm text-slate-400 hover:text-white transition-colors">How it works</a>
          <a href="#privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-ghost text-sm">Sign In</button>
          <button onClick={() => navigate('/register')} className="btn-primary text-sm">Get Started <ArrowRight size={15} /></button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Sparkles size={14} className="text-violet-400" />
          <span className="text-sm text-violet-300">AI-Powered Knowledge Platform</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
          Listen Less.{' '}
          <span className="gradient-text">Understand More.</span>{' '}
          <br className="hidden md:block" />Remember Everything.
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          Transform your recorded meetings and lectures into searchable, organized, actionable knowledge — summaries, notes, flashcards, quizzes, and an AI assistant that answers your questions.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => navigate('/register')} className="btn-primary px-6 py-3 text-base">
            Get Started Free <ArrowRight size={18} />
          </button>
          {config?.demo_mode && (
            <button onClick={handleDemo} className="btn-secondary px-6 py-3 text-base">
              <Play size={18} /> Try Demo Mode
            </button>
          )}
        </div>
        {config && !config.is_ai_configured && (
          <p className="mt-4 text-xs text-amber-400/70">
            Demo mode active — AI features use sample data. Configure an AI provider in .env for real processing.
          </p>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
          {[
            { label: 'Features', value: '20+' },
            { label: 'API Routes', value: '93' },
            { label: 'AI Providers', value: '4' },
            { label: 'File Formats', value: '12+' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold gradient-text">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-2">Everything you need to <span className="gradient-text">learn from recordings</span></h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">From audio upload to actionable insights, IntelliMeet AI covers the full workflow.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className={`card-hover bg-gradient-to-br ${f.gradient} group animate-slide-up`} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={24} className={f.iconColor} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">How it <span className="gradient-text">works</span></h2>
          <p className="text-slate-400 text-center mb-12">Four simple steps from recording to knowledge</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="card text-center group">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, ${s.color}30, ${s.color}10)`, border: `1px solid ${s.color}30` }}>
                    <Icon size={26} style={{ color: s.color }} />
                  </div>
                  <div className="text-sm font-semibold mb-1" style={{ color: s.color }}>Step {i + 1}</div>
                  <h3 className="text-base font-semibold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-400">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Shield size={28} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Privacy and <span className="gradient-text">security first</span></h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Your recordings and transcripts are treated as sensitive data. We never expose API keys to the frontend, enforce ownership checks on every resource, and clearly indicate when data is sent to third-party AI providers. You control your data and can delete it anytime.
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="card p-10 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.08), rgba(6,182,212,0.05))', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          <div className="relative">
            <div className="inline-flex items-center gap-1 mb-4">
              {[0, 1, 2, 3, 4].map(i => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
            </div>
            <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-slate-400 mb-6">Join IntelliMeet AI and turn your recordings into knowledge.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => navigate('/register')} className="btn-primary px-6 py-3">
                Create Account <ArrowRight size={18} />
              </button>
              {config?.demo_mode && (
                <button onClick={handleDemo} className="btn-secondary px-6 py-3">
                  <Zap size={18} /> Try Demo Mode
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-slate-300">Features</a>
            <a href="#how" className="hover:text-slate-300">How it works</a>
            <a href="#privacy" className="hover:text-slate-300">Privacy</a>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
