---
name: commit
description: Create well-formatted git commits with conventional commit messages and emoji. Use this skill AUTOMATICALLY when (1) the user asks to commit changes, (2) the user says "commit", "/commit", or similar, (3) after completing a task when the user asks to save/commit the work, (4) when git operations involve creating commits. This skill ensures atomic commits, suggests splitting large changes, and uses emoji conventional commit format.
---

# Commit

Create atomic, well-documented git commits using conventional commit format with emoji.

## Workflow

### 1. Check staged files

```bash
git status
```

If no files are staged, automatically stage all modified/new files:

```bash
git add -A
```

### 2. Analyze the diff

```bash
git diff --staged
```

Review staged changes to:
- Understand what's being committed
- Identify if multiple logical changes exist
- Determine appropriate commit type

### 3. Evaluate for commit splitting

Consider splitting if changes involve:
- Different concerns (unrelated code areas)
- Different change types (mixing features, fixes, refactoring)
- Different file patterns (source vs docs vs tests)
- Large changes that would be clearer as smaller commits

If splitting is recommended, help stage and commit changes separately.

### 4. Create commit message

Use emoji conventional commit format:

```
<emoji> <type>: <description>
```

**Commit types:**
| Emoji | Type | Use for |
|-------|------|---------|
| ✨ | feat | New feature |
| 🐛 | fix | Bug fix |
| 📝 | docs | Documentation |
| 💄 | style | Formatting/style |
| ♻️ | refactor | Code refactoring |
| ⚡️ | perf | Performance |
| ✅ | test | Tests |
| 🔧 | chore | Tooling/config |

For the complete emoji reference, see [references/emoji-guide.md](references/emoji-guide.md).

**Message guidelines:**
- Present tense, imperative mood ("add" not "added")
- First line under 72 characters
- Focus on "why" not "what"

### 5. Execute commit

```bash
git commit -m "<emoji> <type>: <description>"
```

Verify with `git status` after committing.

## Options

- `--no-verify`: Skip pre-commit hooks
- Specific files can be staged before running to commit only those files

## Examples

Good commit messages:
- `✨ feat: add user authentication system`
- `🐛 fix: resolve memory leak in rendering`
- `♻️ refactor: simplify error handling logic`
- `🔒️ fix: patch security vulnerability in auth`
