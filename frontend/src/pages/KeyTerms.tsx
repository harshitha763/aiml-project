import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookMarked, GraduationCap, Search, ArrowRight, Sparkles,
  Tag, Lightbulb, Filter,
} from 'lucide-react'
import { lecturesApi, flashcardsApi } from '../services/api'
import type { Lecture, Flashcard } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'

export function KeyTerms() {
  const navigate = useNavigate()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedLecture, setSelectedLecture] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [l, f] = await Promise.all([
          lecturesApi.list(1, 100).catch(() => ({ items: [] })),
          flashcardsApi.list(1, 200).catch(() => ({ items: [] })),
        ])
        setLectures((l as any).items || [])
        setFlashcards((f as any).items || [])
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <FullSpinner message="Loading key terms…" />

  // Group flashcards by topic to create "key terms"
  const termsByTopic = new Map<string, { term: string; definition: string; lecture: string }[]>()

  flashcards
    .filter(f => !selectedLecture || f.lecture_id === selectedLecture)
    .filter(f => !search || f.front.toLowerCase().includes(search.toLowerCase()) || f.back.toLowerCase().includes(search.toLowerCase()))
    .forEach(f => {
      const topic = f.topic || 'General'
      if (!termsByTopic.has(topic)) termsByTopic.set(topic, [])
      termsByTopic.get(topic)!.push({
        term: f.front.replace(/\[Demo\]\s*/i, '').trim(),
        definition: f.back.replace(/\[Demo\]\s*/i, '').trim(),
        lecture: lectures.find(l => l.id === f.lecture_id)?.title || 'Unknown',
      })
    })

  const topics = Array.from(termsByTopic.entries()).sort((a, b) => b[1].length - a[1].length)
  const totalTerms = flashcards.filter(f => !selectedLecture || f.lecture_id === selectedLecture).length

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Key Terms & Definitions</h1>
          <p className="text-sm text-slate-400 mt-0.5">Important concepts extracted from your lectures</p>
        </div>
        <span className="badge-primary">{totalTerms} terms</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-11" placeholder="Search terms…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={selectedLecture} onChange={(e) => setSelectedLecture(e.target.value)}>
          <option value="">All Lectures</option>
          {lectures.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>

      {topics.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookMarked}
            title="No key terms found"
            message="Generate flashcards from your lectures to see key terms and definitions here."
            actionLabel="Browse Lectures"
            onAction={() => navigate('/lectures')}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {topics.map(([topic, terms]) => (
            <div key={topic} className="card-glow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Tag size={18} className="text-violet-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">{topic}</h2>
                <span className="badge-neutral">{terms.length} terms</span>
              </div>

              {/* Terms grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {terms.map((t, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                    <div className="flex items-start gap-2">
                      <Lightbulb size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white mb-1">{t.term}</div>
                        <div className="text-sm text-slate-400 leading-relaxed">{t.definition}</div>
                        <button onClick={() => {
                          const lecture = lectures.find(l => l.title === t.lecture)
                          if (lecture) navigate(`/lectures/${lecture.id}`)
                        }} className="text-xs text-violet-400 hover:text-violet-300 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          From: {t.lecture} <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
