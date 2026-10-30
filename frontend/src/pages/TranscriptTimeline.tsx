import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, Users, Search, Download, Bookmark, Play, Pause,
  AudioLines, MessageCircle, Filter, ChevronDown,
} from 'lucide-react'
import { meetingsApi, lecturesApi, mediaApi, exportApi, downloadBlob } from '../services/api'
import type { Meeting, Lecture, Transcript } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { formatTime } from '../utils/cn'

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const SPEAKER_COLORS = [
  '#818cf8','#f472b6','#34d399','#fb923c','#22d3ee','#a78bfa','#f87171','#facc15',
]

export function TranscriptTimeline() {
  const navigate   = useNavigate()
  const [meetings, setMeetings]   = useState<Meeting[]>([])
  const [lectures, setLectures]   = useState<Lecture[]>([])
  const [type, setType]           = useState<'meeting'|'lecture'>('meeting')
  const [selectedId, setSelectedId] = useState('')
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [loading, setLoading]     = useState(true)
  const [tLoading, setTLoading]   = useState(false)
  const [search, setSearch]       = useState('')
  const [filterSpeaker, setFilterSpeaker] = useState('')
  const [playingAt, setPlayingAt] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [m, l] = await Promise.all([
          meetingsApi.list(1, 100).catch(() => ({ items: [] })),
          lecturesApi.list(1, 100).catch(() => ({ items: [] })),
        ])
        setMeetings((m as any).items || [])
        setLectures((l as any).items || [])
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const resources = type === 'meeting' ? meetings : lectures

  const loadTranscript = async (id: string) => {
    if (!id) { setTranscript(null); return }
    setTLoading(true)
    try {
      const resource = type === 'meeting'
        ? await meetingsApi.get(id)
        : await lecturesApi.get(id)
      const mediaId = (resource as any).media_asset_id
      if (!mediaId) { setTranscript(null); return }
      const asset = await mediaApi.get(mediaId) as any
      if (asset?.transcript?.id) {
        const resp = await fetch(`/api/transcripts/${asset.transcript.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('intellimeet_token')}` }
        })
        const t = await resp.json()
        setTranscript(t)
      }
    } catch { setTranscript(null) }
    finally { setTLoading(false) }
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setSearch('')
    setFilterSpeaker('')
    loadTranscript(id)
  }

  const handleExport = async () => {
    if (!transcript?.id) return
    setExporting(true)
    try {
      const blob = await exportApi.transcript(transcript.id)
      downloadBlob(blob, `transcript-${transcript.id}.txt`)
    } catch { /* ignore */ }
    finally { setExporting(false) }
  }

  const speakers = transcript
    ? [...new Set(transcript.segments.map(s => s.speaker))]
    : []

  const filtered = transcript?.segments.filter(seg => {
    const matchSearch = !search || seg.text.toLowerCase().includes(search.toLowerCase())
    const matchSpeaker = !filterSpeaker || seg.speaker === filterSpeaker
    return matchSearch && matchSpeaker
  }) ?? []

  const speakerColor = (speaker: string) => {
    const idx = speakers.indexOf(speaker)
    return SPEAKER_COLORS[idx % SPEAKER_COLORS.length]
  }

  const speakerStats = speakers.map(spk => {
    const segs = transcript?.segments.filter(s => s.speaker === spk) ?? []
    const words = segs.reduce((n, s) => n + s.text.split(' ').length, 0)
    const duration = segs.reduce((n, s) => n + (s.end_time - s.start_time), 0)
    return { speaker: spk, segments: segs.length, words, duration }
  })

  const totalDuration = transcript?.duration_seconds ?? 0

  if (loading) return <FullSpinner message="Loading transcript timeline…" />

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.10),rgba(99,102,241,0.08))', border: '1px solid rgba(6,182,212,0.2)' }}>
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#6366f1)' }}>
              <AudioLines size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Transcript Timeline</h1>
              <p className="text-sm text-slate-400">Visual timeline of speech with speaker analysis</p>
            </div>
          </div>
          {transcript && (
            <button onClick={handleExport} disabled={exporting} className="btn-secondary text-sm">
              <Download size={14} /> {exporting ? 'Exporting…' : 'Export'}
            </button>
          )}
        </div>
      </div>

      {/* Selector */}
      <div className="card flex flex-wrap gap-3 items-center py-3">
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          <button onClick={() => { setType('meeting'); setSelectedId(''); setTranscript(null) }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${type==='meeting' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'}`}>
            Meetings
          </button>
          <button onClick={() => { setType('lecture'); setSelectedId(''); setTranscript(null) }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${type==='lecture' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:text-white'}`}>
            Lectures
          </button>
        </div>
        <select className="input flex-1" value={selectedId} onChange={e => handleSelect(e.target.value)}>
          <option value="">— Select {type} —</option>
          {resources.map(r => <option key={r.id} value={r.id}>{r.title.replace(/\[Demo\]\s*/i,'')}</option>)}
        </select>
      </div>

      {tLoading ? <FullSpinner message="Loading transcript…" /> : !transcript ? (
        <div className="card">
          <EmptyState icon={AudioLines} title="No transcript" message="Select a meeting or lecture that has been transcribed to view its timeline." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Speaker analysis sidebar */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Users size={15} className="text-violet-400" /> Speakers</h3>
              {speakerStats.map((s, i) => (
                <div key={s.speaker} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <button
                      onClick={() => setFilterSpeaker(filterSpeaker === s.speaker ? '' : s.speaker)}
                      className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
                      style={{ color: speakerColor(s.speaker) }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: speakerColor(s.speaker) }} />
                      {s.speaker}
                    </button>
                    <span className="text-xs text-slate-500">{Math.round((s.duration / totalDuration) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width:`${(s.duration/totalDuration)*100}%`, background: speakerColor(s.speaker) }} />
                  </div>
                  <div className="flex gap-3 text-[10px] text-slate-500 mt-1">
                    <span>{s.segments} segments</span>
                    <span>{s.words} words</span>
                    <span>{fmtTime(s.duration)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual timeline bar */}
            {totalDuration > 0 && (
              <div className="card">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Clock size={15} className="text-cyan-400" /> Timeline</h3>
                <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden">
                  {transcript.segments.map((seg, i) => {
                    const left = (seg.start_time / totalDuration) * 100
                    const width = Math.max(0.5, ((seg.end_time - seg.start_time) / totalDuration) * 100)
                    return (
                      <div key={i}
                        className="absolute top-0 h-full opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ left:`${left}%`, width:`${width}%`, background: speakerColor(seg.speaker) }}
                        title={`${seg.speaker}: ${seg.text.substring(0,60)}`}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0:00</span>
                  <span>{fmtTime(totalDuration)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Transcript segments */}
          <div className="lg:col-span-3 space-y-3">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input pl-10 text-sm" placeholder="Search transcript…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {filterSpeaker && (
                <button onClick={() => setFilterSpeaker('')} className="btn-secondary text-sm">
                  <Filter size={14} /> {filterSpeaker} ×
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500">{filtered.length} segments{search ? ` matching "${search}"` : ''}</div>

            {filtered.length === 0 ? (
              <EmptyState icon={MessageCircle} title="No segments found" message="Try a different search term or remove the speaker filter." />
            ) : (
              <div className="space-y-2">
                {filtered.map((seg, i) => (
                  <div key={i}
                    className="group flex gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03]"
                    style={{ border:'1px solid rgba(255,255,255,0.04)' }}
                  >
                    {/* Timestamp */}
                    <div className="shrink-0 text-right w-14">
                      <div className="text-xs font-mono font-semibold" style={{ color: speakerColor(seg.speaker) }}>
                        {fmtTime(seg.start_time)}
                      </div>
                      <div className="text-[9px] text-slate-600">{fmtTime(seg.end_time)}</div>
                    </div>

                    {/* Speaker bar */}
                    <div className="w-0.5 rounded-full shrink-0 self-stretch opacity-50"
                      style={{ background: speakerColor(seg.speaker) }} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => setFilterSpeaker(filterSpeaker === seg.speaker ? '' : seg.speaker)}
                          className="text-xs font-semibold hover:underline"
                          style={{ color: speakerColor(seg.speaker) }}
                        >
                          {seg.speaker}
                        </button>
                        <span className="text-[10px] text-slate-600">
                          {Math.round(seg.end_time - seg.start_time)}s
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {search ? highlightText(seg.text, search) : seg.text}
                      </p>
                    </div>

                    {/* Bookmark action */}
                    <button className="opacity-0 group-hover:opacity-100 btn-ghost !p-1.5 shrink-0">
                      <Bookmark size={13} className="text-amber-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function highlightText(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.substring(0, idx)}
      <mark className="bg-amber-400/30 text-amber-300 rounded px-0.5">{text.substring(idx, idx + query.length)}</mark>
      {text.substring(idx + query.length)}
    </>
  )
}
