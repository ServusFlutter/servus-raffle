---
paths:
  - "lib/supabase/realtime.ts"
  - "lib/constants/events.ts"
  - "components/raffle/**/*"
  - "lib/actions/draw.ts"
---

# Supabase Realtime Patterns

## Event Constants

All event types use SCREAMING_SNAKE_CASE:

```typescript
// lib/constants/events.ts
export const RAFFLE_EVENTS = {
  DRAW_START: 'DRAW_START',
  WHEEL_SEED: 'WHEEL_SEED',
  WINNER_REVEALED: 'WINNER_REVEALED',
  RAFFLE_ENDED: 'RAFFLE_ENDED',
} as const

export type RaffleEventType = keyof typeof RAFFLE_EVENTS

// Event payload types
export interface DrawStartPayload {
  raffleId: string
  prizeId: string
  timestamp: string
}

export interface WheelSeedPayload {
  raffleId: string
  seed: number
  participantCount: number
  timestamp: string
}

export interface WinnerRevealedPayload {
  raffleId: string
  prizeId: string
  winner: {
    userId: string
    name: string
    ticketsAtWin: number
  }
  timestamp: string
}
```

## Channel Naming Convention

```typescript
// Pattern: raffle:{raffleId}:draw
const getDrawChannel = (raffleId: string) => `raffle:${raffleId}:draw`

// Usage
const channel = supabase.channel(getDrawChannel(raffleId))
```

## Broadcast Pattern (Ephemeral Events)

Use Broadcast for low-latency events that don't need persistence:

- Wheel animation sync
- Draw countdown
- Temporary UI state

```typescript
// lib/supabase/realtime.ts
import { createBrowserSupabaseClient } from './client'
import { RAFFLE_EVENTS, type WheelSeedPayload } from '@/lib/constants/events'

export function createDrawChannel(raffleId: string) {
  const supabase = createBrowserSupabaseClient()
  return supabase.channel(`raffle:${raffleId}:draw`)
}

// Sending broadcast (from Server Action via service role)
export async function broadcastDrawStart(
  raffleId: string,
  prizeId: string,
  seed: number
) {
  const supabase = createServiceRoleClient()
  const channel = supabase.channel(`raffle:${raffleId}:draw`)

  await channel.send({
    type: 'broadcast',
    event: RAFFLE_EVENTS.DRAW_START,
    payload: {
      raffleId,
      prizeId,
      timestamp: new Date().toISOString(),
    },
  })

  // Brief delay then send seed for animation sync
  await new Promise((resolve) => setTimeout(resolve, 100))

  await channel.send({
    type: 'broadcast',
    event: RAFFLE_EVENTS.WHEEL_SEED,
    payload: {
      raffleId,
      seed,
      timestamp: new Date().toISOString(),
    },
  })
}
```

## Postgres Changes Pattern (Persistent State)

Use Postgres Changes for data that persists:

- Participant count updates
- Raffle status changes
- Winner records

```typescript
// Subscribe to table changes
channel.on(
  'postgres_changes',
  {
    event: 'UPDATE',
    schema: 'public',
    table: 'raffles',
    filter: `id=eq.${raffleId}`,
  },
  (payload) => {
    setRaffleStatus(payload.new.status)
  }
)

// Subscribe to inserts (new participants)
channel.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'participants',
    filter: `raffle_id=eq.${raffleId}`,
  },
  (payload) => {
    setParticipantCount((prev) => prev + 1)
  }
)
```

## Subscription Hook Pattern

```typescript
// lib/hooks/use-raffle-realtime.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { RAFFLE_EVENTS } from '@/lib/constants/events'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRaffleRealtimeOptions {
  raffleId: string
  onDrawStart?: () => void
  onWheelSeed?: (seed: number) => void
  onWinnerRevealed?: (winner: { userId: string; name: string }) => void
}

export function useRaffleRealtime({
  raffleId,
  onDrawStart,
  onWheelSeed,
  onWinnerRevealed,
}: UseRaffleRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    const channel = supabase.channel(`raffle:${raffleId}:draw`)

    // Broadcast subscriptions
    channel
      .on('broadcast', { event: RAFFLE_EVENTS.DRAW_START }, () => {
        onDrawStart?.()
      })
      .on('broadcast', { event: RAFFLE_EVENTS.WHEEL_SEED }, ({ payload }) => {
        onWheelSeed?.(payload.seed)
      })
      .on('broadcast', { event: RAFFLE_EVENTS.WINNER_REVEALED }, ({ payload }) => {
        onWinnerRevealed?.(payload.winner)
      })

    // Postgres Changes subscriptions
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `raffle_id=eq.${raffleId}`,
      },
      async () => {
        // Refetch count on any participant change
        const { count } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('raffle_id', raffleId)

        setParticipantCount(count ?? 0)
      }
    )

    // Subscribe and track connection status
    channel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED')
    })

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [raffleId, onDrawStart, onWheelSeed, onWinnerRevealed])

  return { isConnected, participantCount }
}
```

## Using the Hook in Components

