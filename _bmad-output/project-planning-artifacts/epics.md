---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - "_bmad-output/prd.md"
  - "_bmad-output/architecture.md"
  - "_bmad-output/project-planning-artifacts/ux-design-specification.md"
status: complete
completedAt: '2025-12-25'
project_name: servus-raffle
user_name: Ben
---

# servus-raffle - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for servus-raffle, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**User Authentication & Registration (FR1-5)**
- FR1: Users can authenticate using email and password
- FR2: Users can view their profile information (name, avatar)
- FR3: Users can see their current ticket count immediately after logging in
- FR4: Users can log out of the system
- FR5: System can identify returning users and restore their ticket history

**Ticket Management (FR6-11)**
- FR6: Users receive one ticket automatically when scanning a valid QR code
- FR7: Users can view their total accumulated ticket count
- FR8: System accumulates tickets across multiple events for users who don't win
- FR9: System resets a user's ticket count to zero when they win a prize
- FR10: Users can see a confirmation message after receiving a ticket
- FR11: Users can see a positive message explaining ticket reset after winning

**Raffle Administration (FR12-21)**
- FR12: Admins can create a new raffle with a name/title
- FR13: Admins can generate a QR code for a specific raffle
- FR14: Admins can set an expiration time for QR codes
- FR15: Admins can view the list of participants who scanned in for a raffle
- FR16: Admins can view the total number of tickets in play for a raffle
- FR17: Admins can view the number of participants for a raffle
- FR18: Admins can initiate the winner drawing process
- FR19: Admins can proceed to the next prize after a winner is drawn
- FR20: Admins can view raffle history (past raffles and winners)
- FR21: Multiple users can have admin privileges

**Prize Management (FR22-26)**
- FR22: Admins can add multiple prizes to a single raffle
- FR23: Admins can specify prize names and descriptions
- FR24: Admins can set the order of prizes for sequential drawing
- FR25: System enforces one prize per user per raffle (winners excluded from subsequent draws)
- FR26: System tracks which prizes have been awarded and which remain

**Live Raffle Experience (FR27-35)**
- FR27: System displays a wheel-of-fortune animation when drawing a winner
- FR28: Wheel animation shows participant names spinning
- FR29: Wheel animation runs for approximately 5 seconds before stopping
- FR30: System displays winner celebration screen after wheel stops
- FR31: Winner celebration displays the winner's name prominently
- FR32: Winner celebration displays the winner's ticket count (loyalty recognition)
- FR33: Users can view the list of prizes for the current raffle
- FR34: Users can view the current raffle status (active, drawing, completed)
- FR35: Admin interface is projection-friendly (large text, clear visuals)

**Real-time Synchronization (FR36-40)**
- FR36: All connected users see the wheel animation simultaneously when admin triggers draw
- FR37: Participant count updates in real-time as users scan QR codes
- FR38: Winner announcement displays on all connected devices simultaneously
- FR39: Users can watch the live raffle on their own mobile devices
- FR40: System maintains synchronization with <500ms latency between admin action and user display

### NonFunctional Requirements

**Performance**
- NFR1: QR scan to ticket confirmation < 5 seconds
- NFR2: Page initial load (LCP) < 2 seconds
- NFR3: Time to interactive < 3 seconds
- NFR4: Real-time sync latency < 500ms
- NFR5: Wheel animation framerate 60fps
- NFR6: Concurrent user support for 100 users

**Reliability**
- NFR7: Uptime during raffle window 99.9%
- NFR8: Data persistence - zero ticket loss
- NFR9: Graceful degradation with offline fallback
- NFR10: Recovery time < 30 seconds

**Integration**
- NFR11: Supabase email/password authentication
- NFR12: Supabase for database and real-time features
- NFR13: Client-side QR code generation

### Additional Requirements

**From Architecture - Starter Template:**
- Use official Vercel/Supabase template: `npx create-next-app --example with-supabase servus-raffle`
- Add packages: framer-motion (^11.x), canvas-confetti (^1.9.x), qrcode.react (^4.x)
- TypeScript strict mode enabled
- Supabase Auth with cookie-based session management

**From Architecture - Database & Naming:**
- Database naming: snake_case (tables, columns, foreign keys)
- TypeScript/React: camelCase for functions/variables, PascalCase for components
- Constants: SCREAMING_SNAKE_CASE for event constants
- Server Action response format: `{ data: T | null, error: string | null }`

**From Architecture - Security:**
- Row-level security (RLS) policies for data access
- Environment-based admin allowlist (ADMIN_EMAILS env var)
- Service role key for sensitive mutations via Server Actions

