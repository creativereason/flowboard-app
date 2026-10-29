import { useState } from 'react'
import { COLUMNS } from '../types'
import type { CardData, Status } from '../types'

interface Props {
  card: CardData
  removing?: boolean
  onEdit: (card: CardData) => void
  onMove: (id: string, status: Status) => void
}

function formatDate(iso: string) {
  if (!iso) return 'No due date'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Card({ card, removing, onEdit, onMove }: Props) {
  const [dragging, setDragging] = useState(false)

  return (
    <article
      className={`card${dragging ? ' dragging' : ''}${removing ? ' removing' : ''}`}
      data-card-id={card.id}
      draggable={!removing}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', card.id)
        e.dataTransfer.effectAllowed = 'move'
        // Defer so the browser snapshots the drag image before we dim the card.
        setTimeout(() => setDragging(true), 0)
      }}
      onDragEnd={() => setDragging(false)}
    >
      <div className="card-top">
        <span className={`badge ${card.priority.toLowerCase()}`}>{card.priority}</span>
      </div>
      <h3>
        <button type="button" className="card-title" onClick={() => onEdit(card)}>
          {card.title}
        </button>
      </h3>
      <div className="meta">
        <span><span aria-hidden="true">👤</span> {card.assignee || 'Unassigned'}</span>
        <span><span aria-hidden="true">📅</span> {formatDate(card.dueDate)}</span>
      </div>
      <select
        className="card-move"
        aria-label={`Move "${card.title}" to column`}
        value={card.status}
        onChange={(e) => onMove(card.id, e.target.value as Status)}
      >
        {COLUMNS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.id === card.status ? `In ${c.label}` : `Move to ${c.label}`}
          </option>
        ))}
      </select>
    </article>
  )
}
