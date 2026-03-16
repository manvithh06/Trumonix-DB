import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ArrowLeftRight, PlusCircle, ScrollText,
  ShieldCheck, User, LogOut, Menu, X, Zap, Bell
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions',     icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/transactions/new', icon: PlusCircle,      label: 'New Transaction' },
  { to: '/audit',            icon: ScrollText,      label: 'Audit Logs' },
  { to: '/profile',          icon: User,            label: 'Profile' },
]

const adminItems = [
  { to: '/admin', icon: ShieldCheck, label: 'Admin Panel' },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const Sidebar = () => (
    <aside className={clsx(
      'fixed inset-y-0 left-0 z-40 w-64 bg-surface-card border-r border-surface-border flex flex-col',
      'transition-transform duration-300 lg:translate-x-0',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-border">
        <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
          <Zap size={16} className="text-brand-400" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm tracking-wider">TRUMONIX</p>
          <p className="text-xs text-slate-500 font-mono">v1.0.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs text-slate-600 font-mono uppercase tracking-widest px-3 mb-3">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/transactions'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-surface-hover'
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="text-xs text-slate-600 font-mono uppercase tracking-widest px-3 mt-5 mb-3">Admin</p>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-surface-hover'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-surface-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-surface grid-bg">
      <Sidebar />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-surface-card/80 backdrop-blur border-b border-surface-border px-4 lg:px-6 py-3 flex items-center justify-between">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-600">
            <span className="w-2 h-2 rounded-full bg-brand-500 notif-dot"></span>
            ZERO-TRUST ACTIVE
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border border-surface-border">
              <span className="text-xs text-slate-400 font-mono">
                {isAdmin ? '🛡️ ADMIN' : '👤 USER'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
