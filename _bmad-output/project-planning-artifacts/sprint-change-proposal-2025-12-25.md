# Sprint Change Proposal

**Project:** servus-raffle
**Date:** 2025-12-25
**Author:** Ben (facilitated by Correct Course workflow)
**Status:** ✅ Approved (2025-12-25)

---

## Section 1: Issue Summary

### Problem Statement

Meetup.com OAuth authentication, as originally specified in FR1 and Story 1-2, requires a **premium Meetup subscription**. This external dependency creates a blocker for the current authentication implementation.

### Context

- **Discovery Point:** During implementation of Epic 1, Story 1-2 (Implement Meetup OAuth Authentication)
- **Issue Type:** External limitation / technical constraint
- **Evidence:** Meetup API documentation confirms OAuth is a premium-only feature

### Proposed Solution

Pivot from Meetup OAuth to **email/password authentication** using Supabase Auth's built-in email provider. This achieves the same functional goal (users can authenticate and participate in raffles) without external dependencies or subscription costs.

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact Level | Description |
|------|--------------|-------------|
| Epic 1: Project Foundation & User Authentication | **Moderate** | Goal and 2 stories need updating |
| Epic 2: Raffle Creation & QR Codes | None | No auth-specific dependencies |
| Epic 3: Participant Joining & Ticket System | None | References "authenticated user" generically |
| Epic 4: Prize Management | None | No auth-specific dependencies |
| Epic 5: Admin Dashboard & Participant Visibility | None | No auth-specific dependencies |
| Epic 6: Live Draw Experience | None | No auth-specific dependencies |

**Summary:** Only Epic 1 requires modifications. The core goal "Users can sign in and see their profile" remains valid - only the mechanism changes.

### Story Impact

| Story | Current Status | Impact |
|-------|----------------|--------|
| 1-1: Initialize Project | done | No change needed |
| 1-2: Implement Meetup OAuth | done | **Needs rewrite** - pivot to email/password |
| 1-3: Display User Profile | done | Minor update - remove Meetup references |
| 1-4: Implement User Logout | done | No change needed - logout works the same |

### Artifact Conflicts

| Artifact | Conflicts Found | Changes Required |
|----------|-----------------|------------------|
| Functional Requirements | FR1, FR2 reference Meetup | Update to email/password |
| Non-Functional Requirements | NFR11 specifies Meetup OAuth | Update to Supabase email auth |
| Epic 1 Description | References "Meetup account" | Update goal statement |
| Story 1-2 | Entirely about Meetup OAuth | Complete rewrite |
| Story 1-3 | References "profile from Meetup" | Minor text updates |
| UX Design Spec | "Sign in with Meetup" flow | Update 3 sections |
| Database Schema | `meetup_id` column | Change to `email` column |

### Technical Impact

| Component | Change Required |
|-----------|-----------------|
| Supabase Auth Config | Enable email provider (already available) |
| Users Table | Replace `meetup_id` with `email` column |
| Login UI | Replace OAuth button with email/password form |
| Registration Flow | Add sign-up form with name, email, password |
| Profile Display | Use stored name/avatar instead of Meetup API data |

---

## Section 3: Recommended Approach

### Selected Path: Direct Adjustment

**Rationale:**
1. The core goal (users can authenticate) remains unchanged
2. Email/password is **simpler** and has **no external dependencies**
3. Supabase Auth already supports email/password out of the box
4. No scope reduction or MVP modification needed
5. Existing code structure can be adapted, not replaced entirely

### Effort Estimate: **Low**

| Task | Effort |
|------|--------|
| Document updates (epics.md, UX spec) | ~30 minutes |
| Database schema change | ~15 minutes |
| Auth UI changes (login/signup forms) | ~1-2 hours |
| Profile display adjustments | ~30 minutes |
| Testing | ~1 hour |

**Total:** ~3-4 hours of implementation work

### Risk Assessment: **Low**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Email deliverability issues | Low | Disable email confirmation for MVP |
| User friction with sign-up | Low | Minimal form fields (name, email, password) |
| Losing "one-tap" convenience | Medium | Accept as trade-off; still simple flow |

### Trade-offs Considered

| OAuth (Original) | Email/Password (New) |
|------------------|----------------------|
| ✓ One-tap login | ✓ No external dependencies |
| ✓ No password to remember | ✓ No premium subscription needed |
| ✗ Requires Meetup premium | ✓ Works with free Supabase tier |
| ✗ External service dependency | ✓ Full control over auth |

---

## Section 4: Detailed Change Proposals

### 4.1 Functional Requirements Updates

#### FR1
```diff
- FR1: Users can authenticate using their Meetup.com account via OAuth
+ FR1: Users can authenticate using email and password
```

#### FR2
```diff
- FR2: Users can view their profile information pulled from Meetup.com
+ FR2: Users can view their profile information (name, avatar)
```

#### NFR11
```diff
- NFR11: Meetup.com OAuth 2.0 authentication
+ NFR11: Supabase email/password authentication
```

