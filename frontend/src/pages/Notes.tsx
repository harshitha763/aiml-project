import { useEffect, useState } from 'react'
import { Plus, StickyNote, Trash2, Download, Edit3, FileText } from 'lucide-react'
import { notesApi, exportApi, downloadBlob } from '../services/api'
import type { PersonalNote } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { formatDate } from '../utils/cn'

export function Notes() {
  const [notes, setNotes] = useState<PersonalNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<PersonalNote | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PersonalNote | null>(null)
  const [form, setForm] = useState({ title: '', content: '', note_type: 'general' })
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try { const res = await notesApi.list(1, 100); setNotes(res.items || []) } catch { setNotes([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    try {
      await notesApi.create({ title: form.title, content: form.content, note_type: form.note_type })
      setShowCreate(false)
      setForm({ title: '', content: '', note_type: 'general' })
      await load()
    } catch { /* ignore */ }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      await notesApi.update(editing.id, { title: form.title, content: form.content })
      setEditing(null)
      setForm({ title: '', content: '', note_type: 'general' })
      await load()
    } catch { /* ignore */ }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await notesApi.delete(deleteTarget.id); await load() } catch {}
    setDeleteTarget(null)
  }

  const handleExport = async (note: PersonalNote, format: 'txt' | 'pdf') => {
    try {
      const blob = await exportApi.note(note.id, format)
      downloadBlob(blob, `note_${note.id}.${format}`)
    } catch { /* ignore */ }
  }

  const openEdit = (note: PersonalNote) => {
    setEditing(note)
    setForm({ title: note.title, content: note.content, note_type: note.note_type })
  }

  const filtered = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <FullSpinner message="Loading notes…" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notes</h1>
          <p className="text-sm text-navy-400 mt-0.5">All your personal notes in one place</p>
        </div>
        <button onClick={() => { setForm({ title: '', content: '', note_type: 'general' }); setShowCreate(true) }} className="btn-primary"><Plus size={16} /> New Note</button>
      </div>

      <input className="input" placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={StickyNote} title="No notes yet" message="Create personal notes from your meetings, lectures, or standalone." actionLabel="Create Note" onAction={() => setShowCreate(true)} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((n) => (
            <div key={n.id} className="card group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white">{n.title || 'Untitled'}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(n)} className="btn-ghost !p-1.5"><Edit3 size={14} /></button>
                  <button onClick={() => handleExport(n, 'txt')} className="btn-ghost !p-1.5" title="Export TXT"><Download size={14} /></button>
                  <button onClick={() => handleExport(n, 'pdf')} className="btn-ghost !p-1.5" title="Export PDF"><FileText size={14} /></button>
                  <button onClick={() => setDeleteTarget(n)} className="btn-ghost !p-1.5 text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-navy-300 whitespace-pre-wrap line-clamp-4">{n.content}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-navy-800">
                <span className="badge-neutral">{n.note_type}</span>
                <span className="text-xs text-navy-500">{formatDate(n.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreate || !!editing}
        onClose={() => { setShowCreate(false); setEditing(null) }}
        title={editing ? 'Edit Note' : 'New Note'}
        footer={
          <>
            <button onClick={() => { setShowCreate(false); setEditing(null) }} className="btn-secondary">Cancel</button>
            <button onClick={editing ? handleUpdate : handleCreate} className="btn-primary">{editing ? 'Save' : 'Create'}</button>
          </>
        }
      >
        <div><label className="block text-sm text-navy-300 mb-1.5">Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Content</label><textarea className="input" rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Type</label><select className="input" value={form.note_type} onChange={(e) => setForm({ ...form, note_type: e.target.value })}><option value="general">General</option><option value="revision">Revision</option><option value="key_terms">Key Terms</option><option value="checklist">Checklist</option></select></div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Note" message="Delete this note permanently?" confirmLabel="Delete" danger />
    </div>
  )
}
