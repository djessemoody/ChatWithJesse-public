x-# ChatWithJesse — Project Plan

This document tracks the project roadmap, completed milestones, and upcoming work. Update this file whenever plans change or milestones are reached.

---

## Completed Milestones

### Phase 0 — Planning & Documentation
_Commits: `2aab9ab`, `13f1e4c`, `3dfe6d2`_

- [x] Created CLAUDE.md with full project plan — tech stack, API integrations, persona design, deployment strategy
- [x] Defined flat-file knowledge base structure (`jesse.json`, `bio.md`, `knowledge.md`, `links.json`)
- [x] Documented OpenAI prompt caching strategy (automatic, ~50% input token savings)
- [x] Evaluated Claude API as alternative LLM (200K context, 90% cache savings)
- [x] Designed single-container Docker deployment — Express serves React static files + API on one port
- [x] Defined 4-phase implementation roadmap

### Phase 1 — Scaffold & Text Chat
_Commits: `899e0c3`, `1fe156f`_

- [x] Initialized React + Vite + TypeScript + Tailwind frontend
- [x] Built chat UI components: `ChatWindow`, `MessageBubble`, `ChatInput`
- [x] Created `useChat` hook for conversation state management
- [x] Created `api.ts` service for frontend-to-backend communication
- [x] Initialized Express + TypeScript backend
- [x] Built `POST /api/chat` route with message validation
- [x] Integrated OpenAI GPT-4o chat completions via `openai` SDK
- [x] Built persona system — loads `jesse.json`, `bio.md`, `knowledge.md`, `links.json` into system prompt
- [x] Created multi-stage Dockerfile (build client → build server → production image)
- [x] Created `docker-compose.yml` for local Docker runs
- [x] End-to-end text chat working

### Infrastructure — Testing & CI
_Commits: `6866776`, `be76970`, `37062af`, `dee303e`_

- [x] Added Vitest + Testing Library for client (37 tests across components, hooks, services)
- [x] Added Jest + supertest for server (31 tests across routes, services, persona)
- [x] Extracted Express app into `app.ts` for testability (separate from server startup)
- [x] Created GitHub Actions workflow — runs client and server tests on push/PR to main

### Bug Fixes from Test Discovery
_Commits: `64e4528`, `d64832c`_

- [x] Fixed server crash on malformed `jesse.json` / `links.json` — added safe JSON parsing with fallbacks
- [x] Fixed missing input validation on `/api/chat` — now rejects missing role, invalid roles, missing/non-string content
- [x] Fixed unused variable TypeScript error in `ChatInput.test.tsx`

### Documentation — Operational Guidelines
_Commits: `2c6861d`_

- [x] Expanded CLAUDE.md with coding conventions, testing workflow, commit format, dependency policy, file boundaries
- [x] Created PLAN.md (this file) and ARCHITECTURE.md for ongoing project documentation

---

## Current Phase

### Persona Content Pipeline
_Status: In progress_

Setting up the infrastructure for building out Jesse's persona — templates, raw content workflow, and documentation.

- [x] Create `persona/templates/` with annotated template files (`jesse.json.template`, `bio.md.template`, `knowledge.md.template`, `links.json.template`)
- [x] Create `persona/dump/` staging directory for raw human-written content
- [x] Create `persona/README.md` documenting the persona system and content workflow
- [ ] Populate persona files with real content (ongoing — driven by dump/ content)

---

### Phase 3 — Test Coverage & Bug Fixes
_Status: Complete_

Audit-driven phase to close test gaps, fix discovered bugs, and harden existing functionality before adding new features.

#### 3a — Bug Fixes (discovered during audit)

- [x] Fix `VoiceButton.tsx` dead code — removed unused `onTranscription` from props interface and `App.tsx`
- [x] Fix `whisper.ts` mimetype mismatch — added `mimetype` parameter (default `"audio/webm"`), passed from voice route via `req.file.mimetype`
- [x] Fix `persona.ts` link formatting — `label` and `description` now optional; falls back to URL for label, omits description suffix if missing
- [x] Fix `persona.ts` traits handling — added `Array.isArray` guard with string fallback

