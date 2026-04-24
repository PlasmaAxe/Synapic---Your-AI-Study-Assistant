import { useState } from 'react'
import { supabase } from './supabase'
import synapicLogo from './assets/synapicLogo1.png'

// Same design tokens as App.jsx so styling is consistent
const C = {
  bg: '#F7F5F0',
  bgCard: '#FFFFFF',
  border: '#E8E4DC',
  text: '#1A1A18',
  textMuted: '#6B6860',
  textLight: '#9B9890',
  accent: '#0D9373',
  accentLight: '#E6F5F0',
  accentGrad: 'linear-gradient(135deg, #0D9373, #0A7A5F)',
  danger: '#E53E3E',
  success: '#38A169',
}

export default function Authentication({ onLogin, onBack }) {
  // Toggle between sign in and sign up mode
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  // type will be 'error' or 'success' to control the colour

  const handleAuth = async () => {
    // Basic validation before hitting the API
    if (!email || !password) {
      setMessage({ text: 'Please fill in all fields.', type: 'error' })
      return
    }
    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' })
      return
    }

    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      if (mode === 'signup') {
        // supabase.auth.signUp creates a new user account
        // Supabase sends a confirmation email automatically
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage({
          text: 'Account created! Check your email to confirm, then sign in.',
          type: 'success'
        })
      } else {
        // supabase.auth.signInWithPassword checks email + password
        // If correct, Supabase stores a session token in localStorage
        // automatically — you don't manage tokens yourself
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // Tell the parent component login succeeded
        onLogin()
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' })
    }

    setLoading(false)
  }

  // Allow pressing Enter to submit instead of clicking the button
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAuth()
  }
//stylling:
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
        
       <nav className="flex items-center justify-between px-8 py-4 sticky top-0 z-40"
        style={{
          background: 'rgba(247,245,240,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${C.border}`
        }}>
        <button
          type="button"
          onClick={onBack}
          className="transition-opacity hover:opacity-70"
        >
          <img
            src={synapicLogo}
            alt="Synapic"
            className="h-20 w-auto object-contain"
          />
        </button>
      </nav>

      {/* Centered auth card */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="rounded-3xl p-10"
            style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-black mb-2" style={{ color: C.text }}>
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm" style={{ color: C.textMuted }}>
                {mode === 'signin'
                  ? 'Sign in to access your study tools'
                  : 'Start studying smarter today. No Payment Info Required!'}
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: C.textMuted }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
                  style={{
                    background: C.bg,
                    border: `1.5px solid ${C.border}`,
                    color: C.text
                  }}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: C.textMuted }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
                  style={{
                    background: C.bg,
                    border: `1.5px solid ${C.border}`,
                    color: C.text
                  }}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            </div>

            {/* Message — shows errors or success in different colours */}
            {message.text && (
              <div className="mb-6 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: message.type === 'error' ? '#FFF5F5' : C.accentLight,
                  color: message.type === 'error' ? C.danger : C.accent,
                  border: `1px solid ${message.type === 'error' ? C.danger : C.accent}30`
                }}>
                {message.text}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full py-3 rounded-full font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: C.accentGrad }}>
              {loading
                ? 'Loading...'
                : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: C.border }} />
              <span className="text-xs" style={{ color: C.textLight }}>or</span>
              <div className="flex-1 h-px" style={{ background: C.border }} />
            </div>

            {/* Toggle mode */}
            <button
              onClick={() => {
                setMode(m => m === 'signin' ? 'signup' : 'signin')
                setMessage({ text: '', type: '' }) // clear message on switch
              }}
              className="w-full py-3 rounded-full text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: C.bg,
                color: C.text,
                border: `1px solid ${C.border}`
              }}>
              {mode === 'signin'
                ? "Don't have an account? Sign up!"
                : 'Already have an account? Sign in!'}
            </button>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: C.textLight }}>
            By signing up you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  )
}