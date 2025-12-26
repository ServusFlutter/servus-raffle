# Servus Raffle - Project Overview

## What This Project Is

Servus Raffle is a web application for the Flutter Munich meetup community that implements a **loyalty-based raffle system**:

- **Ticket Accumulation**: Users earn 1 ticket each time they scan a QR code at an event
- **Fairness Mechanism**: Tickets accumulate across events if you don't win, but reset to zero when you do
- **Live Experience**: Organizers run animated wheel-of-fortune drawings with real-time sync across all devices

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Meetup.com OAuth 2.0 |
| UI | shadcn/ui + Tailwind CSS |
| Animation | Framer Motion + canvas-confetti |
| Package Manager | **Bun** |
| Testing | **Vitest** |
| Linting/Formatting | **Biome** |

## Core Commands

```bash
# Package management
bun install                    # Install dependencies
bun add <package>              # Add a package

# Development
bun run dev                    # Start development server
bun run build                  # Production build
bun run start                  # Start production server

# Testing
bun run test                   # Run unit tests
bun run test:watch             # Run tests in watch mode
bun run test:coverage          # Run tests with coverage
bun run test:integration       # Run integration tests

# Code quality
bun run lint                   # Run Biome linter
bun run format                 # Format code with Biome

# Supabase
bunx supabase start            # Start local Supabase
bunx supabase stop             # Stop local Supabase
bunx supabase db reset         # Reset and seed database
bunx supabase gen types typescript --local > types/database.ts
```

## Project Structure

```
servus-raffle/
├── app/
│   ├── (auth)/               # Authentication routes
│   ├── (participant)/        # User-facing raffle routes
│   └── (admin)/              # Admin dashboard routes
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── raffle/               # Raffle components (wheel, tickets, winner)
│   ├── admin/                # Admin components (QR, controls)
│   └── shared/               # Cross-cutting components
├── lib/
│   ├── supabase/             # Supabase clients and utilities
│   ├── actions/              # Server Actions
│   ├── schemas/              # Zod validation schemas
│   └── utils/                # Utility functions
├── types/                    # TypeScript type definitions
├── supabase/
│   ├── migrations/           # Database migrations
│   └── seed.sql              # Development seed data
└── tests/
    └── integration/          # Integration tests
```

## Anti-Patterns

**Package Manager:**
- NEVER use `npm` - use `bun` exclusively
- NEVER use `pnpm` - use `bun` exclusively
- NEVER use `npx` - use `bunx` instead

**Testing:**
- NEVER use Jest - use Vitest
- NEVER write implementation before tests (TDD is mandatory)

**Linting:**
- NEVER use ESLint - use Biome
- NEVER use Prettier - use Biome

**Database:**
- NEVER use camelCase in database identifiers - use snake_case
- NEVER skip RLS policies on tables

**Server Actions:**
- NEVER throw errors from Server Actions - return `{ data, error }`
