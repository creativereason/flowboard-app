import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { dataError } from './errors'
import type { CardData, Priority, Status } from './types'

interface Row {
  id: string
  title: string
  assignee: string
  priority: Priority
  due_date: string
  column_id: Status
  position: number
}

type PositionedCard = CardData & { position: number }

const toCard = (r: Row): PositionedCard => ({
  id: r.id,
  title: r.title,
  assignee: r.assignee,
  priority: r.priority,
  dueDate: r.due_date,
  status: r.column_id,
  position: r.position,
})

const byPosition = (cs: PositionedCard[]) => [...cs].sort((a, b) => a.position - b.position)

export type CardInput = Omit<CardData, 'id' | 'status'>

export function useCards(userId: string) {
  const [cards, setCards] = useState<PositionedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('id,title,assignee,priority,due_date,column_id,position')
        .order('position')
      if (error) setError(dataError(error, 'Could not load your cards.'))
      else {
        setError(null)
        setCards(byPosition((data as Row[]).map(toCard)))
      }
    } catch (e) {
      setError(dataError(e, 'Could not load your cards.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    const channel = supabase
      .channel(`cards:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id?: string }).id
            setCards((cs) => cs.filter((c) => c.id !== id))
          } else {
            const card = toCard(payload.new as Row)
            setCards((cs) =>
              byPosition(
                cs.some((c) => c.id === card.id)
                  ? cs.map((c) => (c.id === card.id ? card : c))
                  : [...cs, card],
              ),
            )
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, refetch])

  const fail = async (message: string) => {
    setError(message)
    await refetch()
  }

  /** Resolves to an error message, or null on success. */
  const add = async (input: CardInput, status: Status = 'backlog'): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .insert({
          title: input.title,
          assignee: input.assignee,
          priority: input.priority,
          due_date: input.dueDate,
          column_id: status,
          position: Date.now(),
        })
        .select('id,title,assignee,priority,due_date,column_id,position')
        .single()
      if (error) return dataError(error, 'Could not add the card. Check the fields and try again.')
      const card = toCard(data as Row)
      setCards((cs) => (cs.some((c) => c.id === card.id) ? cs : byPosition([...cs, card])))
      return null
    } catch (e) {
      return dataError(e, 'Could not add the card.')
    }
  }

  const update = async (id: string, input: CardInput) => {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...input } : c)))
    const { error } = await supabase
      .from('cards')
      .update({
        title: input.title,
        assignee: input.assignee,
        priority: input.priority,
        due_date: input.dueDate,
      })
      .eq('id', id)
    if (error) await fail(dataError(error, 'Could not save your changes.'))
  }

  const move = async (id: string, status: Status) => {
    const position = Date.now()
    setCards((cs) => byPosition(cs.map((c) => (c.id === id ? { ...c, status, position } : c))))
    const { error } = await supabase
      .from('cards')
      .update({ column_id: status, position })
      .eq('id', id)
    if (error) await fail(dataError(error, 'Could not move the card.'))
  }

  const remove = async (id: string) => {
    setCards((cs) => cs.filter((c) => c.id !== id))
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) await fail(dataError(error, 'Could not delete the card.'))
  }

  return { cards, loading, error, refetch, add, update, move, remove }
}
