import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState, lazy, Suspense } from 'react'
import { Menu } from 'lucide-react'
import { useAuthStore } from './store/authStore'
import Sidebar from './components/layout/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy-load route chunks so the initial bundle only contains the shell.
// Each cluster (auth, student, recruiter, admin) is split on its own.
const LandingPage  = lazy(() => import('./pages/LandingPage'))
const LoginPage    = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))

const StudentDashboard    = lazy(() => import('./pages/student/StudentDashboard'))
const JobMatches          = lazy(() => import('./pages/student/JobMatches'))
const ApplicationTracker  = lazy(() => import('./pages/student/ApplicationTracker'))
const StudentProfile      = lazy(() => import('./pages/student/StudentProfile'))
const Notifications       = lazy(() => import('./pages/student/Notifications'))

const RecruiterDashboard = lazy(() => import('./pages/recruiter/RecruiterDashboard'))
const PostJob            = lazy(() => import('./pages/recruiter/PostJob'))
const CandidateList      = lazy(() => import('./pages/recruiter/CandidateList'))
const JobPostings        = lazy(() => import('./pages/recruiter/JobPostings'))
const InterviewSchedule  = lazy(() => import('./pages/recruiter/InterviewSchedule'))

const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'))
const AnalyticsPage       = lazy(() => import('./pages/admin/AnalyticsPage'))
const StudentManagement   = lazy(() => import('./pages/admin/StudentManagement'))
const RecruiterManagement = lazy(() => import('./pages/admin/RecruiterManagement'))

const StudentDetailPage = lazy(() => import('./pages/shared/StudentDetailPage'))

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin"
           style={{ borderTopColor: 'var(--system-blue)', borderRightColor: 'var(--system-blue)' }} />
    </div>
  )
}

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
      <Suspense fallback={<RouteFallback />}>
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
      </Suspense>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}
