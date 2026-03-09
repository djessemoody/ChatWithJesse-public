import { transcribeAudio } from "../services/whisper";

// Mock the openai module
jest.mock("openai", () => {
  const mockTranscribe = jest.fn();
  return jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: mockTranscribe,
      },
    },
  }));
});

import OpenAI from "openai";

function getMockTranscribe() {
  const instance = new (OpenAI as unknown as jest.Mock)();
  return instance.audio.transcriptions.create as jest.Mock;
}

describe("transcribeAudio (Whisper service)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return transcribed text from Whisper API", async () => {
    const mockTranscribe = getMockTranscribe();
    mockTranscribe.mockResolvedValue({ text: "Hello Jesse!" });

    const audioBuffer = Buffer.from("fake-audio-data");
    const result = await transcribeAudio(audioBuffer, "audio.webm");

    expect(result).toBe("Hello Jesse!");
  });

  it("should call Whisper API with whisper-1 model", async () => {
    const mockTranscribe = getMockTranscribe();
    mockTranscribe.mockResolvedValue({ text: "test" });

    const audioBuffer = Buffer.from("fake-audio-data");
    await transcribeAudio(audioBuffer, "audio.webm");

    expect(mockTranscribe).toHaveBeenCalledWith(
      expect.objectContaining({ model: "whisper-1" })
    );
  });

  it("should pass audio file to Whisper API", async () => {
    const mockTranscribe = getMockTranscribe();
    mockTranscribe.mockResolvedValue({ text: "test" });

    const audioBuffer = Buffer.from("fake-audio-data");
    await transcribeAudio(audioBuffer, "audio.webm");

    expect(mockTranscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.anything(),
      })
    );
  });

  it("should propagate Whisper API errors", async () => {
    const mockTranscribe = getMockTranscribe();
    mockTranscribe.mockRejectedValue(new Error("API rate limit exceeded"));

    const audioBuffer = Buffer.from("fake-audio-data");
    await expect(
      transcribeAudio(audioBuffer, "audio.webm")
    ).rejects.toThrow("API rate limit exceeded");
  });

  it("should handle empty transcription result", async () => {
    const mockTranscribe = getMockTranscribe();
    mockTranscribe.mockResolvedValue({ text: "" });

    const audioBuffer = Buffer.from("fake-audio-data");
    const result = await transcribeAudio(audioBuffer, "audio.webm");

    expect(result).toBe("");
  });

  it("should handle null text in response", async () => {
    const mockTranscribe = getMockTranscribe();
    mockTranscribe.mockResolvedValue({ text: null });

    const audioBuffer = Buffer.from("fake-audio-data");
    const result = await transcribeAudio(audioBuffer, "audio.webm");

    // Should return empty string or fallback, not null
    expect(result).toBe("");
  });

  it("should accept different audio formats", async () => {
    const mockTranscribe = getMockTranscribe();
    mockTranscribe.mockResolvedValue({ text: "hello" });

    const audioBuffer = Buffer.from("fake-audio-data");

    // Should work with various file extensions
    await transcribeAudio(audioBuffer, "audio.mp3");
    await transcribeAudio(audioBuffer, "audio.wav");
    await transcribeAudio(audioBuffer, "audio.webm");

    expect(mockTranscribe).toHaveBeenCalledTimes(3);
  });

  it("should propagate 429 rate limit errors", async () => {
    const mockTranscribe = getMockTranscribe();
    const error = new Error("Rate limit exceeded");
    (error as unknown as Record<string, unknown>).status = 429;
    mockTranscribe.mockRejectedValue(error);

    const audioBuffer = Buffer.from("fake-audio-data");
    await expect(
      transcribeAudio(audioBuffer, "audio.webm")
    ).rejects.toThrow("Rate limit exceeded");
  });

  it("should propagate 401 auth errors", async () => {
    const mockTranscribe = getMockTranscribe();
    const error = new Error("Invalid API key");
    (error as unknown as Record<string, unknown>).status = 401;
    mockTranscribe.mockRejectedValue(error);

    const audioBuffer = Buffer.from("fake-audio-data");
    await expect(
      transcribeAudio(audioBuffer, "audio.webm")
    ).rejects.toThrow("Invalid API key");
  });

  it("should propagate timeout errors", async () => {
    const mockTranscribe = getMockTranscribe();
    mockTranscribe.mockRejectedValue(new Error("Request timed out"));

    const audioBuffer = Buffer.from("fake-audio-data");
    await expect(
      transcribeAudio(audioBuffer, "audio.webm")
    ).rejects.toThrow("Request timed out");
  });

  it("should handle undefined response fields", async () => {
    const mockTranscribe = getMockTranscribe();
    mockTranscribe.mockResolvedValue({});

    const audioBuffer = Buffer.from("fake-audio-data");
    const result = await transcribeAudio(audioBuffer, "audio.webm");

    expect(result).toBe("");
  });

  it("should use provided mimetype for the File constructor", async () => {
    const mockTranscribe = getMockTranscribe();
    mockTranscribe.mockResolvedValue({ text: "test" });

    const audioBuffer = Buffer.from("fake-audio-data");
    await transcribeAudio(audioBuffer, "audio.mp3", "audio/mpeg");

    const call = mockTranscribe.mock.calls[0][0];
    expect(call.file).toBeInstanceOf(File);
    expect(call.file.type).toBe("audio/mpeg");
  });
});
