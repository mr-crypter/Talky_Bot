import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const navigate = useNavigate()

  const valid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)
  const match = password === confirm

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || !match) return
    navigate('/login')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-white to-indigo-50 text-neutral-900">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white/90 backdrop-blur p-8 rounded-2xl shadow-lg border border-neutral-100">
        <h1 className="text-2xl font-semibold text-center">Sign Up</h1>
        <p className="text-center text-neutral-500 mt-1 mb-6">Create an account to get started</p>

        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          className="w-full mb-1 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Choose a username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-sm font-medium mt-3 mb-1">Password</label>
        <div className="relative">
          <input
            className="w-full px-3 py-2 pr-10 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Create a password"
            type={show1 ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            aria-label={show1 ? 'Hide password' : 'Show password'}
            onClick={() => setShow1((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {show1 ? (
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

        {password.length > 0 && (
          <ul className="mt-2 text-sm text-emerald-600 space-y-1">
            <li className={valid ? '' : 'opacity-40'}>✓ At least 8 characters</li>
            <li className={/[A-Z]/.test(password) ? '' : 'opacity-40'}>✓ One uppercase letter</li>
            <li className={/[a-z]/.test(password) ? '' : 'opacity-40'}>✓ One lowercase letter</li>
            <li className={/\d/.test(password) ? '' : 'opacity-40'}>✓ One number</li>
          </ul>
        )}

        <label className="block text-sm font-medium mt-4 mb-1">Confirm Password</label>
        <div className="relative">
          <input
            className={`w-full px-3 py-2 pr-10 rounded-lg border ${match ? 'border-neutral-200' : 'border-rose-400'} focus:outline-none focus:ring-2 focus:ring-indigo-400`}
            placeholder="Confirm your password"
            type={show2 ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            type="button"
            aria-label={show2 ? 'Hide password' : 'Show password'}
            onClick={() => setShow2((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {show2 ? (
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

        <button disabled={!valid || !match} type="submit" className="w-full mt-6 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 shadow">
          Sign Up
        </button>

        <p className="text-center text-sm text-neutral-500 mt-4">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  )
}


