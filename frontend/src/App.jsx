import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { useAuthStore } from './store/authStore'
import Sidebar from './components/layout/Sidebar'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Student pages
import StudentDashboard from './pages/student/StudentDashboard'
import JobMatches from './pages/student/JobMatches'
import ApplicationTracker from './pages/student/ApplicationTracker'
import StudentProfile from './pages/student/StudentProfile'
import Notifications from './pages/student/Notifications'

// Recruiter pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard'
import PostJob from './pages/recruiter/PostJob'
import CandidateList from './pages/recruiter/CandidateList'
import JobPostings from './pages/recruiter/JobPostings'
import InterviewSchedule from './pages/recruiter/InterviewSchedule'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import StudentManagement from './pages/admin/StudentManagement'
import RecruiterManagement from './pages/admin/RecruiterManagement'

// Shared pages
import StudentDetailPage from './pages/shared/StudentDetailPage'
import LandingPage from './pages/LandingPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function ProtectedRoute({ children, allowedRoles }) {
  const { token, user } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    if (user.role === 'student') return <Navigate to="/student" replace />
    if (user.role === 'recruiter') return <Navigate to="/recruiter" replace />
    if (user.role === 'admin') return <Navigate to="/admin" replace />
  }

  return children
}

function AppLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with hamburger (hidden on md+) */}
        <header
          className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-12"
          style={{
            background: 'var(--bg-glass)',
            backdropFilter: 'saturate(180%) blur(30px)',
            WebkitBackdropFilter: 'saturate(180%) blur(30px)',
            borderBottom: '1px solid var(--separator)',
            paddingTop: 'env(safe-area-inset-top)',
            height: `calc(48px + env(safe-area-inset-top))`,
          }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="p-2 -ml-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-primary)' }}
          >
            <Menu size={20} />
          </button>
          <span
            className="text-[15px] font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            PlacementsAI
          </span>
        </header>

        <main
          className="flex-1 p-4 md:p-6 min-h-0 overflow-y-auto"
          style={{
            paddingBottom: `max(16px, env(safe-area-inset-bottom))`,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const { token, user } = useAuthStore()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route
          path="/"
          element={
            token
              ? <Navigate to={user?.role === 'recruiter' ? '/recruiter' : user?.role === 'admin' ? '/admin' : '/student'} replace />
              : <LandingPage />
          }
        />
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to={user?.role === 'recruiter' ? '/recruiter' : user?.role === 'admin' ? '/admin' : '/student'} replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/student" replace /> : <RegisterPage />}
        />

        {/* Student routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <AppLayout><StudentDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/jobs" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <AppLayout><JobMatches /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/applications" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <AppLayout><ApplicationTracker /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <AppLayout><StudentProfile /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/notifications" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <AppLayout><Notifications /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Recruiter routes */}
        <Route path="/recruiter" element={
          <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
            <AppLayout><RecruiterDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/recruiter/jobs" element={
          <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
            <AppLayout><JobPostings /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/recruiter/jobs/new" element={
          <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
            <AppLayout><PostJob /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/recruiter/candidates" element={
          <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
            <AppLayout><CandidateList /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/recruiter/candidates/:studentId" element={
          <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
            <AppLayout><StudentDetailPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/recruiter/interviews" element={
          <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
            <AppLayout><InterviewSchedule /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><AdminDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><AnalyticsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><StudentManagement /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/students/:studentId" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><StudentDetailPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/recruiters" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><RecruiterManagement /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route
          path="*"
          element={
            token
              ? <Navigate to={user?.role === 'recruiter' ? '/recruiter' : user?.role === 'admin' ? '/admin' : '/student'} replace />
              : <Navigate to="/" replace />
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </QueryClientProvider>
  )
}
