// Regression tests for the WCAG 2.2 AA fixes made in the accessibility audit.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import css from '../index.css?raw'
import { db, resetDb, row, supabase } from './mockSupabase'

vi.mock('../supabase', () => import('./mockSupabase'))

async function renderBoard() {
  resetDb([row({ id: 'a', title: 'Write docs', assignee: '' }), row({ id: 'b', title: 'Fix login', column_id: 'done', position: 2 })])
  const utils = render(<App />)
  await screen.findByText('Write docs')
  return utils
}

describe('cards (keyboard and screen-reader access)', () => {
  beforeEach(() => resetDb())

  it('opens from a real button inside the heading, not a clickable article', async () => {
    await renderBoard()
    const button = screen.getByRole('button', { name: 'Write docs' })
    expect(button.closest('h3')).not.toBeNull()
    const article = button.closest('article')!
    // Clicking the card body (not the title) must not open the editor.
    await userEvent.click(within(article).getByText('Unassigned'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('offers a non-drag way to move cards (WCAG 2.5.7)', async () => {
    await renderBoard()
    const select = screen.getByRole('combobox', { name: 'Move "Write docs" to column' })
    expect(within(select).getAllByRole('option').map((o) => (o as HTMLOptionElement).value)).toEqual(['backlog', 'in-progress', 'in-review', 'done'])
  })

  it('hides decorative emoji from assistive tech', async () => {
    await renderBoard()
    for (const symbol of ['👤', '📅']) {
      const found = screen.getAllByText(symbol)
      expect(found.length).toBeGreaterThan(0)
      found.forEach((el) => expect(el).toHaveAttribute('aria-hidden', 'true'))
    }
  })

  it('gives every Add button a column-specific name', async () => {
    await renderBoard()
    for (const name of ['Backlog', 'In Progress', 'In Review', 'Done']) {
      expect(screen.getByRole('button', { name: `Add card to ${name}` })).toBeInTheDocument()
    }
  })

  it('spells out the card count for screen readers', async () => {
    await renderBoard()
    const done = screen.getByRole('region', { name: 'Done' })
    expect(within(done).getByRole('heading', { name: /Done 1 card$/ })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'In Review' })).getByRole('heading', { name: /In Review 0 cards$/ })).toBeInTheDocument()
  })

  it('announces a move in a polite live region and keeps focus on the card', async () => {
    const user = userEvent.setup()
    const { container } = await renderBoard()
    const live = container.querySelector('[aria-live="polite"]')!
    expect(live).toHaveAttribute('role', 'status')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Move "Write docs" to column' }), 'in-review')
    await waitFor(() => expect(live).toHaveTextContent('Moved "Write docs" to In Review'))
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Move "Write docs" to column' })).toHaveFocus())
  })
})

describe('page structure', () => {
  beforeEach(() => resetDb())

  it('has a skip link that moves focus to the board', async () => {
    const user = userEvent.setup()
    await renderBoard()
    const skip = screen.getByRole('link', { name: 'Skip to board' })
    await user.click(skip)
    expect(screen.getByRole('main')).toHaveFocus()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'board')
  })

  it('exposes the user as text instead of a title tooltip', async () => {
    await renderBoard()
    expect(screen.getByText('Signed in as sam@example.com')).toBeInTheDocument()
    expect(document.querySelector('.avatar')).not.toHaveAttribute('title')
  })

  it('has one h1 and the sign-in screen is wrapped in <main>', async () => {
    resetDb([], false)
    render(<App />)
    await screen.findByRole('heading', { name: 'FlowBoard', level: 1 })
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})

describe('card dialog', () => {
  beforeEach(() => resetDb())

  async function openDialog() {
    const user = userEvent.setup()
    const { container } = await renderBoard()
    const opener = screen.getByRole('button', { name: 'Write docs' })
    await user.click(opener)
    return { user, container, opener, dialog: screen.getByRole('dialog', { name: 'Edit card' }) }
  }

  it('moves focus in, makes the page behind inert, and exposes aria-modal', async () => {
    const { container, dialog } = await openDialog()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog.contains(document.activeElement)).toBe(true)
    expect(container.querySelector('.app-inert')).toHaveAttribute('inert')
  })

  it('traps Tab and Shift+Tab inside the dialog', async () => {
    const { user, dialog } = await openDialog()
    const buttons = within(dialog).getAllByRole('button')
    const save = within(dialog).getByRole('button', { name: 'Save' })
    const close = within(dialog).getByRole('button', { name: 'Close' })
    expect(buttons[0]).toBe(close)
    save.focus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(save).toHaveFocus()
  })

  it('closes on Escape and returns focus to the control that opened it', async () => {
    const { user, container, opener } = await openDialog()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(opener).toHaveFocus())
    expect(container.querySelector('.app-inert')).not.toHaveAttribute('inert')
  })

  it('links the title error to its field, outside the label', async () => {
    const { user, dialog } = await openDialog()
    const title = within(dialog).getByLabelText(/Title/)
    await user.clear(title)
    await user.type(title, '   ')
    fireEvent.submit(dialog)
    const error = await within(dialog).findByRole('alert')
    expect(error).toHaveTextContent('Title is required.')
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAccessibleDescription('Title is required.')
    expect(title.closest('label')).not.toContainElement(error)
    expect(title.closest('label')!.textContent).not.toMatch(/required\./)
  })

  it('marks required fields visibly', async () => {
    const { dialog } = await openDialog()
    expect(within(dialog).getByText('All fields are required')).toBeInTheDocument()
    expect(within(dialog).getAllByText('*', { exact: false }).length).toBeGreaterThanOrEqual(3)
  })
})

