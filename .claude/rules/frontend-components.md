---
paths:
  - "components/**/*"
  - "app/**/*.tsx"
---

# Frontend Component Patterns

## Component Directory Structure

```
components/
├── ui/                    # shadcn/ui primitives (DO NOT MODIFY)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── raffle/                # Raffle-specific components
│   ├── raffle-wheel.tsx
│   ├── raffle-wheel.test.tsx
│   ├── ticket-circle.tsx
│   ├── ticket-circle.test.tsx
│   ├── winner-card.tsx
│   ├── winner-card.test.tsx
│   ├── status-bar.tsx
│   └── confetti-overlay.tsx
├── admin/                 # Admin-specific components
│   ├── qr-code-display.tsx
│   ├── participant-counter.tsx
│   ├── draw-controls.tsx
│   └── raffle-form.tsx
└── shared/                # Cross-cutting components
    ├── providers.tsx
    ├── error-boundary.tsx
    └── navigation.tsx
```

## Adding shadcn/ui Components

```bash
# Add individual components as needed
bunx shadcn-ui@latest add button
bunx shadcn-ui@latest add card
bunx shadcn-ui@latest add dialog
bunx shadcn-ui@latest add input
bunx shadcn-ui@latest add badge
bunx shadcn-ui@latest add skeleton
bunx shadcn-ui@latest add toast
bunx shadcn-ui@latest add avatar
```

## Component Template

Always define props interface and support className passthrough:

```typescript
// components/raffle/ticket-circle.tsx
import { cn } from '@/lib/utils/cn'

interface TicketCircleProps {
  count: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TicketCircle({
  count,
  size = 'md',
  className,
}: TicketCircleProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 text-6xl',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-blue-500 to-blue-600',
        'text-white font-bold shadow-lg',
        sizeClasses[size],
        className
      )}
      data-testid="ticket-circle"
    >
      {count}
    </div>
  )
}
```

## Client Components with State

```typescript
// components/raffle/raffle-wheel.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface RaffleWheelProps {
  participants: { id: string; name: string }[]
  seed?: number
  onComplete?: (winnerId: string) => void
  className?: string
}

export function RaffleWheel({
  participants,
  seed,
  onComplete,
  className,
}: RaffleWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false)

  useEffect(() => {
    if (seed !== undefined) {
      setIsSpinning(true)
    }
  }, [seed])

  const handleAnimationComplete = () => {
    setIsSpinning(false)
    if (seed !== undefined && onComplete) {
      const winnerIndex = Math.floor(seed * participants.length)
      onComplete(participants[winnerIndex].id)
    }
  }

  return (
    <motion.div
      className={cn('relative', className)}
      animate={isSpinning ? { rotate: 360 * 5 + (seed ?? 0) * 360 } : {}}
      transition={{
        duration: 5,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onAnimationComplete={handleAnimationComplete}
    >
      {/* Wheel segments */}
    </motion.div>
  )
}
```

## Animation Patterns with Framer Motion

```typescript
// Entrance animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Exit animation with AnimatePresence
import { AnimatePresence } from 'framer-motion'

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>

// Respect reduced motion preference
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

<motion.div
  animate={{ rotate: prefersReducedMotion ? 0 : 360 }}
>
```

## Celebration Effects with canvas-confetti

```typescript
// components/raffle/confetti-overlay.tsx
'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiOverlayProps {
  trigger: boolean
}

export function ConfettiOverlay({ trigger }: ConfettiOverlayProps) {
  useEffect(() => {
    if (trigger) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F7DC6F', '#FF6B6B', '#0468D7', '#87CEEB'],
      })
    }
  }, [trigger])

  return null // No DOM element, just effect
}
```

## Tailwind CSS Conventions

Use the `cn()` utility for conditional classes:

```typescript
// lib/utils/cn.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<div
  className={cn(
    'base-classes here',
    isActive && 'active-classes',
    variant === 'primary' && 'primary-classes',
    className // Always last for overrides
  )}
/>
```

## Responsive Design

Mobile-first with Tailwind breakpoints:

```typescript
<div className="
  text-base         // Mobile default
  md:text-lg        // Tablet (768px+)
  lg:text-xl        // Desktop (1024px+)
  xl:text-2xl       // Large desktop (1280px+)
">

// Projection mode (for live raffle display)
<div className="
  text-4xl          // Default large
  projection:text-8xl  // Even larger for projector
">
```

## Accessibility Requirements

```typescript
// WCAG 2.1 Level AA compliance

// Touch targets: minimum 48x48px
<button className="min-w-12 min-h-12 p-3">

// Focus visible
<button className="focus-visible:ring-2 focus-visible:ring-offset-2">

// Screen reader text
<span className="sr-only">Close dialog</span>

// ARIA labels
<button aria-label="Draw winner">
  <Icon />
</button>

// Reduced motion support
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : 0.3,
  }}
>
```

## Testing Components

```typescript
// components/raffle/ticket-circle.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TicketCircle } from './ticket-circle'

describe('TicketCircle', () => {
  it('displays the ticket count', () => {
    render(<TicketCircle count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('applies size variant classes', () => {
    render(<TicketCircle count={3} size="lg" />)
    expect(screen.getByTestId('ticket-circle')).toHaveClass('w-32', 'h-32')
  })

  it('supports custom className', () => {
    render(<TicketCircle count={1} className="custom-class" />)
    expect(screen.getByTestId('ticket-circle')).toHaveClass('custom-class')
  })
})
```

## Anti-Patterns

```typescript
// WRONG: Modifying shadcn/ui components directly
// components/ui/button.tsx - DON'T EDIT THIS

// WRONG: Inline styles when Tailwind exists
<div style={{ display: 'flex', marginTop: '16px' }}>

// WRONG: Missing props interface
export function TicketCircle({ count }) { ... }

// WRONG: No className passthrough
export function TicketCircle({ count }: { count: number }) {
  return <div className="fixed-classes">{count}</div>
  // Can't be styled from parent
}

// WRONG: Hardcoded colors instead of theme
<div className="bg-[#1a1a1a]">  // Use bg-background instead

// WRONG: Missing data-testid for testing
<div className="ticket">{count}</div>  // Can't find in tests

// CORRECT
<div data-testid="ticket-circle" className="ticket">{count}</div>
```
