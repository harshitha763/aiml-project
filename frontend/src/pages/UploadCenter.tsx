import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileAudio, FileVideo, FileText, Trash2, RefreshCw,
  CheckCircle2, XCircle, Loader2, Play, Plus, Users, GraduationCap,
  AlertCircle, ChevronRight, Mic, Radio, Brain, Sparkles, LayoutList,
  Volume2, ScanText, ListChecks, MonitorPlay, LayoutDashboard, Zap,
} from 'lucide-react'
import { mediaApi, meetingsApi, lecturesApi } from '../services/api'
import type { MediaAsset, Meeting, Lecture } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { formatDate } from '../utils/cn'

/* ─── Pipeline step definition ────────────────────────────────────── */
const PIPELINE_STEPS = [
  {
    num: '01',
    icon: Upload,
    title: 'Upload Audio',
    desc: 'User uploads meeting or lecture audio files.',
    status_keys: ['uploaded'],
    color: '#06b6d4',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/20',
  },
  {
    num: '02',
    icon: Radio,
    title: 'Preprocess Audio',
    desc: 'AI cleans noise, normalizes volume, and segments the audio.',
    status_keys: ['queued'],
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-violet-600/10',
    border: 'border-violet-500/20',
  },
  {
    num: '03',
    icon: Mic,
    title: 'Translate Speech',
    desc: 'AI converts speech to text with high accuracy.',
    status_keys: ['transcribing'],
    color: '#6366f1',
    gradient: 'from-indigo-500/20 to-indigo-600/10',
    border: 'border-indigo-500/20',
  },
  {
    num: '04',
    icon: Brain,
    title: 'Analyze Text',
    desc: 'AI understands context, detects key points, and organizes content.',
    status_keys: ['analyzing'],
    color: '#a855f7',
    gradient: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/20',
  },
  {
    num: '05',
    icon: ListChecks,
    title: 'Summarize & Extract',
    desc: 'AI generates summaries and extracts action items and topics.',
    status_keys: ['analyzing'],
    color: '#ec4899',
    gradient: 'from-pink-500/20 to-pink-600/10',
    border: 'border-pink-500/20',
  },
  {
    num: '06',
    icon: MonitorPlay,
    title: 'Display Results',
    desc: 'Results are presented in a structured, easy-to-read format.',
    status_keys: ['completed'],
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/20',
  },
]

/* ─── Get which step index is active for a given status ─────────── */
function getActiveStep(status: string): number {
  if (status === 'uploaded') return 0
  if (status === 'queued') return 1
  if (status === 'transcribing') return 2
  if (status === 'analyzing') return 3
  if (status === 'completed') return 5
  return -1
}

const statusConfig: Record<string, { color: string; label: string; spinning?: boolean }> = {
  uploaded:     { color: 'badge-neutral',  label: 'Uploaded' },
  queued:       { color: 'badge-warning',  label: 'Queued', spinning: true },
  transcribing: { color: 'badge-primary',  label: 'Transcribing…', spinning: true },
  analyzing:    { color: 'badge-primary',  label: 'Analyzing…', spinning: true },
  completed:    { color: 'badge-success',  label: 'Complete' },
  failed:       { color: 'badge-danger',   label: 'Failed' },
}

