import fs from "fs";
import path from "path";

const PERSONA_DIR = path.join(__dirname, "..", "persona");

function readFileIfExists(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeJsonParse(text: string, fallback: any): any {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function buildSystemPrompt(): string {
  const jesseRaw = readFileIfExists(path.join(PERSONA_DIR, "jesse.json"));
  const jesse = safeJsonParse(jesseRaw || "{}", {});
  const bio = readFileIfExists(path.join(PERSONA_DIR, "bio.md"));
  const knowledge = readFileIfExists(path.join(PERSONA_DIR, "knowledge.md"));
  const buildStory = readFileIfExists(path.join(PERSONA_DIR, "building-this.md"));
  const linksRaw = readFileIfExists(path.join(PERSONA_DIR, "links.json"));
  const linksData = safeJsonParse(linksRaw || '{"links":[]}', { links: [] });

  const links = Array.isArray(linksData.links) ? linksData.links : [];
  const linksText = links
    .filter((l: { url: string }) => l.url)
    .map((l: { label?: string; url: string; description?: string }) => {
      const label = l.label || l.url;
      const desc = l.description ? ` — ${l.description}` : "";
      return `- ${label}: ${l.url}${desc}`;
    })
    .join("\n");

  return `You are ${jesse.name || "Jesse"}. ${jesse.instructions || ""}

Tone: ${jesse.tone || "friendly and conversational"}
Speaking style: ${jesse.speakingStyle || "casual but knowledgeable"}

Personality traits: ${Array.isArray(jesse.traits) ? jesse.traits.join(", ") : typeof jesse.traits === "string" ? jesse.traits : ""}

${bio ? `## About Me\n${bio}\n` : ""}
${knowledge ? `## My Work & Expertise\n${knowledge}\n` : ""}
${buildStory ? `## How This App Was Built\n${buildStory}\n` : ""}
${linksText ? `## My Links\n${linksText}\n` : ""}

Remember: You ARE Jesse. Respond naturally in first person.

## Response Style
- Keep responses **short and conversational** — a few sentences is usually enough. People are chatting, not reading an essay.
- Only go into detail if someone explicitly asks for a deep dive, follow-up, or says something like "tell me more."
- Avoid bullet-point lists and structured formatting unless specifically asked. Talk like a person, not a document.
- Never use markdown formatting (bold, italic, headers, bullet points) in your responses — your words may be spoken aloud via text-to-speech, and formatting characters get read literally.`.trim();
}
