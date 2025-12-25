---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments: []
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 0
workflowType: 'prd'
lastStep: 11
project_name: 'servus-raffle'
user_name: 'Ben'
date: '2025-12-25'
---

# Product Requirements Document - servus-raffle

**Author:** Ben
**Date:** 2025-12-25

## Executive Summary

Servus Raffle is a web application designed for the Flutter Munich meetup community to manage swag giveaway raffles with a built-in fairness system. Attendees authenticate via their Meetup.com account and earn raffle tickets by scanning QR codes at events. The core innovation is a loyalty-based ticket system: tickets accumulate across events if you don't win, but reset to zero when you do - ensuring long-time participants eventually get rewarded while keeping the system fair for everyone.

The platform includes an admin dashboard for organizers to create multi-prize raffles, view participant stats, and run engaging live drawings with wheel-of-fortune animations. Practical features like T-shirt size preferences ensure prizes match winners appropriately.

### What Makes This Special

- **Fairness through loyalty**: Regular attendees accumulate tickets over time, increasing their odds with each event they attend without winning. First-timers have a chance, but dedication is rewarded.
- **Commitment incentive**: The ticket system creates a compelling reason to return - "I have 5 tickets building up, I should go to the next meetup!"
- **Event verification**: QR codes with expiration ensure only physical attendees can participate - no remote gaming of the system.
- **Practical efficiency**: T-shirt size preferences collected upfront eliminate awkward prize exchanges and speed up the raffle process.
- **Engaging experience**: Wheel-of-fortune animations make the drawing fun and suspenseful for the live audience.

## Project Classification

**Technical Type:** web_app (Next.js + Supabase)
**Domain:** general (community/events tooling)
**Complexity:** low-medium
**Project Context:** Greenfield - new project

This is a straightforward web application with OAuth integration, real-time features, and QR code generation - all well-understood patterns. No regulated domain concerns apply.

## Success Criteria

### User Success

- **Loyalty payoff**: Users who attend 5+ events without winning feel their increased odds and experience the satisfaction of eventually winning
- **Frictionless onboarding**: Registration completes in under 30 seconds via Meetup.com OAuth - no new accounts or passwords
- **Instant participation**: QR code scan to ticket acquisition takes less than 5 seconds
- **Anticipation building**: Users can check their accumulated ticket count anytime, building excitement for the next raffle
- **Memorable moments**: Winner announcement creates joy through engaging wheel animation and celebration display

### Business Success

- **Adoption rate**: >50% of event attendees participate in the raffle system
- **Time savings**: Organizers reduce raffle management from 10-15 minutes of manual work to simply pressing "draw winner"
- **Fair distribution**: Over multiple events, prizes are spread across different winners - no single person dominates
- **Community satisfaction**: Loyal attendees feel rewarded for their continued participation

### Technical Success

- **Simplicity**: Self-hosted, minimal infrastructure - Next.js on Vercel + Supabase cloud
- **Reliability**: Rock-solid during the raffle window - no crashes mid-draw
- **Performance**: Wheel animation runs smoothly for ~5 seconds before revealing winner
- **Low maintenance**: System handles low traffic (event-time usage only) without ongoing ops burden

### Measurable Outcomes

| Metric | Target |
|--------|--------|
| Registration time | < 30 seconds |
| QR scan to ticket | < 5 seconds |
| Attendee participation | > 50% |
| Raffle execution time | < 2 minutes (vs 10-15 min manual) |
| Unique winners over 10 events | No person wins > 2 times |

## Product Scope

### MVP - Minimum Viable Product

Core functionality needed for first meetup usage:

- Meetup.com OAuth authentication
- QR code generation with configurable expiration
- Ticket accumulation system (keep tickets if no win)
- Ticket reset on win (fairness mechanism)
- Admin dashboard: create raffle, add prizes, view participants
- Wheel-of-fortune animation (~5 sec spin)
- Winner display and announcement
- One prize per user per raffle enforcement

### Growth Features (Post-MVP)

Polish and practical improvements:

- T-shirt size preferences and size-grouped prize drawing
- Participant statistics dashboard (ticket history, win history)
- Historical raffle data and analytics
- Enhanced animations and visual polish
- Admin view of active ticket counts per participant

### Vision (Future)

Dream features for long-term engagement:

- Leaderboard: "Most tickets without winning" - celebrating the unlucky loyalists
- Advanced analytics: attendance patterns, engagement trends
- Customizable themes for different event types

## User Journeys

### Journey 1: First-Timer Felix - Discovering the Raffle

Felix is a junior Flutter developer attending his first Flutter Munich meetup. He's a bit nervous, doesn't know anyone yet, and is mostly here for the tech talks about state management. During the break, he notices people around him pulling out their phones and scanning a QR code displayed on the projector screen.

