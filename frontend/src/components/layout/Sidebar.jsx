import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import {
  LayoutDashboard, User, Briefcase, ClipboardList, Bell, LogOut,
  Users, Building2, BarChart3, Calendar, X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const STUDENT_NAV = [
  { to: '/student',               icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/profile',       icon: User,            label: 'My Profile' },
  { to: '/student/jobs',          icon: Briefcase,       label: 'Job Matches' },
  { to: '/student/applications',  icon: ClipboardList,   label: 'Applications' },
  { to: '/student/notifications', icon: Bell,            label: 'Notifications' },
]

const RECRUITER_NAV = [
  { to: '/recruiter',            icon: LayoutDashboard, label: 'Overview' },
  { to: '/recruiter/candidates', icon: Users,           label: 'Candidates' },
  { to: '/recruiter/jobs',       icon: Briefcase,       label: 'Job Postings' },
  { to: '/recruiter/interviews', icon: Calendar,        label: 'Interviews' },
]

const ADMIN_NAV = [
  { to: '/admin',             icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/students',    icon: Users,           label: 'Students' },
  { to: '/admin/recruiters',  icon: Building2,       label: 'Recruiters' },
  { to: '/admin/analytics',   icon: BarChart3,       label: 'Analytics' },
]

function NavItem({ to, icon: Icon, label, end = false, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-colors relative ${
          isActive ? 'text-white' : 'hover:bg-white/5'
        }`
      }
      style={({ isActive }) => ({
        color: isActive ? '#fff' : 'var(--text-secondary)',
      })}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-[10px]"
              style={{ background: 'var(--system-blue)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-3">
            <Icon size={17} />
            <span>{label}</span>
          </span>
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = user?.role || 'student'

  const navItems =
    role === 'recruiter' ? RECRUITER_NAV :
    role === 'admin' ? ADMIN_NAV :
    STUDENT_NAV

  const roleLabel =
    role === 'recruiter' ? 'Recruiter' :
    role === 'admin' ? 'Admin' :
    'Student'

  function handleLogout() {
    logout()
    navigate('/')
    onNavigate?.()
  }

  return (
    <>
      {/* Logo + branding */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="PlacementsAI" className="w-8 h-8 rounded-lg" />
          <div className="min-w-0">
            <span
              className="text-[15px] font-semibold block leading-tight"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              PlacementsAI
            </span>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {roleLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="h-px mx-4 mb-2" style={{ background: 'var(--separator)' }} />

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            end={item.to === '/student' || item.to === '/recruiter' || item.to === '/admin'}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-2 pb-3" style={{ paddingBottom: `max(12px, env(safe-area-inset-bottom))` }}>
        <div
          className="p-2.5 rounded-[12px]"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-[13px]"
              style={{ background: 'var(--system-blue)' }}
            >
              {(user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.email}
              </p>
              <p className="text-[11px] capitalize" style={{ color: 'var(--text-muted)' }}>{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-[8px] text-[13px] transition-colors hover:bg-white/5"
            style={{ color: 'var(--system-red)' }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}

export default function Sidebar({ open = false, onClose }) {
  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <>
      {/* Desktop: static sidebar */}
      <aside
        className="hidden md:flex w-[240px] flex-shrink-0 flex-col h-screen sticky top-0"
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'saturate(180%) blur(30px)',
          WebkitBackdropFilter: 'saturate(180%) blur(30px)',
          borderRight: '1px solid var(--separator)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile: slide-in drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              onClick={onClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[82vw] max-w-[300px] flex flex-col"
              style={{
                background: 'var(--bg-surface)',
                borderRight: '1px solid var(--separator)',
                paddingTop: 'env(safe-area-inset-top)',
              }}
            >
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="absolute top-2 right-2 p-2 rounded-full transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
