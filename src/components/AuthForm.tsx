import { useState } from 'react'
import { supabase } from '../supabase'
import { authError } from '../errors'
import { ThemeToggle } from '../theme'
import logoLg from '../assets/logo-lg.svg'

export default function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next)
    setMessage(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(authError(error))
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(authError(error))
      else if (!data.session) setMessage('Check your email to confirm your account, then sign in.')
    }
    setBusy(false)
  }

  return (
    <main className="overlay auth">
      <ThemeToggle floating />
      <div className="auth-brand">
        <span className="logo lg">
          <img src={logoLg} alt="" width={24} height={24} />
        </span>
        <h1>FlowBoard</h1>
        <p>{mode === 'signin' ? 'Sign in to manage your boards' : 'Create your account'}</p>
      </div>
      <div className="auth-card">
        <div className="tabs" role="group" aria-label="Account mode">
          <button type="button" aria-pressed={mode === 'signin'} className={`tab${mode === 'signin' ? ' active' : ''}`} onClick={() => switchMode('signin')}>
            Sign in
          </button>
          <button type="button" aria-pressed={mode === 'signup'} className={`tab${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>
            Sign up
          </button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>Email Address</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>
          {message && <p className="form-message" role="alert">{message}</p>}
          <button type="submit" className="btn primary block" disabled={busy}>
            {mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>
      </div>
    </main>
  )
}
