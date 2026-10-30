import { useEffect, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays,
  Clock, MapPin, Users, GraduationCap, BookOpen, Target,
  Bell, Edit3, CalendarCheck,
} from 'lucide-react'
import { calendarApi } from '../services/api'
import type { CalendarEvent } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  meeting:       { label: 'Meeting',       color: '#818cf8', bg: 'rgba(99,102,241,0.15)',  icon: Users },
  study_session: { label: 'Study Session', color: '#c084fc', bg: 'rgba(192,132,252,0.15)', icon: BookOpen },
  deadline:      { label: 'Deadline',      color: '#f87171', bg: 'rgba(248,113,113,0.15)', icon: Target },
  revision:      { label: 'Revision',      color: '#34d399', bg: 'rgba(52,211,153,0.15)',  icon: GraduationCap },
}

function formatEventTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

export function Calendar() {
  const [events, setEvents]         = useState<CalendarEvent[]>([])
  const [loading, setLoading]       = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay]   = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)
  const [editTarget, setEditTarget]     = useState<CalendarEvent | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', event_type: 'meeting',
    start_time: '', end_time: '', location: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await calendarApi.list()
      setEvents(Array.isArray(res) ? res : (res as any)?.items || [])
    } catch { setEvents([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  /* ── helpers ── */
  const year   = currentDate.getFullYear()
  const month  = currentDate.getMonth()
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const eventsByDay = new Map<number, CalendarEvent[]>()
  events.forEach(ev => {
    const d = new Date(ev.start_time)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!eventsByDay.has(day)) eventsByDay.set(day, [])
      eventsByDay.get(day)!.push(ev)
    }
  })

  const today    = new Date()
  const isToday  = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const upcoming = [...events]
    .filter(ev => new Date(ev.start_time) >= today)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const selectedDayEvents = selectedDay ? (eventsByDay.get(selectedDay) || []) : []

  /* ── create ── */
  const openCreate = (day?: number) => {
    const base = day
      ? new Date(year, month, day, 9, 0).toISOString().slice(0, 16)
      : ''
    setForm({ title:'', description:'', event_type:'meeting', start_time: base, end_time:'', location:'' })
    setShowCreate(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    try {
      await calendarApi.create({
        title: form.title,
        description: form.description,
        event_type: form.event_type,
        start_time: form.start_time ? new Date(form.start_time).toISOString() : new Date().toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : undefined,
        location: form.location,
      } as any)
      setShowCreate(false)
      await load()
    } catch { /* ignore */ }
  }

  /* ── edit ── */
  const openEdit = (ev: CalendarEvent) => {
    setEditTarget(ev)
    setForm({
      title:       ev.title,
      description: ev.description,
      event_type:  ev.event_type,
      start_time:  ev.start_time ? new Date(ev.start_time).toISOString().slice(0,16) : '',
      end_time:    ev.end_time   ? new Date(ev.end_time).toISOString().slice(0,16)   : '',
      location:    ev.location,
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    try {
      await calendarApi.update(editTarget.id, {
        title:       form.title,
        description: form.description,
        event_type:  form.event_type,
        start_time:  form.start_time ? new Date(form.start_time).toISOString() : undefined,
        end_time:    form.end_time   ? new Date(form.end_time).toISOString()   : undefined,
        location:    form.location,
      } as any)
      setEditTarget(null)
      await load()
    } catch { /* ignore */ }
  }

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await calendarApi.delete(deleteTarget.id); await load() } catch {}
    setDeleteTarget(null)
  }

  if (loading) return <FullSpinner message="Loading calendar…" />

  /* ── render ── */
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background:'linear-gradient(135deg,rgba(220,38,38,0.10),rgba(99,102,241,0.08))', border:'1px solid rgba(220,38,38,0.15)' }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20"
          style={{ background:'radial-gradient(circle,#ef4444,transparent)' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#ef4444,#6366f1)' }}>
              <CalendarCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Calendar</h1>
              <p className="text-sm text-slate-400">Schedule meetings, study sessions &amp; deadlines</p>
            </div>
          </div>
          <button onClick={() => openCreate()} className="btn-primary">
            <Plus size={16} /> New Event
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
          const count = events.filter(ev => ev.event_type === key).length
          const Icon  = cfg.icon
          return (
            <div key={key} className="card text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: cfg.bg }}>
                <Icon size={20} style={{ color: cfg.color }} />
              </div>
              <div className="text-xl font-bold text-white">{count}</div>
              <div className="text-xs text-slate-400">{cfg.label}s</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Calendar grid ── */}
        <div className="lg:col-span-2 card">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">
              {MONTH_NAMES[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentDate(new Date(year, month-1, 1))} className="btn-ghost !p-1.5"><ChevronLeft size={18}/></button>
              <button onClick={() => setCurrentDate(new Date())} className="btn-secondary text-sm px-3 py-1.5">Today</button>
              <button onClick={() => setCurrentDate(new Date(year, month+1, 1))} className="btn-ghost !p-1.5"><ChevronRight size={18}/></button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2 uppercase tracking-wide">{d}</div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before the 1st */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[68px] rounded-xl" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day       = i + 1
              const dayEvs    = eventsByDay.get(day) || []
              const today_    = isToday(day)
              const selected  = selectedDay === day

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className="min-h-[68px] p-1.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    border: today_
                      ? '2px solid #6366f1'
                      : selected
                        ? '1px solid rgba(99,102,241,0.5)'
                        : '1px solid rgba(255,255,255,0.05)',
                    background: today_
                      ? 'rgba(99,102,241,0.08)'
                      : selected
                        ? 'rgba(99,102,241,0.04)'
                        : 'rgba(255,255,255,0.02)',
                  }}
                >
                  {/* Day number */}
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: today_ ? '#6366f1' : 'transparent', color: today_ ? 'white' : '#94a3b8' }}
                    >
                      {day}
                    </span>
                    {dayEvs.length > 0 && (
                      <span className="text-[9px] text-slate-500">{dayEvs.length}</span>
                    )}
                  </div>

                  {/* Event pills */}
                  {dayEvs.slice(0, 2).map((ev, j) => {
                    const cfg = TYPE_CONFIG[ev.event_type] || TYPE_CONFIG.meeting
                    return (
                      <div
                        key={j}
                        className="text-[10px] px-1.5 py-0.5 rounded-md truncate mb-0.5 font-medium"
                        style={{ background: cfg.bg, color: cfg.color }}
                        title={ev.title}
                      >
                        {ev.title.replace(/\[Demo\]\s*/i, '')}
                      </div>
                    )
                  })}
                  {dayEvs.length > 2 && (
                    <div className="text-[9px] text-slate-500 text-center">+{dayEvs.length - 2}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Selected day detail */}
          {selectedDay !== null && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">
                  {MONTH_NAMES[month]} {selectedDay}
                </h3>
                <button onClick={() => openCreate(selectedDay)} className="btn-primary text-xs !py-1.5 !px-3">
                  <Plus size={12} /> Add Event
                </button>
              </div>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No events on this day. Click "Add Event" to create one.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map(ev => {
                    const cfg = TYPE_CONFIG[ev.event_type] || TYPE_CONFIG.meeting
                    const Icon = cfg.icon
                    return (
                      <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl group"
                        style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: cfg.bg }}>
                          <Icon size={16} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {ev.title.replace(/\[Demo\]\s*/i, '')}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatEventTime(ev.start_time)}
                            {ev.location && ` · ${ev.location}`}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(ev)} className="btn-ghost !p-1.5">
                            <Edit3 size={13} className="text-slate-400" />
                          </button>
                          <button onClick={() => setDeleteTarget(ev)} className="btn-ghost !p-1.5">
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          {/* Upcoming events */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Bell size={16} className="text-amber-400" /> Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <div className="py-4">
                <EmptyState icon={CalendarDays} title="No upcoming events" message="Create your first event." />
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0,8).map(ev => {
                  const cfg  = TYPE_CONFIG[ev.event_type] || TYPE_CONFIG.meeting
                  const Icon = cfg.icon
                  return (
                    <div key={ev.id}
                      className="flex items-start gap-3 p-3 rounded-xl group transition-all hover:bg-white/[0.03] cursor-pointer"
                      onClick={() => {
                        const d = new Date(ev.start_time)
                        setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1))
                        setSelectedDay(d.getDate())
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: cfg.bg }}>
                        <Icon size={14} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">
                          {ev.title.replace(/\[Demo\]\s*/i, '')}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock size={10} /> {formatEventTime(ev.start_time)}
                        </div>
                        {ev.location && (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin size={10} /> {ev.location}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={e => { e.stopPropagation(); openEdit(ev) }} className="btn-ghost !p-1">
                          <Edit3 size={12} className="text-slate-400" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(ev) }} className="btn-ghost !p-1">
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick add */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Add</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button
                    key={key}
                    onClick={() => { setForm(f => ({ ...f, event_type: key })); openCreate() }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105 border border-white/5 hover:border-white/10"
                    style={{ background: cfg.bg }}
                  >
                    <Icon size={18} style={{ color: cfg.color }} />
                    <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Create / Edit modal ── */}
      <Modal
        isOpen={showCreate || !!editTarget}
        onClose={() => { setShowCreate(false); setEditTarget(null) }}
        title={editTarget ? 'Edit Event' : 'Create Event'}
        footer={
          <>
            <button onClick={() => { setShowCreate(false); setEditTarget(null) }} className="btn-secondary">Cancel</button>
            <button onClick={editTarget ? handleUpdate : handleCreate} className="btn-primary">
              {editTarget ? 'Save Changes' : 'Create Event'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Event title" autoFocus />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button key={key} type="button"
                    onClick={() => setForm({ ...form, event_type: key })}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
                    style={{
                      border: form.event_type === key ? `2px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.05)',
                      background: form.event_type === key ? cfg.bg : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <Icon size={16} style={{ color: cfg.color }} />
                    <span className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Start</label>
              <input type="datetime-local" className="input" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">End</label>
              <input type="datetime-local" className="input" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Location</label>
            <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Room, online link, etc." />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes…" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
