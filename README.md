# Servus Raffle

A raffle system for Flutter Munich meetups, featuring live draws with synchronized wheel animations.

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Database/Auth/Realtime:** Supabase
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **Language:** TypeScript (strict mode)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### Setup

1. Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd servus-raffle
npm install
```

2. Copy the environment example and configure:

```bash
cp .env.example .env.local
```

3. Update `.env.local` with your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) to view the app.

## Project Structure

```
servus-raffle/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # OAuth login/callback
│   ├── (participant)/     # Mobile user experience
│   └── (admin)/           # Organizer dashboard
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── raffle/            # TicketCircle, RaffleWheel, WinnerCard
│   ├── admin/             # QRCodeDisplay, DrawControls
│   └── shared/            # Providers, ErrorBoundary
├── lib/
│   ├── supabase/          # Client utilities
│   ├── actions/           # Server Actions
│   ├── schemas/           # Zod validation
│   └── constants/         # RAFFLE_EVENTS, etc.
├── types/                 # TypeScript definitions
└── supabase/              # Database migrations
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
