import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, GraduationCap, Clock, FileText, CheckSquare, ListTodo,
  Layers, HelpCircle, Upload, Sparkles, Plus, ArrowRight, Database,
  TrendingUp, Target, Flame, Zap, Calendar, BookOpen, Award,
} from 'lucide-react'
import { dashboardApi, demoApi } from '../services/api'
import type { DashboardStats } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { formatDuration, formatDateTime } from '../utils/cn'

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const loadStats = async () => {
    setLoading(true)
    try { const data = await dashboardApi.getStats(); setStats(data) } catch { setStats(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadStats() }, [])

  const handleSeed = async () => {
    setSeeding(true)
    try { await demoApi.seed(); await loadStats() } catch {}
    finally { setSeeding(false) }
  }

  if (loading) return <FullSpinner message="Loading dashboard…" />

  const statCards = [
    { icon: Users, label: 'Meetings', value: stats?.meeting_count ?? 0, color: 'text-indigo-400', bg: 'bg-indigo-500/10', ring: '#818cf8' },
    { icon: GraduationCap, label: 'Lectures', value: stats?.lecture_count ?? 0, color: 'text-violet-400', bg: 'bg-violet-500/10', ring: '#c4b5fd' },
    { icon: Clock, label: 'Duration', value: formatDuration(stats?.total_duration_minutes ?? 0), color: 'text-cyan-400', bg: 'bg-cyan-500/10', ring: '#67e8f9' },
    { icon: FileText, label: 'Summaries', value: stats?.summaries_generated ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: '#6ee7b7' },
    { icon: ListTodo, label: 'Pending Tasks', value: stats?.pending_tasks ?? 0, color: 'text-amber-400', bg: 'bg-amber-500/10', ring: '#fcd34d' },
    { icon: CheckSquare, label: 'Completed', value: stats?.completed_tasks ?? 0, color: 'text-green-400', bg: 'bg-green-500/10', ring: '#86efac' },
    { icon: Layers, label: 'Flashcards', value: stats?.flashcards_created ?? 0, color: 'text-pink-400', bg: 'bg-pink-500/10', ring: '#f9a8d4' },
    { icon: HelpCircle, label: 'Quizzes', value: stats?.quizzes_taken ?? 0, color: 'text-orange-400', bg: 'bg-orange-500/10', ring: '#fdba74' },
  ]

  const quickActions = [
    { icon: Upload, label: 'Upload Recording', desc: 'Add audio or video', onClick: () => navigate('/upload'), color: 'from-cyan-500/20 to-blue-500/20', iconColor: 'text-cyan-400' },
    { icon: Plus, label: 'New Meeting', desc: 'Create manually', onClick: () => navigate('/meetings'), color: 'from-indigo-500/20 to-purple-500/20', iconColor: 'text-indigo-400' },
    { icon: Plus, label: 'New Lecture', desc: 'Add a lecture', onClick: () => navigate('/lectures'), color: 'from-violet-500/20 to-fuchsia-500/20', iconColor: 'text-violet-400' },
    { icon: Sparkles, label: 'AI Assistant', desc: 'Ask questions', onClick: () => navigate('/assistant'), color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
    { icon: Layers, label: 'Study Cards', desc: 'Review due cards', onClick: () => navigate('/flashcards/study'), color: 'from-pink-500/20 to-rose-500/20', iconColor: 'text-pink-400' },
    { icon: HelpCircle, label: 'Take Quiz', desc: 'Test knowledge', onClick: () => navigate('/quizzes'), color: 'from-orange-500/20 to-amber-500/20', iconColor: 'text-orange-400' },
  ]

  const isEmpty = stats?.meeting_count === 0 && stats?.lecture_count === 0 && stats?.flashcards_created === 0

  // Calculate progress percentages
  const totalTasks = (stats?.pending_tasks ?? 0) + (stats?.completed_tasks ?? 0)
  const taskCompletion = totalTasks > 0 ? Math.round((stats?.completed_tasks ?? 0) / totalTasks * 100) : 0
  const studyProgress = Math.min(100, Math.round(((stats?.flashcards_created ?? 0) / 20) * 100))

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08), rgba(6,182,212,0.06))', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Welcome back! 👋</h1>
            <p className="text-slate-400 text-sm">Here's what's happening with your meetings and lectures.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/upload')} className="btn-primary"><Upload size={16} /> Upload</button>
            <button onClick={() => navigate('/assistant')} className="btn-secondary"><Sparkles size={16} /> Ask AI</button>
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="card-glow" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
          <EmptyState
            icon={Database}
            title="No data yet"
            message="Get started by uploading a recording or loading demo data to explore the platform."
            actionLabel={seeding ? 'Seeding…' : 'Load Demo Data'}
            onAction={handleSeed}
          />
        </div>
      )}

      {/* Progress rings row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task completion ring */}
        <div className="card-glow flex items-center gap-4">
          <ProgressRing percent={taskCompletion} color="#818cf8" label="Tasks" />
          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Target size={12} /> Task Completion</div>
            <div className="text-2xl font-bold text-white">{taskCompletion}%</div>
            <div className="text-xs text-slate-400">{stats?.completed_tasks ?? 0} of {totalTasks} done</div>
          </div>
        </div>

        {/* Study progress ring */}
        <div className="card-glow flex items-center gap-4">
          <ProgressRing percent={studyProgress} color="#c4b5fd" label="Study" />
          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><BookOpen size={12} /> Study Progress</div>
            <div className="text-2xl font-bold text-white">{stats?.flashcards_created ?? 0} cards</div>
            <div className="text-xs text-slate-400">{stats?.due_flashcards ?? 0} due for review</div>
          </div>
        </div>

        {/* Quiz score ring */}
        <div className="card-glow flex items-center gap-4">
          <ProgressRing percent={Math.round(stats?.avg_quiz_score ?? 0)} color="#fdba74" label="Quiz" />
          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Award size={12} /> Quiz Performance</div>
            <div className="text-2xl font-bold text-white">{Math.round(stats?.avg_quiz_score ?? 0)}%</div>
            <div className="text-xs text-slate-400">{stats?.quizzes_taken ?? 0} quizzes taken</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="card-hover group animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className={s.color} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Quick actions grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Zap size={18} className="text-violet-400" /> Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((a, i) => {
            const Icon = a.icon
            return (
              <button
                key={i}
                onClick={a.onClick}
                className={`card-hover text-left p-4 bg-gradient-to-br ${a.color} border border-white/10 group`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon size={20} className={a.iconColor} />
                </div>
                <div className="text-sm font-semibold text-white">{a.label}</div>
                <div className="text-xs text-slate-400">{a.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent activity + Study streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity timeline */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-cyan-400" /> Recent Activity</h2>
          {stats?.recent_activity && stats.recent_activity.length > 0 ? (
            <div className="space-y-2">
              {stats.recent_activity.map((a, i) => (
                <button
                  key={i}
                  onClick={() => navigate(a.type === 'meeting' ? `/meetings/${a.id}` : `/lectures/${a.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.type === 'meeting' ? 'bg-indigo-500/10' : 'bg-violet-500/10'}`}>
                    {a.type === 'meeting' ? <Users size={16} className="text-indigo-400" /> : <GraduationCap size={16} className="text-violet-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.timestamp ? formatDateTime(a.timestamp) : ''}</div>
                  </div>
                  <ArrowRight size={14} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recent activity yet.</p>
          )}
        </div>

        {/* Study streak card */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
          <div className="relative">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Flame size={18} className="text-orange-400" /> Study Streak</h2>
            <div className="text-center py-4">
              <div className="text-5xl font-bold gradient-text mb-1">7</div>
              <div className="text-xs text-slate-400">days in a row</div>
            </div>
            <div className="flex justify-between gap-1 mt-4">
              {[0, 1, 2, 3, 4, 5, 6].map(d => (
                <div key={d} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: d < 5 ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'rgba(255,255,255,0.05)', color: d < 5 ? 'white' : '#64748b' }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][d]}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1"><Calendar size={12} /> This week</span>
                <span className="text-white font-semibold">{(stats?.quizzes_taken ?? 0) + (stats?.flashcards_created ?? 0)} activities</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressRing({ percent, color, label }: { percent: number; color: string; label: string }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="progress-ring w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx="32" cy="32" r={radius} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{percent}%</div>
    </div>
  )
}
