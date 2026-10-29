// In-memory stand-in for src/supabase.ts. Tests install it with:
//   vi.mock('../supabase', () => import('./mockSupabase'))
// so nothing ever reaches the real database.
import { vi } from 'vitest'

export interface Row {
  id: string
  title: string
  assignee: string
  priority: 'High' | 'Medium' | 'Low'
  due_date: string
  column_id: 'backlog' | 'in-progress' | 'in-review' | 'done'
  position: number
}

type Op = 'select' | 'insert' | 'update' | 'delete'
export interface Call {
  op: Op
  payload?: Record<string, unknown>
  id?: string
}

export const missingConfig = false

export const db = {
  rows: [] as Row[],
  calls: [] as Call[],
  nextId: 1,
  /** Make every call of this operation fail with this message. */
  failOn: null as { op: Op; message: string } | null,
  session: null as { user: { id: string; email: string } } | null,
}

export const SESSION = { user: { id: 'user-1', email: 'sam@example.com' } }

export function resetDb(rows: Row[] = [], signedIn = true) {
  db.rows = rows.map((r) => ({ ...r }))
  db.calls = []
  db.nextId = 1
  db.failOn = null
  db.session = signedIn ? SESSION : null
}

export const row = (over: Partial<Row> & Pick<Row, 'id' | 'title'>): Row => ({
  assignee: 'Alex',
  priority: 'Medium',
  due_date: '2026-11-01',
  column_id: 'backlog',
  position: 1,
  ...over,
})

function query() {
  let op: Op = 'select'
  let payload: Record<string, unknown> | undefined
  let id: string | undefined
  let single = false

  const run = () => {
    db.calls.push({ op, payload, id })
    if (db.failOn?.op === op) return { data: null, error: { message: db.failOn.message } }
    switch (op) {
      case 'select':
        return { data: [...db.rows].sort((a, b) => a.position - b.position), error: null }
      case 'insert': {
        const created = { id: `new-${db.nextId++}`, ...payload } as Row
        db.rows.push(created)
        return { data: single ? created : [created], error: null }
      }
      case 'update':
        db.rows = db.rows.map((r) => (r.id === id ? ({ ...r, ...payload } as Row) : r))
        return { data: null, error: null }
      case 'delete':
        db.rows = db.rows.filter((r) => r.id !== id)
        return { data: null, error: null }
    }
  }

  const q = {
    select: () => q,
    order: () => q,
    single: () => ((single = true), q),
    eq: (_col: string, value: string) => ((id = value), q),
    insert: (p: Record<string, unknown>) => ((op = 'insert'), (payload = p), q),
    update: (p: Record<string, unknown>) => ((op = 'update'), (payload = p), q),
    delete: () => ((op = 'delete'), q),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(run()).then(resolve, reject),
  }
  return q
}

const channel = { on: () => channel, subscribe: () => channel }

export const supabase = {
  from: vi.fn(() => query()),
  channel: vi.fn(() => channel),
  removeChannel: vi.fn(),
  auth: {
    getSession: vi.fn(async () => ({ data: { session: db.session } })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
    signInWithPassword: vi.fn(async () => ({ error: null })),
    signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
  },
}
