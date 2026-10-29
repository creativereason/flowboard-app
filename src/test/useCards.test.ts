import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCards } from '../useCards'
import { db, resetDb, row } from './mockSupabase'

vi.mock('../supabase', () => import('./mockSupabase'))

const input = { title: 'New task', assignee: 'Sam', priority: 'High' as const, dueDate: '2026-12-01' }

async function setup(rows = [row({ id: 'a', title: 'Alpha' }), row({ id: 'b', title: 'Beta', position: 2 })]) {
  resetDb(rows)
  const hook = renderHook(() => useCards('user-1'))
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook
}

describe('useCards', () => {
  beforeEach(() => resetDb())

  it('loads cards from the (mocked) database in position order', async () => {
    const { result } = await setup([row({ id: 'b', title: 'Beta', position: 2 }), row({ id: 'a', title: 'Alpha', position: 1 })])
    expect(result.current.cards.map((c) => c.title)).toEqual(['Alpha', 'Beta'])
    expect(result.current.cards[0]).toMatchObject({ status: 'backlog', dueDate: '2026-11-01' })
  })

  it('surfaces a load error without crashing', async () => {
    resetDb()
    db.failOn = { op: 'select', message: 'boom' }
    const { result } = renderHook(() => useCards('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Could not load your cards.')
  })

  describe('create', () => {
    it('inserts into the requested column and adds the card', async () => {
      const { result } = await setup()
      let message: string | null = 'unset'
      await act(async () => {
        message = await result.current.add(input, 'in-review')
      })
      expect(message).toBeNull()
      const insert = db.calls.find((c) => c.op === 'insert')!
      expect(insert.payload).toMatchObject({ title: 'New task', assignee: 'Sam', priority: 'High', due_date: '2026-12-01', column_id: 'in-review' })
      expect(result.current.cards.find((c) => c.title === 'New task')?.status).toBe('in-review')
    })

    it('defaults to the backlog column', async () => {
      const { result } = await setup([])
      await act(async () => {
        await result.current.add(input)
      })
      expect(db.calls.find((c) => c.op === 'insert')!.payload).toMatchObject({ column_id: 'backlog' })
    })

    it('returns a safe message (not the raw DB error) when the insert fails', async () => {
      const { result } = await setup()
      db.failOn = { op: 'insert', message: 'violates check constraint "cards_title_check"' }
      let message: string | null = null
      await act(async () => {
        message = await result.current.add(input)
      })
      expect(message).toMatch(/could not add/i)
      expect(message).not.toMatch(/constraint/i)
      expect(result.current.cards).toHaveLength(2)
    })
  })

  describe('edit', () => {
    it('updates the card optimistically and persists the change', async () => {
      const { result } = await setup()
      await act(async () => {
        await result.current.update('a', input)
      })
      expect(result.current.cards.find((c) => c.id === 'a')).toMatchObject({ title: 'New task', priority: 'High', dueDate: '2026-12-01' })
      expect(db.calls.find((c) => c.op === 'update')).toMatchObject({ id: 'a', payload: { title: 'New task', due_date: '2026-12-01' } })
      expect(db.rows.find((r) => r.id === 'a')?.title).toBe('New task')
    })

    it('reports an error and re-syncs from the database when saving fails', async () => {
      const { result } = await setup()
      db.failOn = { op: 'update', message: 'nope' }
      await act(async () => {
        await result.current.update('a', input)
      })
      await waitFor(() => expect(result.current.cards.find((c) => c.id === 'a')?.title).toBe('Alpha'))
    })
  })

  describe('move', () => {
    it('changes the column locally and in the database', async () => {
      const { result } = await setup()
      await act(async () => {
        await result.current.move('a', 'done')
      })
      expect(result.current.cards.find((c) => c.id === 'a')?.status).toBe('done')
      expect(db.rows.find((r) => r.id === 'a')?.column_id).toBe('done')
      expect(db.calls.find((c) => c.op === 'update')!.payload).toMatchObject({ column_id: 'done' })
    })

    it('rolls back to the stored column when the update fails', async () => {
      const { result } = await setup()
      db.failOn = { op: 'update', message: 'Failed to fetch' }
      await act(async () => {
        await result.current.move('a', 'done')
      })
      await waitFor(() => expect(result.current.cards.find((c) => c.id === 'a')?.status).toBe('backlog'))
    })
  })

  describe('delete', () => {
    it('removes the card locally and from the database', async () => {
      const { result } = await setup()
      await act(async () => {
        await result.current.remove('a')
      })
      expect(result.current.cards.map((c) => c.id)).toEqual(['b'])
      expect(db.rows.map((r) => r.id)).toEqual(['b'])
    })

    it('restores the card if the delete fails', async () => {
      const { result } = await setup()
      db.failOn = { op: 'delete', message: 'nope' }
      await act(async () => {
        await result.current.remove('a')
      })
      await waitFor(() => expect(result.current.cards.map((c) => c.id)).toContain('a'))
    })
  })
})
