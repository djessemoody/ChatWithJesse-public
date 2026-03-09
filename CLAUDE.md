# ChatWithJesse

A chatbot web application that emulates talking to Jesse — text and voice conversation with an AI that mirrors his personality, speaking style, and knowledge.

## Key Documentation

- **`PLAN.md`** — Project roadmap, completed milestones, upcoming phases, and future considerations
- **`ARCHITECTURE.md`** — System architecture, data flow diagrams, component details, API integrations, infrastructure, and design decisions

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **AI:** OpenAI GPT-4o (chat), Whisper (STT), ElevenLabs (TTS)
- **Infra:** Docker (single container), GitHub Actions CI

## Commands

```bash
# Install dependencies
cd client && npm install
cd server && npm install

# Development
cd client && npm run dev
cd server && npm run dev

# Build
cd client && npm run build
cd server && npm run build

# Test
cd client && npm test          # Vitest
cd server && npm test          # Jest

# Responsive screenshot capture (requires Chromium — see below)
cd client && npm run test:screenshots

# One-time Chromium install for screenshots (if not pre-cached)
cd client && npm run test:screenshots:install

# Type check (client only — server type checks during build)
cd client && npx tsc -b --noEmit

# Docker
docker build -t chatwith-jesse .
docker run -p 3001:3001 --env-file server/.env chatwith-jesse
```

## Environment Variables

### Server (`server/.env`)
```
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
PORT=3001
```

## Guidelines for Claude

### General
- Always read files before editing them
- Keep code simple and focused — avoid over-engineering
- Use TypeScript throughout (frontend and backend)
- Prefer small, incremental commits
- Run tests before committing: `cd client && npm test` and `cd server && npm test` — for UI/styling changes, also run `cd client && npm run test:screenshots` and review the output (see Testing section)
- For multi-file or multi-concern tasks, ask if an agent team would be helpful before starting

### Security
- Never commit `.env` files or API keys
- Do not log or expose API keys in error messages or responses
- Validate and sanitize user input at API boundaries

### Coding Conventions
- **TypeScript strict mode** — no `any` types unless absolutely necessary; prefer explicit types
- **Functional components only** — no class components in React
- **Named exports** — prefer named exports over default exports for components and utilities
- **One component per file** — each React component gets its own `.tsx` file in `components/`
- **Hooks in `hooks/`** — custom hooks go in `client/src/hooks/` prefixed with `use`
- **Services are stateless** — functions in `services/` should be pure or side-effect-only (API calls), no internal state
- **API routes** — all backend routes are under `/api/*` (e.g., `/api/chat`, `/api/voice`)

### Testing
- **Client:** Vitest + Testing Library — test files live next to the source file (e.g., `ChatInput.test.tsx`)
- **Server:** Jest + supertest — test files live in `src/__tests__/`
- Write tests for new features and bug fixes
- Mock external API calls (OpenAI, ElevenLabs) — never make real API calls in tests

#### Visual Review (Responsive Screenshots)
When running tests to validate work — especially after UI or styling changes — also run responsive screenshot testing:
1. Run `cd client && npm run test:screenshots` to capture screenshots at 5 viewport sizes (mobile portrait, mobile landscape, tablet, small desktop, large desktop)
2. Read the generated PNG files in `client/screenshots/` and review each one for:
   - Layout issues (overflow, clipping, elements off-screen)
   - Spacing and alignment problems
   - Text readability (too small, truncated, overlapping)
   - Component visibility (elements that should be hidden/shown at that breakpoint)
   - Overall visual quality (does it look intentional, not broken?)
3. Report any issues found, grouped by viewport size
4. If screenshots can't be generated (e.g., no Chromium installed), note it and continue with unit tests only — don't block the commit

**Playwright/Chromium setup notes:**
- `@playwright/test` is pinned to exactly `1.56.0` — this matches the Chromium 1194 binary pre-cached on cloud sandbox images at `~/.cache/ms-playwright/chromium-1194/`
- The config uses explicit viewport sizes (not device presets like `devices["iPhone 14"]`) so all projects run on Chromium — no WebKit dependency needed
- If Chromium is missing, try `npm run test:screenshots:install`. If that fails (sandbox network restrictions), screenshots can't run — continue without them
- Do not upgrade `@playwright/test` without verifying the new version's expected Chromium revision matches what's cached

### Branching & Git Workflow
- **`main`** is production — only merged to by the user after testing on `develop`
- **`develop`** is the integration branch — all feature branches target `develop`
- **Feature branches** are created from `develop` (e.g., `feat/phase-4-tts`, `fix/voice-bug`)
- Flow: `feature-branch` → PR to `develop` → user tests `develop` → user merges to `main`
- Never push directly to `main` or `develop` — always use feature branches and PRs
- When creating a new branch, always base it on `develop`: `git checkout -b <branch> develop`

### Commit Messages
Use conventional commit format:
```
feat: add voice recording button
fix: handle empty chat response
refactor: extract persona loading into service
test: add ChatWindow rendering tests
docs: update CLAUDE.md with coding conventions
chore: update dependencies
```

### Dependencies
- Do not add new dependencies without asking first
- Use `fetch` (native) for HTTP requests on the client — no axios
- Use the `openai` SDK for OpenAI API calls on the server

### Project Documentation — MANDATORY
**`PLAN.md`** and **`ARCHITECTURE.md`** are the source of truth for this project. **You MUST keep them up to date as you work, not after the fact.**

#### When to update `PLAN.md`:
- When you **start** a new task or phase — update the status to "In progress"
- When you **complete** a task — check it off, add commit hashes, update the status
- When plans change — add, remove, or reorder tasks
- When new work is discovered during implementation — add it to the plan
- When you move a "Future Consideration" into active work — move it to the appropriate phase

#### When to update `ARCHITECTURE.md`:
- When you add, remove, or rename a **component, hook, service, or route**
- When you add or change **data flow** (new API calls, new state, new integrations)
- When you add a new **external dependency or API integration**
- When the **component tree, request flow diagrams, or key files tables** become outdated
- When you add **design decisions** — document the decision and rationale
- When **test counts** change significantly (new test files, major additions)

#### Rules:
- Update these files **in the same commit** as the code changes, not in a follow-up
- Read both files before starting any feature work to understand current state
- If you realize documentation is stale, fix it immediately
- Never leave "(Phase N)" placeholders in architecture diagrams after that phase is implemented

### File Boundaries — Ask Before Modifying
- `server/src/persona/*` — Jesse's personality and knowledge base; changes affect AI behavior
- `Dockerfile` / `docker-compose.yml` — deployment config
- `.github/workflows/*` — CI/CD pipeline
- `CLAUDE.md` — this file
