import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAppDispatch } from '../store/hooks'
import { loginSuccess } from '../features/auth/authSlice'
import { api } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname ?? '/'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await api.post('/auth/login', { email, password })
    const { token, user, credits } = res.data
    dispatch(loginSuccess({ token, user, credits }))
    navigate(from, { replace: true })
  }

  // Handle Google OAuth callback token in hash
  useEffect(() => {
    const hash = window.location.hash
    const match = hash.match(/token=([^&]+)/)
    if (match) {
      const token = decodeURIComponent(match[1])
      localStorage.setItem('token', token)
      ;(async () => {
        const me = await api.get('/auth/me')
        const { user, credits } = me.data
        dispatch(loginSuccess({ token, user, credits }))
        navigate(from, { replace: true })
      })()
    }
  }, [dispatch, from, navigate])

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-white to-indigo-50 text-neutral-900">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white/90 backdrop-blur p-8 rounded-2xl shadow-lg border border-neutral-100">
        <h1 className="text-2xl font-semibold text-center">Sign In</h1>
        <p className="text-center text-neutral-500 mt-1 mb-6">Enter your credentials to access your account</p>

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          className="w-full mb-1 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-sm font-medium mt-3 mb-1">Password</label>
        <div className="relative">
          <input
            className="w-full px-3 py-2 pr-10 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Enter your password"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            aria-label={show ? 'Hide password' : 'Show password'}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {show ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-indigo-600">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" strokeWidth="2" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-neutral-500">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" strokeWidth="2" />
                <path d="M3 3l18 18" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        <button type="submit" className="w-full mt-6 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition shadow">
          Sign In
        </button>

        <a
          href={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, '')}/api/auth/google`}
          className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border hover:bg-neutral-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.563 32.91 29.204 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.493 0 19.128-7.686 19.128-20 0-1.341-.138-2.651-.402-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.814C14.238 16.355 18.76 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.159 0 9.86-1.977 13.409-5.197l-6.191-5.238C29.205 36.001 26.715 37 24 37c-5.176 0-9.523-3.262-11.135-7.838l-6.5 5.02C9.671 39.556 16.314 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.36 3.91-5.718 7-11.303 7-5.176 0-9.523-3.262-11.135-7.838l-6.5 5.02C9.671 39.556 16.314 44 24 44c10.493 0 19.128-7.686 19.128-20 0-1.341-.138-2.651-.402-3.917z"/>
          </svg>
          <span>Continue with Google</span>
        </a>

        <p className="text-center text-sm text-neutral-500 mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  )
}



