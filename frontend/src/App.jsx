import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
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
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="flex-1 ml-[260px] p-6 min-h-screen overflow-y-auto">
        {children}
      </main>
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
