interface TimelineEntry {
  phase: string;
  title: string;
  description: string;
  detail?: string;
}

const timeline: TimelineEntry[] = [
  {
    phase: "Phase 1",
    title: "The Plan",
    description:
      "Started by writing a CLAUDE.md file — a single document laying out the full vision: tech stack, persona design, API integrations, deployment strategy, and a phased roadmap. Everything Claude needed to understand what I was building and why.",
    detail:
      "This became the project's source of truth. Every session, Claude read it first and picked up exactly where we left off.",
  },
  {
    phase: "Phase 2",
    title: "Scaffold to Working Chat",
    description:
      "One prompt scaffolded the entire project — React frontend, Express backend, TypeScript config, Docker setup, and a working chat UI connected to GPT-4o. End-to-end text conversation working from a single session.",
    detail:
      "I reviewed every file Claude generated. The architecture was clean — hooks for state, services for API calls, one component per file. Exactly how I'd structure it myself.",
  },
  {
    phase: "Phase 3",
    title: "Tests Before Features",
    description:
      "Before adding voice, I had Claude write the test suite first — 68 tests across client and server. The tests immediately caught bugs: missing input validation, unsafe JSON parsing, a crash on malformed persona files.",
    detail:
      "Writing tests first wasn't just good practice — it was a forcing function. Claude found edge cases I hadn't considered, and fixing them before building more features saved real time.",
  },
  {
    phase: "Phase 4",
    title: "Voice In, Voice Out",
    description:
      "Added Whisper speech-to-text and ElevenLabs text-to-speech in two focused sessions. Microphone capture with silence auto-detection, server-side transcription, and audio playback with per-message controls.",
    detail:
      "The Whisper integration hit a snag — the OpenAI SDK rejected Node.js Readable streams. Claude diagnosed it and swapped to the File constructor. Later, ElevenLabs kept pronouncing my name \"Jess-ee\" instead of \"Jess\" — so I had Claude add a pronunciation map that quietly fixes it before sending text to the TTS API. Little details like that are what make it feel real.",
  },
  {
    phase: "Phase 5",
    title: "The Deep Test Pass",
    description:
      "Ran a comprehensive test audit — not just coverage numbers, but actually reading every module and asking \"what could break?\" Went from 68 to 236 tests. Found and fixed dead code, mimetype mismatches, and trait parsing bugs.",
    detail:
      "This was a multi-agent session. I had Claude spawn parallel agents to audit different parts of the codebase simultaneously — one for components, one for hooks, one for server services. Each agent found issues the others wouldn't have caught.",
  },
  {
    phase: "Phase 5b",
    title: "Visual Testing",
    description:
      "Added Playwright-based responsive screenshot testing — the app is captured at 5 viewport sizes (mobile portrait, mobile landscape, tablet, small desktop, large desktop) and Claude reviews the screenshots for layout issues.",
    detail:
      "This turned visual QA from a manual \"resize the browser and squint\" process into something repeatable. Claude reads the actual PNG screenshots and catches overflow, spacing issues, and alignment problems I'd miss staring at code.",
  },
  {
    phase: "Phase 6",
    title: "Making It Personal",
    description:
      "Built a persona content pipeline — templates, a staging directory for raw content, and documentation for the workflow. Then I dumped my actual resume and LinkedIn text into the staging area, and Claude transformed it into structured persona files.",
    detail:
      "This was the most collaborative part. I provided the raw material — my career history, patents, the way I actually talk — and Claude structured it while preserving my voice. The result: an AI that sounds like me, not like a chatbot.",
  },
  {
    phase: "Phase 7",
    title: "Design & Polish",
    description:
      "Added the profile sidebar, then iterated on the visual design through 5+ rounds of refinement — glassmorphism, gradient message bubbles, animated glow ring, brand-colored link hovers. Went from \"functional\" to \"portfolio-worthy.\"",
    detail:
      "The sidebar alone went through multiple commits: layout, mobile responsiveness, text tweaks, image format fix, description stacking. Real design work is iterative, and Claude kept up with every adjustment.",
  },
];

const stats = [
  { label: "PRs Merged", value: "35+" },
  { label: "Tests Written", value: "296" },
  { label: "Mini Sessions, One Weekend", value: "2 days" },
  { label: "Lines of Code", value: "5,600+" },
];

