import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon, User, Palette, Globe, Mic, FileText,
  Sparkles, Shield, Download, Trash2, AlertCircle, Check, Info,
} from 'lucide-react'
import { settingsApi, authApi, configApi, logout, demoApi } from '../services/api'
import type { UserSettings, AppConfig } from '../types'
import { FullSpinner } from '../components/Spinner'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showResetDemo, setShowResetDemo] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([
        settingsApi.get().catch(() => null),
        configApi.getConfig().catch(() => null),
      ])
      setSettings(s)
      setConfig(c)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    try {
      await settingsApi.update({
        theme: settings.theme,
        language: settings.language,
        default_transcription_language: settings.default_transcription_language,
        default_summary_length: settings.default_summary_length,
        preferred_note_format: settings.preferred_note_format,
        default_explanation_level: settings.default_explanation_level,
      })
      setSaved(true)
      // Apply theme
      document.documentElement.classList.toggle('light', settings.theme === 'light')
      document.documentElement.classList.toggle('dark', settings.theme === 'dark')
      setTimeout(() => setSaved(false), 2000)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleDeleteAccount = async () => {
    try { await authApi.deleteMe(); logout(); navigate('/') } catch { /* ignore */ }
    setShowDeleteAccount(false)
  }

  const handleResetDemo = async () => {
    try { await demoApi.reset(); await load() } catch { /* ignore */ }
    setShowResetDemo(false)
  }

  if (loading) return <FullSpinner message="Loading settings…" />

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-navy-400 mt-0.5">Manage your preferences and account</p>
      </div>

      {/* Theme */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Palette size={18} className="text-brand-400" /><h2 className="text-lg font-semibold text-white">Appearance</h2></div>
        <div className="grid grid-cols-2 gap-3">
          {['dark', 'light'].map(theme => (
            <button key={theme} onClick={() => setSettings(s => s ? { ...s, theme } : s)} className={`p-4 rounded-lg border-2 transition-colors ${settings?.theme === theme ? 'border-brand-500 bg-brand-500/5' : 'border-navy-700 hover:border-navy-600'}`}>
              <div className="text-sm font-medium text-white capitalize">{theme} Mode</div>
              <div className={`mt-2 h-12 rounded-lg ${theme === 'dark' ? 'bg-navy-900' : 'bg-gray-100'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Globe size={18} className="text-brand-400" /><h2 className="text-lg font-semibold text-white">Language</h2></div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Interface Language</label><select className="input" value={settings?.language || 'en'} onChange={(e) => setSettings(s => s ? { ...s, language: e.target.value } : s)}><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option><option value="hi">Hindi</option><option value="ja">Japanese</option></select></div>
      </div>

      {/* AI Preferences */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Sparkles size={18} className="text-brand-400" /><h2 className="text-lg font-semibold text-white">AI Preferences</h2></div>
        <div className="space-y-3">
          <div><label className="block text-sm text-navy-300 mb-1.5">Default Transcription Language</label><select className="input" value={settings?.default_transcription_language || 'en'} onChange={(e) => setSettings(s => s ? { ...s, default_transcription_language: e.target.value } : s)}><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option><option value="auto">Auto-detect</option></select></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Default Summary Length</label><select className="input" value={settings?.default_summary_length || 'medium'} onChange={(e) => setSettings(s => s ? { ...s, default_summary_length: e.target.value } : s)}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></select></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Preferred Note Format</label><select className="input" value={settings?.preferred_note_format || 'detailed'} onChange={(e) => setSettings(s => s ? { ...s, preferred_note_format: e.target.value } : s)}><option value="short">Short</option><option value="detailed">Detailed</option><option value="bullet">Bullet Points</option><option value="qa">Q&A Format</option></select></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Default Explanation Level</label><select className="input" value={settings?.default_explanation_level || 'intermediate'} onChange={(e) => setSettings(s => s ? { ...s, default_explanation_level: e.target.value } : s)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
        </div>
      </div>

      {/* AI Provider Status */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Info size={18} className="text-brand-400" /><h2 className="text-lg font-semibold text-white">AI Provider Status</h2></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-navy-800/50">
            <span className="text-sm text-navy-300">LLM Provider</span>
            {config?.is_ai_configured ? <span className="badge-success">Configured</span> : <span className="badge-warning">Demo Mode (no provider)</span>}
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-navy-800/50">
            <span className="text-sm text-navy-300">Transcription Provider</span>
            {config?.is_transcription_configured ? <span className="badge-success">Configured</span> : <span className="badge-warning">Demo Mode (sample data)</span>}
          </div>
          {!config?.is_ai_configured && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> AI features use demo content. Configure an API key in the backend .env file to enable real AI processing.
            </div>
          )}
        </div>
      </div>

      {/* Privacy */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Shield size={18} className="text-emerald-400" /><h2 className="text-lg font-semibold text-white">Privacy & Data</h2></div>
        <div className="space-y-2 text-sm text-navy-400">
          <p>Your recordings and transcripts are stored locally in SQLite. API keys are kept server-side and never exposed to the frontend.</p>
          <p>When AI processing is enabled, content is sent to the configured provider (OpenAI, Groq, or Anthropic) for analysis.</p>
          <p>You can export or delete your data at any time.</p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving || !settings} className="btn-primary">
          {saving ? 'Saving…' : saved ? <><Check size={16} /> Saved!</> : 'Save Settings'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="card border-red-500/20">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
        <div className="space-y-3">
          {config?.demo_mode && (
            <div className="flex items-center justify-between">
              <div><div className="text-sm text-white">Reset Demo Data</div><div className="text-xs text-navy-500">Delete all demonstration records</div></div>
              <button onClick={() => setShowResetDemo(true)} className="btn-secondary text-sm">Reset</button>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-navy-800">
            <div><div className="text-sm text-white">Delete Account</div><div className="text-xs text-navy-500">Permanently delete your account and all data</div></div>
            <button onClick={() => setShowDeleteAccount(true)} className="btn-danger text-sm"><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      </div>

      <div className="text-xs text-navy-500 text-center pt-4">IntelliMeet AI v1.0.0</div>

      <ConfirmDialog isOpen={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} onConfirm={handleDeleteAccount} title="Delete Account" message="This will permanently delete your account and all associated data. This action cannot be undone." confirmLabel="Delete Account" danger />
      <ConfirmDialog isOpen={showResetDemo} onClose={() => setShowResetDemo(false)} onConfirm={handleResetDemo} title="Reset Demo Data" message="Delete all demonstration records? Your manually created content will remain." confirmLabel="Reset" danger />
    </div>
  )
}
