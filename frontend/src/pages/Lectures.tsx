import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, GraduationCap, Trash2, Calendar, Clock, BookOpen } from 'lucide-react'
import { lecturesApi } from '../services/api'
import type { Lecture } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { formatDate, formatDuration } from '../utils/cn'

export function Lectures() {
  const navigate = useNavigate()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Lecture | null>(null)
  const [form, setForm] = useState({ title: '', description: '', subject: '', lecturer: '', date: '', duration_minutes: 0, explanation_level: 'intermediate' })
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await lecturesApi.list()
      setLectures(res.items || [])
    } catch { setLectures([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    try {
      await lecturesApi.create({
        title: form.title,
        description: form.description,
        subject: form.subject,
        lecturer: form.lecturer,
        date: form.date || new Date().toISOString(),
        duration_minutes: Number(form.duration_minutes) || 0,
        explanation_level: form.explanation_level,
      })
      setShowCreate(false)
      setForm({ title: '', description: '', subject: '', lecturer: '', date: '', duration_minutes: 0, explanation_level: 'intermediate' })
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await lecturesApi.delete(deleteTarget.id); await load() } catch {}
    setDeleteTarget(null)
  }

  if (loading) return <FullSpinner message="Loading lectures…" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lectures</h1>
          <p className="text-sm text-navy-400 mt-0.5">Study materials, notes, flashcards, and quizzes</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> New Lecture</button>
      </div>

      {lectures.length === 0 ? (
        <div className="card"><EmptyState icon={GraduationCap} title="No lectures yet" message="Create your first lecture or upload a recording." actionLabel="Create Lecture" onAction={() => setShowCreate(true)} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lectures.map((l) => (
            <div key={l.id} onClick={() => navigate(`/lectures/${l.id}`)} className="card cursor-pointer hover:border-brand-500/30 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center"><GraduationCap size={20} className="text-violet-400" /></div>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(l) }} className="opacity-0 group-hover:opacity-100 btn-ghost !p-1.5 text-red-400"><Trash2 size={16} /></button>
              </div>
              <h3 className="font-semibold text-white mb-1 truncate">{l.title}</h3>
              <p className="text-sm text-navy-400 line-clamp-2 mb-3">{l.description || 'No description'}</p>
              <div className="flex flex-wrap gap-3 text-xs text-navy-500">
                {l.subject && <span className="flex items-center gap-1"><BookOpen size={12} /> {l.subject}</span>}
                <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(l.date)}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(l.duration_minutes)}</span>
                {l.has_summary && <span className="text-emerald-400">Summary</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Lecture"
        footer={<><button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button><button onClick={handleCreate} className="btn-primary">Create</button></>}>
        {error && <div className="bg-red-500/10 text-red-400 text-sm p-2 rounded-lg">{error}</div>}
        <div><label className="block text-sm text-navy-300 mb-1.5">Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Intro to Machine Learning" /></div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm text-navy-300 mb-1.5">Subject</label><input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Computer Science" /></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Lecturer</label><input className="input" value={form.lecturer} onChange={(e) => setForm({ ...form, lecturer: e.target.value })} placeholder="Dr. Smith" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm text-navy-300 mb-1.5">Date</label><input type="date" className="input" value={form.date ? form.date.split('T')[0] : ''} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Duration (min)</label><input type="number" className="input" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
        </div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Explanation Level</label>
          <select className="input" value={form.explanation_level} onChange={(e) => setForm({ ...form, explanation_level: e.target.value })}>
            <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </select>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Lecture" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} confirmLabel="Delete" danger />
    </div>
  )
}
