import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, BookOpen, StickyNote, Layers, HelpCircle, GraduationCap,
  Plus, Download, Clock, Calendar,
} from 'lucide-react'
import { lecturesApi, exportApi, downloadBlob, notesApi } from '../services/api'
import type { Lecture, Summary, PersonalNote, Flashcard, Quiz } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { formatDate, formatDuration } from '../utils/cn'

type Tab = 'overview' | 'summary' | 'notes' | 'flashcards' | 'quizzes' | 'assistant'

export function LectureDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [notes, setNotes] = useState<PersonalNote[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteForm, setNoteForm] = useState({ title: '', content: '' })
  const [quizForm, setQuizForm] = useState({ num_questions: 5, difficulty: 'medium', topic: '' })
  const [noteOptions, setNoteOptions] = useState({ level: 'intermediate', format: 'detailed' })
  const [flashcardCount, setFlashcardCount] = useState(5)
  const [showGenQuiz, setShowGenQuiz] = useState(false)
  const [showGenNotes, setShowGenNotes] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const l = await lecturesApi.get(id)
      setLecture(l)
      const [s, n, f, q] = await Promise.all([
        lecturesApi.getSummary(id).catch(() => null),
        lecturesApi.listNotes(id).catch(() => []),
        lecturesApi.listFlashcards(id).catch(() => []),
        lecturesApi.listQuizzes(id).catch(() => []),
      ])
      setSummary(s as Summary | null)
      setNotes(n as PersonalNote[])
      setFlashcards(f as Flashcard[])
      setQuizzes(q as Quiz[])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleGenerateSummary = async () => {
    if (!id) return
    setGenerating(true)
    try { const s = await lecturesApi.generateSummary(id); setSummary(s) } catch {}
    finally { setGenerating(false) }
  }

  const handleGenerateNotes = async () => {
    if (!id) return
    setGenerating(true)
    try { await lecturesApi.generateNotes(id, noteOptions.level, noteOptions.format); setShowGenNotes(false); const n = await lecturesApi.listNotes(id); setNotes(n as PersonalNote[]) } catch {}
    finally { setGenerating(false) }
  }

  const handleGenerateFlashcards = async () => {
    if (!id) return
    setGenerating(true)
    try { await lecturesApi.generateFlashcards(id, flashcardCount); const f = await lecturesApi.listFlashcards(id); setFlashcards(f as Flashcard[]) } catch {}
    finally { setGenerating(false) }
  }

  const handleGenerateQuiz = async () => {
    if (!id) return
    setGenerating(true)
    try { await lecturesApi.generateQuiz(id, quizForm); setShowGenQuiz(false); const q = await lecturesApi.listQuizzes(id); setQuizzes(q as Quiz[]) } catch {}
    finally { setGenerating(false) }
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !noteForm.title.trim()) return
    try { await lecturesApi.createNote(id, { title: noteForm.title, content: noteForm.content }); setShowAddNote(false); setNoteForm({ title: '', content: '' }); const n = await lecturesApi.listNotes(id); setNotes(n as PersonalNote[]) } catch {}
  }

  if (loading) return <FullSpinner message="Loading lecture…" />
  if (!lecture) return <EmptyState icon={GraduationCap} title="Lecture not found" message="This lecture may have been deleted." />

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BookOpen },
    { key: 'summary', label: 'Summary', icon: Sparkles },
    { key: 'notes', label: 'Notes', icon: StickyNote },
    { key: 'flashcards', label: 'Flashcards', icon: Layers },
    { key: 'quizzes', label: 'Quizzes', icon: HelpCircle },
    { key: 'assistant', label: 'AI Assistant', icon: Sparkles },
  ]

  const parseList = (val: string) => {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : [] } catch { return val.split('\n').filter((s: string) => s.trim()) }
  }

  const handleAskAssistant = async (question: string) => {
    if (!id) return null
    try {
      const res = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('intellimeet_token')}` },
        body: JSON.stringify({ resource_type: 'lecture', resource_id: id, question }),
      })
      return await res.json()
    } catch { return null }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/lectures')} className="btn-ghost !p-1.5"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{lecture.title}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-navy-500">
            {lecture.subject && <span className="flex items-center gap-1"><BookOpen size={12} /> {lecture.subject}</span>}
            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(lecture.date)}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(lecture.duration_minutes)}</span>
            {lecture.lecturer && <span>{lecture.lecturer}</span>}
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-navy-800 pb-px">
        {tabs.map((t) => { const Icon = t.icon; return (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${tab === t.key ? 'text-brand-400 border-b-2 border-brand-500' : 'text-navy-400 hover:text-navy-200'}`}>
            <Icon size={16} /> {t.label}
          </button>
        )})}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="card"><h3 className="text-sm font-semibold text-navy-300 mb-2">Description</h3><p className="text-sm text-navy-100">{lecture.description || 'No description provided.'}</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card"><div className="text-xs text-navy-500 mb-1">Subject</div><div className="text-sm text-white">{lecture.subject || 'Unspecified'}</div></div>
            <div className="card"><div className="text-xs text-navy-500 mb-1">Lecturer</div><div className="text-sm text-white">{lecture.lecturer || 'Unspecified'}</div></div>
            <div className="card"><div className="text-xs text-navy-500 mb-1">Level</div><span className="badge-primary">{lecture.explanation_level}</span></div>
          </div>
          <div className="card"><div className="text-xs text-navy-500 mb-1">Revision Status</div><span className={`badge ${lecture.revision_status === 'reviewed' ? 'badge-success' : lecture.revision_status === 'in_progress' ? 'badge-warning' : 'badge-neutral'}`}>{lecture.revision_status.replace('_', ' ')}</span></div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="space-y-4">
          {!summary ? (
            <EmptyState icon={Sparkles} title="No summary generated" message={generating ? 'Generating…' : 'Generate an AI summary of this lecture.'} actionLabel={generating ? 'Generating…' : 'Generate Summary'} onAction={handleGenerateSummary} />
          ) : (
            <>
              {summary.is_demo && <div className="badge-warning mb-2">Demo content</div>}
              <div className="card"><h3 className="font-semibold text-white mb-2">Summary</h3><p className="text-sm text-navy-200 whitespace-pre-wrap">{summary.summary_text}</p></div>
              {parseList(summary.key_points).length > 0 && <div className="card"><h3 className="font-semibold text-white mb-2">Key Points</h3><ul className="space-y-1">{parseList(summary.key_points).map((p: string, i: number) => <li key={i} className="text-sm text-navy-200 flex gap-2"><span className="text-brand-400">•</span> {p}</li>)}</ul></div>}
              <button onClick={handleGenerateSummary} className="btn-secondary text-sm" disabled={generating}>Regenerate</button>
            </>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Study Notes ({notes.length})</h2>
            <div className="flex gap-2">
              <button onClick={() => setShowGenNotes(true)} className="btn-primary text-sm" disabled={generating}><Sparkles size={14} /> Generate Notes</button>
              <button onClick={() => setShowAddNote(true)} className="btn-secondary text-sm"><Plus size={14} /> Add Note</button>
            </div>
          </div>
          {notes.length === 0 ? (
            <EmptyState icon={StickyNote} title="No notes yet" message="Generate AI study notes or add your own." />
          ) : (
            notes.map((n) => (
              <div key={n.id} className="card">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-white">{n.title}</h3>
                  <button onClick={() => exportApi.note(n.id, 'txt').then(b => downloadBlob(b, `note_${n.id}.txt`))} className="btn-ghost !p-1.5"><Download size={14} /></button>
                </div>
                <p className="text-sm text-navy-200 whitespace-pre-wrap">{n.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'flashcards' && (
        <div className="space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Flashcards ({flashcards.length})</h2>
            <div className="flex gap-2">
              <button onClick={() => navigate('/flashcards/study')} className="btn-secondary text-sm"><Layers size={14} /> Study</button>
              <button onClick={handleGenerateFlashcards} className="btn-primary text-sm" disabled={generating}><Sparkles size={14} /> {generating ? 'Generating…' : 'Generate'}</button>
            </div>
          </div>
          {flashcards.length === 0 ? (
            <EmptyState icon={Layers} title="No flashcards" message="Generate flashcards from this lecture's content." actionLabel="Generate Flashcards" onAction={handleGenerateFlashcards} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashcards.map((f) => (
                <div key={f.id} className="card">
                  <div className="text-sm font-medium text-white mb-2">{f.front}</div>
                  <div className="text-sm text-navy-300 border-t border-navy-700 pt-2">{f.back}</div>
                  <div className="flex gap-2 mt-2">{f.topic && <span className="badge-neutral">{f.topic}</span>}<span className="badge-primary">{f.difficulty}</span>{f.is_demo && <span className="badge-warning">Demo</span>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'quizzes' && (
        <div className="space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Quizzes ({quizzes.length})</h2>
            <button onClick={() => setShowGenQuiz(true)} className="btn-primary text-sm" disabled={generating}><Sparkles size={14} /> {generating ? 'Generating…' : 'Generate Quiz'}</button>
          </div>
          {quizzes.length === 0 ? (
            <EmptyState icon={HelpCircle} title="No quizzes" message="Generate a quiz from this lecture's content." actionLabel="Generate Quiz" onAction={() => setShowGenQuiz(true)} />
          ) : (
            quizzes.map((q) => (
              <div key={q.id} onClick={() => navigate(`/quizzes/${q.id}`)} className="card cursor-pointer hover:border-brand-500/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div><h3 className="font-semibold text-white">{q.title}</h3><p className="text-sm text-navy-400">{q.description}</p></div>
                  <div className="flex gap-2"><span className="badge-primary">{q.difficulty}</span><span className="badge-neutral">{q.questions?.length || 0} Qs</span>{q.is_demo && <span className="badge-warning">Demo</span>}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'assistant' && (
        <LectureAssistant resourceId={id!} onAsk={handleAskAssistant} />
      )}

      {/* Modals */}
      <Modal isOpen={showGenNotes} onClose={() => setShowGenNotes(false)} title="Generate Study Notes"
        footer={<><button onClick={() => setShowGenNotes(false)} className="btn-secondary">Cancel</button><button onClick={handleGenerateNotes} className="btn-primary" disabled={generating}>{generating ? 'Generating…' : 'Generate'}</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm text-navy-300 mb-1.5">Level</label><select className="input" value={noteOptions.level} onChange={(e) => setNoteOptions({ ...noteOptions, level: e.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Format</label><select className="input" value={noteOptions.format} onChange={(e) => setNoteOptions({ ...noteOptions, format: e.target.value })}><option value="short">Short</option><option value="detailed">Detailed</option><option value="bullet">Bullet Points</option><option value="qa">Q&A</option></select></div>
        </div>
      </Modal>

      <Modal isOpen={showAddNote} onClose={() => setShowAddNote(false)} title="Add Note"
        footer={<><button onClick={() => setShowAddNote(false)} className="btn-secondary">Cancel</button><button onClick={handleCreateNote} className="btn-primary">Add</button></>}>
        <div><label className="block text-sm text-navy-300 mb-1.5">Title *</label><input className="input" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} /></div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Content</label><textarea className="input" rows={5} value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} /></div>
      </Modal>

      <Modal isOpen={showGenQuiz} onClose={() => setShowGenQuiz(false)} title="Generate Quiz"
        footer={<><button onClick={() => setShowGenQuiz(false)} className="btn-secondary">Cancel</button><button onClick={handleGenerateQuiz} className="btn-primary" disabled={generating}>{generating ? 'Generating…' : 'Generate'}</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm text-navy-300 mb-1.5">Questions</label><input type="number" min={1} max={20} className="input" value={quizForm.num_questions} onChange={(e) => setQuizForm({ ...quizForm, num_questions: Number(e.target.value) })} /></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Difficulty</label><select className="input" value={quizForm.difficulty} onChange={(e) => setQuizForm({ ...quizForm, difficulty: e.target.value })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
        </div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Topic (optional)</label><input className="input" value={quizForm.topic} onChange={(e) => setQuizForm({ ...quizForm, topic: e.target.value })} placeholder="Linear Regression" /></div>
      </Modal>
    </div>
  )
}

function LectureAssistant({ resourceId, onAsk }: { resourceId: string; onAsk: (q: string) => Promise<any> }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [loading, setLoading] = useState(false)

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: question }])
    const res = await onAsk(question)
    if (res) setMessages(prev => [...prev, { role: 'assistant', content: res.answer }])
    else setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your request.' }])
    setQuestion('')
    setLoading(false)
  }

  return (
    <div className="card min-h-[300px] flex flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px]">
        {messages.length === 0 ? <EmptyState icon={Sparkles} title="Ask about this lecture" message="Questions like: Explain the main concept. What did the lecturer say about X?" /> :
          messages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-navy-800 text-navy-100'}`}>{m.content}</div></div>)}
        {loading && <div className="text-center text-sm text-navy-500">Thinking…</div>}
      </div>
      <form onSubmit={handleAsk} className="flex gap-2 mt-3 pt-3 border-t border-navy-800">
        <input className="input flex-1" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about this lecture…" disabled={loading} />
        <button type="submit" disabled={loading} className="btn-primary"><Sparkles size={16} /> Ask</button>
      </form>
    </div>
  )
}
