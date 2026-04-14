import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import GoogleSignInButton from '../../components/ui/GoogleSignInButton'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shakeError, setShakeError] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      if (data.success) {
        login(data.data.token, data.data.user)
        const role = data.data.user.role
        navigate(role === 'admin' ? '/admin' : role === 'recruiter' ? '/recruiter' : '/student')
        toast.success('Welcome back!')
      }
    } catch (err) {
      setShakeError(true)
      setTimeout(() => setShakeError(false), 600)
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(role) {
    const creds = {
      admin:     { email: 'admin@college.edu',  password: 'admin123' },
      student:   { email: 'arjun@college.edu',   password: 'student123' },
      recruiter: { email: 'sarah@google.com',    password: 'recruiter123' },
    }
    setForm(creds[role])
  }

  const inputStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Aurora blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #6C63FF, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #3ECFCF, transparent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <motion.div
          animate={shakeError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="glass-card p-8"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/favicon.svg" alt="PlacementsAI" className="w-14 h-14 mx-auto mb-3 rounded-2xl" />
            <h1 className="text-3xl font-bold aurora-text" style={{ fontFamily: 'var(--font-heading)' }}>
              PlacementsAI
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              AI-Powered Campus Placement Platform
            </p>
          </div>

          {/* Google Sign-In — students only */}
          <div className="mb-5">
            <GoogleSignInButton label="Continue with Google" />
            <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              For students only
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                placeholder="you@college.edu"
                onFocus={e => e.target.style.borderColor = 'var(--border-active)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 pr-10 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  placeholder="••••••••"
                  onFocus={e => e.target.style.borderColor = 'var(--border-active)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'var(--gradient-aurora)' }}
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><LogIn size={16} /> Sign In</>
              }
            </motion.button>
          </form>

          {/* Demo quick-fill */}
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-xs text-center mb-3" style={{ color: 'var(--text-muted)' }}>
              Quick demo login
            </p>
            <div className="flex gap-2">
              {['student', 'recruiter', 'admin'].map(role => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all hover:scale-105"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            New student?{' '}
            <Link to="/register" className="hover:underline" style={{ color: 'var(--purple)' }}>
              Create account
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
