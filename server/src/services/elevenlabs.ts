const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

// Max characters per TTS chunk — keeps each ElevenLabs request fast and reliable.
const MAX_CHUNK_LENGTH = 1000;

// Timeout per ElevenLabs API call (ms).
const TTS_TIMEOUT_MS = 30_000;

// Pronunciation overrides: map words to phonetic spellings for ElevenLabs TTS.
// "Jesse" is pronounced "Jess" (silent E), not "Jess-ee".
const PRONUNCIATION_MAP: ReadonlyMap<RegExp, string> = new Map([
  [/\bJesse\b/g, "Jess"],
  [/\bjesse\b/g, "jess"],
  [/\bJESSE\b/g, "JESS"],
]);

// Strip markdown formatting that TTS engines pronounce literally.
// GPT sometimes returns bold (**text**), italic (*text*), headers, etc.
export function stripMarkdownForTTS(text: string): string {
  let result = text;
  // Remove bold/italic markers: ***text***, **text**, *text*
  result = result.replace(/\*{1,3}(.+?)\*{1,3}/g, "$1");
  // Remove markdown headers (## Header)
  result = result.replace(/^#{1,6}\s+/gm, "");
  // Remove markdown links [text](url) → text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Remove bullet markers at start of lines (- or *)
  result = result.replace(/^[\s]*[-*]\s+/gm, "");
  // Remove backtick code formatting
  result = result.replace(/`([^`]+)`/g, "$1");
  return result;
}

export function applyPronunciationFixes(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PRONUNCIATION_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// Split text into chunks at sentence boundaries, keeping each under maxLen.
// Falls back to splitting at word boundaries if a single sentence exceeds maxLen.
export function chunkText(text: string, maxLen: number = MAX_CHUNK_LENGTH): string[] {
  if (text.length <= maxLen) {
    return [text];
  }

  const chunks: string[] = [];
  // Split into sentences (keep the delimiter attached to the preceding text)
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];

  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length <= maxLen) {
      current += sentence;
    } else {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      // If a single sentence is longer than maxLen, split at word boundaries
      if (sentence.length > maxLen) {
        const words = sentence.split(/\s+/);
        current = "";
        for (const word of words) {
          if (current.length + word.length + 1 <= maxLen) {
            current += (current ? " " : "") + word;
          } else {
            if (current.trim()) {
              chunks.push(current.trim());
            }
            current = word;
          }
        }
      } else {
        current = sentence;
      }
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  // If sentence regex didn't match (no sentence-ending punctuation), the
  // original text was returned as a single element. Split it by word boundary.
  if (chunks.length === 1 && chunks[0].length > maxLen) {
    const words = chunks[0].split(/\s+/);
    chunks.length = 0;
    let segment = "";
    for (const word of words) {
      if (segment.length + word.length + 1 <= maxLen) {
        segment += (segment ? " " : "") + word;
      } else {
        if (segment.trim()) chunks.push(segment.trim());
        segment = word;
      }
    }
    if (segment.trim()) chunks.push(segment.trim());
  }

  return chunks;
}

async function synthesizeChunk(text: string, apiKey: string, voiceId: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errorBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new Error("ElevenLabs API key or voice ID not configured");
  }

  const processed = applyPronunciationFixes(stripMarkdownForTTS(text));
  const chunks = chunkText(processed);

  if (chunks.length === 1) {
    return synthesizeChunk(chunks[0], apiKey, voiceId);
  }

  // Synthesize chunks in parallel and concatenate MP3 buffers.
  // MP3 is frame-based, so buffers can be concatenated directly.
  const buffers = await Promise.all(
    chunks.map((chunk) => synthesizeChunk(chunk, apiKey, voiceId))
  );

  return Buffer.concat(buffers);
}
