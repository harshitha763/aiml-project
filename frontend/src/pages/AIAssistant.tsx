import { useEffect, useState } from 'react'
import {
  Sparkles, Send, Trash2, MessageSquare, Plus, Bot, User,
  Info, Mic, Brain, Zap,
} from 'lucide-react'
import { meetingsApi, lecturesApi, assistantApi } from '../services/api'
import type { Meeting, Lecture, AssistantConversation } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { formatDate } from '../utils/cn'

// Strip demo prefix from AI responses for cleaner display
function cleanContent(text: string): string {
  return text.replace(/^\[Demo Mode\]\s*/i, '').trim()
}

export function AIAssistant() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [conversations, setConversations] = useState<AssistantConversation[]>([])
  const [selectedType, setSelectedType] = useState<'meeting' | 'lecture'>('meeting')
  const [selectedId, setSelectedId] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string; refs?: any[]; is_demo?: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [deleteConv, setDeleteConv] = useState<AssistantConversation | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [m, l, c] = await Promise.all([
        meetingsApi.list(1, 100),
        lecturesApi.list(1, 100),
        assistantApi.conversations().catch(() => ({ items: [] })),
      ])
      setMeetings(m.items || [])
      setLectures(l.items || [])
      setConversations((c as any).items || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resources = selectedType === 'meeting' ? meetings : lectures

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !selectedId) return
    setSending(true)
    const q = question
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setQuestion('')
    try {
      const res = await assistantApi.ask(selectedType, selectedId, q, activeConv || undefined)
      setActiveConv(res.conversation_id)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanContent(res.answer),
        refs: res.references,
        is_demo: res.is_demo,
      }])
      await load()
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I could not process your request. ' + (err instanceof Error ? err.message : ''),
      }])
    } finally { setSending(false) }
  }

  const handleNewConversation = () => { setActiveConv(null); setMessages([]) }

  const handleLoadConversation = async (conv: AssistantConversation) => {
    try {
      const c = await assistantApi.getConversation(conv.id)
      setActiveConv(c.id)
      setMessages(c.messages.map((m: any) => ({ role: m.role, content: cleanContent(m.content) })))
      setSelectedType(c.resource_type as 'meeting' | 'lecture')
      if (c.resource_id) setSelectedId(c.resource_id)
    } catch { /* ignore */ }
  }

  const handleDeleteConv = async () => {
    if (!deleteConv) return
    try {
      await assistantApi.deleteConversation(deleteConv.id)
      await load()
      if (activeConv === deleteConv.id) handleNewConversation()
    } catch { /* ignore */ }
    setDeleteConv(null)
  }

  const quickQuestions = [
    'What were the main topics discussed?',
    'What decisions were made?',
    'What are the action items?',
    'Summarize in 3 bullet points',
  ]

  if (loading) return <FullSpinner message="Loading assistant…" />

  const hasResources = meetings.length > 0 || lectures.length > 0
  const selectedResource = resources.find(r => r.id === selectedId)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
              <p className="text-sm text-slate-400">Ask anything about your meetings & lectures</p>
            </div>
          </div>
          <button onClick={handleNewConversation} className="btn-secondary">
            <Plus size={16} /> New Chat
          </button>
        </div>
      </div>

      {!hasResources ? (
        <div className="card">
          <EmptyState
            icon={Brain}
            title="No content to analyse"
            message="Create a meeting or lecture first, then ask the AI assistant about it."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Conversation history sidebar */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">History</p>
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-600">No conversations yet.</p>
            ) : (
              <div className="space-y-1.5">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleLoadConversation(c)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all group ${
                      activeConv === c.id
                        ? 'bg-violet-500/10 border border-violet-500/20'
                        : 'hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <MessageSquare size={14} className="text-violet-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-600">{formatDate(c.created_at)}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConv(c) }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat panel */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            {/* Resource selector */}
            <div className="card flex flex-wrap gap-3 items-center py-3">
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                <button
                  onClick={() => { setSelectedType('meeting'); setSelectedId('') }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedType === 'meeting' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
                  }`}
                >Meetings</button>
                <button
                  onClick={() => { setSelectedType('lecture'); setSelectedId('') }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedType === 'lecture' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:text-white'
                  }`}
                >Lectures</button>
              </div>
              <select
                className="input flex-1"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">— Select {selectedType} —</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title.replace(/\[Demo\]\s*/i, '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Messages */}
            <div
              className="card flex-1 flex flex-col"
              style={{ minHeight: '420px', maxHeight: '520px' }}
            >
              <div className="flex-1 overflow-y-auto space-y-4 pr-1" style={{ minHeight: '320px', maxHeight: '380px' }}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                      <Sparkles size={28} className="text-violet-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white mb-1">Ask me anything</p>
                      <p className="text-xs text-slate-500">Select a {selectedType} and type your question below</p>
                    </div>
                    {selectedId && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {quickQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => setQuestion(q)}
                            className="text-xs px-3 py-1.5 rounded-full border border-violet-500/20 text-violet-300 hover:bg-violet-500/10 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        m.role === 'user'
                          ? 'bg-indigo-500/20'
                          : 'bg-violet-500/20'
                      }`}>
                        {m.role === 'user'
                          ? <User size={15} className="text-indigo-400" />
                          : <Bot size={15} className="text-violet-400" />
                        }
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        m.role === 'user'
                          ? 'bg-indigo-500/15 text-white border border-indigo-500/20 rounded-tr-sm'
                          : 'bg-white/[0.04] text-slate-200 border border-white/10 rounded-tl-sm'
                      }`}>
                        {m.is_demo && (
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/10">
                            <Info size={12} className="text-amber-400" />
                            <span className="text-xs text-amber-400">Demo answer — configure an AI provider for real analysis</span>
                          </div>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                        {/* Source references */}
                        {m.refs && m.refs.filter((r: any) => r.source !== 'demo').length > 0 && (
                          <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sources</p>
                            {m.refs.filter((r: any) => r.source !== 'demo').slice(0, 3).map((ref: any, j: number) => (
                              <div key={j} className="text-[11px] text-slate-500">
                                {ref.source === 'transcript'
                                  ? `[${Math.floor(ref.timestamp / 60)}:${String(Math.floor(ref.timestamp % 60)).padStart(2, '0')}] ${String(ref.preview || '').substring(0, 80)}…`
                                  : `${ref.source}: ${String(ref.preview || '').substring(0, 80)}…`
                                }
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {sending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                      <Bot size={15} className="text-violet-400" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white/[0.04] border border-white/10">
                      <div className="flex gap-1.5 items-center h-5">
                        <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleAsk} className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <input
                  className="input flex-1"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={selectedId ? `Ask about "${selectedResource?.title.replace(/\[Demo\]\s*/i, '') || selectedType}"…` : `Select a ${selectedType} first…`}
                  disabled={!selectedId || sending}
                />
                <button
                  type="submit"
                  disabled={!selectedId || sending || !question.trim()}
                  className="btn-primary px-4"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConv}
        onClose={() => setDeleteConv(null)}
        onConfirm={handleDeleteConv}
        title="Delete Conversation"
        message="Delete this conversation and all messages?"
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
