import { useEffect, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { BarChart3, Users, GraduationCap, Clock, CheckSquare, ListTodo, Layers, HelpCircle } from 'lucide-react'
import { analyticsApi } from '../services/api'
import type { Analytics as AnalyticsType } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { formatDuration } from '../utils/cn'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#f97316']

export function Analytics() {
  const [data, setData] = useState<AnalyticsType | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await analyticsApi.get(); setData(d) } catch { setData(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <FullSpinner message="Loading analytics…" />

  if (!data || (data.meeting_count === 0 && data.lecture_count === 0)) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <div className="card"><EmptyState icon={BarChart3} title="No data yet" message="Create meetings, lectures, and study materials to see analytics." /></div>
      </div>
    )
  }

  const taskData = [
    { name: 'Completed', value: data.completed_tasks },
    { name: 'Pending', value: data.pending_tasks },
  ]

  const resourceData = [
    { name: 'Meetings', value: data.meeting_count },
    { name: 'Lectures', value: data.lecture_count },
    { name: 'Flashcards', value: data.flashcards_created },
    { name: 'Notes', value: data.notes_count },
    { name: 'Bookmarks', value: data.bookmarks_count },
    { name: 'Media', value: data.media_assets },
  ]

  const topicData = (data.topics || []).slice(0, 8)

  const statCards = [
    { icon: Users, label: 'Meetings', value: data.meeting_count, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { icon: GraduationCap, label: 'Lectures', value: data.lecture_count, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { icon: Clock, label: 'Total Duration', value: formatDuration(data.total_duration_minutes), color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { icon: CheckSquare, label: 'Completed Tasks', value: data.completed_tasks, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: ListTodo, label: 'Pending Tasks', value: data.pending_tasks, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { icon: Layers, label: 'Flashcards', value: data.flashcards_created, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { icon: HelpCircle, label: 'Quiz Attempts', value: data.quiz_attempts, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { icon: CheckSquare, label: 'Avg Quiz Score', value: `${data.avg_quiz_score.toFixed(0)}%`, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-navy-400 mt-0.5">Insights from your activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => { const Icon = s.icon; return (
          <div key={i} className="card">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-2`}><Icon size={20} className={s.color} /></div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-navy-400">{s.label}</div>
          </div>
        )})}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Content Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={resourceData}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task completion */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Task Completion</h2>
          {data.completed_tasks === 0 && data.pending_tasks === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-navy-500">No tasks yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={taskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  <Cell fill="#10b981" /><Cell fill="#f59e0b" />
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Topic frequency */}
        {topicData.length > 0 && (
          <div className="card lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4">Topic Frequency</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topicData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} />
                <YAxis type="category" dataKey="topic" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} width={120} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topicData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
