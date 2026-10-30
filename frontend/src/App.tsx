import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { LandingPage } from './pages/LandingPage'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Meetings } from './pages/Meetings'
import { MeetingDetail } from './pages/MeetingDetail'
import { Lectures } from './pages/Lectures'
import { LectureDetail } from './pages/LectureDetail'
import { UploadCenter } from './pages/UploadCenter'
import { Flashcards } from './pages/Flashcards'
import { FlashcardStudy } from './pages/FlashcardStudy'
import { Quizzes } from './pages/Quizzes'
import { QuizTake } from './pages/QuizTake'
import { AIAssistant } from './pages/AIAssistant'
import { SmartSearch } from './pages/SmartSearch'
import { Analytics } from './pages/Analytics'
import { Calendar } from './pages/Calendar'
import { Settings } from './pages/Settings'
import { Notes } from './pages/Notes'
import { Topics } from './pages/Topics'
import { StudyPlanner } from './pages/StudyPlanner'
import { MeetingMinutes } from './pages/MeetingMinutes'
import { KeyTerms } from './pages/KeyTerms'
import { RevisionHub } from './pages/RevisionHub'
import { TranscriptTimeline } from './pages/TranscriptTimeline'
import { ActionDashboard } from './pages/ActionDashboard'
import { Resume } from './pages/Resume'
import { NotFound } from './pages/NotFound'
import { configApi, authApi, isLoggedIn, setToken, logout } from './services/api'
import type { AppConfig, User } from './types'

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch app config (no auth needed)
    configApi.getConfig()
      .then(setConfig)
      .catch(() => setConfig({ is_ai_configured: false, is_transcription_configured: false, demo_mode: true }))
      .finally(() => setLoading(false))

    // If logged in, fetch user profile
    if (isLoggedIn()) {
      authApi.me()
        .then(setUser)
        .catch(() => {
          logout()
          setUser(null)
        })
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="animate-pulse text-brand-400 text-lg">Loading IntelliMeet AI…</div>
      </div>
    )
  }

  // Demo mode: allow access without login
  const isDemo = config?.demo_mode ?? true
  const hasToken = isLoggedIn()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage config={config} />} />
      <Route path="/login" element={hasToken ? <Navigate to="/dashboard" /> : <Login onLogin={(token) => { setToken(token); window.location.reload() }} />} />
      <Route path="/register" element={hasToken ? <Navigate to="/dashboard" /> : <Register onRegister={(token) => { setToken(token); window.location.reload() }} />} />

      {/* Protected routes */}
      <Route element={<AppLayout config={config} user={user} onLogout={() => { logout(); setUser(null); window.location.href = '/' }} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/meetings/:id" element={<MeetingDetail />} />
        <Route path="/lectures" element={<Lectures />} />
        <Route path="/lectures/:id" element={<LectureDetail />} />
        <Route path="/upload" element={<UploadCenter />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/flashcards/study" element={<FlashcardStudy />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/quizzes/:id" element={<QuizTake />} />
        <Route path="/assistant" element={<AIAssistant />} />
        <Route path="/search" element={<SmartSearch />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/study-planner" element={<StudyPlanner />} />
        <Route path="/minutes" element={<MeetingMinutes />} />
        <Route path="/key-terms" element={<KeyTerms />} />
        <Route path="/revision" element={<RevisionHub />} />
        <Route path="/timeline" element={<TranscriptTimeline />} />
        <Route path="/actions" element={<ActionDashboard />} />
        <Route path="/resume" element={<Resume />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
