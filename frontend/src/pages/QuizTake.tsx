import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Clock } from 'lucide-react'
import { quizzesApi } from '../services/api'
import type { Quiz, QuizAttempt } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'

export function QuizTake() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizAttempt | null>(null)
  const [startTime] = useState(Date.now())

  const load = async () => {
    if (!id) return
    setLoading(true)
    try { const q = await quizzesApi.get(id); setQuiz(q) } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleSubmit = async () => {
    if (!id || !quiz) return
    setSubmitting(true)
    try {
      const answerList = Object.entries(answers).map(([question_id, user_answer]) => ({ question_id, user_answer }))
      const attempt = await quizzesApi.attempt(id, answerList, Math.round((Date.now() - startTime) / 1000))
      setResult(attempt)
    } catch { /* ignore */ }
    finally { setSubmitting(false) }
  }

  if (loading) return <FullSpinner message="Loading quiz…" />
  if (!quiz) return <EmptyState icon={XCircle} title="Quiz not found" message="This quiz may have been deleted." />

  // Results screen
  if (result) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="card text-center py-8">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${result.score >= 70 ? 'bg-emerald-500/10' : result.score >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
            <Trophy size={36} className={result.score >= 70 ? 'text-emerald-400' : result.score >= 40 ? 'text-amber-400' : 'text-red-400'} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{result.score}%</h1>
          <p className="text-navy-400">{result.correct_count} out of {result.total_questions} correct</p>
          <p className="text-sm text-navy-500 mt-2 flex items-center justify-center gap-1"><Clock size={12} /> {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s</p>
        </div>

        {/* Review answers */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Review Answers</h2>
          {quiz.questions.map((q, i) => {
            const userAnswer = answers[q.id] || '(no answer)'
            const isCorrect = userAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
            return (
              <div key={q.id} className="card">
                <div className="flex items-start gap-3">
                  {isCorrect ? <CheckCircle2 size={20} className="text-emerald-400 mt-0.5 shrink-0" /> : <XCircle size={20} className="text-red-400 mt-0.5 shrink-0" />}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">{i + 1}. {q.question}</div>
                    <div className="text-xs text-navy-400 mb-1">Your answer: <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>{userAnswer}</span></div>
                    {!isCorrect && <div className="text-xs text-emerald-400 mb-1">Correct: {q.correct_answer}</div>}
                    {q.explanation && <div className="text-xs text-navy-500 mt-1">{q.explanation}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setResult(null); setAnswers({}); }} className="btn-secondary">Retake Quiz</button>
          <button onClick={() => navigate('/quizzes')} className="btn-primary">Back to Quizzes</button>
        </div>
      </div>
    )
  }

  // Quiz taking screen
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/quizzes')} className="btn-ghost !p-1.5"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
          <p className="text-sm text-navy-400">{quiz.questions.length} questions • {quiz.difficulty}</p>
        </div>
      </div>

      {quiz.is_demo && <div className="badge-warning">Demo quiz — content is sample data</div>}

      <div className="space-y-4">
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="card">
            <div className="text-sm font-medium text-white mb-3">{i + 1}. {q.question}</div>
            {q.question_type === 'short_answer' ? (
              <input className="input" placeholder="Type your answer…" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
            ) : (
              <div className="space-y-2">
                {q.options.map((opt, j) => (
                  <label key={j} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${answers[q.id] === opt ? 'border-brand-500 bg-brand-500/10' : 'border-navy-700 hover:border-navy-600'}`}>
                    <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers({ ...answers, [q.id]: opt })} className="accent-brand-500" />
                    <span className="text-sm text-navy-100">{opt}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={submitting || Object.keys(answers).length === 0} className="btn-primary w-full py-3">
        {submitting ? 'Submitting…' : `Submit Quiz (${Object.keys(answers).length}/${quiz.questions.length} answered)`}
      </button>
    </div>
  )
}