**From Architecture - Real-time:**
- Supabase Broadcast for ephemeral events (wheel sync)
- Postgres Changes for persistent state sync
- Channel pattern: `raffle:{id}:draw`

**From UX Design - Design System:**
- shadcn/ui + Tailwind CSS for UI components
- Framer Motion for wheel animation
- canvas-confetti for winner celebration

**From UX Design - Accessibility:**
- WCAG 2.1 Level AA compliance target
- 48px minimum touch targets
- Respect `prefers-reduced-motion` for animations
- Screen reader support with ARIA live regions

**From UX Design - Responsive:**
- Mobile-first design (participants)
- Projection mode for live draw (2x typography, pure black background)
- Light/dark mode via `prefers-color-scheme`

**From UX Design - Custom Components Required:**
- TicketCircle: Hero ticket count display with glow effects
- RaffleWheel: 5-second synchronized animation
- WinnerCard: Gold celebration card with confetti
- StatusBar: Persistent "Locked in" indicator
- ConfettiOverlay: canvas-confetti integration
- QRCodeDisplay: QR generation with projection styling
- ParticipantCounter: Real-time animated count

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Email/password authentication |
| FR2 | Epic 1 | View profile information |
| FR3 | Epic 3 | See ticket count after logging in |
| FR4 | Epic 1 | Log out of the system |
| FR5 | Epic 1 | Identify returning users, restore ticket history |
| FR6 | Epic 3 | Receive ticket when scanning valid QR |
| FR7 | Epic 3 | View total accumulated ticket count |
| FR8 | Epic 3 | Tickets accumulate across events for non-winners |
| FR9 | Epic 6 | Reset ticket count to zero when user wins |
| FR10 | Epic 3 | Confirmation message after receiving ticket |
| FR11 | Epic 6 | Positive message explaining ticket reset after win |
| FR12 | Epic 2 | Create new raffle with name/title |
| FR13 | Epic 2 | Generate QR code for raffle |
| FR14 | Epic 2 | Set expiration time for QR codes |
| FR15 | Epic 5 | View list of participants who scanned in |
| FR16 | Epic 5 | View total tickets in play |
| FR17 | Epic 5 | View number of participants |
| FR18 | Epic 6 | Initiate winner drawing process |
| FR19 | Epic 6 | Proceed to next prize after winner drawn |
| FR20 | Epic 5 | View raffle history (past raffles and winners) |
| FR21 | Epic 2 | Multiple users can have admin privileges |
| FR22 | Epic 4 | Add multiple prizes to a raffle |
| FR23 | Epic 4 | Specify prize names and descriptions |
| FR24 | Epic 4 | Set order of prizes for drawing |
| FR25 | Epic 6 | One prize per user per raffle (winner exclusion) |
| FR26 | Epic 4 | Track awarded vs remaining prizes |
| FR27 | Epic 6 | Wheel-of-fortune animation |
| FR28 | Epic 6 | Wheel shows participant names spinning |
| FR29 | Epic 6 | 5-second wheel animation |
| FR30 | Epic 6 | Winner celebration screen |
| FR31 | Epic 6 | Winner name displayed prominently |
| FR32 | Epic 6 | Winner ticket count displayed (loyalty recognition) |
| FR33 | Epic 5 | Users can view prize list for current raffle |
| FR34 | Epic 5 | Users can view raffle status |
| FR35 | Epic 6 | Projection-friendly admin interface |
| FR36 | Epic 6 | Synchronized wheel animation across all devices |
| FR37 | Epic 6 | Real-time participant count updates |
| FR38 | Epic 6 | Synchronized winner announcement |
| FR39 | Epic 6 | Users watch live on mobile devices |
| FR40 | Epic 6 | <500ms latency synchronization |

## Epic List

### Epic 1: Project Foundation & User Authentication

**Goal:** Users can sign in with email/password and see their profile. This epic initializes the project using the official starter template and implements the authentication system that all other features depend on.

**FRs covered:** FR1, FR2, FR4, FR5

---

### Epic 2: Raffle Creation & QR Codes

**Goal:** Organizers can create a raffle and generate QR codes for attendees to scan.

**FRs covered:** FR12, FR13, FR14, FR21

---

### Epic 3: Participant Joining & Ticket System

**Goal:** Attendees can scan the QR code, join the raffle, and see their accumulated tickets.

**FRs covered:** FR3, FR6, FR7, FR8, FR10

---

### Epic 4: Prize Management

**Goal:** Organizers can add prizes to their raffle and organize them for sequential drawing.

**FRs covered:** FR22, FR23, FR24, FR26

---

### Epic 5: Admin Dashboard & Participant Visibility

**Goal:** Organizers have complete visibility into who joined and the raffle status.

