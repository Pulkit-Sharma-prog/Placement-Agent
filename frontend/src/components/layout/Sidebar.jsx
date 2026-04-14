import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, User, Briefcase, ClipboardList, Bell, LogOut,
  Users, Building2, BarChart3, Calendar,
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

function NavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${
          isActive
            ? 'text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(108,99,255,0.25), rgba(62,207,207,0.12))',
                border: '1px solid rgba(108,99,255,0.3)',
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-3">
            <Icon size={18} />
            <span>{label}</span>
          </span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = user?.role || 'student'

  const navItems =
    role === 'recruiter' ? RECRUITER_NAV :
    role === 'admin' ? ADMIN_NAV :
    STUDENT_NAV

  const roleConfig = {
    student:   { color: '#6C63FF', gradient: 'from-purple-500 to-teal-400', label: 'Student Portal' },
    recruiter: { color: '#FF6B9D', gradient: 'from-pink-500 to-orange-400', label: 'Recruiter Portal' },
    admin:     { color: '#3ECFCF', gradient: 'from-teal-400 to-purple-500', label: 'Admin Portal' },
  }
  const rc = roleConfig[role] || roleConfig.student

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-[260px] flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo + branding */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="PlacementsAI" className="w-9 h-9 rounded-xl" />
          <div>
            <span
              className="text-lg font-bold aurora-text block leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              PlacementsAI
            </span>
            <p className="text-[10px] font-medium tracking-wider uppercase" style={{ color: rc.color }}>
              {rc.label}
            </p>
          </div>
        </div>
      </div>

      <div className="h-px mx-4 mb-3" style={{ background: 'var(--border-subtle)' }} />

      {/* Section label */}
      <div className="px-6 mb-2">
        <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
          Navigation
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.to} {...item}
            end={item.to === '/student' || item.to === '/recruiter' || item.to === '/admin'}
          />
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 pb-4">
        <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-br ${rc.gradient} flex items-center justify-center text-white font-bold text-sm`}
            >
              {(user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-red-500/15 text-red-400"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
