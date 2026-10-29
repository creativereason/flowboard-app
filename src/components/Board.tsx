import { useLayoutEffect, useRef } from 'react'
import Column from './Column'
import { COLUMNS } from '../types'
import type { CardData, Status } from '../types'

interface Props {
  cards: CardData[]
  removingIds: Set<string>
  onMove: (id: string, status: Status) => void
  onAdd: (status: Status) => void
  onEdit: (card: CardData) => void
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Board({ cards, removingIds, onMove, onAdd, onEdit }: Props) {
  const boardRef = useRef<HTMLElement>(null)
  const prevRects = useRef<Map<string, DOMRect> | null>(null)

  // FLIP: after every render, animate each card from where it was to where it
  // is now. This covers moves between columns and siblings closing the gap.
  useLayoutEffect(() => {
    const nodes = boardRef.current?.querySelectorAll<HTMLElement>('[data-card-id]') ?? []
    const rects = new Map<string, DOMRect>()
    nodes.forEach((el) => rects.set(el.dataset.cardId!, el.getBoundingClientRect()))
    const prev = prevRects.current
    prevRects.current = rects
    if (!prev || reducedMotion()) return

    nodes.forEach((el) => {
      const id = el.dataset.cardId!
      const before = prev.get(id)
      const after = rects.get(id)!
      if (!before) {
        el.animate(
          [{ opacity: 0, transform: 'scale(.95) translateY(-6px)' }, { opacity: 1, transform: 'none' }],
          { duration: 200, easing: 'ease-out' },
        )
        return
      }
      const dx = before.left - after.left
      const dy = before.top - after.top
      if (!dx && !dy) return
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: 250, easing: 'cubic-bezier(.2, .8, .2, 1)' },
      )
    })
  })

  return (
    <main className="board" id="board" tabIndex={-1} ref={boardRef}>
      {COLUMNS.map((col) => (
        <Column
          key={col.id}
          id={col.id}
          label={col.label}
          cards={cards.filter((c) => c.status === col.id)}
          removingIds={removingIds}
          onDropCard={onMove}
          onAdd={onAdd}
          onEdit={onEdit}
        />
      ))}
    </main>
  )
}