describe('sign-in form', () => {
  beforeEach(() => resetDb([], false))

  it('uses pressed toggle buttons rather than half-built tabs', async () => {
    render(<App />)
    const group = await screen.findByRole('group', { name: 'Account mode' })
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Sign in' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(group).getByRole('button', { name: 'Sign up' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('announces errors and declares the email autocomplete token', async () => {
    const user = userEvent.setup()
    render(<App />)
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({ error: { code: 'invalid_credentials', message: '' } } as never)
    const email = await screen.findByLabelText('Email Address')
    expect(email).toHaveAttribute('autocomplete', 'email')
    await user.type(email, 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'pw-pw-pw-pw')
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.')
    expect(db.session).toBeNull()
  })
})

// --- Styles ------------------------------------------------------------

const block = (start: string, end?: string) => {
  const from = css.indexOf(start)
  return css.slice(from, end ? css.indexOf(end, from) : undefined)
}
const light = block(':root {', ':root[data-theme')
const dark = block(":root[data-theme='dark']", '* { box-sizing')
const token = (scope: string, name: string) => {
  const m = scope.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`missing token ${name}`)
  return m[1]
}
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('styles (WCAG 1.4.3, 1.4.11, 2.4.7, 2.5.8)', () => {
  it.each([
    ['muted text on column surface', 'light', '--muted', '--surface'],
    ['muted text on white', 'light', '--muted', '--bg'],
    ['danger on white', 'light', '--danger', '--bg'],
    ['high badge', 'light', '--badge-high-fg', '--badge-high-bg'],
    ['medium badge', 'light', '--badge-medium-fg', '--badge-medium-bg'],
    ['low badge', 'light', '--badge-low-fg', '--badge-low-bg'],
    ['muted text on card (dark)', 'dark', '--muted', '--card'],
    ['danger on card (dark)', 'dark', '--danger', '--card'],
    ['high badge (dark)', 'dark', '--badge-high-fg', '--badge-high-bg'],
    ['medium badge (dark)', 'dark', '--badge-medium-fg', '--badge-medium-bg'],
    ['low badge (dark)', 'dark', '--badge-low-fg', '--badge-low-bg'],
  ])('%s has at least 4.5:1 contrast', (_n, theme, fg, bg) => {
    const scope = theme === 'light' ? light : dark
    const lookup = (n: string) => (scope.includes(`${n}:`) ? token(scope, n) : token(light, n))
    expect(contrast(lookup(fg), lookup(bg))).toBeGreaterThanOrEqual(4.5)
  })

  it('focus ring has at least 3:1 contrast against its backgrounds', () => {
    expect(contrast(token(light, '--focus'), token(light, '--bg'))).toBeGreaterThanOrEqual(3)
    expect(contrast(token(dark, '--focus'), token(dark, '--card'))).toBeGreaterThanOrEqual(3)
  })

  it('shows a visible focus indicator and never removes it from fields', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid/)
    const fieldFocus = css.match(/\.field input:focus[^{]*\{([^}]*)\}/)![1]
    expect(fieldFocus).not.toMatch(/outline:\s*none/)
    expect(fieldFocus).toMatch(/outline:\s*2px solid/)
  })

  it('defines the screen-reader and skip-link utilities', () => {
    expect(css).toMatch(/\.sr-only\s*\{/)
    expect(css).toMatch(/\.skip-link:focus\s*\{/)
  })

  it('gives small controls a 24px minimum target', () => {
    expect(css).toMatch(/\.link-btn,\s*\.danger-link,\s*\.add-card,\s*\.icon-btn\s*\{[^}]*min-height:\s*24px;[^}]*min-width:\s*24px/)
  })

  it('respects reduced motion', () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/)
  })
})
