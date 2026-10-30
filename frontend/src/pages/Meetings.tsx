import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Trash2, Calendar, Clock, FileText, ListTodo } from 'lucide-react'
import { meetingsApi } from '../services/api'
import type { Meeting } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { formatDate, formatDuration } from '../utils/cn'

export function Meetings() {
  const navigate = useNavigate()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null)
  const [form, setForm] = useState({ title: '', description: '', participants: '', date: '', duration_minutes: 0, location: '' })
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await meetingsApi.list()
      setMeetings(res.items || [])
    } catch { setMeetings([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setError('')
    try {
      await meetingsApi.create({
        title: form.title,
        description: form.description,
        participants: form.participants,
        date: form.date || new Date().toISOString(),
        duration_minutes: Number(form.duration_minutes) || 0,
        location: form.location,
      })
      setShowCreate(false)
      setForm({ title: '', description: '', participants: '', date: '', duration_minutes: 0, location: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await meetingsApi.delete(deleteTarget.id)
      await load()
    } catch { /* ignore */ }
    setDeleteTarget(null)
  }

  if (loading) return <FullSpinner message="Loading meetings…" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meetings</h1>
          <p className="text-sm text-navy-400 mt-0.5">Manage and review your meeting recordings</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> New Meeting
        </button>
      </div>

      {meetings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No meetings yet"
            message="Create your first meeting or upload a recording to get started."
            actionLabel="Create Meeting"
            onAction={() => setShowCreate(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/meetings/${m.id}`)}
              className="card cursor-pointer hover:border-brand-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Users size={20} className="text-brand-400" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(m) }}
                  className="opacity-0 group-hover:opacity-100 btn-ghost !p-1.5 text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="font-semibold text-white mb-1 truncate">{m.title}</h3>
              <p className="text-sm text-navy-400 line-clamp-2 mb-3">{m.description || 'No description'}</p>
              <div className="flex flex-wrap gap-3 text-xs text-navy-500">
                <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(m.date)}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(m.duration_minutes)}</span>
                {m.has_summary && <span className="flex items-center gap-1 text-emerald-400"><FileText size={12} /> Summary</span>}
                {m.action_item_count ? <span className="flex items-center gap-1"><ListTodo size={12} /> {m.action_item_count} tasks</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Meeting"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} className="btn-primary">Create</button>
          </>
        }
      >
        {error && <div className="bg-red-500/10 text-red-400 text-sm p-2 rounded-lg">{error}</div>}
        <div>
          <label className="block text-sm text-navy-300 mb-1.5">Title *</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Q3 Planning Meeting" />
        </div>
        <div>
          <label className="block text-sm text-navy-300 mb-1.5">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-navy-300 mb-1.5">Date</label>
            <input type="date" className="input" value={form.date ? form.date.split('T')[0] : ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-navy-300 mb-1.5">Duration (min)</label>
            <input type="number" className="input" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-navy-300 mb-1.5">Participants</label>
          <input className="input" value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} placeholder="Alice, Bob, Carol" />
        </div>
        <div>
          <label className="block text-sm text-navy-300 mb-1.5">Location</label>
          <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Conference Room A" />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Meeting"
        message={`Delete "${deleteTarget?.title}"? This will also delete related summaries, action items, and notes. This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
