import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { resetDb, supabase } from './mockSupabase'

vi.mock('../supabase', () => import('./mockSupabase'))

async function renderAuth() {
  resetDb([], false)
  render(<App />)
  await screen.findByRole('heading', { name: 'FlowBoard' })
}

describe('sign in', () => {
  beforeEach(() => resetDb([], false))

  it('signs in with email and password', async () => {
    const user = userEvent.setup()
    await renderAuth()
    await user.type(screen.getByLabelText('Email Address'), 'sam@example.com')
    await user.type(screen.getByLabelText('Password'), 'hunter2hunter2')
    await user.click(screen.getAllByRole('button', { name: 'Sign in' }).find((b) => b.getAttribute('type') === 'submit')!)
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'sam@example.com', password: 'hunter2hunter2' })
  })

  it('shows a friendly message for bad credentials', async () => {
    const user = userEvent.setup()
    await renderAuth()
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({ error: { code: 'invalid_credentials', message: 'raw' } } as never)
    await user.type(screen.getByLabelText('Email Address'), 'sam@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.')
  })

  it('switches to sign up and creates an account', async () => {
    const user = userEvent.setup()
    await renderAuth()
    await user.click(screen.getByRole('button', { name: 'Sign up', pressed: false }))
    await user.type(screen.getByLabelText('Email Address'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'long-enough-pw')
    await user.keyboard('{Enter}')
    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'long-enough-pw' })
    expect(await screen.findByRole('alert')).toHaveTextContent(/check your email/i)
  })
})