#### 3b — Critical: New test files for untested modules

- [x] Add `App.test.tsx` — 10 tests: hook integration, prop passing to children, transcription callback (trim + send), disabled state propagation
- [x] Add `app.test.ts` (server) — 9 tests: CORS headers, JSON body parsing, API route routing, SPA fallback, wrong-method handling

#### 3c — High priority: Fill gaps in existing tests

- [x] `useChat.test.ts` — added 5 tests: concurrent sends, empty/whitespace messages, non-Error thrown, console.error verification
- [x] `routes/voice.ts` tests — added 4 tests: empty file (0 bytes), wrong field name, mimetype passthrough, filename passthrough
- [x] `services/api.ts` tests — added 3 tests: missing reply field, empty string reply, JSON parse failure on ok response
- [x] `VoiceButton.test.tsx` — added 4 tests: disabled + recording combined state, rapid clicks, both aria-label states

#### 3d — Medium priority: Edge cases and hardening

- [x] `ChatWindow.test.tsx` — added 3 tests: scrollIntoView on message changes, scrollIntoView on loading changes, large message list (100 items)
- [x] `persona.test.ts` — added 5 tests: whitespace-only bio/knowledge, falsy name/tone/speakingStyle defaults, missing link label/description, traits as string, traits as object
- [x] `openai.test.ts` — added 4 tests: 429 rate limit, 401 auth error, timeout, undefined message object
- [x] `whisper.test.ts` — added 5 tests: 429 rate limit, 401 auth error, timeout, undefined response fields, mimetype passthrough to File
- [x] `routes/chat.ts` tests — added 4 tests: empty string content, very long content, 100+ message array, non-Error thrown
- [x] `useVoice.test.ts` — added 3 tests: RMS just above threshold, onTranscription not called on failure, rapid start/stop cycles

#### 3e — Low priority: Polish

- [x] `ChatInput.test.tsx` — added 3 tests: unicode/emoji input, very long input strings, button re-enables as user types
- [x] `MessageBubble.test.tsx` — added 4 tests: empty content string, very long single word, no blue on assistant, no gray on user

---

## Completed Milestones (continued)

### Phase 2 — Voice Input (Whisper)
_Status: Complete_
_Commits: `74c9c46`, `c6710a6`, `d62661c`_

- [x] Add microphone capture in browser using MediaRecorder API
- [x] Create `VoiceButton` component with "Press to talk" / "Click to send" UI and wave animation
- [x] Create `useVoice` hook for recording state, audio capture, and silence detection
- [x] Add silence auto-detection via Web Audio API (`AudioContext` + `AnalyserNode`) — auto-stops and sends after 1.5s of silence
- [x] Create `POST /api/voice/transcribe` backend route with multer file upload
- [x] Integrate OpenAI Whisper API on server (`server/src/services/whisper.ts`)
- [x] Feed transcribed text into existing chat pipeline via `onTranscription` callback
- [x] Add `transcribeAudio()` to client API service
- [x] Wire `VoiceButton` into `App.tsx` with `useVoice` hook
- [x] Add Tailwind wave animation keyframes for recording indicator
- [x] Add tests: 14 useVoice tests (including silence detection), 9 VoiceButton tests, 7 voice API tests, 7 voice route tests, 7 whisper service tests
- [x] Fix: use `File` constructor instead of `Readable` stream for Whisper API upload (OpenAI SDK compatibility)

### Phase 4 — Voice Output (ElevenLabs)
_Status: Complete_

- [x] Create `server/src/services/elevenlabs.ts` — `synthesizeSpeech()` calls ElevenLabs TTS API, returns audio/mpeg Buffer
- [x] Create `POST /api/voice/speak` route — accepts `{ text }` JSON, validates input (max 5000 chars), returns audio/mpeg binary
- [x] Add `speakText()` to client API service — POSTs text, returns audio Blob
- [x] Create `useAudioPlayback` hook — manages play/stop/loading state, Audio element lifecycle, object URL cleanup
- [x] Add play/stop buttons on assistant messages in `MessageBubble`
- [x] Add voice mode toggle in header — auto-plays new assistant messages when enabled
- [x] Add tests: 9 elevenlabs service, 10 voice/speak route, 8 speakText API, 13 useAudioPlayback hook, 7 MessageBubble audio controls

