import { describe, it, expect, vi, beforeEach } from "vitest";
import { transcribeAudio } from "./api";

describe("transcribeAudio", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should send audio blob and return transcribed text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ text: "Hello Jesse!" }),
    } as Response);

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    const result = await transcribeAudio(audioBlob);

    expect(result).toBe("Hello Jesse!");
  });

  it("should POST to /api/voice/transcribe with FormData", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ text: "transcribed text" }),
    } as Response);

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    await transcribeAudio(audioBlob);

    expect(mockFetch).toHaveBeenCalledWith("/api/voice/transcribe", {
      method: "POST",
      body: expect.any(FormData),
    });
  });

  it("should include audio file in FormData with correct field name", async () => {
    let capturedBody: FormData | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      capturedBody = init?.body as FormData;
      return {
        ok: true,
        json: async () => ({ text: "hello" }),
      } as Response;
    });

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    await transcribeAudio(audioBlob);

    expect(capturedBody).toBeInstanceOf(FormData);
    const audioFile = capturedBody!.get("audio");
    expect(audioFile).toBeTruthy();
  });

  it("should throw on non-ok response (400)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "No audio file provided" }),
    } as Response);

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    await expect(transcribeAudio(audioBlob)).rejects.toThrow(/400/);
  });

  it("should throw on non-ok response (500)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Transcription failed" }),
    } as Response);

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    await expect(transcribeAudio(audioBlob)).rejects.toThrow(/500/);
  });

  it("should propagate network errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("Failed to fetch")
    );

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    await expect(transcribeAudio(audioBlob)).rejects.toThrow("Failed to fetch");
  });

  it("should handle empty transcription result", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ text: "" }),
    } as Response);

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    const result = await transcribeAudio(audioBlob);

    expect(result).toBe("");
  });
});