export function UploadCenter() {
  const navigate = useNavigate()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null)
  const [transcribing, setTranscribing] = useState<Set<string>>(new Set())
  const [linkModal, setLinkModal] = useState<MediaAsset | null>(null)
  const [linkType, setLinkType] = useState<'meeting' | 'lecture'>('meeting')
  const [linkTarget, setLinkTarget] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(assets.length === 0)
    try {
      const [a, m, l] = await Promise.all([
        mediaApi.list(1, 50),
        meetingsApi.list(1, 100).catch(() => ({ items: [] })),
        lecturesApi.list(1, 100).catch(() => ({ items: [] })),
      ])
      setAssets(a.items || [])
      setMeetings((m as any).items || [])
      setLectures((l as any).items || [])
      // Keep activeAsset in sync
      if (activeAsset) {
        const updated = (a.items || []).find((x: MediaAsset) => x.id === activeAsset.id)
        if (updated) setActiveAsset(updated)
      }
    } catch { setAssets([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  /* Auto-poll while any asset is processing */
  useEffect(() => {
    const hasActive = assets.some(a => ['queued', 'transcribing', 'analyzing'].includes(a.status))
    if (!hasActive) return
    const timer = setInterval(load, 3500)
    return () => clearInterval(timer)
  }, [assets])

  const handleUpload = async (file: File) => {
    setUploadError('')
    setUploading(true)
    try {
      const res = await mediaApi.upload(file)
      await load()
      // Auto-open the freshly uploaded asset in the pipeline view
      const uploaded = assets.find(a => a.id === res.id) || null
      if (res.id) {
        const fresh = await mediaApi.get(res.id).catch(() => null)
        if (fresh) setActiveAsset(fresh)
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Check file type/size.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const handleTranscribe = async (asset: MediaAsset) => {
    setTranscribing(prev => new Set(prev).add(asset.id))
    setActiveAsset(asset)
    try {
      await mediaApi.transcribe(asset.id)
      await load()
    } catch { /* ignore */ }
    finally {
      setTranscribing(prev => { const n = new Set(prev); n.delete(asset.id); return n })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await mediaApi.delete(deleteTarget.id)
      if (activeAsset?.id === deleteTarget.id) setActiveAsset(null)
      await load()
    } catch { /* ignore */ }
    setDeleteTarget(null)
  }

  const handleLink = async () => {
    if (!linkModal || !linkTarget) return
    try {
      if (linkType === 'meeting') await meetingsApi.update(linkTarget, { media_asset_id: linkModal.id } as any)
      else await lecturesApi.update(linkTarget, { media_asset_id: linkModal.id } as any)
      setLinkModal(null); setLinkTarget('')
    } catch { /* ignore */ }
  }

  if (loading && assets.length === 0) return <FullSpinner message="Loading uploads…" />

  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── Page header ── */}
      <div className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.10), rgba(99,102,241,0.08))', border: '1px solid rgba(6,182,212,0.15)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle,#06b6d4,transparent)' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#6366f1)' }}>
              <Upload size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Upload Center</h1>
              <p className="text-sm text-slate-400">AI end-to-end audio processing pipeline</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/meetings')} className="btn-secondary text-sm">
              <Users size={15} /> New Meeting
            </button>
            <button onClick={() => navigate('/lectures')} className="btn-secondary text-sm">
              <GraduationCap size={15} /> New Lecture
            </button>
          </div>
        </div>
      </div>

      {/* ── 6-step pipeline visualization ── */}
      <div className="card p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" /> AI Processing Pipeline
        </h2>

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:flex items-stretch gap-0">
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = step.icon
            const activeStep = activeAsset ? getActiveStep(activeAsset.status) : -1
            const isDone = activeAsset?.status === 'completed' || activeStep > i
            const isActive = activeStep === i || (i === 4 && activeStep === 3)
            const isPending = activeStep < i && activeAsset && activeAsset.status !== 'completed'

            return (
              <div key={i} className="flex items-center flex-1">
                {/* Step card */}
                <div
                  className={`flex-1 rounded-xl p-4 text-center transition-all duration-500 border ${step.border} bg-gradient-to-b ${step.gradient} ${
                    isActive ? 'scale-105 shadow-lg' : isDone ? 'opacity-90' : isPending ? 'opacity-40' : 'opacity-60'
                  }`}
                  style={isActive ? { boxShadow: `0 0 20px ${step.color}30` } : {}}
                >
                  <div className="text-xs font-bold mb-2" style={{ color: step.color }}>{step.num}</div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all"
                    style={{ background: `${step.color}20` }}
                  >
                    {isActive
                      ? <Loader2 size={20} style={{ color: step.color }} className="animate-spin" />
                      : isDone
                        ? <CheckCircle2 size={20} className="text-emerald-400" />
                        : <Icon size={20} style={{ color: step.color }} />
                    }
                  </div>
                  <div className="text-xs font-semibold text-white">{step.title}</div>
                </div>

                {/* Arrow */}
                {i < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight
                    size={18}
                    className={`mx-1 shrink-0 transition-colors ${isDone ? 'text-emerald-400' : 'text-slate-700'}`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: 2-column grid */}
        <div className="lg:hidden grid grid-cols-2 gap-3">
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = step.icon
            const activeStep = activeAsset ? getActiveStep(activeAsset.status) : -1
            const isDone = activeAsset?.status === 'completed' || activeStep > i
            const isActive = activeStep === i || (i === 4 && activeStep === 3)

            return (
              <div
                key={i}
                className={`rounded-xl p-3 border ${step.border} bg-gradient-to-br ${step.gradient} transition-all ${
                  isActive ? 'scale-[1.02]' : isDone ? 'opacity-90' : 'opacity-50'
                }`}
                style={isActive ? { boxShadow: `0 0 16px ${step.color}25` } : {}}
              >
                <div className="text-xs font-bold mb-1" style={{ color: step.color }}>{step.num}</div>
                <div className="flex items-center gap-2 mb-1">
                  {isActive
                    ? <Loader2 size={16} style={{ color: step.color }} className="animate-spin" />
                    : isDone
                      ? <CheckCircle2 size={16} className="text-emerald-400" />
                      : <Icon size={16} style={{ color: step.color }} />
                  }
                  <span className="text-xs font-semibold text-white">{step.title}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Expanded step descriptions — always visible */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = step.icon
            const activeStep = activeAsset ? getActiveStep(activeAsset.status) : -1
            const isDone = activeAsset?.status === 'completed' || (activeStep > i)
            const isActive = activeStep === i || (i === 4 && activeStep === 3)

            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white/[0.05] border border-white/15'
                    : 'bg-white/[0.015] border border-white/5'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isDone ? 'rgba(16,185,129,0.15)' : `${step.color}18` }}
                >
                  {isActive
                    ? <Loader2 size={15} style={{ color: step.color }} className="animate-spin" />
                    : isDone
                      ? <CheckCircle2 size={15} className="text-emerald-400" />
                      : <Icon size={15} style={{ color: step.color }} />
                  }
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span style={{ color: step.color }}>{step.num}</span> {step.title}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Active file progress */}
        {activeAsset && activeAsset.status !== 'failed' && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Processing: <span className="text-white font-medium">{activeAsset.filename}</span></span>
              <span className={`badge ${statusConfig[activeAsset.status]?.color || 'badge-neutral'}`}>
                {statusConfig[activeAsset.status]?.label || activeAsset.status}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${(Math.max(0, getActiveStep(activeAsset.status)) / 5) * 100}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #6366f1, #8b5cf6, #ec4899)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Upload zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className="relative cursor-pointer rounded-2xl transition-all duration-300"
        style={{
          border: `2px dashed ${dragActive ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
          background: dragActive ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.015)',
        }}
      >
        <div className="text-center py-10 px-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all"
            style={{ background: dragActive ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.12)' }}
          >
            <Upload size={28} className={dragActive ? 'text-white' : 'text-indigo-400'} />
          </div>
          {uploading ? (
            <>
              <p className="text-base font-semibold text-white mb-1">Uploading…</p>
              <div className="w-48 h-1.5 bg-white/5 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-white mb-1">Drop your audio or video here</p>
              <p className="text-sm text-slate-400">MP3, WAV, M4A, MP4, MOV, PDF, TXT — up to 500 MB</p>
              <button
                type="button"
                className="btn-primary mt-4 text-sm"
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
              >
                <Upload size={15} /> Choose File
              </button>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          accept="audio/*,video/*,.pdf,.txt,.mp3,.wav,.m4a,.mp4"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
          <AlertCircle size={15} /> {uploadError}
        </div>
      )}

      {/* ── File list ── */}
      {assets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Uploaded Files</h2>
            <span className="badge-neutral">{assets.length}</span>
          </div>

          {assets.map((a) => {
            const Icon = a.media_type === 'audio' ? FileAudio : a.media_type === 'video' ? FileVideo : FileText
            const sc = statusConfig[a.status] || statusConfig.uploaded
            const isProcessing = ['queued', 'transcribing', 'analyzing'].includes(a.status)
            const isBusy = transcribing.has(a.id)
            const activeStep = getActiveStep(a.status)
            const isThisActive = activeAsset?.id === a.id

            return (
              <div
                key={a.id}
                className={`card-hover flex items-center gap-4 cursor-pointer transition-all ${
                  isThisActive ? 'border-violet-500/30' : ''
                }`}
                onClick={() => setActiveAsset(isThisActive ? null : a)}
                style={isThisActive ? { boxShadow: '0 0 20px rgba(139,92,246,0.1)' } : {}}
              >
                {/* Type icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: a.media_type === 'audio' ? 'rgba(99,102,241,0.12)' : a.media_type === 'video' ? 'rgba(168,85,247,0.12)' : 'rgba(6,182,212,0.12)' }}
                >
                  <Icon size={22} className={a.media_type === 'audio' ? 'text-indigo-400' : a.media_type === 'video' ? 'text-violet-400' : 'text-cyan-400'} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{a.title || a.filename}</div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{formatSize(a.file_size)}</span>
                    <span className="capitalize">{a.media_type}</span>
                    <span>{formatDate(a.created_at)}</span>
                    <span className={`badge ${sc.color} flex items-center gap-1`}>
                      {sc.spinning && <Loader2 size={9} className="animate-spin" />}
                      {sc.label}
                    </span>
                  </div>
                  {/* Inline mini pipeline */}
                  {isProcessing && (
                    <div className="flex items-center gap-1 mt-2">
                      {PIPELINE_STEPS.map((step, i) => {
                        const done = activeStep > i || a.status === 'completed'
                        const active = activeStep === i || (i === 4 && activeStep === 3)
                        return (
                          <div key={i} className="flex items-center gap-0.5">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                active ? 'scale-125' : done ? '' : 'opacity-25'
                              }`}
                              style={{ background: done || active ? `${step.color}20` : 'rgba(255,255,255,0.04)' }}
                              title={step.title}
                            >
                              {active
                                ? <Loader2 size={9} style={{ color: step.color }} className="animate-spin" />
                                : done
                                  ? <CheckCircle2 size={9} className="text-emerald-400" />
                                  : <step.icon size={9} style={{ color: step.color }} />
                              }
                            </div>
                            {i < 5 && <div className={`w-3 h-px ${done ? 'bg-emerald-500/50' : 'bg-white/5'}`} />}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {a.status === 'completed' && (
                    <button onClick={() => setLinkModal(a)} className="btn-secondary text-xs py-1.5 px-2.5">
                      <Plus size={13} /> Link
                    </button>
                  )}
                  {(a.status === 'uploaded' || a.status === 'failed') && (
                    <button
                      onClick={() => handleTranscribe(a)}
                      disabled={isBusy}
                      className="btn-primary text-xs py-1.5 px-2.5"
                    >
                      {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                      {isBusy ? 'Starting…' : 'Transcribe'}
                    </button>
                  )}
                  {a.status === 'failed' && (
                    <button onClick={() => handleTranscribe(a)} className="btn-ghost !p-1.5 text-amber-400" title="Retry">
                      <RefreshCw size={13} />
                    </button>
                  )}
                  <button onClick={() => setDeleteTarget(a)} className="btn-ghost !p-1.5 text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {assets.length === 0 && !loading && (
        <div className="card">
          <EmptyState
            icon={FileAudio}
            title="No uploads yet"
            message="Upload an audio or video recording to start the AI processing pipeline."
          />
        </div>
      )}

      {/* ── Link to meeting/lecture modal ── */}
      <Modal
        isOpen={!!linkModal}
        onClose={() => { setLinkModal(null); setLinkTarget('') }}
        title="Link to Meeting or Lecture"
        footer={
          <>
            <button onClick={() => { setLinkModal(null); setLinkTarget('') }} className="btn-secondary">Cancel</button>
            <button onClick={handleLink} disabled={!linkTarget} className="btn-primary">Link</button>
          </>
        }
      >
        <p className="text-sm text-slate-400 mb-3">
          Linking <span className="text-white font-medium">"{linkModal?.filename}"</span> enables transcript access and AI analysis inside the linked resource.
        </p>
        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-3">
          {['meeting', 'lecture'].map((t) => (
            <button
              key={t}
              onClick={() => { setLinkType(t as any); setLinkTarget('') }}
              className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                linkType === t ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>
        <select className="input" value={linkTarget} onChange={(e) => setLinkTarget(e.target.value)}>
          <option value="">Select {linkType}…</option>
          {(linkType === 'meeting' ? meetings : lectures).map((r) => (
            <option key={r.id} value={r.id}>{r.title.replace(/\[Demo\]\s*/i, '')}</option>
          ))}
        </select>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete File"
        message={`Delete "${deleteTarget?.filename}"? Associated transcripts will also be removed.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
