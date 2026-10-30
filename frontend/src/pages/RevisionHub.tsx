import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers, HelpCircle, BookOpen, Sparkles, ArrowRight, CheckCircle2,
  Clock, Target, Flame, Zap, Play, TrendingUp,
} from 'lucide-react'
import { flashcardsApi, quizzesApi, lecturesApi } from '../services/api'
import type { Flashcard, Quiz, Lecture, StudyStats } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { formatDate } from '../utils/cn'

export function RevisionHub() {
  const navigate = useNavigate()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [f, q, l, s] = await Promise.all([
          flashcardsApi.list(1, 200).catch(() => ({ items: [] })),
          quizzesApi.list(1, 100).catch(() => ({ items: [] })),
          lecturesApi.list(1, 100).catch(() => ({ items: [] })),
          flashcardsApi.studyStats().catch(() => null),
        ])
        setFlashcards((f as any).items || [])
        setQuizzes((q as any).items || [])
        setLectures((l as any).items || [])
        setStats(s)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <FullSpinner message="Loading revision hub…" />

  const dueCards = flashcards.filter(f => new Date(f.next_review_date) <= new Date())
  const reviewedLectures = lectures.filter(l => l.revision_status === 'reviewed')
  const inProgressLectures = lectures.filter(l => l.revision_status === 'in_progress')

  // Calculate overall study readiness
  const totalLectures = lectures.length
  const studiedLectures = reviewedLectures.length + inProgressLectures.length
  const readiness = totalLectures > 0 ? Math.round((studiedLectures / totalLectures) * 100) : 0

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Revision Hub</h1>
        <p className="text-sm text-slate-400 mt-0.5">Your unified study command center</p>
      </div>

      {/* Study Readiness Ring */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-glow flex items-center gap-4 md:col-span-2">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full progress-ring" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - readiness / 100)}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">{readiness}%</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 flex items-center gap-1.5"><Target size={14} className="text-violet-400" /> Study Readiness</div>
            <div className="text-xl font-bold text-white">{studiedLectures} of {totalLectures} lectures started</div>
            <div className="text-xs text-slate-500">{reviewedLectures.length} reviewed, {inProgressLectures.length} in progress</div>
          </div>
        </div>

        <div className="card text-center">
          <Flame size={20} className="text-orange-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-white">{dueCards.length}</div>
          <div className="text-xs text-slate-400">Cards Due</div>
        </div>
        <div className="card text-center">
          <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-white">{stats?.total_reviews ?? 0}</div>
          <div className="text-xs text-slate-400">Total Reviews</div>
        </div>
      </div>

      {/* Three columns: Flashcards, Quizzes, Lectures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flashcards column */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Layers size={18} className="text-pink-400" /> Flashcards</h2>
            <span className="badge-pink">{flashcards.length}</span>
          </div>
          {flashcards.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No flashcards yet.</p>
          ) : (
            <>
              {dueCards.length > 0 && (
                <button onClick={() => navigate('/flashcards/study')} className="w-full mb-3 p-3 rounded-xl bg-gradient-to-r from-pink-500/15 to-rose-500/15 border border-pink-500/20 text-left group transition-all hover:scale-[1.02]">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-pink-400" />
                    <div>
                      <div className="text-sm font-semibold text-white">{dueCards.length} cards due now</div>
                      <div className="text-xs text-slate-400">Tap to start studying</div>
                    </div>
                    <Play size={16} className="text-pink-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              )}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {flashcards.slice(0, 5).map((f) => (
                  <div key={f.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="text-xs text-white truncate font-medium">{f.front.replace(/\[Demo\]\s*/i, '')}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{f.back.replace(/\[Demo\]\s*/i, '')}</div>
                    <div className="flex gap-1.5 mt-1">
                      {f.topic && <span className="badge-neutral text-[10px]">{f.topic}</span>}
                      <span className={`badge text-[10px] ${f.difficulty === 'easy' ? 'badge-success' : f.difficulty === 'difficult' ? 'badge-danger' : 'badge-warning'}`}>{f.difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/flashcards')} className="w-full mt-3 text-sm text-pink-400 hover:text-pink-300 flex items-center justify-center gap-1">
                View All Flashcards <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>

        {/* Quizzes column */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><HelpCircle size={18} className="text-orange-400" /> Quizzes</h2>
            <span className="badge-warning">{quizzes.length}</span>
          </div>
          {quizzes.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No quizzes yet. Generate from a lecture.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {quizzes.map((q) => (
                <div key={q.id} onClick={() => navigate(`/quizzes/${q.id}`)} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors group">
                  <div className="text-sm font-medium text-white">{q.title.replace(/\[Demo\]\s*/i, '')}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{q.questions?.length || 0} questions</span>
                    <span className="badge-primary text-[10px]">{q.difficulty}</span>
                    {q.is_demo && <span className="badge-warning text-[10px]">Demo</span>}
                  </div>
                  <div className="text-xs text-orange-400 mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Take quiz <ArrowRight size={10} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/quizzes')} className="w-full mt-3 text-sm text-orange-400 hover:text-orange-300 flex items-center justify-center gap-1">
            View All Quizzes <ArrowRight size={14} />
          </button>
        </div>

        {/* Lectures column */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><BookOpen size={18} className="text-violet-400" /> Lecture Status</h2>
            <span className="badge-violet">{lectures.length}</span>
          </div>
          {lectures.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No lectures yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lectures.map((l) => (
                <div key={l.id} onClick={() => navigate(`/lectures/${l.id}`)} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors">
                  <div className="text-sm font-medium text-white truncate">{l.title.replace(/\[Demo\]\s*/i, '')}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge text-[10px] ${l.revision_status === 'reviewed' ? 'badge-success' : l.revision_status === 'in_progress' ? 'badge-warning' : 'badge-neutral'}`}>
                      {l.revision_status.replace('_', ' ')}
                    </span>
                    {l.subject && <span className="text-xs text-slate-500">{l.subject}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/lectures')} className="w-full mt-3 text-sm text-violet-400 hover:text-violet-300 flex items-center justify-center gap-1">
            View All Lectures <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Study plan timeline */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Sparkles size={18} className="text-violet-400" /> Suggested Study Plan</h2>
        <div className="space-y-3">
          {dueCards.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-pink-500/5 border border-pink-500/10">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0"><Zap size={18} className="text-pink-400" /></div>
              <div className="flex-1"><div className="text-sm text-white font-medium">Review {dueCards.length} due flashcards</div><div className="text-xs text-slate-400">Spaced repetition — best done now</div></div>
              <button onClick={() => navigate('/flashcards/study')} className="btn-primary text-sm">Study</button>
            </div>
          )}
          {quizzes.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0"><HelpCircle size={18} className="text-orange-400" /></div>
              <div className="flex-1"><div className="text-sm text-white font-medium">Take a quiz to check understanding</div><div className="text-xs text-slate-400">{quizzes.length} quizzes available</div></div>
              <button onClick={() => navigate('/quizzes')} className="btn-secondary text-sm">Take Quiz</button>
            </div>
          )}
          {inProgressLectures.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0"><BookOpen size={18} className="text-violet-400" /></div>
              <div className="flex-1"><div className="text-sm text-white font-medium">Continue studying {inProgressLectures.length} lectures</div><div className="text-xs text-slate-400">In-progress revision</div></div>
              <button onClick={() => navigate('/lectures')} className="btn-secondary text-sm">Continue</button>
            </div>
          )}
          {dueCards.length === 0 && quizzes.length === 0 && inProgressLectures.length === 0 && (
            <div className="py-4">
              <EmptyState icon={TrendingUp} title="All caught up!" message="No urgent study tasks. Keep creating content to build your knowledge base." />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
