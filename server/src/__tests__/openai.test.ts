import { getChatResponse } from "../services/openai";

// Mock the openai module
jest.mock("openai", () => {
  const mockCreate = jest.fn();
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

// Mock persona to avoid file system reads
jest.mock("../services/persona", () => ({
  buildSystemPrompt: () => "You are Jesse. Be friendly.",
}));

import OpenAI from "openai";

function getMockCreate() {
  const instance = new (OpenAI as unknown as jest.Mock)();
  return instance.chat.completions.create as jest.Mock;
}

describe("getChatResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the assistant's reply from OpenAI", async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Hey! I'm Jesse." } }],
    });

    const result = await getChatResponse([
      { role: "user", content: "Hi Jesse!" },
    ]);

    expect(result).toBe("Hey! I'm Jesse.");
  });

  it("should pass system prompt as the first message", async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Hello!" } }],
    });

    await getChatResponse([{ role: "user", content: "Hi" }]);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          { role: "system", content: "You are Jesse. Be friendly." },
        ]),
      })
    );
  });

  it("should pass conversation history after system prompt", async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Great!" } }],
    });

    const messages = [
      { role: "user" as const, content: "Hi" },
      { role: "assistant" as const, content: "Hey!" },
      { role: "user" as const, content: "How are you?" },
    ];

    await getChatResponse(messages);

    const call = mockCreate.mock.calls[0][0];
    expect(call.messages[0]).toEqual({
      role: "system",
      content: "You are Jesse. Be friendly.",
    });
    expect(call.messages.slice(1)).toEqual(messages);
  });

  it("should use gpt-4o model", async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Hi" } }],
    });

    await getChatResponse([{ role: "user", content: "test" }]);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o" })
    );
  });

  it("should return fallback message when choices are empty", async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValue({ choices: [] });

    const result = await getChatResponse([
      { role: "user", content: "Hello" },
    ]);

    expect(result).toBe("Sorry, I couldn't come up with a response.");
  });

  it("should return fallback when message content is null", async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const result = await getChatResponse([
      { role: "user", content: "Hello" },
    ]);

    expect(result).toBe("Sorry, I couldn't come up with a response.");
  });

  it("should propagate OpenAI API errors", async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockRejectedValue(new Error("API rate limit exceeded"));

    await expect(
      getChatResponse([{ role: "user", content: "Hello" }])
    ).rejects.toThrow("API rate limit exceeded");
  });

  it("should handle empty message array", async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Hi!" } }],
    });

    const result = await getChatResponse([]);

    expect(result).toBe("Hi!");
    // Should still send system prompt even with no user messages
    const call = mockCreate.mock.calls[0][0];
    expect(call.messages).toHaveLength(1);
    expect(call.messages[0].role).toBe("system");
  });

  it("should propagate 429 rate limit errors", async () => {
    const mockCreate = getMockCreate();
    const error = new Error("Rate limit exceeded");
    (error as unknown as Record<string, unknown>).status = 429;
    mockCreate.mockRejectedValue(error);

    await expect(
      getChatResponse([{ role: "user", content: "Hi" }])
    ).rejects.toThrow("Rate limit exceeded");
  });

  it("should propagate 401 auth errors", async () => {
    const mockCreate = getMockCreate();
    const error = new Error("Invalid API key");
    (error as unknown as Record<string, unknown>).status = 401;
    mockCreate.mockRejectedValue(error);

    await expect(
      getChatResponse([{ role: "user", content: "Hi" }])
    ).rejects.toThrow("Invalid API key");
  });

  it("should propagate timeout errors", async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockRejectedValue(new Error("Request timed out"));

    await expect(
      getChatResponse([{ role: "user", content: "Hi" }])
    ).rejects.toThrow("Request timed out");
  });

  it("should return fallback when message object is undefined", async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValue({
      choices: [{ message: undefined }],
    });

    const result = await getChatResponse([
      { role: "user", content: "Hello" },
    ]);

    expect(result).toBe("Sorry, I couldn't come up with a response.");
  });
});
