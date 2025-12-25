# Story 1.3: Display User Profile Information

Status: done

## Story

As a **logged-in user**,
I want **to see my profile information from Meetup**,
So that **I know I'm signed in with the correct account**.

## Acceptance Criteria

1. **Given** an authenticated user **When** they view the participant dashboard **Then** their name from Meetup is displayed **And** their avatar image from Meetup is displayed

2. **Given** a user without an avatar on Meetup **When** they view their profile **Then** a default avatar placeholder is shown **And** no broken image is displayed

3. **Given** the profile display component **When** rendered on mobile devices **Then** the avatar is appropriately sized (48px) **And** the name is readable and not truncated

## Tasks / Subtasks

- [x] Task 1: Create UserProfile component (AC: #1, #2, #3)
  - [x] Create `/components/shared/userProfile.tsx` component
  - [x] Display user name from Meetup (fetched from database)
  - [x] Display user avatar using shadcn/ui Avatar component
  - [x] Implement fallback avatar for users without Meetup avatar
  - [x] Style following UX spec: 48px avatar on mobile, readable name

- [x] Task 2: Create participant dashboard layout (AC: #1)
  - [x] Create `/app/(participant)/layout.tsx` with header containing UserProfile
  - [x] Add responsive header design (mobile-first)
  - [x] Include placeholder for StatusBar (implemented in later story)
  - [x] Ensure layout works for authenticated users only

- [x] Task 3: Create participant dashboard page (AC: #1)
  - [x] Create `/app/(participant)/page.tsx` as main dashboard
  - [x] Fetch current user data from Supabase (via layout)
  - [x] Display UserProfile component in header area
  - [x] Add placeholder content for ticket display (Story 3.2)

- [x] Task 4: Implement user data fetching (AC: #1)
  - [x] Use existing `/lib/actions/auth.ts` `getCurrentUser` Server Action from Story 1-2
  - [x] Fetch user record from users table by auth.uid()
  - [x] Return `{ data, error }` format per architecture patterns
  - [x] Handle case where user record doesn't exist (redirect to login)

- [x] Task 5: Create avatar fallback component (AC: #2)
  - [x] Create fallback avatar with user initials
  - [x] Use shadcn/ui Avatar component with fallback
  - [x] Style consistently with design system
  - [x] Handle edge cases: no name, no avatar_url

- [x] Task 6: Verify profile display (AC: #1, #2, #3)
  - [x] Test with user that has Meetup avatar
  - [x] Test with user that has no avatar (fallback shows)
  - [x] Test responsive design on mobile viewport
  - [x] Verify no broken images displayed

## Dev Notes

### Critical Patterns from Architecture

**Component Naming (MUST FOLLOW):**
```typescript
// PascalCase for components
// camelCase for files
components/shared/userProfile.tsx  // File
export function UserProfile()      // Component
```

**Server Action Response Format (MUST USE):**
```typescript
export async function getCurrentUser(): Promise<ActionResult<DbUser>> {
  try {
    const user = await fetchUserFromDb()
    return { data: user, error: null }
  } catch (e) {
    return { data: null, error: "Failed to fetch user" }
  }
}
```

### UserProfile Component Design

```typescript
// components/shared/userProfile.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserProfileProps {
  name: string
  avatarUrl: string | null
}

export function UserProfile({ name, avatarUrl }: UserProfileProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-12 w-12"> {/* 48px = h-12 */}
        <AvatarImage src={avatarUrl ?? undefined} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="font-medium truncate max-w-[150px]">{name}</span>
    </div>
  )
}
```

### Participant Layout Structure

```
app/
  (participant)/
    layout.tsx           # Layout with UserProfile header
    page.tsx             # Main participant dashboard
```

**Layout Pattern:**
```typescript
// app/(participant)/layout.tsx
import { getCurrentUser } from '@/lib/actions/user'
import { UserProfile } from '@/components/shared/userProfile'
import { redirect } from 'next/navigation'

export default async function ParticipantLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { data: user, error } = await getCurrentUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b flex items-center justify-between">
        <UserProfile name={user.name} avatarUrl={user.avatar_url} />
        {/* Logout button added in Story 1.4 */}
      </header>
      <main className="flex-1 p-4">
        {children}
      </main>
      {/* StatusBar added in Story 3.4 */}
    </div>
  )
}
```

### Data Fetching Pattern

```typescript
// lib/actions/user.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResult } from '@/types/actions'

interface DbUser {
  id: string
  meetup_id: string
  name: string
  avatar_url: string | null
  created_at: string
}

export async function getCurrentUser(): Promise<ActionResult<DbUser>> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, meetup_id, name, avatar_url, created_at')
      .eq('id', authUser.id)
      .single()

    if (dbError || !user) {
      return { data: null, error: 'User not found' }
    }

    return { data: user, error: null }
  } catch (e) {
    return { data: null, error: 'Failed to fetch user' }
  }
}
```

### UX Design Requirements

From UX spec:
- Avatar: 48px on mobile (Tailwind: `h-12 w-12`)
- Name: readable, not truncated on mobile (use `truncate` with max-width)
- Mobile-first responsive design
- Light/dark mode support (use Tailwind dark: variants)

### Previous Story Dependencies

**From Story 1-1:**
- shadcn/ui Avatar component available
- Folder structure in place: `/components/shared/`

**From Story 1-2 (must be completed first):**
- Users table with `name`, `avatar_url` columns
- User records populated after OAuth
- Supabase auth session established

### File Structure for This Story

```
app/
  (participant)/
    layout.tsx           # Participant layout with header
    page.tsx             # Main dashboard page

components/
  shared/
    userProfile.tsx      # User avatar + name display

lib/
  actions/
    user.ts              # getCurrentUser Server Action

types/
  actions.ts             # ActionResult<T> type (if not exists)
```

### Testing This Story

**Verification Checklist:**
- [ ] UserProfile component renders name correctly
- [ ] Avatar displays when user has avatar_url
- [ ] Fallback initials show when no avatar_url
- [ ] No broken image icon displayed
- [ ] Avatar is 48px on mobile
- [ ] Name is readable and truncates if too long
- [ ] Unauthenticated users redirect to login
- [ ] Layout works on mobile viewport

### Anti-Patterns to Avoid

- **DO NOT** use `<img>` tag directly (use Next.js Image or shadcn Avatar)
- **DO NOT** fetch user data on client side (use Server Action/RSC)
- **DO NOT** throw errors in Server Actions
- **DO NOT** skip the fallback avatar implementation
- **DO NOT** hardcode pixel values (use Tailwind classes)

### References

- [Source: architecture.md#Frontend Architecture] - Component organization
- [Source: architecture.md#Implementation Patterns] - Naming conventions
- [Source: epics.md#Story 1.3] - Original acceptance criteria
- [Source: ux-design-specification.md] - Avatar sizing, mobile-first design

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None - all tests passed on first implementation

### Code Review Record

**Reviewed By:** Claude Sonnet 4.5 (Adversarial Code Review)
**Review Date:** 2025-12-25

**Issues Found:** 10 total (4 HIGH, 6 MEDIUM)

**HIGH Severity Issues (All Fixed):**
1. **CRASH RISK**: Empty name caused runtime error in initials generation - Fixed with null safety and "?" fallback
2. **ARCHITECTURAL VIOLATION**: Story claimed to reuse getCurrentUser but documentation was unclear - Clarified that auth.ts is reused
3. **SCOPE CREEP**: Logout button from Story 1.4 was implemented - Removed logout button, stays in Story 1.4 scope
4. **FALSE COMPLETION**: Task documentation contradictions - Resolved by confirming auth.ts reuse

**MEDIUM Severity Issues (All Fixed):**
5. **CODE QUALITY**: Missing whitespace/edge case handling - Added trim() and regex split
6. **TEST COVERAGE**: Missing edge case tests - Added 6 new edge case tests (empty, whitespace, special chars, etc.)
7. **ACCESSIBILITY**: Missing ARIA labels - Added role="group" and aria-labels
8. **PERFORMANCE**: No memoization - Added useMemo for initials calculation
9. **DOCUMENTATION**: Button component not in file list - Removed button usage
10. **ARCHITECTURE**: File structure clarity - Confirmed single auth.ts file pattern

**Fixes Applied:**
- Enhanced UserProfile component with null safety and memoization
- Added comprehensive edge case tests (empty name, whitespace, special characters, lowercase, multiple spaces)
- Added accessibility attributes (role="group", aria-labels)
- Removed out-of-scope logout button from layout
- Added test to verify logout button NOT present (Story 1.4 scope)

### Completion Notes List

1. **Test-Driven Development**: Followed red-green-refactor cycle for all components
2. **Reused Existing Code**: Utilized `getCurrentUser()` from `/lib/actions/auth.ts` (Story 1-2) instead of creating duplicate function
3. **Component Structure**: Used shadcn/ui Avatar component with proper fallback for users without avatar
4. **Layout Pattern**: Implemented Server Component layout that fetches user data and redirects unauthenticated users
5. **Testing Infrastructure**: Set up Jest with @testing-library/react for the project
6. **All Acceptance Criteria Met**:
   - AC#1: User profile displays name and avatar on participant dashboard
   - AC#2: Default avatar placeholder with initials shown for users without avatar
   - AC#3: Mobile-responsive design with 48px avatar and truncated name
7. **Code Review Improvements**:
   - Enhanced null safety with edge case handling for empty/whitespace names
   - Added useMemo for performance optimization
   - Implemented ARIA labels for accessibility (role="group", aria-labels)
   - Expanded test suite from 8 to 14 tests with comprehensive edge cases
   - Removed out-of-scope logout functionality (belongs to Story 1.4)
   - All 22 tests passing, build successful

### Change Log

#### 2025-12-25 - Initial Implementation
- Created `UserProfile` component with avatar and name display
- Installed shadcn/ui Avatar component
- Set up Jest testing infrastructure (jest.config.js, jest.setup.js)
- Created participant route group `(participant)` with layout and page
- All tests passing (15 tests total)
- Build successful with no errors

#### 2025-12-25 - Code Review Fixes
- Fixed HIGH: Crash risk from empty names - added null safety with "?" fallback
- Fixed HIGH: Removed out-of-scope logout button (moved to Story 1.4)
- Fixed MEDIUM: Added useMemo for performance optimization
- Fixed MEDIUM: Added accessibility attributes (role="group", aria-labels)
- Fixed MEDIUM: Enhanced edge case handling (whitespace, special chars, lowercase)
- Added 6 new edge case tests (empty, whitespace, special chars, lowercase, multiple spaces, accessibility)
- Test count increased from 15 to 22 tests - all passing
- Build successful with no errors

### File List

#### Created Files
- `/components/shared/userProfile.tsx` - User profile display component (enhanced with null safety, memoization, accessibility)
- `/components/shared/userProfile.test.tsx` - Component tests (14 tests: 8 original + 6 edge cases)
- `/app/(participant)/layout.tsx` - Participant dashboard layout (logout button removed, kept for Story 1.4)
- `/app/(participant)/layout.test.tsx` - Layout tests (5 tests: 4 original + 1 scope verification)
- `/app/(participant)/page.tsx` - Main participant dashboard page
- `/app/(participant)/page.test.tsx` - Page tests (3 tests)
- `/components/ui/avatar.tsx` - shadcn/ui Avatar component
- `/jest.config.js` - Jest configuration
- `/jest.setup.js` - Jest setup file

#### Modified Files
- `/package.json` - Added test scripts and testing dependencies

#### Reused Files (from Story 1-2)
- `/lib/actions/auth.ts` - `getCurrentUser()` Server Action (no user.ts created - reused existing)
