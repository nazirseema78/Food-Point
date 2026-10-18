# CLAUDE.md — Food-Point

All project rules, stack, folder layout and commands live in AGENTS.md. Follow them exactly:

@AGENTS.md

## Claude Code specifics

- **Plan first** for anything touching the schema, pricing, checkout or auth. Summarise the approach before editing.
- Before writing new code, search `src/lib`, `src/server` and `src/components` for an existing helper (`formatINR`, `calculateOrder`, `requireAdmin`, validators) and reuse it.
- After making changes, run `npm run lint && npm run typecheck && npm test` and report the real results. Don't claim success without running them.
- For UI work, start the dev server and check the page at mobile (360px) and desktop widths.
- Never run `prisma migrate reset`, drop tables, or delete data without explicit confirmation.
- Never print or commit values from `.env`.
- Shell: the owner develops on Windows. Keep npm scripts cross-platform (no bash-only syntax; use `cross-env` if env vars are needed in scripts).

## Current phase

**Phase 1 (MVP)** — see the build order in README.md. Work milestone by milestone and keep phase 2 features out unless asked.