### Phase 5 — Polishing Chat Experience

The chat will eventually be one section of a larger personal site (resume, links, portfolio, etc.), so this phase focuses on making the chat experience feel complete and solid on its own before integrating it into a broader layout.

- [x] Loading states and animations (typing indicator, message fade-in, send button, audio spinner)
- [ ] Error handling UI (toast notifications, retry buttons)
- [ ] Mobile responsiveness
- [x] Rate limiting and basic abuse prevention on API routes
- [ ] Performance testing with persona context in system prompt

---

### Profile Sidebar & Portfolio Links
_Status: In progress_

Adding a profile sidebar to transform the site from a standalone chat into the beginning of a professional portfolio.

- [x] Create `ProfileSidebar` component with profile image, name/title, and external links (GitHub, LinkedIn, Patent)
- [x] Update `App.tsx` layout — horizontal flex with sidebar + chat column
- [x] Add SVG icons for GitHub, LinkedIn, and Patent links
- [x] Add `ProfileSidebar.test.tsx` — 7 tests covering rendering, links, and accessibility
- [x] Sidebar hidden on mobile (`hidden md:flex`), shown on medium+ screens
- [ ] Add profile image file (`client/public/jesse-profile.jpg`)

---

### Visual Design Enhancement
_Status: Complete_

Upgraded the entire UI from a flat monochromatic dark theme to a richer, more dynamic personal site aesthetic.

- [x] Sidebar gradient background (deep blue-to-indigo)
- [x] Animated conic-gradient glow ring around profile photo
- [x] Per-link brand-colored hover states (GitHub white, LinkedIn sky, Patent amber)
- [x] Decorative gradient divider between profile info and links
- [x] Glassmorphism header with backdrop blur and gradient text
- [x] Gradient user message bubbles (indigo-to-purple) with drop shadows
- [x] Glass-effect assistant message bubbles with subtle border
- [x] Glassmorphism chat input with gradient send button
- [x] Updated voice toggle and voice button to glass styling
- [x] Typing indicator updated to match glass theme
- [x] Updated tests to match new class names (144 client tests passing)

---

### "How I Built This" Section
_Status: Complete_

Added a new section to the site telling the story of building the app with Claude Code, with tab-based navigation to switch between Chat and the build story.

- [x] Create `HowItsMade` component with timeline, stats, approach, learnings, and tech stack
- [x] Add tab navigation to `App.tsx` — `Chat` | `How I Built This` toggle
- [x] Voice toggle hides when viewing the build story section
- [x] Accessible navigation with `aria-current` and `aria-label`
- [x] Add `HowItsMade.test.tsx` — 10 tests covering rendering, links, sections, and scrollability
- [x] Add 4 App tab-switching tests — view toggling, voice toggle visibility, aria-current
- [x] All 158 client tests passing

---

### Chat Response Optimizations
_Status: In progress_

Improving the quality of chat responses for both text and voice output.

- [x] Strip markdown formatting (bold, italic, headers, bullets, links, code) from text before sending to ElevenLabs TTS — prevents TTS from pronouncing `*`, `#`, backticks, etc.
- [x] Add brevity instructions to system prompt — GPT now keeps responses short and conversational by default, only going into detail when explicitly asked
- [x] Instruct GPT to avoid markdown formatting in responses since output may be spoken aloud via TTS
- [x] Add `stripMarkdownForTTS` tests (9 tests) and update persona/elevenlabs tests
- [x] Add `react-markdown` to render markdown in assistant chat bubbles (bold, italic, lists, code, links, headers)
- [x] Add `.prose-chat` CSS for markdown elements inside glass-style assistant bubbles
- [x] User messages remain plain text (no markdown rendering)
- [x] Add 3 MessageBubble tests for markdown rendering
- [x] Fix long response TTS playback — chunk text at sentence boundaries (~1000 chars), synthesize chunks in parallel with 30s timeout, concatenate MP3 buffers. Prevents timeouts on 3+ paragraph responses.
- [x] Add `chunkText` function with 8 tests (chunking, concatenation, timeout signal, sentence splitting, word fallback)

