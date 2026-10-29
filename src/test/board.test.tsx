import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { db, resetDb, row } from './mockSupabase'

vi.mock('../supabase', () => import('./mockSupabase'))

const column = (name: string) => screen.getByRole('region', { name })

async function renderBoard(rows = [row({ id: 'a', title: 'Write docs' }), row({ id: 'b', title: 'Fix login', column_id: 'in-progress', position: 2 })]) {
  resetDb(rows)
  render(<App />)
  await screen.findByRole('heading', { name: 'My board' })
  await screen.findByText('Write docs')
}

describe('board', () => {
  beforeEach(() => resetDb())

  it('shows each card in its column', async () => {
    await renderBoard()
    expect(within(column('Backlog')).getByText('Write docs')).toBeInTheDocument()
    expect(within(column('In Progress')).getByText('Fix login')).toBeInTheDocument()
  })

  it('creates a card in the column whose Add button was used', async () => {
    const user = userEvent.setup()
    await renderBoard()
    await user.click(screen.getByRole('button', { name: 'Add card to In Review' }))
    const dialog = screen.getByRole('dialog', { name: 'Add card' })
    await user.type(within(dialog).getByLabelText(/Title/), 'Ship release')
    await user.type(within(dialog).getByLabelText(/Assignee/), 'Sam')
    fireEvent.change(within(dialog).getByLabelText(/Due date/), { target: { value: '2026-12-24' } })
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await within(column('In Review')).findByText('Ship release')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(db.calls.find((c) => c.op === 'insert')!.payload).toMatchObject({
      title: 'Ship release',
      assignee: 'Sam',
      due_date: '2026-12-24',
      column_id: 'in-review',
    })
  })

  it('edits a card', async () => {
    const user = userEvent.setup()
    await renderBoard()
    await user.click(screen.getByRole('button', { name: 'Write docs' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit card' })
    const title = within(dialog).getByLabelText(/Title/)
    await user.clear(title)
    await user.type(title, 'Write better docs')
    await user.selectOptions(within(dialog).getByLabelText('Priority'), 'High')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Write better docs')).toBeInTheDocument()
    expect(screen.queryByText('Write docs')).not.toBeInTheDocument()
    await waitFor(() => expect(db.rows.find((r) => r.id === 'a')).toMatchObject({ title: 'Write better docs', priority: 'High' }))
  })

  it('moves a card to another column with the Move to menu', async () => {
    const user = userEvent.setup()
    await renderBoard()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Move "Write docs" to column' }), 'done')

    expect(await within(column('Done')).findByText('Write docs')).toBeInTheDocument()
    expect(within(column('Backlog')).queryByText('Write docs')).not.toBeInTheDocument()
    await waitFor(() => expect(db.rows.find((r) => r.id === 'a')?.column_id).toBe('done'))
  })

  it('moves a card with drag and drop', async () => {
    await renderBoard()
    const store: Record<string, string> = {}
    const dataTransfer = { setData: (k: string, v: string) => (store[k] = v), getData: (k: string) => store[k], effectAllowed: '', dropEffect: '' }
    fireEvent.dragStart(screen.getByText('Write docs').closest('article')!, { dataTransfer })
    fireEvent.drop(column('Done'), { dataTransfer })
    expect(await within(column('Done')).findByText('Write docs')).toBeInTheDocument()
  })

  it('deletes a card after the user confirms', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await renderBoard()
    await user.click(screen.getByRole('button', { name: 'Write docs' }))
    await user.click(screen.getByRole('button', { name: 'Delete card' }))

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Write docs'))
    await waitFor(() => expect(screen.queryByText('Write docs')).not.toBeInTheDocument())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(db.rows.map((r) => r.id)).toEqual(['b']))
  })

  it('keeps the card when the user cancels the delete', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    await renderBoard()
    await user.click(screen.getByRole('button', { name: 'Write docs' }))
    await user.click(screen.getByRole('button', { name: 'Delete card' }))

    expect(screen.getByText('Write docs')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(db.rows).toHaveLength(2)
  })

  it('requires a title', async () => {
    const user = userEvent.setup()
    await renderBoard()
    await user.click(screen.getByRole('button', { name: 'Add card to Backlog' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Title/), '   ')
    await user.type(within(dialog).getByLabelText(/Assignee/), 'Sam')
    fireEvent.change(within(dialog).getByLabelText(/Due date/), { target: { value: '2026-12-24' } })
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Title is required.')).toBeInTheDocument()
    expect(db.calls.some((c) => c.op === 'insert')).toBe(false)
  })

  it('shows a safe error and keeps the dialog open when creating fails', async () => {
    const user = userEvent.setup()
    await renderBoard()
    db.failOn = { op: 'insert', message: 'duplicate key value violates unique constraint "cards_pkey"' }
    await user.click(screen.getByRole('button', { name: 'Add card to Backlog' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Title/), 'X')
    await user.type(within(dialog).getByLabelText(/Assignee/), 'Sam')
    fireEvent.change(within(dialog).getByLabelText(/Due date/), { target: { value: '2026-12-24' } })
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    const alert = await within(dialog).findByRole('alert')
    expect(alert).toHaveTextContent(/could not add/i)
    expect(alert).not.toHaveTextContent(/constraint|pkey/i)
  })
})