Curious, Felix scans the code with his phone camera. He's taken to a clean, simple page that says "Flutter Munich Raffle - Sign in with Meetup.com to participate." Since he already has a Meetup account (that's how he found this event), he taps the button. One OAuth popup later, he's in. No forms, no passwords to create, no email verification - just instant access.

The screen now shows "Welcome, Felix! You have 1 ticket for tonight's raffle." He feels a spark of excitement - he could actually win something tonight! He sees the prizes listed: a Flutter book, a JetBrains license, and a t-shirt. As a newcomer with just one ticket, his odds aren't great, but hey, someone has to win. He puts his phone away and enjoys the rest of the meetup, already looking forward to the raffle at the end.

**This journey reveals requirements for:**
- QR code scanning that opens registration flow
- Meetup.com OAuth integration (one-tap sign-in)
- Immediate ticket grant upon successful scan
- Clear display of current ticket count
- Prize list visibility for participants

---

### Journey 2: Loyal Lisa - The Payoff Moment

Lisa has been a Flutter Munich regular for over a year. She's scanned QR codes at 8 consecutive meetups and watched others win prizes while her ticket count steadily grew. She's joked with friends that she's "the unluckiest person here" - but tonight feels different. She has 8 tickets, more than most people in the room.

When the raffle begins, Lisa watches the wheel-of-fortune animation spin on the big screen. Names flash by as the wheel slows down. Her heart beats faster. The wheel lands... on her name! The screen explodes with a celebration animation, and prominently displays: "Lisa - 8 tickets - WINNER!" The crowd cheers - everyone can see she's been coming for months and finally got her moment.