---

### Security Hardening
_Status: Complete_

Comprehensive security improvements to protect API routes, prevent abuse, and follow Express security best practices.

- [x] Add `express-rate-limit` — 20 req/min for chat, 10 req/min for voice (more expensive API calls)
- [x] Add `helmet` — security headers (CSP, X-Content-Type-Options, X-Frame-Options, etc.)
- [x] Restrict CORS — configurable origin via `CORS_ORIGIN` env var (open by default for dev)
- [x] Add JSON body size limit — `express.json({ limit: '1mb' })` to prevent memory exhaustion
- [x] Add multer file size limit — 25MB max for audio uploads
- [x] Add chat message limits — max 100 messages per request, max 10,000 chars per message
- [x] Add API 404 handler — JSON `{ error }` response for unmatched `/api/*` routes (before SPA catch-all)
- [x] Harden Dockerfile — run production container as non-root `node` user
- [x] Add security test suite — 14 tests covering headers, limits, body size, and 404 handling
- [x] Update existing tests for new validation rules (message length/count limits)

---

### Parallax Background Effect
_Status: Complete_

Added subtle parallax floating shapes behind the chat area for visual depth and polish.

- [x] Create `ParallaxBackground` component with 12 floating geometric shapes (circles, rings, diamonds, dots)
- [x] Shapes drift slowly with CSS `parallax-drift` animation at varied speeds and delays
- [x] Mouse-based parallax — shapes shift based on cursor position, with different depths creating a layered effect
- [x] Very subtle opacity (0.03–0.08) so shapes never distract from content
- [x] Integrated into `App.tsx` behind header and chat content (z-layered)
- [x] `aria-hidden="true"` for accessibility — decorative only
- [x] Add `ParallaxBackground.test.tsx` — 6 tests covering rendering, accessibility, and styling
- [x] All 167 client tests passing

---

### Responsive Screenshot Testing
_Status: Complete_

Added Playwright-based screenshot capture for visual review of the site at multiple viewport sizes. Claude analyzes the screenshots to catch layout issues, overflow, spacing, and alignment problems.

- [x] Add `@playwright/test` as dev dependency
- [x] Create `playwright.config.ts` with 5 viewport projects (mobile portrait, mobile landscape, tablet, small desktop, large desktop)
- [x] Create `e2e/responsive-screenshots.spec.ts` — captures 4 views (empty chat, chat with message, how-its-made, how-its-made scrolled) at each viewport size (20 screenshots total)
- [x] Add `test:screenshots` and `test:screenshots:install` npm scripts
- [x] Exclude `e2e/` from Vitest config to avoid conflicts
- [x] Add screenshot PNGs to `.gitignore`
- [x] All 168 client + 128 server tests still passing

---

## Future Considerations

- **Personal site integration** — Embed chat as one section of a larger site with resume, links, portfolio, etc. Chat becomes ~1/3 of the overall layout.
- **Production deployment** — Deploy to a Docker host (Railway, Render, Fly.io, or similar)
- **RAG for knowledge base** — If persona context grows beyond ~128K tokens, add vector search (OpenAI Embeddings + ChromaDB/Pinecone) instead of stuffing everything into the system prompt
- **Claude API swap** — Replace OpenAI GPT-4o with Claude Sonnet 4.6 (`@anthropic-ai/sdk`) for 200K context (vs 128K), up to 90% prompt cache savings (vs 50%), and strong persona-style conversation. Swap is isolated to `server/src/services/openai.ts` — replace `chat.completions.create()` with `messages.create()`. Would still need OpenAI for Whisper (STT), so two API providers.
- **Conversation persistence** — Save chat history to a database so users can resume conversations
- **Multi-user support** — Session management, optional auth
