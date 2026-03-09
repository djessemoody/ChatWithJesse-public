# ChatWithJesse — Architecture

This document describes the system architecture, data flow, and key design decisions. Update this file whenever the architecture changes.

---

## System Overview

ChatWithJesse is a single-container web application where an Express backend serves both a React SPA and API routes. Users chat with an AI persona of Jesse powered by OpenAI GPT-4o.

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│                                                 │
│  React SPA (Vite build)                         │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ ChatWindow│  │ ChatInput│  │ VoiceButton  │ │
│  │           │  │          │  │              │ │
│  └─────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│        │              │               │         │
│        └──────┬───────┘               │         │
│               ▼                       ▼         │
│         useChat hook            useVoice hook    │
│               │                                 │
│               ▼                                 │
│         useAudioPlayback hook                   │
│               │                       │         │
│               ▼                       ▼         │
│          api.ts service                         │
│          (sendMessage, transcribeAudio,          │
│           speakText)                             │
│               │                                 │
└───────────────┼─────────────────────────────────┘
                │  HTTP (fetch)
                ▼
┌─────────────────────────────────────────────────┐
│              Express Server (:3001)             │
│                                                 │
│  Static files ──► client/dist/ (production)     │
│                                                 │
│  /api/chat ────────► chat.ts route              │
│                         │                       │
│                         ▼                       │
│                   openai.ts service             │
│                         │                       │
│                         ▼                       │
│                   persona.ts service            │
│                   ┌─────────────┐               │
│                   │ jesse.json     │               │
│                   │ bio.md         │               │
│                   │ knowledge.md   │               │
│                   │ building-this.md│              │
│                   │ links.json     │               │
│                   └─────────────┘               │
│                                                 │
│  /api/voice/transcribe ► voice.ts route          │
│                         │                       │
│                         ▼                       │
│                   whisper.ts service             │
│                                                 │
│  /api/voice/speak ────► voice.ts route            │
│                         │                       │
│                         ▼                       │
│                   elevenlabs.ts service          │
│                                                 │
└───────────────┼─────────────────────────────────┘
                │
                ▼
        ┌───────────────┐    ┌─────────────────┐
        │  OpenAI API   │    │  ElevenLabs API  │
        │  - GPT-4o     │    │  - TTS           │
        │  - Whisper    │    │                   │
        │               │    │                   │
        └───────────────┘    └─────────────────┘
```

---

## Frontend Architecture

### Tech: React 19 + TypeScript + Vite + Tailwind CSS

### Component Tree

```
App
├── ProfileSidebar (hidden on mobile, shown md+)
│   ├── Profile image (jesse-profile.jpg)
│   ├── Name + title
│   └── Nav links: GitHub, LinkedIn, Patent (with SVG icons)
├── Main column (flex-1, relative)
│   ├── ParallaxBackground (absolute, z-0, aria-hidden)
│   │   └── 12 floating shapes (circles, rings, diamonds, dots)
│   ├── Header (inline in App.tsx, relative z-10)
│   │   ├── Tab nav: Chat | How I Built This
│   │   └── Voice mode toggle button (chat view only)
│   ├── [Chat view — activeView === "chat"]
│   │   ├── ChatWindow
│   │   ├── MessageBubble (per message)
│   │   │   └── Play/Stop/Loading audio controls (assistant messages only)
│   │   └── TypingIndicator (bouncing dots, when loading)
│   │   ├── ChatInput
│   │   │   ├── Text input field
│   │   │   └── Send button
│   │   └── VoiceButton
│   │       ├── "Press to talk" (idle state)
│   │       └── "Click to send" + WaveAnimation (recording state)
│   │           └── 5 animated bars with staggered delays
│   └── [How I Built This view — activeView === "how-its-made"]
│       └── HowItsMade (scrollable build story page)
```

### State Management

No external state library — state lives in custom hooks:

**`useChat`** — conversation state:

| State        | Type             | Purpose                          |
|------------- |------------------|----------------------------------|
| `messages`   | `ChatMessage[]`  | Full conversation history        |
| `isLoading`  | `boolean`        | Disables input during API calls  |

Exposes: `{ messages, isLoading, send }`

**`useVoice`** — voice recording and silence detection:

| State         | Type              | Purpose                                    |
|---------------|-------------------|--------------------------------------------|
| `isRecording` | `boolean`         | Tracks active recording state              |
| `error`       | `string \| null`  | Mic permission or transcription errors     |

Internal refs (not re-render triggers):
- `mediaRecorderRef` — `MediaRecorder` instance
- `streamRef` — `MediaStream` for track cleanup
- `chunksRef` — accumulated audio `Blob[]`
- `audioContextRef` — `AudioContext` for silence detection
- `analyserRef` — `AnalyserNode` for volume monitoring
- `silenceStartRef` / `monitorIntervalRef` — silence timing

Exposes: `{ isRecording, error, startRecording, stopRecording }`

**`useAudioPlayback`** — TTS audio playback:

| State                | Type              | Purpose                                    |
|----------------------|-------------------|--------------------------------------------|
| `isPlaying`          | `boolean`         | Audio is actively playing                  |
| `isLoading`          | `boolean`         | Waiting for TTS API response               |
| `activeMessageIndex` | `number \| null`  | Which message is playing/loading           |

Internal refs (not re-render triggers):
- `audioRef` — `HTMLAudioElement` instance
- `objectUrlRef` — Object URL for cleanup (`URL.revokeObjectURL`)

Exposes: `{ isPlaying, isLoading, activeMessageIndex, play, stop }`

### Silence Detection

The `useVoice` hook uses the Web Audio API to auto-stop recording after silence:

```
MediaStream → AudioContext.createMediaStreamSource()
                    │
                    ▼
              AnalyserNode (fftSize: 2048)
                    │
                    ▼
          setInterval every 100ms:
            getFloatTimeDomainData() → calculate RMS
            if RMS < 0.01 for ≥ 1500ms → stopRecording()
            if RMS ≥ 0.01 → reset silence timer
