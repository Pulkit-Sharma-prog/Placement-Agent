import { useGoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

// Google "G" SVG logo
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  )
}

export default function GoogleSignInButton({ label = 'Continue with Google', onSuccess }) {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const [loading, setLoading] = useState(false)

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        // Exchange access token for user info, then send to our backend
        // Note: useGoogleLogin gives us an access_token, not an id_token.
        // We fetch userinfo from Google with the access_token.
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const userInfo = await userInfoRes.json()

        // Send to our backend — pass the raw access token + email/name
        const { data } = await api.post('/auth/google-token', {
          access_token: tokenResponse.access_token,
          email: userInfo.email,
          name: userInfo.name || '',
          google_sub: userInfo.sub,
          picture: userInfo.picture || '',
        })

        if (data.success) {
          login(data.data.token, data.data.user)
          toast.success('Signed in with Google!')
          if (onSuccess) onSuccess(data.data)
          else navigate('/student')
        }
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Google sign-in failed')
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      toast.error('Google sign-in was cancelled or failed')
    },
    flow: 'implicit',
  })

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-60"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
      }}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <GoogleLogo />
      )}
      {loading ? 'Signing in...' : label}
    </button>
  )
}
