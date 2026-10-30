import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Layers, Trash2, BookOpen, GraduationCap } from 'lucide-react'
import { flashcardsApi } from '../services/api'
import type { Flashcard, StudyStats } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function Flashcards() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Flashcard[]>([])
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Flashcard | null>(null)
  const [form, setForm] = useState({ front: '', back: '', topic: '', difficulty: 'medium' })

  const load = async () => {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([
        flashcardsApi.list(1, 100),
        flashcardsApi.studyStats().catch(() => null),
      ])
      setCards(c.items || [])
      setStats(s)
    } catch { setCards([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.front.trim() || !form.back.trim()) return
    try {
      await flashcardsApi.create({ front: form.front, back: form.back, topic: form.topic, difficulty: form.difficulty })
      setShowCreate(false)
      setForm({ front: '', back: '', topic: '', difficulty: 'medium' })
      await load()
    } catch { /* ignore */ }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await flashcardsApi.delete(deleteTarget.id); await load() } catch {}
    setDeleteTarget(null)
  }

  if (loading) return <FullSpinner message="Loading flashcards…" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Flashcards</h1>
          <p className="text-sm text-navy-400 mt-0.5">Study with spaced repetition</p>
        </div>
        <div className="flex gap-2">
          {stats && stats.due_cards > 0 && (
            <button onClick={() => navigate('/flashcards/study')} className="btn-primary"><BookOpen size={16} /> Study ({stats.due_cards} due)</button>
          )}
          <button onClick={() => setShowCreate(true)} className="btn-secondary"><Plus size={16} /> New Card</button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card text-center"><div className="text-2xl font-bold text-white">{stats.total_cards}</div><div className="text-xs text-navy-400">Total Cards</div></div>
          <div className="card text-center"><div className="text-2xl font-bold text-amber-400">{stats.due_cards}</div><div className="text-xs text-navy-400">Due Now</div></div>
          <div className="card text-center"><div className="text-2xl font-bold text-emerald-400">{stats.total_reviews}</div><div className="text-xs text-navy-400">Reviews</div></div>
          <div className="card text-center"><div className="text-2xl font-bold text-brand-400">{stats.avg_ease_factor}</div><div className="text-xs text-navy-400">Avg Ease</div></div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="card"><EmptyState icon={Layers} title="No flashcards yet" message="Create flashcards manually or generate them from a lecture." actionLabel="Create Flashcard" onAction={() => setShowCreate(true)} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.id} className="card group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex gap-2">
                  {c.topic && <span className="badge-neutral">{c.topic}</span>}
                  <span className={`badge ${c.difficulty === 'easy' ? 'badge-success' : c.difficulty === 'difficult' ? 'badge-danger' : 'badge-warning'}`}>{c.difficulty}</span>
                  {c.is_demo && <span className="badge-warning">Demo</span>}
                </div>
                <button onClick={() => setDeleteTarget(c)} className="opacity-0 group-hover:opacity-100 btn-ghost !p-1 text-red-400"><Trash2 size={14} /></button>
              </div>
              <div className="text-sm font-medium text-white mb-2">{c.front}</div>
              <div className="text-sm text-navy-300 border-t border-navy-700 pt-2">{c.back}</div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Flashcard"
        footer={<><button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button><button onClick={handleCreate} className="btn-primary">Create</button></>}>
        <div><label className="block text-sm text-navy-300 mb-1.5">Front (Question) *</label><textarea className="input" rows={2} value={form.front} onChange={(e) => setForm({ ...form, front: e.target.value })} /></div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Back (Answer) *</label><textarea className="input" rows={2} value={form.back} onChange={(e) => setForm({ ...form, back: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm text-navy-300 mb-1.5">Topic</label><input className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Difficulty</label><select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="difficult">Difficult</option></select></div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Flashcard" message="Delete this flashcard and its review history?" confirmLabel="Delete" danger />
    </div>
  )
}
