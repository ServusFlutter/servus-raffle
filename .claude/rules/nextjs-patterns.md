---
paths:
  - "app/**/*"
  - "lib/actions/**/*"
---

# Next.js App Router Patterns

## Route Organization

Use route groups `()` for logical organization without affecting URLs:

```
app/
├── (auth)/                 # Authentication routes
│   ├── login/page.tsx      # → /login
│   ├── callback/route.ts   # → /callback
│   └── logout/route.ts     # → /logout
├── (participant)/          # User-facing routes
│   ├── layout.tsx          # Shared layout with StatusBar
│   ├── join/[code]/page.tsx    # → /join/abc123
│   └── raffle/[id]/page.tsx    # → /raffle/uuid
└── (admin)/                # Protected admin routes
    ├── layout.tsx          # Admin layout with navigation
    ├── page.tsx            # → / (admin dashboard)
    ├── raffles/page.tsx    # → /raffles
    └── raffles/[id]/live/page.tsx  # → /raffles/uuid/live
```

## Server Components (Default)

Components in the `/app` directory are Server Components by default:

```typescript
// app/(admin)/raffles/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { RaffleList } from '@/components/admin/raffle-list'

export default async function RafflesPage() {
  // This runs on the server - no "use client" needed
  const supabase = await createServerSupabaseClient()

  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .order('created_at', { ascending: false })

  return <RaffleList raffles={raffles ?? []} />
}
```

## Client Components

Add `'use client'` directive for interactivity:

```typescript
// components/admin/draw-button.tsx
'use client'

import { useState } from 'react'
import { drawWinner } from '@/lib/actions/draw'
import { Button } from '@/components/ui/button'

interface DrawButtonProps {
  raffleId: string
  disabled?: boolean
}

export function DrawButton({ raffleId, disabled }: DrawButtonProps) {
  const [isDrawing, setIsDrawing] = useState(false)

  async function handleDraw() {
    setIsDrawing(true)
    const result = await drawWinner(raffleId)
    setIsDrawing(false)

    if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <Button onClick={handleDraw} disabled={disabled || isDrawing}>
      {isDrawing ? 'Drawing...' : 'Draw Winner'}
    </Button>
  )
}
```

## Server Actions

Location: `/lib/actions/*.ts`

All Server Actions follow the `ActionResult` pattern:

```typescript
// lib/actions/raffles.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CreateRaffleSchema } from '@/lib/schemas/raffle'
import type { ActionResult } from '@/types/actions'
import type { Raffle } from '@/types/raffle'

export async function createRaffle(
  formData: FormData
): Promise<ActionResult<Raffle>> {
  // 1. Extract and validate input
  const name = formData.get('name') as string
  const parsed = CreateRaffleSchema.safeParse({ name })

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message }
  }

  // 2. Perform authenticated operation
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('raffles')
    .insert({ name: parsed.data.name })
    .select()
    .single()

  // 3. Return result (never throw)
  if (error) {
    return { data: null, error: error.message }
  }

  // 4. Revalidate if needed
  revalidatePath('/raffles')

  return { data, error: null }
}
```

## Using Server Actions in Forms

```typescript
// app/(admin)/raffles/new/page.tsx
import { createRaffle } from '@/lib/actions/raffles'

export default function NewRafflePage() {
  return (
    <form action={createRaffle}>
      <input name="name" required />
      <button type="submit">Create Raffle</button>
    </form>
  )
}
```

## Loading States

Create `loading.tsx` for route-level loading:

```typescript
// app/(admin)/raffles/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function RafflesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}
```

## Error Boundaries

Create `error.tsx` for route-level error handling:

```typescript
// app/(admin)/raffles/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RafflesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

## Route Handlers (API Routes)

For webhooks or non-action APIs:

```typescript
// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Process webhook...

  return NextResponse.json({ success: true })
}
```

## Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/raffle/:path*'],
}
```

## Anti-Patterns

```typescript
// WRONG: Using Pages Router APIs
export async function getServerSideProps() { ... }
export async function getStaticProps() { ... }

// WRONG: Throwing from Server Actions
export async function createRaffle() {
  throw new Error('Failed') // DON'T DO THIS
}

// WRONG: Importing server code in client components
'use client'
import { createServerSupabaseClient } from '@/lib/supabase/server' // ERROR

// WRONG: Using 'use client' unnecessarily in Server Components
'use client' // Not needed if no hooks/interactivity
export default function StaticPage() {
  return <div>Static content</div>
}

// WRONG: Calling Server Actions on render
'use client'
export function Component() {
  createRaffle() // WRONG: Called on every render
  return <div />
}

// CORRECT: Call in event handlers or useEffect
'use client'
export function Component() {
  const handleClick = () => createRaffle()
  return <button onClick={handleClick}>Create</button>
}
```