```typescript
// components/raffle/raffle-wheel.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRaffleRealtime } from '@/lib/hooks/use-raffle-realtime'
import { ConfettiOverlay } from './confetti-overlay'
import { WinnerCard } from './winner-card'

export function RaffleWheel({ raffleId }: { raffleId: string }) {
  const [seed, setSeed] = useState<number | null>(null)
  const [winner, setWinner] = useState<{ name: string } | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)

  const { isConnected } = useRaffleRealtime({
    raffleId,
    onDrawStart: () => {
      setIsSpinning(true)
      setWinner(null)
    },
    onWheelSeed: (receivedSeed) => {
      setSeed(receivedSeed)
    },
    onWinnerRevealed: (revealedWinner) => {
      setIsSpinning(false)
      setWinner(revealedWinner)
    },
  })

  return (
    <div className="relative">
      {!isConnected && (
        <div className="text-yellow-500">Connecting...</div>
      )}

      <motion.div
        animate={seed !== null ? { rotate: 360 * 5 + seed * 360 } : {}}
        transition={{ duration: 5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Wheel visualization */}
      </motion.div>

      {winner && <WinnerCard winner={winner} />}
      <ConfettiOverlay trigger={winner !== null} />
    </div>
  )
}
```

## Server Action with Broadcast

```typescript
// lib/actions/draw.ts
'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { RAFFLE_EVENTS } from '@/lib/constants/events'
import type { ActionResult } from '@/types/actions'

export async function drawWinner(
  raffleId: string,
  prizeId: string
): Promise<ActionResult<{ userId: string; name: string }>> {
  const supabase = createServiceRoleClient()

  // 1. Get eligible participants
  const { data: participants, error } = await supabase
    .from('participants')
    .select('user_id, ticket_count, users(name)')
    .eq('raffle_id', raffleId)
    .gt('ticket_count', 0)

  if (error || !participants?.length) {
    return { data: null, error: 'No eligible participants' }
  }

  // 2. Calculate weighted random selection
  const seed = Math.random()
  const totalTickets = participants.reduce((sum, p) => sum + p.ticket_count, 0)
  let cumulative = 0
  let winner = participants[0]

  for (const p of participants) {
    cumulative += p.ticket_count / totalTickets
    if (seed <= cumulative) {
      winner = p
      break
    }
  }

  // 3. Broadcast draw start
  const channel = supabase.channel(`raffle:${raffleId}:draw`)
  await channel.send({
    type: 'broadcast',
    event: RAFFLE_EVENTS.DRAW_START,
    payload: { raffleId, prizeId, timestamp: new Date().toISOString() },
  })

  // 4. Brief delay then broadcast seed (all clients animate identically)
  await new Promise((r) => setTimeout(r, 100))
  await channel.send({
    type: 'broadcast',
    event: RAFFLE_EVENTS.WHEEL_SEED,
    payload: { raffleId, seed, timestamp: new Date().toISOString() },
  })

  // 5. Wait for animation duration
  await new Promise((r) => setTimeout(r, 5000))

  // 6. Record winner and reset tickets (atomic transaction)
  await supabase.from('winners').insert({
    raffle_id: raffleId,
    prize_id: prizeId,
    user_id: winner.user_id,
    tickets_at_win: winner.ticket_count,
  })

  await supabase
    .from('participants')
    .update({ ticket_count: 0 })
    .eq('raffle_id', raffleId)
    .eq('user_id', winner.user_id)

  // 7. Broadcast winner revealed
  await channel.send({
    type: 'broadcast',
    event: RAFFLE_EVENTS.WINNER_REVEALED,
    payload: {
      raffleId,
      prizeId,
      winner: {
        userId: winner.user_id,
        name: winner.users?.name ?? 'Unknown',
        ticketsAtWin: winner.ticket_count,
      },
      timestamp: new Date().toISOString(),
    },
  })

  return {
    data: { userId: winner.user_id, name: winner.users?.name ?? 'Unknown' },
    error: null,
  }
}
```

## Anti-Patterns

```typescript
// WRONG: Inconsistent event naming
channel.send({ event: 'draw-start' })  // Should be DRAW_START
channel.send({ event: 'DrawStart' })   // Should be DRAW_START

// WRONG: Missing cleanup
useEffect(() => {
  const channel = supabase.channel('...')
  channel.subscribe()
  // Missing: return () => supabase.removeChannel(channel)
}, [])

// WRONG: Large payloads over broadcast
channel.send({
  event: RAFFLE_EVENTS.WINNER_REVEALED,
  payload: {
    allParticipants: [...], // DON'T: Large arrays
    fullRaffleData: {...},  // DON'T: Full objects
  }
})

// CORRECT: Minimal payloads, fetch details separately
channel.send({
  event: RAFFLE_EVENTS.WINNER_REVEALED,
  payload: { winnerId: 'uuid', timestamp: '...' }
})

// WRONG: Using Postgres Changes for time-critical sync
// Postgres Changes has higher latency than Broadcast

// CORRECT: Use Broadcast for wheel animation, Postgres Changes for counts
```
