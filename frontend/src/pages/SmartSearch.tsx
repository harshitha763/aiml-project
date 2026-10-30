import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Users, GraduationCap, FileText, ListTodo, Layers, MessageSquare } from 'lucide-react'
import { searchApi } from '../services/api'
import type { SearchResult } from '../types'
import { EmptyState } from '../components/EmptyState'

const typeIcons: Record<string, any> = {
  meeting: Users, lecture: GraduationCap, transcript: MessageSquare,
  note: FileText, action_item: ListTodo, flashcard: Layers,
}

const typeLabels: Record<string, string> = {
  meeting: 'Meeting', lecture: 'Lecture', transcript: 'Transcript',
  note: 'Note', action_item: 'Action Item', flashcard: 'Flashcard',
}

const typeColors: Record<string, string> = {
  meeting: 'text-brand-400 bg-brand-500/10', lecture: 'text-violet-400 bg-violet-500/10',
  transcript: 'text-cyan-400 bg-cyan-500/10', note: 'text-emerald-400 bg-emerald-500/10',
  action_item: 'text-amber-400 bg-amber-500/10', flashcard: 'text-pink-400 bg-pink-500/10',
}

export function SmartSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [contentType, setContentType] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await searchApi.search(query, contentType || undefined)
      setResults(res || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  const handleNavigate = (result: SearchResult) => {
    if (result.resource_type === 'meeting') navigate(`/meetings/${result.resource_id}`)
    else if (result.resource_type === 'lecture') navigate(`/lectures/${result.resource_id}`)
    else if (result.resource_type === 'note') navigate('/notes')
    else if (result.resource_type === 'action_item') navigate('/meetings')
    else if (result.resource_type === 'flashcard') navigate('/flashcards')
    else navigate('/dashboard')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Smart Search</h1>
        <p className="text-sm text-navy-400 mt-0.5">Search across all your content</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
          <input className="input pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search meetings, lectures, notes, tasks…" />
        </div>
        <select className="input w-auto" value={contentType} onChange={(e) => setContentType(e.target.value)}>
          <option value="">All Types</option>
          <option value="meeting">Meetings</option>
          <option value="lecture">Lectures</option>
          <option value="transcript">Transcripts</option>
          <option value="note">Notes</option>
          <option value="action_item">Action Items</option>
          <option value="flashcard">Flashcards</option>
        </select>
        <button type="submit" disabled={loading} className="btn-primary">Search</button>
      </form>

      {loading ? (
        <div className="text-center text-sm text-navy-500 py-8">Searching…</div>
      ) : searched ? (
        results.length === 0 ? (
          <div className="card"><EmptyState icon={Search} title="No results found" message={`No content matches "${query}". Try different keywords or remove filters.`} /></div>
        ) : (
          <>
            <div className="text-sm text-navy-400">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</div>
            <div className="space-y-3">
              {results.map((r, i) => {
                const Icon = typeIcons[r.resource_type] || FileText
                const colorClass = typeColors[r.resource_type] || ''
                return (
                  <div key={i} onClick={() => handleNavigate(r)} className="card cursor-pointer hover:border-brand-500/30 transition-colors group flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${colorClass}`}>{typeLabels[r.resource_type] || r.resource_type}</span>
                      </div>
                      <div className="text-sm font-medium text-white mb-1">{r.title}</div>
                      {r.preview && <div className="text-xs text-navy-400 line-clamp-2">{r.preview}</div>}
                    </div>
                    <ArrowRight size={16} className="text-navy-600 group-hover:text-brand-400 mt-2 shrink-0" />
                  </div>
                )
              })}
            </div>
          </>
        )
      ) : (
        <div className="card"><EmptyState icon={Search} title="Start searching" message="Search across meetings, lectures, transcripts, notes, action items, and flashcards." /></div>
      )}
    </div>
  )
}
