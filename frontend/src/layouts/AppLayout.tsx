import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, GraduationCap, Users, Upload,
  Layers, HelpCircle, Search, StickyNote, BarChart3, Settings as SettingsIcon,
  Menu, X, LogOut, Sparkles, Bell, Zap, Plus, FileText, Hash, Timer,
  BookMarked, BookOpen,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import type { AppConfig, User } from '../types'
import { cn } from '../utils/cn'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { to: '/meetings', label: 'Meetings', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { to: '/minutes', label: 'Meeting Minutes', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { to: '/lectures', label: 'Lectures', icon: GraduationCap, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { to: '/upload', label: 'Upload', icon: Upload, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { to: '/topics', label: 'Topics & Concepts', icon: Hash, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { to: '/key-terms', label: 'Key Terms', icon: BookMarked, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { to: '/flashcards', label: 'Flashcards', icon: Layers, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { to: '/revision', label: 'Revision Hub', icon: BookOpen, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
  { to: '/study-planner', label: 'Study Planner', icon: Timer, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { to: '/quizzes', label: 'Quizzes', icon: HelpCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { to: '/assistant', label: 'AI Assistant', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { to: '/search', label: 'Search', icon: Search, color: 'text-green-400', bg: 'bg-green-500/10' },
  { to: '/notes', label: 'Notes', icon: StickyNote, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, color: 'text-red-400', bg: 'bg-red-500/10' },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, color: 'text-slate-400', bg: 'bg-slate-500/10' },
]

export function AppLayout({
  config,
  user,
  onLogout,
}: {
  config: AppConfig | null
  user: User | null
  onLogout: () => void
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isDemoUser = !user || user.is_demo

  const activeNav = navItems.find((n) => location.pathname.startsWith(n.to))

  return (
    <div className="min-h-screen flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-72 flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{
          background: 'rgba(10, 10, 26, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <button onClick={() => navigate('/dashboard')} className="hover:opacity-80 transition-opacity">
            <Logo size="md" />
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden btn-ghost !p-1.5" aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                    isActive
                      ? 'bg-white/[0.06] text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all', item.bg, 'group-hover:scale-110')}>
                      <Icon size={16} className={item.color} />
                    </div>
                    {item.label}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {isDemoUser && config?.demo_mode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d' }}>
              <Sparkles size={14} /> Demo Mode
            </div>
          )}
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors">
            <LogOut size={14} /> {isDemoUser ? 'Exit Demo' : 'Sign Out'}
          </button>
          <div className="px-3 text-xs text-slate-600">v1.0.0</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 px-4 lg:px-6 py-3.5 flex items-center justify-between"
          style={{ background: 'rgba(10,10,26,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost !p-1.5" aria-label="Open sidebar">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              {activeNav && (
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', activeNav.bg)}>
                  <activeNav.icon size={16} className={activeNav.color} />
                </div>
              )}
              <h1 className="text-sm font-semibold text-white">
                {activeNav?.label || 'IntelliMeet AI'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/search')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 transition-all hover:text-white hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Search size={15} />
              <span className="hidden sm:inline">Search…</span>
              <kbd className="hidden sm:inline text-xs px-1.5 py-0.5 rounded bg-white/5 text-slate-500">⌘K</kbd>
            </button>

            <button onClick={() => navigate('/upload')} className="btn-primary !py-2 !px-3 hidden sm:flex">
              <Zap size={15} /> <span className="hidden md:inline">Quick Upload</span>
            </button>

            <button className="btn-ghost !p-2 relative" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
            </button>

            {/* User menu */}
            <div className="relative group">
              <button className="flex items-center gap-2 btn-ghost !py-1.5 !px-1.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {user?.full_name?.charAt(0).toUpperCase() || 'D'}
                </div>
                <span className="hidden sm:block text-sm text-slate-300">{user?.full_name || 'Demo User'}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50" style={{ background: 'rgba(10,10,26,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5">
                  <SettingsIcon size={15} /> Settings
                </button>
                <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                  <LogOut size={15} /> {isDemoUser ? 'Exit Demo' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
