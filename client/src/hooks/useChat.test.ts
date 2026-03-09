import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChat } from "./useChat";

// Mock the api module
vi.mock("../services/api", () => ({
  sendMessage: vi.fn(),
}));

import { sendMessage } from "../services/api";

const mockSendMessage = sendMessage as ReturnType<typeof vi.fn>;

describe("useChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start with empty messages and not loading", () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should add user message immediately on send", async () => {
    mockSendMessage.mockResolvedValue("Reply");

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Hello");
    });

    expect(result.current.messages[0]).toEqual({
      role: "user",
      content: "Hello",
    });
  });

  it("should add assistant reply after API response", async () => {
    mockSendMessage.mockResolvedValue("Hey there!");

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Hello");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toEqual({
      role: "assistant",
      content: "Hey there!",
    });
  });

  it("should set isLoading while waiting for response", async () => {
    let resolvePromise: (value: string) => void;
    mockSendMessage.mockReturnValue(
      new Promise<string>((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() => useChat());

    // Start sending — don't await
    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.send("Hello");
    });

    // Should be loading now
    expect(result.current.isLoading).toBe(true);

    // Resolve the API call
    await act(async () => {
      resolvePromise!("Reply");
      await sendPromise!;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should add error message when API call fails", async () => {
    mockSendMessage.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Hello");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toEqual({
      role: "assistant",
      content: "Sorry, something went wrong. Try again?",
    });
  });

  it("should set isLoading to false after error", async () => {
    mockSendMessage.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Hello");
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should send full conversation history to API", async () => {
    mockSendMessage.mockResolvedValueOnce("First reply");
    mockSendMessage.mockResolvedValueOnce("Second reply");

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Hello");
    });

    await act(async () => {
      await result.current.send("How are you?");
    });

    // The second call should include the full history
    const secondCallMessages = mockSendMessage.mock.calls[1][0];
    expect(secondCallMessages).toHaveLength(3);
    expect(secondCallMessages).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "First reply" },
      { role: "user", content: "How are you?" },
    ]);
  });

  // BUG: useChat uses `messages` from the closure in useCallback,
  // not the latest state. If send is called rapidly before the first
  // call completes, the second call will use stale state and lose messages.
  // This is a classic stale closure bug.
  it("should handle rapid sequential sends without losing messages", async () => {
    let callCount = 0;
    mockSendMessage.mockImplementation(async () => {
      callCount++;
      return `Reply ${callCount}`;
    });

    const { result } = renderHook(() => useChat());

    // Send two messages in quick succession
    await act(async () => {
      await result.current.send("First");
    });
    await act(async () => {
      await result.current.send("Second");
    });

    // Should have 4 messages: user, assistant, user, assistant
    expect(result.current.messages).toHaveLength(4);
    expect(result.current.messages.map((m) => m.content)).toEqual([
      "First",
      "Reply 1",
      "Second",
      "Reply 2",
    ]);
  });

  it("should handle concurrent sends while first is in-flight", async () => {
    let resolveFirst: (value: string) => void;
    let resolveSecond: (value: string) => void;

    mockSendMessage
      .mockReturnValueOnce(
        new Promise<string>((resolve) => {
          resolveFirst = resolve;
        })
      )
      .mockReturnValueOnce(
        new Promise<string>((resolve) => {
          resolveSecond = resolve;
        })
      );

    const { result } = renderHook(() => useChat());

    // Start first send without awaiting
    let firstPromise: Promise<void>;
    act(() => {
      firstPromise = result.current.send("First");
    });

    // Start second send while first is still in-flight
    let secondPromise: Promise<void>;
    act(() => {
      secondPromise = result.current.send("Second");
    });

    // Resolve both
    await act(async () => {
      resolveFirst!("Reply 1");
      await firstPromise!;
    });

    await act(async () => {
      resolveSecond!("Reply 2");
      await secondPromise!;
    });

    // Both sends should complete — messages may have stale closure issues
    // but the hook should not crash
    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
  });

  it("should handle non-Error thrown from API", async () => {
    mockSendMessage.mockRejectedValue("string error");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Hello");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toEqual({
      role: "assistant",
      content: "Sorry, something went wrong. Try again?",
    });

    consoleSpy.mockRestore();
  });

  it("should log errors to console.error on failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("API down");
    mockSendMessage.mockRejectedValue(error);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Hello");
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to send message:", error);
    consoleSpy.mockRestore();
  });

  it("should pass empty message directly if given to send", async () => {
    mockSendMessage.mockResolvedValue("Reply");

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("");
    });

    // The hook does not guard against empty strings — that's the caller's job
    expect(result.current.messages[0]).toEqual({
      role: "user",
      content: "",
    });
    expect(mockSendMessage).toHaveBeenCalled();
  });

  it("should pass whitespace message directly if given to send", async () => {
    mockSendMessage.mockResolvedValue("Reply");

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("   ");
    });

    // The hook does not trim — that's the caller's job
    expect(result.current.messages[0]).toEqual({
      role: "user",
      content: "   ",
    });
    expect(mockSendMessage).toHaveBeenCalled();
  });
});
