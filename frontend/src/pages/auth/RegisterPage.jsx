import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../lib/api'
import GoogleSignInButton from '../../components/ui/GoogleSignInButton'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', roll_number: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', { ...form, role: 'student' })
      if (data.success) {
        toast.success('Account created! Please log in.')
        navigate('/login')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
  }

  function Field({ id, label, type = 'text', placeholder, required = true }) {
    return (
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
        <input
          type={type}
          value={form[id]}
          onChange={e => setForm({ ...form, [id]: e.target.value })}
          required={required}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={inputStyle}
          placeholder={placeholder}
          onFocus={e => e.target.style.borderColor = 'var(--border-active)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: 'var(--bg-base)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF6B9D, transparent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <div className="text-center mb-7">
          <img src="/favicon.svg" alt="PlacementsAI" className="w-12 h-12 mx-auto mb-3 rounded-xl" />
          <h1 className="text-2xl font-bold aurora-text" style={{ fontFamily: 'var(--font-heading)' }}>
            Create Account
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Student registration</p>
        </div>

        {/* Google Sign-Up — fastest way */}
        <div className="mb-5">
          <GoogleSignInButton
            label="Sign up with Google"
            onSuccess={() => navigate('/student')}
          />
          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Instant sign-up — no password needed
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or register with email</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field id="full_name"    label="Full Name"              placeholder="Arjun Sharma" />
          <Field id="email"        label="College Email"  type="email" placeholder="arjun@college.edu" />
          <Field id="roll_number"  label="Roll Number (optional)" placeholder="CS2024001" required={false} />
          <Field id="password"     label="Password"       type="password" placeholder="••••••••" />

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 mt-2 hover:opacity-90"
            style={{ background: 'var(--gradient-aurora)' }}
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><UserPlus size={16} /> Create Account</>
            }
          </motion.button>
        </form>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--purple)' }} className="hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
