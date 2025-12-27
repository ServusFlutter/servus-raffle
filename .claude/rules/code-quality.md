# Code Quality Workflow

## Lint Must Pass

Before committing any code changes, you MUST run linting and ensure it passes with **zero errors and zero warnings**:

```bash
bun run lint
```

Expected output:
```
Checked XX files in Xms. No fixes applied.
```

If there are any errors or warnings, fix them before committing.

## Fixing Lint Issues

```bash
# Auto-fix formatting and safe issues
bun run format

# Fix import ordering and other issues
bunx biome check --fix --unsafe

# Verify clean
bun run lint
```

## Common Lint Rules

| Rule | Fix |
|------|-----|
| `noNonNullAssertion` | Use optional chaining (`data?.field`) or validated env modules |
| `noConsoleLog` | Use `console.info` for informational logs, `console.error` for errors |
| `noForEach` | Use `for...of` loops instead |
| `organizeImports` | Run `bunx biome check --fix --unsafe` |
| `useNodejsImportProtocol` | Use `'node:path'` instead of `'path'` |

## Environment Variables

Never use `process.env.VAR!` with non-null assertions. Instead, use the validated env modules:

```typescript
// App code (lib/)
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

// Test code (tests/)
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/tests/env'
```

These modules validate at startup and throw clear errors if variables are missing.

## Pre-Commit Checklist

Before every commit:

1. **Run lint**: `bun run lint` - must show zero errors/warnings
2. **Run tests**: `bun run test` - must pass
3. **Run format** (if needed): `bun run format`

## Anti-Patterns

```typescript
// WRONG: Non-null assertion on env vars
const url = process.env.SUPABASE_URL!

// CORRECT: Use validated env module
import { SUPABASE_URL } from '@/lib/env'

// WRONG: console.log for informational output
console.log('Starting setup...')

// CORRECT: Use console.info
console.info('Starting setup...')

// WRONG: forEach
items.forEach(item => process(item))

// CORRECT: for...of
for (const item of items) {
  process(item)
}
```
