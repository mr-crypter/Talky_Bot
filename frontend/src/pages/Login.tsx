import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAppDispatch } from '../store/hooks'
import { loginSuccess } from '../features/auth/authSlice'

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
    const token = 'demo-token'
    const user = { id: '1', email }
    dispatch(loginSuccess({ token, user }))
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-white to-indigo-50 text-neutral-900">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white/90 backdrop-blur p-8 rounded-2xl shadow-lg border border-neutral-100">
        <h1 className="text-2xl font-semibold text-center">Sign In</h1>
        <p className="text-center text-neutral-500 mt-1 mb-6">Enter your credentials to access your account</p>

        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          className="w-full mb-1 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Enter your username"
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

        <p className="text-center text-sm text-neutral-500 mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  )
}


