import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ListTodo, CheckCircle2, Clock, AlertTriangle, Plus, Edit3,
  Trash2, Filter, ArrowUpRight, Users, Calendar, Flag,
} from 'lucide-react'
import { actionItemsApi, meetingsApi } from '../services/api'
import type { ActionItem, Meeting } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { formatDate } from '../utils/cn'

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  high:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'High' },
  medium: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'Medium' },
  low:    { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Low' },
}

export function ActionDashboard() {
  const navigate  = useNavigate()
  const [items, setItems]       = useState<ActionItem[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<'all'|'pending'|'completed'|'overdue'>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [editing, setEditing]   = useState<ActionItem | null>(null)
  const [deleting, setDeleting] = useState<ActionItem | null>(null)
  const [editForm, setEditForm] = useState({ description:'', owner:'', due_date:'', priority:'medium', completed: false })

  const load = async () => {
    setLoading(true)
    try {
      const [a, m] = await Promise.all([
        actionItemsApi.list(1, 200).catch(() => ({ items:[] })),
        meetingsApi.list(1, 100).catch(() => ({ items:[] })),
      ])
      setItems((a as any).items || [])
      setMeetings((m as any).items || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const now = new Date()

  const isOverdue = (item: ActionItem) =>
    !item.completed && item.due_date && new Date(item.due_date) < now

  const filtered = items.filter(it => {
    if (filter === 'pending')   return !it.completed
    if (filter === 'completed') return it.completed
    if (filter === 'overdue')   return isOverdue(it)
    return true
  }).filter(it =>
    priorityFilter === 'all' || it.priority === priorityFilter
  )

  const stats = {
    total:     items.length,
    pending:   items.filter(i => !i.completed).length,
    completed: items.filter(i => i.completed).length,
    overdue:   items.filter(i => isOverdue(i)).length,
  }

  const meetingTitle = (id: string) =>
    meetings.find(m => m.id === id)?.title.replace(/\[Demo\]\s*/i,'') || 'Meeting'

  const handleToggle = async (item: ActionItem) => {
    const meeting = meetings.find(m => m.id === item.meeting_id)
    if (!meeting) return
    try {
      await meetingsApi.updateActionItem(item.meeting_id, item.id, { completed: !item.completed })
      await load()
    } catch { /* ignore */ }
  }

  const openEdit = (item: ActionItem) => {
    setEditing(item)
    setEditForm({
      description: item.description,
      owner:       item.owner,
      due_date:    item.due_date ? new Date(item.due_date).toISOString().slice(0,10) : '',
      priority:    item.priority,
      completed:   item.completed,
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      await meetingsApi.updateActionItem(editing.meeting_id, editing.id, {
        description: editForm.description,
        owner:       editForm.owner,
        due_date:    editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
        priority:    editForm.priority,
        completed:   editForm.completed,
      })
      setEditing(null)
      await load()
    } catch { /* ignore */ }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await meetingsApi.deleteActionItem(deleting.meeting_id, deleting.id)
      await load()
    } catch { /* ignore */ }
    setDeleting(null)
  }

  if (loading) return <FullSpinner message="Loading action items…" />

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6"
        style={{ background:'linear-gradient(135deg,rgba(251,146,60,0.10),rgba(99,102,241,0.08))', border:'1px solid rgba(251,146,60,0.2)' }}>
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#fb923c,#6366f1)' }}>
              <ListTodo size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Action Dashboard</h1>
              <p className="text-sm text-slate-400">All tasks across every meeting in one place</p>
            </div>
          </div>
          <button onClick={() => navigate('/meetings')} className="btn-primary text-sm">
            <Plus size={15} /> Add via Meeting
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key:'all',       label:'Total',     value: stats.total,     color:'#818cf8', icon: ListTodo },
          { key:'pending',   label:'Pending',   value: stats.pending,   color:'#fb923c', icon: Clock },
          { key:'completed', label:'Done',       value: stats.completed, color:'#34d399', icon: CheckCircle2 },
          { key:'overdue',   label:'Overdue',   value: stats.overdue,   color:'#f87171', icon: AlertTriangle },
        ].map(s => {
          const Icon = s.icon
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key as any)}
              className="card text-center hover:scale-[1.02] transition-all"
              style={{ border: filter === s.key ? `1px solid ${s.color}40` : '1px solid rgba(255,255,255,0.06)' }}
            >
              <Icon size={20} className="mx-auto mb-1" style={{ color: s.color }} />
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          {(['all','pending','completed','overdue'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm capitalize transition-colors ${filter===f ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
        <select className="input w-auto text-sm" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={ListTodo} title="No tasks" message={filter === 'all' ? 'Create meetings and add action items.' : `No ${filter} tasks.`} />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const pc = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium
            const overdue = isOverdue(item)
            return (
              <div key={item.id}
                className="group flex items-start gap-4 p-4 rounded-2xl transition-all hover:bg-white/[0.025]"
                style={{ border:`1px solid ${overdue ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)'}`, background: overdue ? 'rgba(248,113,113,0.03)' : 'transparent' }}
              >
                {/* Checkbox */}
                <button onClick={() => handleToggle(item)} className="mt-0.5 shrink-0">
                  {item.completed
                    ? <CheckCircle2 size={22} className="text-emerald-400" />
                    : <div className="w-5.5 h-5.5 w-[22px] h-[22px] rounded-full border-2 border-slate-600 hover:border-indigo-400 transition-colors" />
                  }
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                    {item.description.replace(/\[Demo\]\s*/i,'')}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Users size={11} /> {item.owner}
                    </span>
                    {item.due_date && (
                      <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                        <Calendar size={11} /> {formatDate(item.due_date)} {overdue && '⚠ Overdue'}
                      </span>
                    )}
                    <button onClick={() => navigate(`/meetings/${item.meeting_id}`)}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      <ArrowUpRight size={11} /> {meetingTitle(item.meeting_id)}
                    </button>
                  </div>
                </div>

                {/* Priority badge */}
                <span className="badge text-xs font-semibold shrink-0"
                  style={{ background: pc.bg, color: pc.color }}>
                  <Flag size={10} className="inline mr-0.5" />{pc.label}
                </span>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => openEdit(item)} className="btn-ghost !p-1.5">
                    <Edit3 size={14} className="text-slate-400" />
                  </button>
                  <button onClick={() => setDeleting(item)} className="btn-ghost !p-1.5">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Task"
        footer={<><button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button><button onClick={handleUpdate} className="btn-primary">Save</button></>}>
        <div className="space-y-3">
          <div><label className="block text-sm text-slate-300 mb-1.5">Description</label>
            <input className="input" value={editForm.description} onChange={e => setEditForm({...editForm,description:e.target.value})} /></div>
          <div><label className="block text-sm text-slate-300 mb-1.5">Owner</label>
            <input className="input" value={editForm.owner} onChange={e => setEditForm({...editForm,owner:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-slate-300 mb-1.5">Due Date</label>
              <input type="date" className="input" value={editForm.due_date} onChange={e => setEditForm({...editForm,due_date:e.target.value})} /></div>
            <div><label className="block text-sm text-slate-300 mb-1.5">Priority</label>
              <select className="input" value={editForm.priority} onChange={e => setEditForm({...editForm,priority:e.target.value})}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editForm.completed} onChange={e => setEditForm({...editForm,completed:e.target.checked})} className="accent-indigo-500" />
            <span className="text-sm text-slate-300">Mark as completed</span>
          </label>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete}
        title="Delete Task" message={`Delete "${deleting?.description}"?`} confirmLabel="Delete" danger />
    </div>
  )
}
