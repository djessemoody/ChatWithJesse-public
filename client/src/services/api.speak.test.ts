import { describe, it, expect, vi, beforeEach } from "vitest";
import { speakText } from "./api";

describe("speakText", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should send text and return audio blob", async () => {
    const mockBlob = new Blob(["audio-data"], { type: "audio/mpeg" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      blob: async () => mockBlob,
    } as Response);

    const result = await speakText("Hello there");
    expect(result).toBe(mockBlob);
  });

  it("should POST to /api/voice/speak with correct headers and body", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      blob: async () => new Blob(),
    } as Response);

    await speakText("Test text");

    expect(mockFetch).toHaveBeenCalledWith("/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Test text" }),
    });
  });

  it("should throw on non-ok response (400)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
    } as Response);

    await expect(speakText("")).rejects.toThrow("Speech request failed: 400");
  });

  it("should throw on non-ok response (500)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(speakText("test")).rejects.toThrow("Speech request failed: 500");
  });

  it("should propagate network errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("Failed to fetch")
    );

    await expect(speakText("test")).rejects.toThrow("Failed to fetch");
  });

  it("should handle long text input", async () => {
    const longText = "a".repeat(5000);
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      blob: async () => new Blob(),
    } as Response);

    await speakText(longText);

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1]!.body as string);
    expect(sentBody.text).toBe(longText);
  });

  it("should return a Blob instance on success", async () => {
    const audioBlob = new Blob([new Uint8Array([0xff, 0xfb])], {
      type: "audio/mpeg",
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      blob: async () => audioBlob,
    } as Response);

    const result = await speakText("Hello");
    expect(result).toBeInstanceOf(Blob);
  });

  it("should throw when blob() rejects on ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      blob: async () => {
        throw new Error("Failed to read response body");
      },
    } as unknown as Response);

    await expect(speakText("Hello")).rejects.toThrow(
      "Failed to read response body"
    );
  });
});