```

- Silence threshold: RMS < 0.01
- Silence duration: 1500ms of continuous silence triggers auto-stop
- Graceful degradation: if AudioContext fails, manual stop still works
- Cleanup: AudioContext and intervals cleaned up on stop and unmount

### Key Files

| File                        | Responsibility                                     |
|-----------------------------|----------------------------------------------------|
| `src/main.tsx`              | React root render                                  |
| `src/App.tsx`               | Layout, wires hooks to components                  |
| `src/App.test.tsx`          | App integration tests (hooks, prop passing, transcription) |
| `src/components/ChatWindow.tsx` | Message list display, auto-scroll, loading state |
| `src/components/ChatInput.tsx`  | Text input form, send button                     |
| `src/components/MessageBubble.tsx` | Single message display — markdown rendering for assistant, plain text for user |
| `src/components/TypingIndicator.tsx` | Bouncing dots animation shown during AI response |
| `src/components/VoiceButton.tsx` | Voice record button with wave animation          |
| `src/components/ProfileSidebar.tsx` | Profile image, name/title, and external links (GitHub, LinkedIn, Patent) |
| `src/components/HowItsMade.tsx` | "How I Built This" page — build story, timeline, stats, tech stack |
| `src/components/ParallaxBackground.tsx` | Decorative parallax floating shapes — mouse-responsive depth effect |
| `src/hooks/useChat.ts`      | Conversation state, API call orchestration         |
| `src/hooks/useVoice.ts`     | Recording, silence detection, transcription flow   |
| `src/hooks/useAudioPlayback.ts` | TTS audio playback, play/stop lifecycle        |
| `src/services/api.ts`       | HTTP client — `sendMessage()`, `transcribeAudio()`, `speakText()` |
| `src/styles/global.css`     | Tailwind directives, gradient backgrounds, glassmorphism utilities, glow-ring animation, parallax-drift keyframes |
| `tailwind.config.js`        | Custom animations: wave, bounce_dot, fade-in-up, spin-slow, shimmer |

### Dev Server

Vite runs on port 5173 and proxies `/api/*` to `http://localhost:3001`.

---

## Backend Architecture

### Tech: Node.js + Express + TypeScript

### Request Flow

```
POST /api/chat
  │
  ▼
chat.ts route
  ├── Validate message array (role, content types)
  ├── Reject invalid input with 400
  │
  ▼
openai.ts → getChatResponse(messages)
  ├── Build system prompt via persona.ts
  ├── Prepend system message to conversation
  ├── Call OpenAI chat.completions.create()
  │     model: "gpt-4o"
  │     max_tokens: 1024
  ├── Return assistant message content
  │
  ▼
Response: { reply: string }
```

```
POST /api/voice/transcribe
  │
  ▼
voice.ts route
  ├── multer memoryStorage — parse multipart "audio" field
  ├── Reject missing file with 400
  │
  ▼
whisper.ts → transcribeAudio(buffer, filename, mimetype)
  ├── Convert buffer to File object (actual mimetype from upload)
  ├── Call OpenAI audio.transcriptions.create()
  │     model: "whisper-1"
  ├── Return transcribed text
  │
  ▼
Response: { text: string }
```

```
POST /api/voice/speak
  │
  ▼
voice.ts route
  ├── Validate text field (non-empty string, max 5000 chars)
  ├── Reject invalid input with 400
  │
  ▼
elevenlabs.ts → synthesizeSpeech(text)
  ├── Call ElevenLabs text-to-speech API
  │     model: "eleven_monolingual_v1"
  │     voice: ELEVENLABS_VOICE_ID
  ├── Return audio buffer (audio/mpeg)
  │
  ▼
Response: audio/mpeg binary
```

### Key Files

| File                          | Responsibility                                      |
|-------------------------------|-----------------------------------------------------|
| `src/index.ts`                | Server startup, port binding                        |
| `src/app.ts`                  | Express app config, middleware, routes, static files |
| `src/__tests__/app.test.ts`   | App middleware/routing tests (CORS, JSON, SPA fallback) |
| `src/routes/chat.ts`          | `/api/chat` POST handler with input validation      |
| `src/routes/voice.ts`         | `/api/voice/transcribe` and `/api/voice/speak` handlers |
| `src/services/openai.ts`      | OpenAI SDK client, `getChatResponse()`              |
| `src/services/whisper.ts`     | OpenAI Whisper client, `transcribeAudio()`          |
| `src/services/elevenlabs.ts`  | ElevenLabs TTS client, `synthesizeSpeech()`         |
| `src/services/persona.ts`     | Loads persona files, builds system prompt            |

### Persona System

The persona service (`persona.ts`) reads four files at call time and assembles a system prompt:

| File             | Format   | Contents                                     |
|------------------|----------|----------------------------------------------|
| `jesse.json`     | JSON     | Name, instructions, tone, speaking style, personality traits |
| `bio.md`         | Markdown | Resume, career history, education            |
| `knowledge.md`   | Markdown | Patents, projects, technical expertise       |
| `building-this.md` | Markdown | How this app was built — process, stats, tech stack, approach |
| `links.json`     | JSON     | Array of `{ url, label, description }` objects |

#### Persona Content Pipeline

The persona directory also includes a content authoring workflow:

```
persona/
├── jesse.json, bio.md, knowledge.md, building-this.md, links.json  ← Active (read at runtime)
├── templates/                                       ← Annotated reference templates
│   ├── jesse.json.template
│   ├── bio.md.template
│   ├── knowledge.md.template
│   └── links.json.template
└── dump/                                            ← Raw content staging area
```

- **`templates/`** — Documented templates showing expected structure, field purposes, and writing tips for each persona file. Not read at runtime.
- **`dump/`** — Staging directory where raw human-written content (LinkedIn text, resume snippets, notes, speech samples) is dropped. Claude processes dump files and updates the active persona files following the template structure.
- **`README.md`** — Documents the full persona system and content workflow.

The system prompt structure:
```
[jesse.json instructions]

Your personality traits: [traits]
Your speaking style: [style]
Your tone: [tone]

Background and Bio:
[bio.md contents]

Knowledge and Expertise:
[knowledge.md contents]

Important Links:
- [label] (url): description

## Response Style
- Keep responses short and conversational
- Only go into detail when explicitly asked
- Avoid markdown formatting (output may be spoken via TTS)
```

JSON files are parsed with try/catch fallbacks to prevent crashes on malformed data.

### TTS Text Processing

Before text is sent to ElevenLabs, three processing steps are applied in `elevenlabs.ts`:

1. **`stripMarkdownForTTS(text)`** — Removes markdown formatting that TTS engines pronounce literally:
   - Bold/italic markers (`**text**`, `*text*`, `***text***`)
   - Markdown headers (`## Header`)
   - Links (`[text](url)` → `text`)
   - Bullet markers (`- item`, `* item`)
   - Backtick code formatting (`` `code` ``)

2. **`applyPronunciationFixes(text)`** — Maps words to phonetic spellings (e.g., "Jesse" → "Jess")

3. **`chunkText(text)`** — Splits long text into chunks of ≤1000 characters at sentence boundaries. Each chunk is synthesized in parallel with a 30-second timeout (via `AbortController`), and the resulting MP3 buffers are concatenated. This prevents timeouts and playback failures on long responses (3+ paragraphs).

Processing order: markdown stripping → pronunciation fixes → chunking → parallel ElevenLabs API calls → buffer concatenation.

### Prompt Caching

OpenAI automatically caches the longest matching prefix of the prompt (system prompt + persona context). No code changes needed.
- Cached input tokens billed at **50% discount**
- Cache persists ~5-10 minutes of inactivity
- Minimum 1,024 tokens to trigger

### Alternative LLM: Claude (Anthropic)

The chat completions layer could be swapped to use **Claude API** (`@anthropic-ai/sdk`):
- **200K token context window** (1M in beta) — larger knowledge base without RAG
- **Prompt caching** offers up to **90% savings** on cached input tokens (vs OpenAI's 50%)
- Trade-off: would still need OpenAI for Whisper (speech-to-text), so two API providers
- To switch: replace `server/src/services/openai.ts` chat logic with Claude's `messages.create()` — the persona/knowledge injection pattern stays the same

### Input Validation

The `/api/chat` route validates each message in the array:
- `role` must be present and one of: `user`, `assistant`, `system`
- `content` must be present and a `string`
- `content` must not exceed 10,000 characters
- Messages array must not exceed 100 items
- Invalid messages return `400` with descriptive error

### Security Middleware

The Express app applies several security layers in `app.ts`:

**Helmet** — sets security headers:
- `Content-Security-Policy` — restricts resource loading to `'self'` (inline styles allowed for Tailwind)
- `X-Content-Type-Options: nosniff` — prevents MIME type sniffing
- `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
- Removes `X-Powered-By` header

**Rate Limiting** (`express-rate-limit`):
- `/api/chat` — 20 requests per minute per IP
- `/api/voice/*` — 10 requests per minute per IP (more expensive external API calls)
- Returns `429` with JSON error message when exceeded
- Skipped in test environment via `skip` option

**CORS** — configurable via `CORS_ORIGIN` env var:
- If set, restricts to specified origins (comma-separated)
- If unset, allows all origins (development default)

**Body Limits**:
- JSON body: 1MB max (`express.json({ limit: '1mb' })`)
- Audio upload: 25MB max (multer `limits.fileSize`)

**API 404 Handler** — `app.all("/api/*")` catch-all returns JSON `{ error }` instead of serving the SPA for unmatched API routes

---

## Infrastructure

### Docker (Production)

Multi-stage build:

| Stage | Base          | Purpose                                    |
|-------|---------------|--------------------------------------------|
| 1     | `node:20`     | Install client deps, run `npm run build`   |
| 2     | `node:20`     | Install server deps, run `npm run build`   |
| 3     | `node:20-alpine` | Production — server deps only, copies built artifacts |

Production container serves:
- `client/dist/` as static files (React SPA)
- `/api/*` routes (Express)
- SPA fallback: all non-API routes → `index.html`
- Single port: **3001**
- Runs as non-root `node` user for security

### CI/CD (GitHub Actions)

`.github/workflows/tests.yml` runs on push to `main` and PRs targeting `main`:

| Job           | Runtime  | Command      |
|---------------|----------|--------------|
| Server Tests  | Node 20  | `npm test` (Jest) |
| Client Tests  | Node 20  | `npm test` (Vitest) |

Jobs run in parallel with npm cache for speed.

### Environment Variables

All secrets loaded from `server/.env` (never committed):

| Variable             | Used By        | Purpose                     |
|----------------------|----------------|-----------------------------|
| `OPENAI_API_KEY`     | `openai.ts`    | OpenAI API authentication   |
| `ELEVENLABS_API_KEY` | `elevenlabs.ts`| ElevenLabs TTS API auth     |
| `ELEVENLABS_VOICE_ID`| `elevenlabs.ts`| Cloned voice model ID       |
| `PORT`               | `index.ts`     | Server port (default: 3001) |
| `CORS_ORIGIN`        | `app.ts`       | Allowed CORS origins, comma-separated (optional) |

---

## Testing Architecture

### Client Tests (Vitest + Testing Library)

- Test files co-located with source: `Component.test.tsx`
- Environment: jsdom (browser simulation)
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`)
- API calls mocked via `vi.mock()`

### Server Tests (Jest + supertest)

- Test files in: `src/__tests__/*.test.ts`
- Environment: Node
- HTTP testing via supertest against `app.ts` (no server startup)
- OpenAI SDK calls mocked via `jest.mock()`
- File system reads mocked for persona tests

### Responsive Screenshot Tests (Playwright)

- Separate from unit tests — runs via `npm run test:screenshots`
- Uses Playwright with real Chromium browser against the dev server
- 5 viewport projects: mobile portrait (iPhone 14), mobile landscape, tablet (iPad Mini), desktop small (1024×768), desktop large (1440×900)
- 4 test scenarios per viewport: empty chat, chat with message, how-its-made page, how-its-made scrolled
- Screenshots saved to `client/screenshots/` (gitignored, except `.gitkeep`)
- Designed for Claude to analyze — run screenshots, then ask Claude to review the PNG files for layout issues

**Key Files:**

| File | Responsibility |
|------|---------------|
| `playwright.config.ts` | Viewport projects, web server config, base URL |
| `e2e/responsive-screenshots.spec.ts` | Screenshot capture test scenarios |
| `screenshots/` | Output directory for captured PNGs |

### Test Counts (as of last update)

| Area              | Framework        | Tests |
|-------------------|------------------|-------|
| Client components | Vitest + RTL     | 92    |
| Client hooks      | Vitest           | 43    |
| Client services   | Vitest           | 24    |
| Server routes     | Jest + supertest | 38    |
| Server services   | Jest             | 68    |
| Server app        | Jest + supertest | 9     |
| Server security   | Jest + supertest | 14    |
| **Total**         |                  | **304** (168 client + 136 server) |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Single container (Express serves React) | Simpler deployment — one port, one process, no nginx |
| Flat-file persona (not database) | Easy to edit, version-controlled, small enough for context window |
| No external state library | App state is simple (messages + loading); `useState` in a hook suffices |
| Separate `app.ts` from `index.ts` | Allows supertest to import the Express app without starting the server |
| GPT-4o over fine-tuning | System prompt + persona files give enough control; fine-tuning is premature |
| Vitest for client, Jest for server | Vitest integrates natively with Vite; server uses Jest as the Node.js standard |
| Silence detection via Web Audio API | Native browser API, no dependencies; gracefully degrades if unavailable |
| `File` constructor for Whisper upload | OpenAI SDK rejects Node.js `Readable` streams; `File` is natively supported; mimetype passed from multer upload |
| multer memoryStorage for voice upload | Small audio files fit in memory; avoids temp file management |
| ElevenLabs TTS via native `fetch` | No SDK dependency needed; simple REST API with audio/mpeg response |
| Full audio buffer (not streaming) | Keeps it simple and consistent with whisper pattern; TTS responses are small enough |
| Chunk long TTS text (~1000 chars) | ElevenLabs struggles with long single requests (timeouts, failures); chunking + parallel synthesis keeps each call fast and reliable |
| Voice mode toggle in App.tsx | Simple boolean state; auto-plays new assistant messages via useEffect watching message count |
| CSS-only animations via Tailwind | All animations (bounce dots, fade-in, spin, glow-rotate) defined as Tailwind keyframes or global CSS — no JS animation libraries needed |
| Gradient + glassmorphism visual design | Rich indigo/purple palette with backdrop-blur glass effects, conic-gradient profile glow, and gradient message bubbles — all CSS-only, no extra dependencies |
| Tab-based view switching (no React Router) | Simple `useState` toggle between Chat and How I Built This views — avoids adding a dependency for just two views; can migrate to React Router later if more pages are added |
| `react-markdown` for assistant messages | Renders markdown as React components (no `dangerouslySetInnerHTML`); user messages stay plain text since users don't write markdown |
| No linter (yet) | TypeScript strict mode catches most issues; ESLint can be added later if needed |
| Playwright for visual testing (not Cypress) | Lightweight, fast browser automation; only used for screenshot capture, not full E2E testing; Vitest handles unit/integration tests |
| Claude-reviewed screenshots (not pixel-diff) | Human-in-the-loop visual review catches subjective issues (cramped layouts, overlap, poor spacing) that automated pixel-diff tools miss; no baseline service needed |
| Split rate limits (chat vs voice) | Voice routes trigger expensive external APIs (Whisper, ElevenLabs); stricter limit (10/min) vs chat (20/min) |
| Rate limit skip in test env | Using `skip` option instead of high max avoids test coupling; production limits stay explicit in code |
| CORS_ORIGIN env var (optional) | Open CORS for local dev; production can lock down to specific domain without code changes |
| Non-root Docker user | Limits blast radius if container is compromised; uses built-in `node` user from base image |
| API 404 before SPA catch-all | Prevents SPA HTML being served for mistyped API paths; returns proper JSON errors |
| CSS + RAF parallax (no library) | Mouse-tracked parallax via `requestAnimationFrame` + CSS `translate` animations — zero dependencies, minimal re-renders, `will-change: transform` for GPU compositing |
