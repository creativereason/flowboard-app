import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Board from './components/Board'
import CardModal from './components/CardModal'
import AuthForm from './components/AuthForm'
import { supabase, missingConfig } from './supabase'
import { useCards } from './useCards'
import { ThemeToggle } from './theme'
import logoSm from './assets/logo-sm.svg'
import { COLUMNS } from './types'
import type { CardData, Status } from './types'

type ModalState = { card: CardData | null; status?: Status } | null

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (missingConfig) return
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setReady(true))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    document.title = session ? 'My board – FlowBoard' : 'FlowBoard – Simple Kanban Task Board'
  }, [session])

  if (missingConfig) {
    return (
      <main>
        <p className="error-banner" role="alert">
          Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in
          .env.local and restart the dev server.
        </p>
      </main>
    )
  }
  if (!ready) return <main><p className="loading" role="status">Loading…</p></main>
  if (!session) return <AuthForm />
  return <BoardApp userId={session.user.id} email={session.user.email ?? ''} />
}

function BoardApp({ userId, email }: { userId: string; email: string }) {
  const { cards, loading, error, refetch, add, update, move, remove } = useCards(userId)
  const [modal, setModal] = useState<ModalState>(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [announcement, setAnnouncement] = useState('')
  const opener = useRef<HTMLElement | null>(null)

  const announce = (message: string) => {
    // Clear first so repeating the same message is still announced.
    setAnnouncement('')
    setTimeout(() => setAnnouncement(message), 50)
  }

  const openModal = (state: ModalState) => {
    opener.current = document.activeElement as HTMLElement | null
    setModalError(null)
    setModal(state)
  }

  const closeModal = () => {
    setModal(null)
    // Return focus to whatever opened the dialog (or the board if it is gone).
    setTimeout(() => {
      const el = opener.current
      if (el?.isConnected) el.focus()
      else document.getElementById('board')?.focus()
    }, 0)
  }

  const moveCard = (id: string, status: Status) => {
    const card = cards.find((c) => c.id === id)
    if (!card || card.status === status) return
    move(id, status)
    const label = COLUMNS.find((c) => c.id === status)?.label ?? status
    announce(`Moved "${card.title}" to ${label}`)
    // The card remounts in its new column; keep keyboard focus on it.
    setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-card-id="${id}"] select`)?.focus()
    }, 0)
  }

  const save = async (data: Omit<CardData, 'id' | 'status'>, id?: string) => {
    if (id) {
      update(id, data)
      announce(`Saved "${data.title}"`)
      closeModal()
      return
    }
    setSaving(true)
    setModalError(null)
    const message = await add(data, modal?.status)
    setSaving(false)
    if (message) setModalError(message)
    else {
      announce(`Added "${data.title}"`)
      closeModal()
    }
  }

  const confirmRemove = (id: string) => {
    const card = cards.find((c) => c.id === id)
    if (!window.confirm(`Delete "${card?.title ?? 'this card'}"? This can't be undone.`)) return false
    announce(`Deleted "${card?.title ?? 'card'}"`)
    // Let the exit animation play before the card is actually removed.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      remove(id)
      return true
    }
    setRemovingIds((s) => new Set(s).add(id))
    setTimeout(() => {
      remove(id)
      setRemovingIds((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
    }, 220)
    return true
  }

  return (
    <>
    <a className="skip-link" href="#board" onClick={(e) => { e.preventDefault(); document.getElementById('board')?.focus() }}>
      Skip to board
    </a>
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    <div className="app">
      <div className="app-inert" inert={!!modal}>
      <header className="app-header">
        <div className="brand">
          <span className="logo">
            <img src={logoSm} alt="" width={20} height={20} />
          </span>
          FlowBoard
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <span className="avatar">
            <span aria-hidden="true">{(email[0] ?? 'U').toUpperCase()}</span>
            <span className="sr-only">Signed in as {email}</span>
          </span>
          <button className="link-btn" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <div className="subbar">
        <span className="crumb">Boards</span>
        <span className="sep">/</span>
        <h1>My board</h1>
        <span className="count-label">{COLUMNS.length} columns</span>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button className="link-btn" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <main id="board" tabIndex={-1}><p className="loading" role="status">Loading…</p></main>
      ) : (
        <Board
          cards={cards}
          removingIds={removingIds}
          onMove={moveCard}
          onAdd={(status) => openModal({ card: null, status })}
          onEdit={(card) => openModal({ card })}
        />
      )}
      </div>
      {modal && (
        <CardModal
          card={modal.card}
          busy={saving}
          error={modalError}
          onSave={save}
          onDelete={(id) => {
            if (confirmRemove(id)) closeModal()
          }}
          onClose={closeModal}
        />
      )}
    </div>
    </>
  )
}
