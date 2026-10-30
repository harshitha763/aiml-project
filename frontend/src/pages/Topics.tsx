import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Tag, ArrowRight, BookOpen, Users, GraduationCap, Sparkles,
  TrendingUp, Hash,
} from 'lucide-react'
import { analyticsApi, meetingsApi, lecturesApi, flashcardsApi } from '../services/api'
import type { Analytics, Meeting, Lecture, Flashcard } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'

const topicColors = [
  'from-indigo-500/20 to-blue-500/20 text-indigo-300',
  'from-violet-500/20 to-fuchsia-500/20 text-violet-300',
  'from-cyan-500/20 to-teal-500/20 text-cyan-300',
  'from-emerald-500/20 to-green-500/20 text-emerald-300',
  'from-amber-500/20 to-orange-500/20 text-amber-300',
  'from-pink-500/20 to-rose-500/20 text-pink-300',
  'from-purple-500/20 to-indigo-500/20 text-purple-300',
  'from-blue-500/20 to-cyan-500/20 text-blue-300',
]

export function Topics() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [a, m, l, f] = await Promise.all([
          analyticsApi.get().catch(() => null),
          meetingsApi.list(1, 50).catch(() => ({ items: [] })),
          lecturesApi.list(1, 50).catch(() => ({ items: [] })),
          flashcardsApi.list(1, 100).catch(() => ({ items: [] })),
        ])
        setAnalytics(a as Analytics | null)
        setMeetings((m as any).items || [])
        setLectures((l as any).items || [])
        setFlashcards((f as any).items || [])
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <FullSpinner message="Loading topics…" />

  // Aggregate topics from analytics + flashcards
  const topicMap = new Map<string, { count: number; type: string; resources: { id: string; title: string; type: string }[] }>()

  // From analytics topics
  analytics?.topics?.forEach(t => {
    const key = t.topic || 'General'
    if (!topicMap.has(key)) topicMap.set(key, { count: 0, type: t.kind || 'mixed', resources: [] })
    topicMap.get(key)!.count += t.count
  })

  // From flashcards
  flashcards.forEach(f => {
    const key = f.topic || 'General'
    if (!topicMap.has(key)) topicMap.set(key, { count: 0, type: 'flashcard', resources: [] })
    topicMap.get(key)!.count++
    if (f.lecture_id) {
      const lecture = lectures.find(l => l.id === f.lecture_id)
      if (lecture) {
        topicMap.get(key)!.resources.push({ id: lecture.id, title: lecture.title, type: 'lecture' })
      }
    }
  })

  // From lecture subjects
  lectures.forEach(l => {
    if (l.subject) {
      const key = l.subject
      if (!topicMap.has(key)) topicMap.set(key, { count: 0, type: 'lecture', resources: [] })
      topicMap.get(key)!.resources.push({ id: l.id, title: l.title, type: 'lecture' })
    }
  })

  const topics = Array.from(topicMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)

  const isEmpty = topics.length === 0 && meetings.length === 0 && lectures.length === 0

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Topics & Concepts</h1>
          <p className="text-sm text-slate-400 mt-0.5">Key themes discovered across your meetings and lectures</p>
        </div>
      </div>

      {isEmpty ? (
        <div className="card">
          <EmptyState icon={Tag} title="No topics yet" message="Create meetings and lectures to discover key topics and concepts." />
        </div>
      ) : (
        <>
          {/* Topic cloud */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Hash size={18} className="text-violet-400" /> Topic Cloud</h2>
            <div className="flex flex-wrap gap-2.5">
              {topics.map((t, i) => {
                const size = Math.min(Math.max(t.count * 2, 14), 28)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const resource = t.resources[0]
                      if (resource) navigate(resource.type === 'lecture' ? `/lectures/${resource.id}` : `/meetings/${resource.id}`)
                    }}
                    className={`px-4 py-2 rounded-full bg-gradient-to-br ${topicColors[i % topicColors.length]} border border-white/10 hover:scale-105 transition-transform font-medium`}
                    style={{ fontSize: `${size}px` }}
                  >
                    {t.name} <span className="opacity-50 text-xs">{t.count}</span>
                  </button>
                )
              })}
              {topics.length === 0 && <p className="text-sm text-slate-500">No topics detected yet.</p>}
            </div>
          </div>

          {/* Topic cards grid */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><BookOpen size={18} className="text-cyan-400" /> Topic Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((t, i) => (
                <div key={i} className="card-hover group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${topicColors[i % topicColors.length]} flex items-center justify-center`}>
                      <Tag size={18} />
                    </div>
                    <span className="badge-neutral">{t.count} items</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{t.name}</h3>
                  <div className="text-xs text-slate-400 mb-3">
                    {t.type === 'lecture' && <span className="flex items-center gap-1"><GraduationCap size={11} /> Lecture topic</span>}
                    {t.type === 'flashcard' && <span className="flex items-center gap-1"><Sparkles size={11} /> Flashcard topic</span>}
                    {(t.type === 'mixed' || !t.type) && <span className="flex items-center gap-1"><TrendingUp size={11} /> Across content</span>}
                  </div>
                  {t.resources.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-white/5">
                      {t.resources.slice(0, 3).map((r, j) => (
                        <button
                          key={j}
                          onClick={() => navigate(r.type === 'lecture' ? `/lectures/${r.id}` : `/meetings/${r.id}`)}
                          className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors text-left"
                        >
                          {r.type === 'lecture' ? <GraduationCap size={12} className="text-violet-400" /> : <Users size={12} className="text-indigo-400" />}
                          <span className="truncate">{r.title}</span>
                          <ArrowRight size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
