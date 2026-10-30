import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Timer, Play, Pause, RotateCcw, Coffee, Brain, Target,
  CheckCircle2, Plus, Trash2, Calendar, Layers, HelpCircle, TrendingUp,
} from 'lucide-react'
import { flashcardsApi, quizzesApi, calendarApi } from '../services/api'
import type { Flashcard, StudyStats } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { cn } from '../utils/cn'

export function StudyPlanner() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  // Pomodoro state
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Study plan state
  const [goals, setGoals] = useState<{ id: string; text: string; done: boolean }[]>(() => {
    const saved = localStorage.getItem('studyGoals')
    return saved ? JSON.parse(saved) : []
  })
  const [newGoal, setNewGoal] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [s, f] = await Promise.all([
          flashcardsApi.studyStats().catch(() => null),
          flashcardsApi.list(1, 100).catch(() => ({ items: [] })),
        ])
        setStats(s)
        setFlashcards((f as any).items || [])
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Pomodoro timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsRunning(false)
            if (mode === 'focus') {
              setCompletedSessions((c) => c + 1)
              setMode('break')
              return 5 * 60
            } else {
              setMode('focus')
              return 25 * 60
            }
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, timeLeft, mode])

  // Save goals
  useEffect(() => {
    localStorage.setItem('studyGoals', JSON.stringify(goals))
  }, [goals])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60)
  }

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoal.trim()) return
    setGoals([...goals, { id: Date.now().toString(), text: newGoal, done: false }])
    setNewGoal('')
  }

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g))
  }

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id))
  }

  // AI-generated study recommendations
  const recommendations: { icon: any; title: string; desc: string; action: string; onClick: () => void; color: string }[] = []

  if (stats && stats.due_cards > 0) {
    recommendations.push({
      icon: Layers, title: 'Review Due Flashcards', desc: `${stats.due_cards} cards waiting for review`, action: 'Start Review',
      onClick: () => navigate('/flashcards/study'), color: 'from-pink-500/20 to-rose-500/20 text-pink-400'
    })
  }
  if (stats && stats.total_cards < 10) {
    recommendations.push({
      icon: Plus, title: 'Create More Flashcards', desc: 'Build your study deck from lecture content', action: 'Browse Lectures',
      onClick: () => navigate('/lectures'), color: 'from-indigo-500/20 to-violet-500/20 text-indigo-400'
    })
  }
  recommendations.push({
    icon: HelpCircle, title: 'Test Your Knowledge', desc: 'Take a quiz to identify weak areas', action: 'Take Quiz',
    onClick: () => navigate('/quizzes'), color: 'from-orange-500/20 to-amber-500/20 text-orange-400'
  })
  recommendations.push({
    icon: Calendar, title: 'Plan Study Sessions', desc: 'Schedule focused study blocks in your calendar', action: 'Open Calendar',
    onClick: () => navigate('/calendar'), color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400'
  })

  if (loading) return <FullSpinner message="Loading study planner…" />

  const progress = (timeLeft / (mode === 'focus' ? 25 * 60 : 5 * 60)) * 100

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Study Planner</h1>
        <p className="text-sm text-slate-400 mt-0.5">Focus timer, study goals, and AI recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pomodoro Timer */}
        <div className="card-glow lg:col-span-1 text-center">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
            <Timer size={18} className={mode === 'focus' ? 'text-indigo-400' : 'text-emerald-400'} />
            {mode === 'focus' ? 'Focus Session' : 'Break Time'}
          </h2>

          {/* Circular timer */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-full h-full progress-ring" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="100" cy="100" r="90" fill="none" stroke={mode === 'focus' ? '#818cf8' : '#6ee7b7'} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-white font-mono">{formatTime(timeLeft)}</div>
              <div className="text-xs text-slate-500 mt-1">
                {mode === 'focus' ? 'Stay focused' : 'Take a break'}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-4">
            <button onClick={() => setIsRunning(!isRunning)} className="btn-primary px-6">
              {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
            </button>
            <button onClick={resetTimer} className="btn-secondary"><RotateCcw size={16} /> Reset</button>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-indigo-400"><Brain size={14} /> {completedSessions} sessions</span>
            <span className="flex items-center gap-1.5 text-emerald-400"><Coffee size={14} /> {completedSessions * 5} min breaks</span>
          </div>
        </div>

        {/* Study Goals */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target size={18} className="text-amber-400" /> Study Goals</h2>
          <form onSubmit={addGoal} className="flex gap-2 mb-4">
            <input className="input flex-1" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="Add a study goal…" />
            <button type="submit" className="btn-primary"><Plus size={16} /></button>
          </form>

          {goals.length === 0 ? (
            <div className="py-6">
              <EmptyState icon={Target} title="No goals set" message="Add study goals to track your progress." />
            </div>
          ) : (
            <div className="space-y-2">
              {goals.map((g) => (
                <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                  <button onClick={() => toggleGoal(g.id)} className="shrink-0">
                    {g.done ? <CheckCircle2 size={20} className="text-emerald-400" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600" />}
                  </button>
                  <span className={cn('text-sm flex-1', g.done ? 'line-through text-slate-500' : 'text-white')}>{g.text}</span>
                  <button onClick={() => deleteGoal(g.id)} className="opacity-0 group-hover:opacity-100 btn-ghost !p-1 text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {goals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Progress</span>
                <span className="text-white font-semibold">{goals.filter(g => g.done).length}/{goals.length} completed</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(goals.filter(g => g.done).length / goals.length) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Study Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card text-center">
            <Layers size={20} className="text-pink-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">{stats.total_cards}</div>
            <div className="text-xs text-slate-400">Total Cards</div>
          </div>
          <div className="card text-center">
            <Brain size={20} className="text-amber-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">{stats.due_cards}</div>
            <div className="text-xs text-slate-400">Due Now</div>
          </div>
          <div className="card text-center">
            <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">{stats.total_reviews}</div>
            <div className="text-xs text-slate-400">Reviews Done</div>
          </div>
          <div className="card text-center">
            <TrendingUp size={20} className="text-indigo-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">{stats.avg_ease_factor}</div>
            <div className="text-xs text-slate-400">Avg Ease</div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><SparklesIcon /> Smart Study Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.map((r, i) => {
            const Icon = r.icon
            return (
              <div key={i} className={`card-hover bg-gradient-to-br ${r.color} flex items-center gap-4`}>
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{r.title}</h3>
                  <p className="text-xs text-slate-400">{r.desc}</p>
                </div>
                <button onClick={r.onClick} className="btn-secondary text-sm shrink-0">{r.action}</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SparklesIcon() {
  return <span className="text-violet-400"><TrendingUp size={18} /></span>
}
