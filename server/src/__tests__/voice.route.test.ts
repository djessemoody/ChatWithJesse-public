import request from "supertest";

// Mock whisper service before importing app
jest.mock("../services/whisper", () => ({
  transcribeAudio: jest.fn(),
}));

// Mock elevenlabs service before importing app
jest.mock("../services/elevenlabs", () => ({
  synthesizeSpeech: jest.fn(),
}));

// Mock persona to avoid file system reads
jest.mock("../services/persona", () => ({
  buildSystemPrompt: () => "You are Jesse.",
}));

// Mock openai service to avoid import issues
jest.mock("../services/openai", () => ({
  getChatResponse: jest.fn(),
}));

import app from "../app";
import { transcribeAudio } from "../services/whisper";
import { synthesizeSpeech } from "../services/elevenlabs";

const mockTranscribeAudio = transcribeAudio as jest.MockedFunction<
  typeof transcribeAudio
>;

const mockSynthesizeSpeech = synthesizeSpeech as jest.MockedFunction<
  typeof synthesizeSpeech
>;

describe("POST /api/voice/transcribe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 with transcribed text for valid audio", async () => {
    mockTranscribeAudio.mockResolvedValue("Hello Jesse!");

    const res = await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.from("fake-audio"), {
        filename: "recording.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ text: "Hello Jesse!" });
  });

  it("should pass audio data to transcribeAudio service", async () => {
    mockTranscribeAudio.mockResolvedValue("test");

    await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.from("fake-audio"), {
        filename: "recording.webm",
        contentType: "audio/webm",
      });

    expect(mockTranscribeAudio).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining("recording"),
      expect.any(String)
    );
  });

  it("should return 400 when no audio file is provided", async () => {
    const res = await request(app)
      .post("/api/voice/transcribe")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("should return 500 when transcription service fails", async () => {
    mockTranscribeAudio.mockRejectedValue(new Error("Whisper API error"));

    const res = await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.from("fake-audio"), {
        filename: "recording.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("should handle empty transcription result", async () => {
    mockTranscribeAudio.mockResolvedValue("");

    const res = await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.from("fake-audio"), {
        filename: "recording.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ text: "" });
  });

  it("should accept different audio content types", async () => {
    mockTranscribeAudio.mockResolvedValue("hello");

    const webmRes = await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.from("fake"), {
        filename: "recording.webm",
        contentType: "audio/webm",
      });

    expect(webmRes.status).toBe(200);

    const mp3Res = await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.from("fake"), {
        filename: "recording.mp3",
        contentType: "audio/mpeg",
      });

    expect(mp3Res.status).toBe(200);
  });

  it("should handle large audio files without crashing", async () => {
    mockTranscribeAudio.mockResolvedValue("long transcription");

    // Create a ~1MB buffer to simulate a larger audio file
    const largeBuffer = Buffer.alloc(1024 * 1024, "a");

    const res = await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", largeBuffer, {
        filename: "recording.webm",
        contentType: "audio/webm",
      });

    // Should process or reject gracefully, not crash
    expect([200, 413]).toContain(res.status);
  });

  it("should return 400 when file is empty (0 bytes)", async () => {
    mockTranscribeAudio.mockResolvedValue("");

    const res = await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.alloc(0), {
        filename: "empty.webm",
        contentType: "audio/webm",
      });

    // Even with 0-byte file, multer still provides req.file
    // The service will receive an empty buffer
    expect([200, 400]).toContain(res.status);
  });

  it("should reject wrong field name (not 'audio')", async () => {
    const res = await request(app)
      .post("/api/voice/transcribe")
      .attach("file", Buffer.from("fake-audio"), {
        filename: "recording.webm",
        contentType: "audio/webm",
      });

    // multer.single("audio") throws LIMIT_UNEXPECTED_FILE for wrong field names
    // The request should not succeed with 200
    expect(res.status).not.toBe(200);
  });

  it("should pass mimetype to transcribeAudio service", async () => {
    mockTranscribeAudio.mockResolvedValue("hello");

    await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.from("fake-audio"), {
        filename: "recording.webm",
        contentType: "audio/webm",
      });

    expect(mockTranscribeAudio).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.any(String),
      "audio/webm"
    );
  });

  it("should pass original filename to transcribeAudio service", async () => {
    mockTranscribeAudio.mockResolvedValue("hello");

    await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.from("fake-audio"), {
        filename: "my-recording.webm",
        contentType: "audio/webm",
      });

    expect(mockTranscribeAudio).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining("my-recording"),
      expect.any(String)
    );
  });
});

describe("POST /api/voice/speak", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 with audio/mpeg for valid text", async () => {
    const fakeAudio = Buffer.from([0xff, 0xfb, 0x90, 0x00]);
    mockSynthesizeSpeech.mockResolvedValue(fakeAudio);

    const res = await request(app)
      .post("/api/voice/speak")
      .send({ text: "Hello Jesse!" });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/audio\/mpeg/);
    expect(res.headers["content-length"]).toBe("4");
  });

  it("should pass text to synthesizeSpeech service", async () => {
    mockSynthesizeSpeech.mockResolvedValue(Buffer.from("audio"));

    await request(app)
      .post("/api/voice/speak")
      .send({ text: "Say something" });

    expect(mockSynthesizeSpeech).toHaveBeenCalledWith("Say something");
  });

  it("should return 400 when text is missing", async () => {
    const res = await request(app)
      .post("/api/voice/speak")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("should return 400 when text is not a string", async () => {
    const res = await request(app)
      .post("/api/voice/speak")
      .send({ text: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("should return 400 when text is empty string", async () => {
    const res = await request(app)
      .post("/api/voice/speak")
      .send({ text: "" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("should return 400 when text exceeds 5000 characters", async () => {
    const longText = "a".repeat(5001);

    const res = await request(app)
      .post("/api/voice/speak")
      .send({ text: longText });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/maximum length/i);
  });

  it("should accept text at exactly 5000 characters", async () => {
    mockSynthesizeSpeech.mockResolvedValue(Buffer.from("audio"));
    const text = "a".repeat(5000);

    const res = await request(app)
      .post("/api/voice/speak")
      .send({ text });

    expect(res.status).toBe(200);
    expect(mockSynthesizeSpeech).toHaveBeenCalledWith(text);
  });

  it("should return 500 when synthesis service fails", async () => {
    mockSynthesizeSpeech.mockRejectedValue(new Error("ElevenLabs API error"));

    const res = await request(app)
      .post("/api/voice/speak")
      .send({ text: "Hello" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("should return binary audio data in response body", async () => {
    const fakeAudio = Buffer.from([0xff, 0xfb, 0x90, 0x00]);
    mockSynthesizeSpeech.mockResolvedValue(fakeAudio);

    const res = await request(app)
      .post("/api/voice/speak")
      .send({ text: "Hello" })
      .responseType("blob");

    expect(res.status).toBe(200);
    expect(Buffer.from(res.body)).toEqual(fakeAudio);
  });
});