export function HowItsMade() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:px-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent mb-3">
            How I Built This
          </h2>
          <p className="text-gray-400 leading-relaxed">
            This entire app — frontend, backend, tests, deployment config, and the
            page you're reading now — was built with{" "}
            <a
              href="https://claude.ai/code"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Claude Code
            </a>
            . Not generated and forgotten. Directed, reviewed, and iterated on —
            the way you'd work with a sharp collaborator who never gets tired.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl px-4 py-3 text-center"
            >
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-4">Tech Stack</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { category: "Frontend", tech: "React 19, TypeScript, Vite, Tailwind CSS" },
              { category: "Backend", tech: "Node.js, Express, TypeScript" },
              { category: "AI / Chat", tech: "OpenAI GPT-4o" },
              { category: "Voice Input", tech: "OpenAI Whisper (STT)" },
              { category: "Voice Output", tech: "ElevenLabs (TTS)" },
              { category: "Infrastructure", tech: "Docker, GitHub Actions CI" },
              { category: "Testing", tech: "Vitest + Jest + Playwright (296 tests)" },
              { category: "Built With", tech: "Claude Code (Anthropic)" },
            ].map((item) => (
              <div key={item.category} className="glass rounded-lg px-4 py-2.5">
                <span className="text-indigo-300 text-xs font-medium">
                  {item.category}
                </span>
                <div className="text-gray-300 text-sm">{item.tech}</div>
              </div>
            ))}
          </div>
        </div>

        {/* My approach */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-3">My Approach</h3>
          <p className="text-gray-400 leading-relaxed mb-4">
            I didn't just ask Claude to "build me a chatbot." I architected the
            system, wrote the project plan, chose the tech stack, and made every
            design decision. Claude was the execution engine — I was the engineer.
          </p>
          <p className="text-gray-400 leading-relaxed">
            The key was{" "}
            <span className="text-indigo-300">starting with a clear plan</span>.
            A single CLAUDE.md file gave Claude full context on every session: what
            we're building, how it should be structured, what conventions to follow,
            and what not to touch. That document evolved throughout the project and
            became the reason every session felt like picking up where I left off.
          </p>
        </div>

        {/* Timeline */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-6">The Build</h3>
          <div className="space-y-6">
            {timeline.map((entry, i) => (
              <div key={i} className="relative pl-6 border-l border-indigo-500/30">
                <div className="absolute left-0 top-1 w-2.5 h-2.5 -translate-x-[5.5px] rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
                <div className="text-xs text-indigo-400 font-medium mb-1">
                  {entry.phase}
                </div>
                <h4 className="text-white font-semibold mb-1">{entry.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed mb-1">
                  {entry.description}
                </p>
                {entry.detail && (
                  <p className="text-gray-500 text-sm leading-relaxed italic">
                    {entry.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* What I learned */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-3">
            What I Learned
          </h3>
          <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
            <p>
              <span className="text-white font-medium">
                The plan is everything.
              </span>{" "}
              Most people jump straight into prompting. I spent the first session
              just writing the plan — tech stack decisions, persona architecture,
              deployment strategy. That upfront investment paid for itself every
              single session after.
            </p>
            <p>
              <span className="text-white font-medium">
                Actually look at what's being built.
              </span>{" "}
              Every PR deploys to a Render preview so I can see, click, and test
              what changed — not just read the diff. Code review matters, but
              there's no substitute for pulling it up and using it. That
              feedback loop caught things no line-by-line review would.
            </p>
            <p>
              <span className="text-white font-medium">
                Tests catch what you miss.
              </span>{" "}
              Having Claude write tests against its own code sounds circular, but
              it works. The test audit caught 6 bugs that would have shipped to
              production. Tests aren't just validation — they're a second pair of
              eyes on your assumptions.
            </p>
            <p>
              <span className="text-white font-medium">
                Multi-agent for breadth, single-agent for depth.
              </span>{" "}
              I used parallel agents when I needed to audit the full codebase at
              once, and single focused sessions for feature work that required
              understanding the whole system. Knowing when to split and when to
              stay focused made a real difference.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs pb-8">
          <p>
            Source code:{" "}
            <a
              href="https://github.com/djessemoody/ChatWithJesse-public"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              github.com/djessemoody/ChatWithJesse-public
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
