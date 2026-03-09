import { synthesizeSpeech, applyPronunciationFixes, stripMarkdownForTTS, chunkText } from "../services/elevenlabs";

// Store original env
const originalEnv = { ...process.env };

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("synthesizeSpeech (ElevenLabs service)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = "test-api-key";
    process.env.ELEVENLABS_VOICE_ID = "test-voice-id";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return audio buffer from ElevenLabs API", async () => {
    const fakeAudio = new Uint8Array([0xff, 0xfb, 0x90, 0x00]);
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeAudio.buffer),
    });

    const result = await synthesizeSpeech("Hello world");

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(4);
  });

  it("should call ElevenLabs API with correct URL and voice ID", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    await synthesizeSpeech("test");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/text-to-speech/test-voice-id",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("should send correct headers", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    await synthesizeSpeech("test");

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers).toEqual(
      expect.objectContaining({
        "xi-api-key": "test-api-key",
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      })
    );
  });

  it("should send correct request body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    await synthesizeSpeech("Hello Jesse!");

    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    expect(body).toEqual({
      text: "Hello Jess!",
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    });
  });

  it("should strip markdown and apply pronunciation fixes in request body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    await synthesizeSpeech("**Hey** Jesse, check *this* out!");

    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    expect(body.text).toBe("Hey Jess, check this out!");
  });

  it("should throw when API key is missing", async () => {
    delete process.env.ELEVENLABS_API_KEY;

    await expect(synthesizeSpeech("test")).rejects.toThrow(
      "ElevenLabs API key or voice ID not configured"
    );
  });

  it("should throw when voice ID is missing", async () => {
    delete process.env.ELEVENLABS_VOICE_ID;

    await expect(synthesizeSpeech("test")).rejects.toThrow(
      "ElevenLabs API key or voice ID not configured"
    );
  });

  it("should throw on non-ok API response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('{"detail":{"message":"Unauthorized"}}'),
    });

    await expect(synthesizeSpeech("test")).rejects.toThrow(
      "ElevenLabs API error (401)"
    );
  });

  it("should throw on 429 rate limit response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve("Rate limit exceeded"),
    });

    await expect(synthesizeSpeech("test")).rejects.toThrow(
      "ElevenLabs API error (429)"
    );
  });

  it("should propagate network errors", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    await expect(synthesizeSpeech("test")).rejects.toThrow("Network error");
  });

  it("should chunk long text and concatenate audio buffers", async () => {
    // Create text longer than 1000 chars
    const longText = "This is a test sentence. ".repeat(60); // ~1500 chars

    const audioChunks: Buffer[] = [];
    mockFetch.mockImplementation(() => {
      const chunk = Buffer.from([0xff, 0xfb, audioChunks.length + 1]);
      audioChunks.push(chunk);
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength)),
      });
    });

    const result = await synthesizeSpeech(longText);

    expect(mockFetch.mock.calls.length).toBeGreaterThan(1);
    expect(result).toBeInstanceOf(Buffer);
    // Concatenated buffer should contain all chunks
    const expectedLength = audioChunks.reduce((sum, b) => sum + b.length, 0);
    expect(result.length).toBe(expectedLength);
  });

  it("should not chunk short text", async () => {
    const shortText = "Hello world, this is short.";
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
    });

    await synthesizeSpeech(shortText);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should include AbortController signal in fetch calls", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    await synthesizeSpeech("test");

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.signal).toBeDefined();
    expect(callArgs.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("chunkText", () => {
  it("should return single-element array for short text", () => {
    const result = chunkText("Hello world.", 1000);
    expect(result).toEqual(["Hello world."]);
  });

  it("should split long text at sentence boundaries", () => {
    const sentence = "This is a sentence. ";
    const text = sentence.repeat(10); // ~200 chars
    const result = chunkText(text, 100);

    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
    // All content should be preserved
    expect(result.join(" ").replace(/\s+/g, " ")).toContain("This is a sentence");
  });

  it("should handle text without sentence-ending punctuation", () => {
    const text = "word ".repeat(50); // ~250 chars, no periods
    const result = chunkText(text, 100);

    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
  });

  it("should handle single very long sentence", () => {
    const text = "word ".repeat(50) + "."; // single sentence, ~250 chars
    const result = chunkText(text, 100);

    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
  });

  it("should use default maxLen of 1000", () => {
    const shortText = "Hello.";
    expect(chunkText(shortText)).toEqual(["Hello."]);

    const longText = "Test sentence. ".repeat(100); // ~1500 chars
    const result = chunkText(longText);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(1000);
    }
  });
});

describe("stripMarkdownForTTS", () => {
  it("should remove bold markers (**text**)", () => {
    expect(stripMarkdownForTTS("This is **bold** text")).toBe("This is bold text");
  });

  it("should remove italic markers (*text*)", () => {
    expect(stripMarkdownForTTS("This is *italic* text")).toBe("This is italic text");
  });

  it("should remove bold+italic markers (***text***)", () => {
    expect(stripMarkdownForTTS("This is ***bold italic*** text")).toBe("This is bold italic text");
  });

  it("should remove markdown headers", () => {
    expect(stripMarkdownForTTS("## Section Title\nSome content")).toBe("Section Title\nSome content");
  });

  it("should remove markdown links, keeping text", () => {
    expect(stripMarkdownForTTS("Check out [my site](https://example.com)")).toBe("Check out my site");
  });

  it("should remove bullet markers", () => {
    expect(stripMarkdownForTTS("- First item\n* Second item")).toBe("First item\nSecond item");
  });

  it("should remove backtick code formatting", () => {
    expect(stripMarkdownForTTS("Use `npm install` to install")).toBe("Use npm install to install");
  });

  it("should handle text with no markdown", () => {
    expect(stripMarkdownForTTS("Just plain text")).toBe("Just plain text");
  });

  it("should handle multiple markdown types together", () => {
    const input = "## Title\n**Bold** and *italic* with [link](url)\n- bullet point";
    const result = stripMarkdownForTTS(input);
    expect(result).not.toContain("**");
    expect(result).not.toContain("##");
    expect(result).not.toContain("[link]");
    expect(result).toContain("Bold");
    expect(result).toContain("italic");
    expect(result).toContain("link");
  });
});

describe("applyPronunciationFixes", () => {
  it("should replace 'Jesse' with 'Jess'", () => {
    expect(applyPronunciationFixes("Hi Jesse!")).toBe("Hi Jess!");
  });

  it("should replace all occurrences of 'Jesse'", () => {
    expect(applyPronunciationFixes("Jesse said hi to Jesse")).toBe(
      "Jess said hi to Jess"
    );
  });

  it("should handle lowercase 'jesse'", () => {
    expect(applyPronunciationFixes("hey jesse")).toBe("hey jess");
  });

  it("should handle uppercase 'JESSE'", () => {
    expect(applyPronunciationFixes("JESSE is here")).toBe("JESS is here");
  });

  it("should not replace 'Jesse' inside other words", () => {
    expect(applyPronunciationFixes("Jesselyn")).toBe("Jesselyn");
  });

  it("should return text unchanged when no matches", () => {
    expect(applyPronunciationFixes("Hello world")).toBe("Hello world");
  });

  it("should handle mixed cases in one string", () => {
    expect(applyPronunciationFixes("Jesse and jesse and JESSE")).toBe(
      "Jess and jess and JESS"
    );
  });
});