**FRs covered:** FR15, FR16, FR17, FR20, FR33, FR34

---

### Epic 6: Live Draw Experience

**Goal:** The complete synchronized raffle experience - wheel spin, winner celebration, and ticket management - all happening in real-time across all devices. This is the "main event" epic that delivers the core product experience.

**FRs covered:** FR9, FR11, FR18, FR19, FR25, FR27, FR28, FR29, FR30, FR31, FR32, FR35, FR36, FR37, FR38, FR39, FR40

---

## Epic 1: Project Foundation & User Authentication

**Goal:** Users can sign in with email/password and see their profile. This epic initializes the project using the official starter template and implements the authentication system that all other features depend on.

### Story 1.1: Initialize Project with Starter Template

As a **developer**,
I want **the project initialized with the official Vercel/Supabase starter template**,
So that **I have a solid foundation with pre-configured authentication patterns and styling**.

**Acceptance Criteria:**

**Given** a new project directory
**When** the developer runs `npx create-next-app --example with-supabase servus-raffle`
**Then** the project is created with Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui pre-configured
**And** the Supabase client utilities are set up in `/lib/supabase/`

**Given** the initialized project
**When** the developer configures environment variables for Supabase
**Then** `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
**And** `.env.example` is updated with all required variables

**Given** the project dependencies
**When** the developer adds required packages
**Then** `framer-motion`, `canvas-confetti`, `qrcode.react`, and `zod` are installed
**And** `package.json` reflects these dependencies

**Given** the configured project
**When** the developer runs `npm run dev`
**Then** the application starts without errors on `localhost:3000`
**And** the default Supabase auth example page loads successfully

---

### Story 1.2: Implement Email/Password Authentication

As a **meetup attendee**,
I want **to sign in using email and password**,
So that **I can participate in the raffle with a simple account**.

**Acceptance Criteria:**

**Given** the Supabase project
**When** authentication is configured
**Then** Supabase Auth email/password provider is enabled
**And** email confirmation is disabled for MVP simplicity

**Given** the database
**When** the users table is created
**Then** the `users` table exists with columns: `id` (uuid), `email` (text unique), `name` (text), `avatar_url` (text nullable), `created_at` (timestamptz)
**And** RLS policies allow users to read their own record

**Given** an unauthenticated user on the login page
**When** they enter email and password and click "Sign In"
**Then** they are authenticated via Supabase Auth
**And** redirected to the participant dashboard
**And** a session cookie is set for persistent authentication

**Given** a new user
**When** they click "Sign Up"
**Then** they see a registration form with email, password, and name fields
**And** after successful registration, they are logged in automatically
**And** a user record is created in the users table

**Given** a returning user
**When** they sign in with their email/password
**Then** the system identifies them by their email
**And** their existing user record is used (not duplicated)

---

### Story 1.3: Display User Profile Information

As a **logged-in user**,
I want **to see my profile information from Meetup**,
So that **I know I'm signed in with the correct account**.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they view the participant dashboard
**Then** their name is displayed
**And** their avatar image is displayed (or default placeholder)

**Given** a user without an avatar
**When** they view their profile
**Then** a default avatar placeholder is shown
**And** no broken image is displayed

**Given** the profile display component
**When** rendered on mobile devices
**Then** the avatar is appropriately sized (48px)
**And** the name is readable and not truncated

---

### Story 1.4: Implement User Logout

As a **logged-in user**,
I want **to sign out of the application**,
So that **I can end my session or switch accounts**.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they click the logout button/link
**Then** their session is terminated
**And** they are redirected to the login page

**Given** a logged-out user
**When** they try to access protected routes
**Then** they are redirected to the login page
**And** no authenticated content is visible

**Given** a successful logout
**When** the user attempts to navigate back
**Then** they cannot access the previous authenticated session
**And** the session cookie is cleared

---

## Epic 2: Raffle Creation & QR Codes

**Goal:** Organizers can create a raffle and generate QR codes for attendees to scan.

### Story 2.1: Admin Role Authorization

As an **organizer**,
I want **my email to be recognized as an admin**,
So that **I can access admin features to manage raffles**.

**Acceptance Criteria:**

**Given** the environment configuration
**When** `ADMIN_EMAILS` is set with a comma-separated list of email addresses
**Then** users with matching emails are identified as admins

**Given** an authenticated user with an admin email
**When** they access the admin dashboard at `/admin`
**Then** they see the admin interface
**And** admin navigation is available

**Given** an authenticated user without an admin email
**When** they try to access `/admin` routes
**Then** they are redirected to the participant view
**And** they see no admin controls

**Given** the admin utility function
**When** `isAdmin(email)` is called
**Then** it returns `true` if the email is in `ADMIN_EMAILS`
**And** it returns `false` otherwise

---

### Story 2.2: Create New Raffle

As an **organizer**,
I want **to create a new raffle with a name**,
So that **I can set up raffles for my meetup events**.

**Acceptance Criteria:**

**Given** the database
**When** the raffles table is created
**Then** the `raffles` table exists with columns: `id` (uuid), `name` (text), `status` (text default 'draft'), `qr_code_expires_at` (timestamptz), `created_at` (timestamptz), `created_by` (uuid references users)
**And** RLS policies allow admins full access and participants read access to active raffles

**Given** an admin on the admin dashboard
**When** they click "Create New Raffle"
**Then** they see a form to enter the raffle name

**Given** an admin filling out the create raffle form
**When** they enter a name and submit
**Then** a new raffle is created with status 'draft'
**And** they are redirected to the raffle detail page
**And** a success toast confirms the creation

**Given** an admin submitting an empty raffle name
**When** validation occurs
**Then** an error message indicates the name is required
**And** the form is not submitted

**Given** the admin dashboard
**When** raffles exist
**Then** a list of raffles is displayed with name, status, and creation date
**And** each raffle links to its detail page

---

### Story 2.3: Generate QR Code with Expiration

As an **organizer**,
I want **to generate a QR code for my raffle with an expiration time**,
So that **attendees can scan it to join, but only during the event**.

**Acceptance Criteria:**

**Given** an admin viewing a raffle detail page
**When** the raffle is in 'draft' status
**Then** they see an option to set QR code expiration time
**And** they see a "Generate QR Code" button

**Given** an admin setting the expiration time
**When** they select a duration (e.g., 3 hours from now)
**Then** the `qr_code_expires_at` timestamp is calculated and saved
**And** the raffle status changes to 'active'

**Given** an active raffle
**When** the admin views the QR code page
**Then** a QR code is displayed encoding the join URL (`/join/{raffle-id}`)
**And** the QR code is large and high-contrast for projection
**And** the expiration time is displayed below the QR code

**Given** the QR code display
**When** viewed in projection context
**Then** the QR code fills most of the screen
**And** text is readable from the back of a room
**And** there's a download button for the QR image

**Given** a raffle whose QR has expired
**When** the admin views the raffle
**Then** the status shows 'expired' or allows regeneration
**And** participants scanning the old QR see an expiration message

---

## Epic 3: Participant Joining & Ticket System

**Goal:** Attendees can scan the QR code, join the raffle, and see their accumulated tickets.

### Story 3.1: QR Code Join Flow & Participant Registration

As a **meetup attendee**,
I want **to scan the QR code and automatically join the raffle**,
So that **I can participate without any extra steps**.

**Acceptance Criteria:**

**Given** the database
**When** the participants table is created
**Then** the `participants` table exists with columns: `id` (uuid), `raffle_id` (uuid references raffles), `user_id` (uuid references users), `ticket_count` (int default 1), `joined_at` (timestamptz)
**And** a unique constraint exists on `(raffle_id, user_id)`
**And** RLS policies allow users to read their own participation records

**Given** a user scanning a valid QR code
**When** they open the `/join/{raffle-id}` URL
**Then** they are redirected to login if not authenticated
**And** after authentication, they return to the join flow

**Given** an authenticated user on the join page for a valid, active raffle
**When** the page loads
**Then** a participant record is automatically created for them
**And** they receive 1 ticket for this raffle
**And** they are redirected to the participant dashboard

**Given** a user who has already joined this raffle
**When** they scan the QR code again
**Then** no duplicate record is created
**And** they see their existing ticket count
**And** they are redirected to the participant dashboard

**Given** a user scanning an expired QR code
**When** the `qr_code_expires_at` timestamp has passed
**Then** they see an "This raffle has ended" message
**And** they cannot join the raffle

**Given** the join flow
**When** completed successfully
**Then** the total time from QR scan to confirmation is under 5 seconds (NFR1)

---

### Story 3.2: Ticket Display with TicketCircle Component

As a **raffle participant**,
I want **to see my ticket count prominently displayed**,
So that **I know my odds and feel the anticipation building**.

**Acceptance Criteria:**

**Given** an authenticated participant
**When** they view the participant dashboard
**Then** their total accumulated ticket count is displayed in a large TicketCircle component
**And** the number is styled as the hero element (72px on mobile)

**Given** the TicketCircle component
**When** rendered in light mode
**Then** it displays with a blue gradient background and frosted glass effect

**Given** the TicketCircle component
**When** rendered in dark mode
**Then** it displays with a glowing number effect on deep navy background

**Given** a user with multiple tickets
**When** they view the dashboard
**Then** contextual messaging appears below the count (e.g., "Your best odds yet!")

**Given** a new user with 1 ticket
**When** they view the dashboard
**Then** encouraging messaging appears (e.g., "You're in! Good luck!")

**Given** the ticket display
**When** the page first loads
**Then** the ticket count is visible immediately after login (FR3)
**And** no loading spinner delays the count display

---

### Story 3.3: Ticket Accumulation Across Events

As a **loyal meetup attendee**,
I want **my tickets to accumulate across multiple events**,
So that **my continued attendance improves my chances of winning**.

**Acceptance Criteria:**

**Given** a user who has participated in multiple raffles
**When** they view their ticket count
**Then** it shows the sum of tickets from all raffles where they haven't won

**Given** the ticket calculation
**When** querying accumulated tickets
**Then** tickets from raffles where the user won a prize are excluded
**And** tickets from all other raffles are summed

**Given** a user attending their 5th event
**When** they join the current raffle
**Then** they see their accumulated count (e.g., 5 tickets if they never won)
**And** the display reflects tickets from all 5 events

**Given** a user who won in a previous raffle
**When** they view their ticket count
**Then** only tickets earned after their last win are counted
**And** pre-win tickets are not included

**Given** the database query
**When** calculating accumulated tickets
**Then** it efficiently joins participants and winners tables
**And** returns results within acceptable performance limits

---

### Story 3.4: Ticket Confirmation & Status Feedback

As a **raffle participant**,
I want **to see confirmation that I'm registered and the current status**,
So that **I know I'm in the raffle and don't need to do anything else**.

**Acceptance Criteria:**

**Given** a user who just joined a raffle
**When** they land on the participant dashboard
**Then** a success toast appears: "You're in! Good luck!"
**And** the toast auto-dismisses after 3 seconds

**Given** a registered participant
**When** they view the participant dashboard
**Then** a StatusBar is visible at the bottom of the screen
**And** it shows "Locked in - waiting for draw" with a pulsing green dot

**Given** the StatusBar component
**When** the raffle status is 'active'
**Then** it displays the "Locked in" state
**And** the green dot pulses with a 2-second animation cycle

**Given** the participant dashboard
**When** a user is registered for an active raffle
**Then** they see no action buttons or decisions to make
**And** the interface clearly communicates "just wait and watch"

**Given** the confirmation flow
**When** a ticket is granted
**Then** screen reader users hear "You now have X tickets for the raffle"
**And** the announcement uses an ARIA live region

---

## Epic 4: Prize Management

**Goal:** Organizers can add prizes to their raffle and organize them for sequential drawing.

### Story 4.1: Add Prizes to Raffle

As an **organizer**,
I want **to add multiple prizes to my raffle with names and descriptions**,
So that **attendees know what they could win**.

**Acceptance Criteria:**

**Given** the database
**When** the prizes table is created
**Then** the `prizes` table exists with columns: `id` (uuid), `raffle_id` (uuid references raffles), `name` (text), `description` (text), `sort_order` (int), `awarded_to` (uuid references users nullable), `awarded_at` (timestamptz nullable)
**And** RLS policies allow admins full access and participants read access

**Given** an admin on the raffle detail page
**When** they navigate to the prizes section
**Then** they see an "Add Prize" button
**And** they see a list of existing prizes (if any)

**Given** an admin clicking "Add Prize"
**When** the form appears
**Then** they can enter a prize name (required)
**And** they can enter an optional description

**Given** an admin submitting a valid prize
**When** they click save
**Then** the prize is added to the raffle
**And** the prize list updates to show the new prize
**And** a success toast confirms the addition

**Given** a raffle with multiple prizes
**When** the admin views the prizes section
**Then** all prizes are listed with their names and descriptions
**And** each prize shows its award status (pending/awarded)

**Given** an admin viewing a prize
**When** they want to edit or delete it
**Then** edit and delete options are available
**And** deleting requires confirmation

---

### Story 4.2: Prize Ordering for Sequential Drawing

As an **organizer**,
I want **to set the order in which prizes will be drawn**,
So that **I can control the sequence of the raffle (e.g., save the best for last)**.

**Acceptance Criteria:**

**Given** a raffle with multiple prizes
**When** the admin views the prize list
**Then** prizes are displayed in their current sort order
**And** the order number is visible for each prize

**Given** the prize list
**When** the admin wants to reorder prizes
**Then** they can drag-and-drop prizes to new positions
**Or** they can use up/down arrows to adjust order

**Given** a prize being reordered
**When** the admin moves it to a new position
**Then** the `sort_order` values are updated in the database
**And** the list immediately reflects the new order

**Given** a new prize being added
**When** it's saved to the database
**Then** it's assigned the next available `sort_order` value
**And** it appears at the end of the list by default

**Given** the raffle draw sequence
**When** prizes are drawn
**Then** they are presented in the defined `sort_order`
**And** prize 1 is drawn first, then prize 2, etc.

---

### Story 4.3: Track Prize Award Status

As an **organizer**,
I want **to see which prizes have been awarded and which remain**,
So that **I know the progress of my raffle**.

**Acceptance Criteria:**

**Given** a raffle with prizes
**When** no prizes have been awarded yet
**Then** all prizes show status "Pending"
**And** the count shows "0 of X awarded"

**Given** a prize that has been awarded
**When** the admin views the prize list
**Then** it shows status "Awarded"
**And** it displays the winner's name
**And** it shows the award timestamp

**Given** a raffle in progress
**When** viewing the prize list
**Then** awarded prizes are visually distinguished (e.g., grayed out or checked)
**And** the next prize to be drawn is highlighted

**Given** the prize tracking display
**When** updated after a draw
**Then** the status changes immediately
**And** no page refresh is required

**Given** a completed raffle
**When** all prizes have been awarded
**Then** the status shows "All prizes awarded"
**And** a summary of all winners is available

---

## Epic 5: Admin Dashboard & Participant Visibility

**Goal:** Organizers have complete visibility into who joined and the raffle status.

### Story 5.1: Participant List & Statistics Dashboard

As an **organizer**,
I want **to see who has joined my raffle and the ticket statistics**,
So that **I know how many people are participating before I start the draw**.

**Acceptance Criteria:**

**Given** an admin viewing a raffle detail page
**When** they navigate to the participants section
**Then** they see a list of all participants who have scanned in
**And** each participant shows their name and avatar

**Given** the participant list
**When** displayed to the admin
**Then** it shows the participant's accumulated ticket count
**And** it shows when they joined (timestamp)

**Given** the raffle statistics display
**When** the admin views the dashboard
**Then** they see the total number of participants (FR17)
**And** they see the total number of tickets in play (FR16)

**Given** the statistics display
**When** rendered with the ParticipantCounter component
**Then** numbers animate when they change
**And** the display is large enough for projection

**Given** participants joining the raffle
**When** new users scan the QR code
**Then** the participant list updates in real-time
**And** the statistics counters increment automatically
**And** no page refresh is required

**Given** the participant list on mobile admin view
**When** displayed on smaller screens
**Then** the list is scrollable
**And** key information (name, tickets) is visible without horizontal scrolling

---

### Story 5.2: Raffle History View

As an **organizer**,
I want **to view past raffles and their winners**,
So that **I can track prize distribution over time and ensure fairness**.

**Acceptance Criteria:**

**Given** an admin on the admin dashboard
**When** they navigate to "History" or "Past Raffles"
**Then** they see a list of completed raffles sorted by date (newest first)

**Given** the raffle history list
**When** displayed
**Then** each raffle shows: name, date, participant count, and number of prizes awarded

**Given** an admin clicking on a past raffle
**When** the detail view opens
**Then** they see the complete list of winners for that raffle
**And** each winner shows: name, prize won, and ticket count at time of win

**Given** the winners table
**When** the `winners` table is created
**Then** it exists with columns: `id` (uuid), `raffle_id` (uuid references raffles), `prize_id` (uuid references prizes), `user_id` (uuid references users), `tickets_at_win` (int), `won_at` (timestamptz)

**Given** the history view
**When** analyzing prize distribution
**Then** admins can see if the same person has won multiple times across events
**And** this helps verify the fairness system is working

**Given** a raffle with no winners yet
**When** viewed in history
**Then** it shows as "In Progress" or "Active"
**And** is clearly distinguished from completed raffles

---

### Story 5.3: Participant Prize & Status View

As a **raffle participant**,
I want **to see what prizes are available and the current raffle status**,
So that **I know what I could win and when the draw will happen**.

**Acceptance Criteria:**

**Given** a participant on the dashboard
**When** viewing an active raffle
**Then** they see a list of prizes for the current raffle
**And** each prize shows its name and description

**Given** the prize list for participants
**When** displayed
**Then** prizes are shown in draw order
**And** awarded prizes are marked as "Awarded" or hidden

**Given** the raffle status display
**When** the raffle is in different states
**Then** participants see clear status indicators:
- "Active" - raffle is open, waiting for draw
- "Drawing" - wheel is spinning
- "Completed" - all prizes awarded

**Given** the participant view
**When** the raffle status changes
**Then** the status updates in real-time
**And** no manual refresh is needed

**Given** the prize and status display
**When** rendered on mobile
**Then** the layout is optimized for phone screens
**And** prizes are easily readable

**Given** the status display
**When** in "Active" state
**Then** it complements the StatusBar "Locked in" message
**And** participants understand they just need to wait

---

## Epic 6: Live Draw Experience

**Goal:** The complete synchronized raffle experience - wheel spin, winner celebration, and ticket management - all happening in real-time across all devices. This is the "main event" epic that delivers the core product experience.

### Story 6.1: Admin Live Draw Mode & Projection UI

As an **organizer**,
I want **to enter a live draw mode optimized for projection**,
So that **the audience can clearly see the raffle on the big screen**.

**Acceptance Criteria:**

**Given** an admin on the raffle detail page
**When** they click "Start Live Draw"
**Then** the interface transitions to projection mode
**And** the URL changes to `/admin/raffles/{id}/live`

**Given** projection mode is active
**When** the page renders
**Then** the background is pure black (#000000)
**And** all text is 2x normal size
**And** navigation and chrome are hidden

**Given** the live draw interface
**When** displayed on a projector
**Then** text is readable from the back of a room
**And** the "Draw Winner" button is prominently displayed
**And** participant count and prize info are visible

**Given** the live draw mode
**When** the admin wants to exit
**Then** an "Exit Live Draw" option is available
**And** they return to the normal admin interface

**Given** the projection display
**When** showing the current prize
**Then** the prize name is displayed in large text
**And** it's clear which prize is being drawn

---

### Story 6.2: Real-time Channel Setup & Synchronization

As a **system**,
I want **to establish real-time channels for the raffle**,
So that **all participants experience the draw simultaneously**.

**Acceptance Criteria:**

**Given** a participant joining a raffle view
**When** the page loads
**Then** they subscribe to the Supabase Broadcast channel `raffle:{id}:draw`
**And** the connection is established within 1 second

**Given** the broadcast channel
**When** events are sent
**Then** all subscribed clients receive them within 500ms (FR40)
**And** latency is monitored and logged

**Given** the real-time event constants
**When** defined in the codebase
**Then** they follow the pattern: `DRAW_START`, `WHEEL_SEED`, `WINNER_REVEALED`, `RAFFLE_ENDED`
**And** they are exported from `/lib/constants/events.ts`

**Given** participant count updates (FR37)
**When** new participants join
**Then** the count updates via Postgres Changes subscription
**And** all admin views reflect the new count in real-time

**Given** a client that loses connection
**When** they reconnect
**Then** they receive the current state
**And** they can continue watching the raffle

**Given** the synchronization requirement
**When** measuring end-to-end latency
**Then** admin action to participant display is under 500ms
**And** this is verified during testing

---

### Story 6.3: Draw Winner Server Action

As an **organizer**,
I want **to draw a winner fairly based on ticket counts**,
So that **participants with more tickets have proportionally higher chances**.

**Acceptance Criteria:**

**Given** the `drawWinner` Server Action
**When** called with a raffle ID and prize ID
**Then** it executes as an atomic transaction
**And** it returns `{ data: Winner, error: null }` on success

**Given** eligible participants
**When** selecting a winner
**Then** the selection is weighted by accumulated ticket count
**And** a participant with 5 tickets has 5x the chance of someone with 1 ticket

**Given** a participant who already won in this raffle (FR25)
**When** drawing for subsequent prizes
**Then** they are excluded from the eligible pool
**And** they cannot win multiple prizes in the same raffle

**Given** the winner selection
**When** a winner is chosen
**Then** a random seed is generated for the wheel animation
**And** the seed ensures identical animation on all devices

**Given** the Server Action execution
**When** the winner is determined
**Then** a record is created in the `winners` table
**And** the prize is marked as awarded
**And** a `DRAW_START` event is broadcast with the wheel seed

**Given** no eligible participants
**When** the draw is attempted
**Then** it returns `{ data: null, error: "No eligible participants" }`
**And** an appropriate message is shown to the admin

---

### Story 6.4: Wheel-of-Fortune Animation

As a **raffle participant**,
I want **to see an exciting wheel animation**,
So that **the draw feels suspenseful and engaging**.

**Acceptance Criteria:**

**Given** the RaffleWheel component
**When** it receives a `DRAW_START` event with wheel seed
**Then** it transitions to full-screen display
**And** the wheel begins spinning immediately

**Given** the wheel animation
**When** spinning
**Then** participant names are displayed on wheel segments (FR28)
**And** names flash past as the wheel rotates
**And** the animation uses Framer Motion for smooth physics

**Given** the wheel spin duration (FR29)
**When** the animation plays
**Then** it runs for exactly 5 seconds (5000ms)
**And** it uses cubic-bezier easing for gradual deceleration

**Given** the wheel synchronization
**When** using the same random seed
**Then** all devices show identical animation
**And** the wheel stops on the same segment everywhere

**Given** the wheel visual design
**When** rendered
**Then** it uses navy-to-sky-blue gradient segments
**And** a gold pointer indicates the selection point
**And** glow effects are visible in dark/projection mode

**Given** a user with `prefers-reduced-motion`
**When** the draw occurs
**Then** the wheel animation is skipped
**And** the winner is revealed directly with a fade transition

**Given** the wheel performance (NFR5)
**When** animating
**Then** it maintains 60fps on modern devices
**And** CSS/GPU acceleration is utilized

---

### Story 6.5: Winner Celebration & Announcement

As a **raffle participant**,
I want **to see an exciting winner celebration**,
So that **winning feels special and the loyalty system is validated**.

**Acceptance Criteria:**

**Given** the wheel stops spinning
**When** the winner is determined
**Then** a brief pause (500ms) builds suspense
**And** the `WINNER_REVEALED` event is broadcast

**Given** the WinnerCard component (FR30)
**When** displayed
**Then** it appears with a scale + fade entrance animation
**And** the background is celebration gold (#F7DC6F)

**Given** the winner display (FR31, FR32)
**When** showing the winner
**Then** the winner's name is displayed prominently (48px mobile, 96px projection)
**And** their ticket count is shown: "Lisa - 8 tickets - WINNER!"
**And** this validates the loyalty system publicly

**Given** the confetti overlay
**When** the winner is revealed
**Then** canvas-confetti fires with 150 particles
**And** colors are Gold, Coral, Flutter Blue, Sky Blue
**And** the animation lasts 3 seconds

**Given** synchronized announcement (FR38)
**When** the winner is revealed
**Then** all connected devices show the celebration simultaneously
**And** participants watching on mobile see the same moment (FR39)

**Given** a non-winner participant
**When** viewing the celebration
**Then** they see the winner announcement
**And** after celebration, they see "Not this time - your X tickets carry forward!"

**Given** screen reader users
**When** the winner is announced
**Then** they hear "[Name] is the winner with X tickets"
**And** the announcement uses an ARIA live region

---

### Story 6.6: Ticket Reset & Post-Win Messaging

As a **raffle winner**,
I want **my tickets reset and to understand what happens next**,
So that **I know the system is fair and others get their chance**.

**Acceptance Criteria:**

**Given** a winner is selected (FR9)
**When** the draw completes
**Then** their accumulated ticket count is reset to zero
**And** this happens atomically as part of the draw transaction

**Given** the ticket reset
**When** it occurs
**Then** tickets from all previous raffles are cleared
**And** the winner starts fresh for future events

**Given** a winner viewing their dashboard after winning (FR11)
**When** the celebration ends
**Then** they see a positive message: "Congratulations! Your tickets have been reset to 0. See you at the next meetup!"
**And** the message frames the reset positively, not as a loss

**Given** a non-winner after the draw
**When** viewing their dashboard
**Then** they see: "Not this time - your X tickets carry forward to the next raffle!"
**And** their ticket count remains unchanged

**Given** the winner's ticket count display
**When** they return to the participant dashboard
**Then** it shows 0 tickets
**And** contextual messaging explains they can start building again

---

### Story 6.7: Sequential Prize Drawing Flow

As an **organizer**,
I want **to draw winners for multiple prizes in sequence**,
So that **I can run through all prizes smoothly during the live event**.

**Acceptance Criteria:**

**Given** a raffle with multiple prizes
**When** the first winner is drawn
**Then** after the celebration, a "Next Prize" button appears (FR19)
**And** the admin can proceed to the next prize

**Given** the "Next Prize" action
**When** clicked
**Then** the interface shows the next prize to be drawn
**And** participants see the new prize being drawn
**And** the raffle status updates to show progress

**Given** the sequential flow
**When** drawing each prize
**Then** previous winners are excluded (FR25)
**And** the eligible participant pool shrinks accordingly

**Given** all prizes have been drawn
**When** the last celebration completes
**Then** no "Next Prize" button appears
**And** the raffle status changes to "Completed"
**And** a summary of all winners is shown

**Given** the raffle completion
**When** all prizes are awarded
**Then** the raffle is marked as completed in the database
**And** it appears in the history view
**And** participants see "Raffle Complete" messaging

**Given** the admin during sequential drawing
**When** between prizes
**Then** they see which prizes remain
**And** they control the pacing of the event

