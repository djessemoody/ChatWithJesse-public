import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMessage, ChatMessage } from "./api";

describe("sendMessage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should send messages and return the reply", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Hey there!" }),
    } as Response);

    const messages: ChatMessage[] = [
      { role: "user", content: "Hello Jesse!" },
    ];

    const result = await sendMessage(messages);
    expect(result).toBe("Hey there!");
  });

  it("should POST to /api/chat with correct headers and body", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Hi" }),
    } as Response);

    const messages: ChatMessage[] = [
      { role: "user", content: "test" },
    ];

    await sendMessage(messages);

    expect(mockFetch).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  });

  it("should throw on non-ok response (400)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "messages array is required" }),
    } as Response);

    await expect(
      sendMessage([])
    ).rejects.toThrow("Chat request failed: 400");
  });

  it("should throw on non-ok response (500)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    } as Response);

    await expect(
      sendMessage([{ role: "user", content: "hi" }])
    ).rejects.toThrow("Chat request failed: 500");
  });

  it("should propagate network errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("Failed to fetch")
    );

    await expect(
      sendMessage([{ role: "user", content: "hi" }])
    ).rejects.toThrow("Failed to fetch");
  });

  it("should send multi-turn conversation history", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "I'm great!" }),
    } as Response);

    const messages: ChatMessage[] = [
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hey!" },
      { role: "user", content: "How are you?" },
    ];

    await sendMessage(messages);

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1]!.body as string);
    expect(sentBody.messages).toHaveLength(3);
    expect(sentBody.messages).toEqual(messages);
  });

  it("should return undefined when reply field is missing from response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ someOtherField: "value" }),
    } as Response);

    const result = await sendMessage([{ role: "user", content: "hi" }]);
    expect(result).toBeUndefined();
  });

  it("should handle empty string reply", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "" }),
    } as Response);

    const result = await sendMessage([{ role: "user", content: "hi" }]);
    expect(result).toBe("");
  });

  it("should throw when json() rejects on ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response);

    await expect(
      sendMessage([{ role: "user", content: "hi" }])
    ).rejects.toThrow("Unexpected token");
  });
});
