import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HelpCircle, ArrowRight, Clock, CheckCircle2 } from 'lucide-react'
import { quizzesApi } from '../services/api'
import type { Quiz } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'

export function Quizzes() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState<Record<string, any[]>>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await quizzesApi.list(1, 100)
      setQuizzes(res.items || [])
      // Load attempt counts
      const a: Record<string, any[]> = {}
      for (const q of res.items || []) {
        try { a[q.id] = await quizzesApi.attempts(q.id) } catch { a[q.id] = [] }
      }
      setAttempts(a)
    } catch { setQuizzes([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <FullSpinner message="Loading quizzes…" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Quizzes</h1>
        <p className="text-sm text-navy-400 mt-0.5">Test your knowledge with AI-generated quizzes</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HelpCircle}
            title="No quizzes available"
            message="Quizzes are generated from your lectures. Go to a lecture detail page to generate a quiz."
            actionLabel="Browse Lectures"
            onAction={() => navigate('/lectures')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((q) => {
            const qa = attempts[q.id] || []
            const bestScore = qa.length > 0 ? Math.max(...qa.map((a: any) => a.score)) : null
            return (
              <div
                key={q.id}
                onClick={() => navigate(`/quizzes/${q.id}`)}
                className="card cursor-pointer hover:border-brand-500/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <HelpCircle size={24} className="text-orange-400" />
                  </div>
                  <div className="flex gap-2">
                    <span className="badge-primary">{q.difficulty}</span>
                    {q.is_demo && <span className="badge-warning">Demo</span>}
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1">{q.title}</h3>
                <p className="text-sm text-navy-400 mb-3">{q.description}</p>
                <div className="flex items-center gap-4 text-xs text-navy-500">
                  <span>{q.questions?.length || 0} questions</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {qa.length} attempts</span>
                  {bestScore !== null && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 size={12} /> Best: {bestScore}%
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end mt-3 text-sm text-brand-400 group-hover:text-brand-300">
                  Take Quiz <ArrowRight size={14} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
