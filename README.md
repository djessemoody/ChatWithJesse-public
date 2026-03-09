> **Public mirror of a private repo (without previous commit history).** Some files (persona data, CI workflows) have been removed. See the live site at [localtoast.io](https://localtoast.io).

# ChatWithJesse

A chatbot web application that emulates talking to Jesse — text and voice conversation with an AI that mirrors his personality, speaking style, and knowledge. Built entirely with [Claude Code](https://claude.ai/code).

## Features

- **Text chat** — Conversational AI powered by OpenAI GPT-4o with a detailed persona system
- **Voice input** — Microphone recording with silence auto-detection via Web Audio API, transcribed by OpenAI Whisper
- **Voice output** — Text-to-speech via ElevenLabs with a cloned voice, per-message playback controls, and auto-play voice mode
- **Persona system** — Flat-file knowledge base (bio, career history, patents, speaking style) injected as system prompt context
- **Profile sidebar** — Photo, name/title, and external links (GitHub, LinkedIn, Patent)
- **"How I Built This" page** — Timeline, stats, and tech stack telling the build story
- **Visual design** — Glassmorphism, gradient message bubbles, animated glow ring, parallax background
- **Security** — Helmet headers, rate limiting, CORS config, body size limits, non-root Docker user

## Quick Start (Development)

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Start dev servers (run in separate terminals)
cd client && npm run dev    # http://localhost:5173
cd server && npm run dev    # http://localhost:3001
```

Create `server/.env` with your API keys (see [Environment Variables](#environment-variables) below).

## Docker

Build and run as a single container:

```bash
docker build -t chatwith-jesse .
docker run -p 3001:3001 --env-file server/.env chatwith-jesse
```

Or use docker-compose:

```bash
docker compose up
```

The app will be available at `http://localhost:3001`.

## Testing

```bash
# Unit tests
cd client && npm test          # Vitest — 168 tests
cd server && npm test          # Jest — 128 tests

# Responsive screenshot capture (requires Chromium)
cd client && npm run test:screenshots:install   # one-time setup
cd client && npm run test:screenshots           # captures at 5 viewport sizes
```

The screenshot tests capture the site at mobile (portrait + landscape), tablet, and desktop viewpoints for visual review.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key for chat completions (GPT-4o) and Whisper speech-to-text |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key for text-to-speech with cloned voice (voice mode only) |
| `ELEVENLABS_VOICE_ID` | No | ElevenLabs voice ID for Jesse's cloned voice (voice mode only) |
| `PORT` | No | Server port (default: `3001`) |
| `CORS_ORIGIN` | No | Allowed CORS origins, comma-separated (default: allow all) |

### Setup

Copy the example env file and fill in your keys:

```bash
cp server/.env.example server/.env
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **AI:** OpenAI GPT-4o (chat), OpenAI Whisper (STT), ElevenLabs (TTS)
- **Testing:** Vitest + Testing Library (client), Jest + supertest (server), Playwright (visual)
- **Deployment:** Single Docker container, GitHub Actions CI
- **Built with:** [Claude Code](https://claude.ai/code) (Anthropic)

## Project Stats

- 35+ PRs merged
- 296 tests (168 client + 128 server)
- 5,600+ lines of TypeScript
- Built over mini sessions across one weekend

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — Project instructions and coding conventions for Claude Code
- **[PLAN.md](PLAN.md)** — Project roadmap, completed milestones, and future considerations
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System architecture, data flow, components, and design decisions

## License

See [LICENSE](LICENSE) for details.