### 4.2 Epic 1 Goal Update

```diff
- **Goal:** Users can sign in with their Meetup account and see their profile.
+ **Goal:** Users can sign in with email/password and see their profile.
```

### 4.3 Story 1-2 Complete Rewrite

**Old Title:** Implement Meetup OAuth Authentication
**New Title:** Implement Email/Password Authentication

**New Acceptance Criteria:**

```markdown
Given the Supabase project
When authentication is configured
Then Supabase Auth email/password provider is enabled
And email confirmation is disabled for MVP simplicity

Given the database
When the users table is created
Then the `users` table exists with columns:
  - `id` (uuid, primary key)
  - `email` (text, unique)
  - `name` (text)
  - `avatar_url` (text, nullable)
  - `created_at` (timestamptz)
And RLS policies allow users to read their own record

Given an unauthenticated user on the login page
When they enter email and password and click "Sign In"
Then they are authenticated via Supabase Auth
And redirected to the participant dashboard
And a session cookie is set for persistent authentication

Given a new user
When they click "Sign Up"
Then they see a registration form with email, password, and name fields
And after successful registration, they are logged in automatically
And a user record is created in the users table

Given a returning user
When they sign in with their email/password
Then the system identifies them by their email
And their existing user record is used (not duplicated)
```

### 4.4 Story 1-3 Updates

```diff
  Given an authenticated user
  When they view the participant dashboard
- Then their name from Meetup is displayed
- And their avatar image from Meetup is displayed
+ Then their name is displayed
+ And their avatar image is displayed (or default placeholder)
```

### 4.5 FR Coverage Map Update

```diff
- | FR1 | Epic 1 | Meetup.com OAuth authentication |
- | FR2 | Epic 1 | View profile information from Meetup |
+ | FR1 | Epic 1 | Email/password authentication |
+ | FR2 | Epic 1 | View profile information |
```

### 4.6 UX Design Specification Updates

**Section: Core User Experience > Defining Experience**
```diff
- Tap once for Meetup.com OAuth, and immediately see "You have X tickets."
+ Sign in with email/password, and immediately see "You have X tickets."
```

**Section: User Journey Flows > Journey 1: First-Timer Felix**
```diff
- E[Landing: 'Sign in with Meetup']
- F[Tap OAuth button]
- G[Meetup OAuth popup]
+ E[Landing: 'Sign In / Sign Up']
+ F[Enter email/password]
+ G[Submit form]
```

**Section: Anti-Patterns to Avoid**
```diff
- | Account creation forms | Kills event participation | OAuth only |
+ | Complex account forms | Kills event participation | Minimal required fields |
```

### 4.7 Database Schema Change

```diff
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-   meetup_id TEXT UNIQUE NOT NULL,
+   email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
-   avatar_url TEXT NOT NULL,
+   avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
```

---

## Section 5: Implementation Handoff

### Scope Classification: **Minor**

This change can be implemented directly by the development team without requiring backlog reorganization or architectural review.

### Handoff Recipients

| Role | Responsibility |
|------|----------------|
| **Developer** | Implement code changes for auth flow |
| **Developer** | Update database schema |
| **Developer** | Update document artifacts |

### Implementation Sequence

1. **Update Documents** (epics.md, ux-design-spec) - 30 min
2. **Modify Database Schema** - 15 min
   - Drop `meetup_id` column (or rename to `email`)
   - Make `avatar_url` nullable
3. **Update Auth UI** - 1-2 hours
   - Replace OAuth button with login form
   - Add sign-up form with name field
4. **Update Profile Display** - 30 min
   - Use stored name instead of Meetup API
   - Add default avatar handling
5. **Test Complete Flow** - 1 hour
   - Sign up → Login → View profile → Logout

### Success Criteria

- [ ] User can sign up with email, password, and name
- [ ] User can sign in with email and password
- [ ] User profile displays their name correctly
- [ ] Default avatar shown when no avatar_url
- [ ] User can log out successfully
- [ ] Returning users are recognized by email
- [ ] No references to "Meetup" remain in user-facing UI

### Definition of Done

- All acceptance criteria in updated Story 1-2 pass
- Story 1-3 acceptance criteria still pass with updates
- Story 1-4 (logout) continues to work unchanged
- Epic 1 goal is achieved with new auth mechanism
- Documents updated to reflect changes

---

## Appendix: Files to Modify

| File | Changes |
|------|---------|
| `_bmad-output/project-planning-artifacts/epics.md` | FR1, FR2, NFR11, Epic 1 goal, Stories 1-2, 1-3, FR Coverage Map |
| `_bmad-output/project-planning-artifacts/ux-design-specification.md` | 3 sections with Meetup references |
| `supabase/migrations/*.sql` | Users table schema |
| `app/(auth)/login/page.tsx` | Login form instead of OAuth |
| `app/(auth)/signup/page.tsx` | New signup page |
| `components/profile-display.tsx` | Remove Meetup-specific logic |

---

**Document generated by Correct Course workflow**
**Awaiting approval before implementation**
