import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, ListTodo, MessageSquare, Sparkles, Download,
  Plus, Trash2, CheckCircle2, Clock, Users, Calendar, Mail, StickyNote,
} from 'lucide-react'
import { meetingsApi, transcriptsApi, exportApi } from '../services/api'
import { downloadBlob } from '../services/api'
import type { Meeting, Summary, ActionItem, PersonalNote, Transcript, MeetingReport } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { formatDate, formatDuration, formatTime } from '../utils/cn'

type Tab = 'overview' | 'transcript' | 'summary' | 'actions' | 'notes' | 'assistant'

export function MeetingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [actions, setActions] = useState<ActionItem[]>([])
  const [notes, setNotes] = useState<PersonalNote[]>([])
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [report, setReport] = useState<MeetingReport | null>(null)
  const [deleteAction, setDeleteAction] = useState<ActionItem | null>(null)
  const [actionForm, setActionForm] = useState({ description: '', owner: '', due_date: '', priority: 'medium' })
  const [noteForm, setNoteForm] = useState({ title: '', content: '' })

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const m = await meetingsApi.get(id)
      setMeeting(m)
      const [s, a, n] = await Promise.all([
        meetingsApi.getSummary(id).catch(() => null),
        meetingsApi.listActionItems(id).catch(() => []),
        meetingsApi.listNotes(id).catch(() => []),
      ])
      setSummary(s as Summary | null)
      setActions(a as ActionItem[])
      setNotes(n as PersonalNote[])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleGenerateSummary = async () => {
    if (!id) return
    setGenerating(true)
    try {
      const s = await meetingsApi.generateSummary(id)
      setSummary(s)
    } catch { /* ignore */ }
    finally { setGenerating(false) }
  }

  const handleGenerateFollowUp = async () => {
    if (!id) return
    setGenerating(true)
    try {
      const res = await meetingsApi.generateFollowUp(id)
      setFollowUp(res.body)
    } catch { /* ignore */ }
    finally { setGenerating(false) }
  }

  const handleLoadTranscript = async () => {
    if (!meeting?.media_asset_id) return
    try {
      const res = await fetch(`/api/media/${meeting.media_asset_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('intellimeet_token')}` },
      })
      const asset = await res.json()
      if (asset.transcript) {
        const t = await transcriptsApi.get(asset.transcript.id)
        setTranscript(t)
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { if (tab === 'transcript' && !transcript) handleLoadTranscript() }, [tab])

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !actionForm.description.trim()) return
    try {
      await meetingsApi.createActionItem(id, {
        description: actionForm.description,
        owner: actionForm.owner || 'Unspecified',
        due_date: actionForm.due_date ? new Date(actionForm.due_date).toISOString() : null,
        priority: actionForm.priority,
      })
      setShowAddAction(false)
      setActionForm({ description: '', owner: '', due_date: '', priority: 'medium' })
      const a = await meetingsApi.listActionItems(id)
      setActions(a as ActionItem[])
    } catch { /* ignore */ }
  }

  const handleToggleAction = async (item: ActionItem) => {
    if (!id) return
    try {
      await meetingsApi.updateActionItem(id, item.id, { completed: !item.completed })
      const a = await meetingsApi.listActionItems(id)
      setActions(a as ActionItem[])
    } catch { /* ignore */ }
  }

  const handleDeleteAction = async () => {
    if (!id || !deleteAction) return
    try {
      await meetingsApi.deleteActionItem(id, deleteAction.id)
      const a = await meetingsApi.listActionItems(id)
      setActions(a as ActionItem[])
    } catch { /* ignore */ }
    setDeleteAction(null)
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !noteForm.title.trim()) return
    try {
      await meetingsApi.createNote(id, { title: noteForm.title, content: noteForm.content })
      setShowAddNote(false)
      setNoteForm({ title: '', content: '' })
      const n = await meetingsApi.listNotes(id)
      setNotes(n as PersonalNote[])
    } catch { /* ignore */ }
  }

  const handleExport = async (format: 'txt' | 'pdf') => {
    if (!id) return
    try {
      const blob = await exportApi.meetingReport(id, format)
      downloadBlob(blob, `meeting_report_${id}.${format}`)
    } catch { /* ignore */ }
  }

  const handleAskAssistant = async (question: string) => {
    if (!id) return null
    try {
      const res = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('intellimeet_token')}` },
        body: JSON.stringify({ resource_type: 'meeting', resource_id: id, question }),
      })
      const data = await res.json()
      return data
    } catch { return null }
  }

  if (loading) return <FullSpinner message="Loading meeting…" />
  if (!meeting) return <EmptyState icon={Users} title="Meeting not found" message="This meeting may have been deleted." />

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'transcript', label: 'Transcript', icon: MessageSquare },
    { key: 'summary', label: 'Summary', icon: Sparkles },
    { key: 'actions', label: 'Action Items', icon: ListTodo },
    { key: 'notes', label: 'Notes', icon: StickyNote },
    { key: 'assistant', label: 'AI Assistant', icon: Sparkles },
  ]

  const parseList = (val: string) => {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : [] } catch { return val.split('\n').filter((s: string) => s.trim()) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/meetings')} className="btn-ghost !p-1.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{meeting.title}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-navy-500">
            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(meeting.date)}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(meeting.duration_minutes)}</span>
            {meeting.participants && <span className="flex items-center gap-1"><Users size={12} /> {meeting.participants}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('txt')} className="btn-secondary text-sm"><Download size={14} /> TXT</button>
          <button onClick={() => handleExport('pdf')} className="btn-secondary text-sm"><Download size={14} /> PDF</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-navy-800 pb-px">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                tab === t.key ? 'text-brand-400 border-b-2 border-brand-500' : 'text-navy-400 hover:text-navy-200'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-navy-300 mb-2">Description</h3>
            <p className="text-sm text-navy-100">{meeting.description || 'No description provided.'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="text-xs text-navy-500 mb-1">Location</div>
              <div className="text-sm text-white">{meeting.location || 'Unspecified'}</div>
            </div>
            <div className="card">
              <div className="text-xs text-navy-500 mb-1">Participants</div>
              <div className="text-sm text-white">{meeting.participants || 'Unspecified'}</div>
            </div>
            <div className="card">
              <div className="text-xs text-navy-500 mb-1">Status</div>
              <span className="badge-primary">{meeting.status}</span>
            </div>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-navy-300 mb-2">Notes</h3>
            <p className="text-sm text-navy-100 whitespace-pre-wrap">{meeting.notes || 'No additional notes.'}</p>
          </div>
        </div>
      )}

      {/* Transcript */}
      {tab === 'transcript' && (
        <div className="space-y-3">
          {!meeting.media_asset_id ? (
            <EmptyState icon={MessageSquare} title="No transcript available" message="Upload a recording to this meeting to generate a transcript." />
          ) : !transcript ? (
            <EmptyState icon={MessageSquare} title="No transcript yet" message="Transcribe the uploaded recording to see the transcript here." />
          ) : (
            <>
              {transcript.is_demo && <div className="badge-warning">Demo transcript</div>}
              {transcript.segments.map((seg, i) => (
                <div key={i} className="card flex gap-3">
                  <div className="text-xs text-brand-400 font-mono shrink-0 pt-0.5 w-20">
                    {formatTime(seg.start_time)} - {formatTime(seg.end_time)}
                  </div>
                  <div>
                    <div className="text-xs text-navy-400 font-semibold mb-0.5">{seg.speaker}</div>
                    <div className="text-sm text-navy-100">{seg.text}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Summary */}
      {tab === 'summary' && (
        <div className="space-y-4">
          {!summary ? (
            <EmptyState
              icon={Sparkles}
              title="No summary generated yet"
              message={generating ? 'Generating summary…' : 'Generate an AI-powered summary of this meeting.'}
              actionLabel={generating ? 'Generating…' : 'Generate Summary'}
              onAction={handleGenerateSummary}
            />
          ) : (
            <>
              {summary.is_demo && <div className="badge-warning mb-2">Demo content — not generated by a real AI</div>}
              <div className="card">
                <h3 className="font-semibold text-white mb-2">Executive Summary</h3>
                <p className="text-sm text-navy-200 whitespace-pre-wrap">{summary.summary_text}</p>
              </div>
              {parseList(summary.key_points).length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-white mb-2">Key Points</h3>
                  <ul className="space-y-1">
                    {parseList(summary.key_points).map((p: string, i: number) => <li key={i} className="text-sm text-navy-200 flex gap-2"><span className="text-brand-400">•</span> {p}</li>)}
                  </ul>
                </div>
              )}
              {parseList(summary.decisions).length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-white mb-2">Decisions</h3>
                  <ul className="space-y-1">
                    {parseList(summary.decisions).map((d: string, i: number) => <li key={i} className="text-sm text-navy-200 flex gap-2"><span className="text-emerald-400">✓</span> {d}</li>)}
                  </ul>
                </div>
              )}
              {summary.unresolved_questions && (
                <div className="card">
                  <h3 className="font-semibold text-white mb-2">Unresolved Questions</h3>
                  <p className="text-sm text-navy-200 whitespace-pre-wrap">{summary.unresolved_questions}</p>
                </div>
              )}
              {summary.next_steps && (
                <div className="card">
                  <h3 className="font-semibold text-white mb-2">Next Steps</h3>
                  <p className="text-sm text-navy-200 whitespace-pre-wrap">{summary.next_steps}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleGenerateSummary} className="btn-secondary text-sm" disabled={generating}>Regenerate</button>
                <button onClick={handleGenerateFollowUp} className="btn-secondary text-sm" disabled={generating}><Mail size={14} /> Follow-up Draft</button>
              </div>
              {followUp && (
                <div className="card">
                  <h3 className="font-semibold text-white mb-2">Follow-up Email Draft</h3>
                  <pre className="text-sm text-navy-200 whitespace-pre-wrap font-sans">{followUp}</pre>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Action Items */}
      {tab === 'actions' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Action Items ({actions.length})</h2>
            <button onClick={() => setShowAddAction(true)} className="btn-primary text-sm"><Plus size={14} /> Add Task</button>
          </div>
          {actions.length === 0 ? (
            <EmptyState icon={ListTodo} title="No action items" message="Add action items to track follow-up tasks from this meeting." actionLabel="Add Task" onAction={() => setShowAddAction(true)} />
          ) : (
            actions.map((a) => (
              <div key={a.id} className="card flex items-start gap-3">
                <button onClick={() => handleToggleAction(a)} className="mt-0.5 shrink-0">
                  {a.completed ? <CheckCircle2 size={20} className="text-emerald-400" /> : <div className="w-5 h-5 rounded-full border-2 border-navy-600" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${a.completed ? 'line-through text-navy-500' : 'text-white'}`}>{a.description}</div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-navy-500">
                    <span>Owner: {a.owner}</span>
                    {a.due_date && <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(a.due_date)}</span>}
                    <span className={`badge ${a.priority === 'high' ? 'badge-danger' : a.priority === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>{a.priority}</span>
                  </div>
                </div>
                <button onClick={() => setDeleteAction(a)} className="btn-ghost !p-1 text-red-400"><Trash2 size={14} /></button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Notes */}
      {tab === 'notes' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Notes ({notes.length})</h2>
            <button onClick={() => setShowAddNote(true)} className="btn-primary text-sm"><Plus size={14} /> Add Note</button>
          </div>
          {notes.length === 0 ? (
            <EmptyState icon={StickyNote} title="No notes yet" message="Add personal notes about this meeting." actionLabel="Add Note" onAction={() => setShowAddNote(true)} />
          ) : (
            notes.map((n) => (
              <div key={n.id} className="card">
                <h3 className="font-semibold text-white mb-1">{n.title}</h3>
                <p className="text-sm text-navy-200 whitespace-pre-wrap">{n.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assistant */}
      {tab === 'assistant' && (
        <MeetingAssistant resourceId={id!} onAsk={handleAskAssistant} />
      )}

      {/* Modals */}
      <Modal isOpen={showAddAction} onClose={() => setShowAddAction(false)} title="Add Action Item"
        footer={<><button onClick={() => setShowAddAction(false)} className="btn-secondary">Cancel</button><button onClick={handleCreateAction} className="btn-primary">Add</button></>}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-navy-300 mb-1.5">Description *</label>
            <input className="input" value={actionForm.description} onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })} placeholder="Send technical spec to team" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-navy-300 mb-1.5">Owner</label>
              <input className="input" value={actionForm.owner} onChange={(e) => setActionForm({ ...actionForm, owner: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm text-navy-300 mb-1.5">Due Date</label>
              <input type="date" className="input" value={actionForm.due_date} onChange={(e) => setActionForm({ ...actionForm, due_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-navy-300 mb-1.5">Priority</label>
            <select className="input" value={actionForm.priority} onChange={(e) => setActionForm({ ...actionForm, priority: e.target.value })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddNote} onClose={() => setShowAddNote(false)} title="Add Note"
        footer={<><button onClick={() => setShowAddNote(false)} className="btn-secondary">Cancel</button><button onClick={handleCreateNote} className="btn-primary">Add</button></>}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-navy-300 mb-1.5">Title *</label>
            <input className="input" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} placeholder="Meeting Notes" />
          </div>
          <div>
            <label className="block text-sm text-navy-300 mb-1.5">Content</label>
            <textarea className="input" rows={5} value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteAction} onClose={() => setDeleteAction(null)} onConfirm={handleDeleteAction} title="Delete Action Item" message="Delete this action item?" confirmLabel="Delete" danger />
    </div>
  )
}

function MeetingAssistant({ resourceId, onAsk }: { resourceId: string; onAsk: (q: string) => Promise<any> }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [loading, setLoading] = useState(false)

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: question }])
    const res = await onAsk(question)
    if (res) {
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }])
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your request.' }])
    }
    setQuestion('')
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="card min-h-[300px] flex flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px]">
          {messages.length === 0 ? (
            <EmptyState icon={Sparkles} title="Ask about this meeting" message="Questions like: What were the main topics? What tasks were assigned?" />
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-navy-800 text-navy-100'}`}>
                  {m.content}
                </div>
              </div>
            ))
          )}
          {loading && <div className="text-center text-sm text-navy-500">Thinking…</div>}
        </div>
        <form onSubmit={handleAsk} className="flex gap-2 mt-3 pt-3 border-t border-navy-800">
          <input className="input flex-1" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about this meeting…" disabled={loading} />
          <button type="submit" disabled={loading} className="btn-primary"><Sparkles size={16} /> Ask</button>
        </form>
      </div>
    </div>
  )
}