Lisa walks up to claim her prize (the JetBrains license she's been hoping for). She feels genuine relief and satisfaction - her loyalty paid off. When she checks her phone afterward, she sees "You won! Your tickets have been reset to 0. See you at the next meetup!" She doesn't mind starting over - the system worked exactly as promised, and now someone else will get their chance to build up tickets.

**This journey reveals requirements for:**
- Ticket accumulation tracking across events
- Wheel-of-fortune animation with name display
- Winner celebration screen showing ticket count (emphasizes loyalty payoff)
- Ticket reset to zero after winning
- Post-win messaging that explains the reset positively
- Prize selection/claiming flow

---

### Journey 3: Organizer Otto - Effortless Raffle Setup

Otto is one of the Flutter Munich organizers. It's 30 minutes before tonight's meetup, and he needs to set up the raffle. In the old days, this meant spreadsheets, random number generators, and awkward "wait, who won already?" moments on stage. Not anymore.

Otto opens the Servus Raffle admin dashboard on his laptop. He clicks "Create New Raffle" and names it "December 2024 Meetup." He adds three prizes: a Flutter book, a JetBrains license, and an XL t-shirt from tonight's sponsor. For the t-shirt, he notes it's size XL so only XL-preference participants will be in that drawing (Growth feature - for now, he just adds it as a note).

With two more clicks, he generates tonight's QR code with a 3-hour expiration (the meetup runs 6-9pm). He copies the QR code image and drops it into the event slide deck. Done - total setup time: 2 minutes.

During the raffle segment, Otto projects his admin dashboard on the big screen. He can see 47 participants have scanned in tonight, with a combined 156 tickets in play. He clicks "Draw Winner" for the first prize. The wheel spins for 5 seconds, building suspense in the room, then lands on a name. The winner celebration plays automatically. Otto clicks "Next Prize" and repeats twice more. The entire raffle takes under 3 minutes, and Otto spends zero mental energy on logistics - just enjoying the community moment.

**This journey reveals requirements for:**
- Admin dashboard with raffle creation
- Multi-prize support per raffle
- QR code generation with configurable expiration
- Participant count and total tickets display for admin
- "Draw Winner" button triggering wheel animation
- Sequential prize drawing flow
- Projection-friendly admin UI (large text, clear visuals)

---

### Journey Requirements Summary

| Capability Area | Revealed By Journey |
|-----------------|---------------------|
| QR code scanning & registration | Felix |
| Meetup.com OAuth | Felix |
| Ticket display & tracking | Felix, Lisa |
| Ticket accumulation across events | Lisa |
| Wheel-of-fortune animation | Lisa, Otto |
| Winner celebration with ticket count | Lisa |
| Ticket reset on win | Lisa |
| Admin raffle creation | Otto |
| Multi-prize raffles | Otto |
| QR code generation with expiration | Otto |
| Admin participant/ticket stats view | Otto |
| Sequential prize drawing | Otto |
| Projection-friendly admin UI | Otto |

## Web App Specific Requirements

### Project-Type Overview

Servus Raffle is a Next.js web application optimized for event-time usage with strong mobile support. As a tool for a mobile development community, excellent mobile browser experience is paramount. The app operates as a closed ecosystem (QR code access only) with no SEO requirements.

### Technical Architecture Considerations

**Framework:** Next.js (App Router)
- Server-side rendering available for initial load performance
- Client-side interactivity for real-time features
- API routes for Supabase integration

**Real-time Architecture:**
- WebSocket or Supabase Realtime for live updates
- Synchronized wheel animation across all connected devices
- Live participant count updates during active raffle
- All attendees can watch the wheel spin on their own devices simultaneously

### Browser & Device Support

| Platform | Support Level | Notes |
|----------|---------------|-------|
| Chrome (Desktop) | Full | Primary admin experience |
| Safari (Desktop) | Full | Mac users |
| Firefox (Desktop) | Full | Developer audience |
| Chrome (Mobile) | Full | **Priority** - Android users |
| Safari (Mobile) | Full | **Priority** - iOS users |
| Samsung Internet | Full | Android fallback |
| Edge | Full | Windows users |

**Mobile-First Considerations:**
- Touch-optimized interactions (QR scan, button taps)
- Responsive design that works on all screen sizes
- Fast load times on mobile networks
- Camera access for QR scanning (if native scan needed)

### Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Initial Load (LCP) | < 2 seconds | Quick access when scanning QR |
| Time to Interactive | < 3 seconds | Users need to act fast at events |
| Real-time Latency | < 500ms | Wheel animation must feel synchronized |
| Offline Tolerance | Graceful degradation | Show cached state if connection drops mid-raffle |

### SEO Strategy

**Not applicable** - Servus Raffle is a closed ecosystem accessed exclusively via QR codes at events. No public discovery or search engine indexing required.

- `robots.txt` can block all crawlers
- No meta description or structured data needed
- Focus resources on performance instead of SEO

### Accessibility Level

**Basic accessibility** - Following standard HTML semantics and keyboard navigation, but not targeting WCAG AA compliance. Focus areas:

- Readable text contrast on projection screens
- Keyboard-navigable admin interface
- Screen reader compatibility for core flows (nice-to-have)

### Implementation Considerations

**Real-time Implementation Options:**
1. **Supabase Realtime** (Recommended) - Already using Supabase, built-in WebSocket support
2. **Pusher/Ably** - Third-party real-time service if more control needed

**Mobile Browser Optimization:**
- Use CSS viewport units correctly for mobile
- Prevent zoom on input focus (form handling)
- Handle safe areas for notched devices
- Test wheel animation performance on lower-end mobile devices

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP
- Focus on delivering the core raffle experience with the "wow factor"
- Synchronized real-time wheel animation is a must-have, not a nice-to-have
- Lean feature set, but polished execution on what matters

**Resource Requirements:**
- Team size: 1-2 developers
- Skills: Next.js, Supabase, real-time WebSockets, basic animation
- Timeline: Suitable for a focused sprint before next meetup

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Felix (First-timer): Full journey - scan, OAuth, get ticket
- Lisa (Loyal winner): Full journey - accumulated tickets, win, reset
- Otto (Organizer): Full journey - create raffle, generate QR, run drawing

**Must-Have Capabilities:**

| Feature | Rationale |
|---------|-----------|
| Meetup.com OAuth | Frictionless onboarding for attendees |
| QR code generation with expiration | Event-scoped participation |
| Ticket accumulation system | Core fairness mechanic |
| Ticket reset on win | Fairness balance |
| Admin: create raffle, add prizes | Organizer workflow |
| Admin: view participants & ticket counts | Live event visibility |
| Wheel-of-fortune animation (~5 sec) | Engagement & suspense |
| **Real-time sync across devices** | **The wow factor** - everyone watches together |
| Winner celebration with ticket count | Loyalty payoff moment |
| One prize per user per raffle | Fairness enforcement |

### Post-MVP Features

**Phase 2 (Growth):**
- T-shirt size preferences and size-grouped prize drawing
- Participant statistics dashboard (ticket history, win history)
- Historical raffle data and analytics
- Enhanced animations and visual polish
- Admin view of individual participant ticket counts

**Phase 3 (Vision):**
- Leaderboard: "Most tickets without winning"
- Advanced analytics: attendance patterns, engagement trends
- Customizable themes for different event types

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Mitigation |
|------|------------|
| Real-time sync with 50+ users | Use Supabase Realtime; load test before first event |
| Meetup.com OAuth API changes | Design auth layer to support fallback (email login) |
| Wheel animation performance on mobile | Test on lower-end devices; use CSS animations over JS |

**Market Risks:**
- Minimal - building for your own community with direct feedback loop
- First event is the validation; iterate based on real usage

**Resource Risks:**

| Scenario | Contingency |
|----------|-------------|
| Time-crunched before event | Launch without real-time sync; add for event #2 |
| Bugs discovered during raffle | Manual fallback (random.org) as backup |
| Supabase issues | Local state fallback for critical raffle moment |

## Functional Requirements

### User Authentication & Registration

- FR1: Users can authenticate using their Meetup.com account via OAuth
- FR2: Users can view their profile information pulled from Meetup.com
- FR3: Users can see their current ticket count immediately after logging in
- FR4: Users can log out of the system
- FR5: System can identify returning users and restore their ticket history

### Ticket Management

- FR6: Users receive one ticket automatically when scanning a valid QR code
- FR7: Users can view their total accumulated ticket count
- FR8: System accumulates tickets across multiple events for users who don't win
- FR9: System resets a user's ticket count to zero when they win a prize
- FR10: Users can see a confirmation message after receiving a ticket
- FR11: Users can see a positive message explaining ticket reset after winning

### Raffle Administration

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

### Prize Management

- FR22: Admins can add multiple prizes to a single raffle
- FR23: Admins can specify prize names and descriptions
- FR24: Admins can set the order of prizes for sequential drawing
- FR25: System enforces one prize per user per raffle (winners are excluded from subsequent draws in the same raffle)
- FR26: System tracks which prizes have been awarded and which remain

### Live Raffle Experience

- FR27: System displays a wheel-of-fortune animation when drawing a winner
- FR28: Wheel animation shows participant names spinning
- FR29: Wheel animation runs for approximately 5 seconds before stopping
- FR30: System displays winner celebration screen after wheel stops
- FR31: Winner celebration displays the winner's name prominently
- FR32: Winner celebration displays the winner's ticket count (loyalty recognition)
- FR33: Users can view the list of prizes for the current raffle
- FR34: Users can view the current raffle status (active, drawing, completed)
- FR35: Admin interface is projection-friendly (large text, clear visuals)

### Real-time Synchronization

- FR36: All connected users see the wheel animation simultaneously when admin triggers draw
- FR37: Participant count updates in real-time as users scan QR codes
- FR38: Winner announcement displays on all connected devices simultaneously
- FR39: Users can watch the live raffle on their own mobile devices
- FR40: System maintains synchronization with <500ms latency between admin action and user display

## Non-Functional Requirements

### Performance

| Requirement | Target | Context |
|-------------|--------|---------|
| QR scan to ticket confirmation | < 5 seconds | Users need instant feedback at events |
| Page initial load (LCP) | < 2 seconds | Quick access when scanning QR |
| Time to interactive | < 3 seconds | Users need to act fast |
| Real-time sync latency | < 500ms | Wheel animation must feel synchronized across devices |
| Wheel animation framerate | 60fps | Smooth, engaging visual experience |
| Concurrent user support | 100 users | Typical large meetup attendance |

**Critical Performance Moment:**
The wheel-spin-to-winner-reveal sequence must perform flawlessly. This is the "main event" - any stutter, delay, or desync breaks the experience.

### Reliability

| Requirement | Target | Context |
|-------------|--------|---------|
| Uptime during raffle window | 99.9% | Cannot crash during the 5-minute raffle |
| Data persistence | Zero ticket loss | Accumulated tickets must never be lost |
| Graceful degradation | Offline fallback | Show cached state if connection drops |
| Recovery time | < 30 seconds | Quick recovery if issues occur |

**Critical Reliability Window:**
The raffle segment (typically 5-10 minutes) is the only time reliability is critical. Outside of events, brief downtime is acceptable.

**Fallback Strategy:**
- If real-time sync fails: Admin can still run raffle locally, sync results after
- If Supabase is down: Random.org as manual backup
- If winner display fails: Admin announces verbally, records manually

### Integration

| System | Integration Type | Requirements |
|--------|------------------|--------------|
| Meetup.com | OAuth 2.0 | Authentication only; read basic profile (name, photo) |
| Supabase | Database + Realtime | Primary data store and WebSocket provider |
| QR Code Generation | Library (client-side) | Generate codes with embedded raffle URL + expiration |

**Meetup.com OAuth Specifics:**
- Scopes needed: Basic profile information only
- Fallback: If Meetup API changes, design for future email-based auth option
- No dependency on Meetup event data (just user identity)

**Supabase Integration:**
- Realtime subscriptions for live updates
- Row-level security for admin vs. user access
- Postgres for reliable ticket/raffle data storage
