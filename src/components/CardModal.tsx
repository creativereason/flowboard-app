import { useRef, useState } from 'react'
import { PRIORITIES } from '../types'
import type { CardData, Priority } from '../types'

interface Props {
  card: CardData | null
  busy?: boolean
  error?: string | null
  onSave: (data: Omit<CardData, 'id' | 'status'>, id?: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function CardModal({ card, busy, error, onSave, onDelete, onClose }: Props) {
  const [titleError, setTitleError] = useState<string | null>(null)
  const [title, setTitle] = useState(card?.title ?? '')
  const [assignee, setAssignee] = useState(card?.assignee ?? '')
  const [priority, setPriority] = useState<Priority>(card?.priority ?? 'Medium')
  const [dueDate, setDueDate] = useState(card?.dueDate ?? '')

  const dialogRef = useRef<HTMLFormElement>(null)

  // Escape closes; Tab/Shift+Tab wrap inside the dialog.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="modal"
        ref={dialogRef}
        onKeyDown={onKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={card ? 'Edit card' : 'Add card'}
        onSubmit={(e) => {
          e.preventDefault()
          if (busy) return
          if (!title.trim()) {
            setTitleError('Title is required.')
            return
          }
          onSave({ title: title.trim(), assignee: assignee.trim(), priority, dueDate }, card?.id)
        }}
      >
        <div className="modal-head">
          <h2>{card ? 'Edit card' : 'Add card'}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <span className="icon x" aria-hidden="true" />
          </button>
        </div>
        <p className="required-note"><span aria-hidden="true">*</span> All fields are required</p>
        <label className="field">
          <span>Title <span aria-hidden="true">*</span></span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setTitleError(null)
            }}
            placeholder="Enter card name..."
            maxLength={120}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? 'title-error' : undefined}
            required
            autoFocus
          />
        </label>
        {titleError && <p id="title-error" className="form-message" role="alert">{titleError}</p>}
        <label className="field">
          <span>Assignee <span aria-hidden="true">*</span></span>
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Who owns this?" maxLength={60} required />
        </label>
        <div className="field-row">
          <label className="field small">
            <span>Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="field small">
            <span>Due date <span aria-hidden="true">*</span></span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </label>
        </div>
        {error && <p className="form-message" role="alert">{error}</p>}
        <div className="actions">
          {card && (
            <button type="button" className="danger-link" onClick={() => onDelete(card.id)}>
              Delete card
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
