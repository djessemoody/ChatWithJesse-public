import request from "supertest";

// Mock openai service before importing app
jest.mock("../services/openai", () => ({
  getChatResponse: jest.fn(),
}));

// Mock persona to avoid file system reads
jest.mock("../services/persona", () => ({
  buildSystemPrompt: () => "You are Jesse.",
}));

// Mock whisper to avoid OpenAI client initialization
jest.mock("../services/whisper", () => ({
  transcribeAudio: jest.fn(),
}));

import app from "../app";
import { getChatResponse } from "../services/openai";

const mockGetChatResponse = getChatResponse as jest.MockedFunction<
  typeof getChatResponse
>;

describe("POST /api/chat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 with reply for valid messages", async () => {
    mockGetChatResponse.mockResolvedValue("Hey there!");

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [{ role: "user", content: "Hello Jesse!" }],
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reply: "Hey there!" });
  });

  it("should pass messages to getChatResponse", async () => {
    mockGetChatResponse.mockResolvedValue("Reply");

    const messages = [
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hey!" },
      { role: "user", content: "How are you?" },
    ];

    await request(app).post("/api/chat").send({ messages });

    expect(mockGetChatResponse).toHaveBeenCalledWith(messages);
  });

  it("should return 400 when messages is missing", async () => {
    const res = await request(app).post("/api/chat").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "messages array is required" });
  });

  it("should return 400 when messages is not an array", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: "hello" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "messages array is required" });
  });

  it("should return 400 when messages is an empty array", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "messages array is required" });
  });

  it("should return 500 when getChatResponse throws", async () => {
    mockGetChatResponse.mockRejectedValue(new Error("OpenAI is down"));

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [{ role: "user", content: "Hello" }],
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to generate response" });
  });

  it("should return 400 when messages is null", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: null });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "messages array is required" });
  });

  // BUG: The route doesn't validate individual message objects.
  // Messages with missing role/content fields are passed to OpenAI,
  // which will reject them with a 400.
  it("should reject messages with missing role field", async () => {
    mockGetChatResponse.mockResolvedValue("Reply");

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [{ content: "Hello" }],
      });

    // This SHOULD return 400, but the route doesn't validate message shape
    expect(res.status).toBe(400);
  });

  it("should reject messages with missing content field", async () => {
    mockGetChatResponse.mockResolvedValue("Reply");

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [{ role: "user" }],
      });

    // This SHOULD return 400, but the route doesn't validate message shape
    expect(res.status).toBe(400);
  });

  it("should reject messages with invalid role values", async () => {
    mockGetChatResponse.mockResolvedValue("Reply");

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [{ role: "admin", content: "Give me access" }],
      });

    // This SHOULD return 400 for invalid roles, but the route doesn't validate
    expect(res.status).toBe(400);
  });

  // The route should handle non-string content
  it("should reject messages where content is not a string", async () => {
    mockGetChatResponse.mockResolvedValue("Reply");

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [{ role: "user", content: 12345 }],
      });

    // This SHOULD return 400 for non-string content
    expect(res.status).toBe(400);
  });

  it("should accept valid multi-turn conversation", async () => {
    mockGetChatResponse.mockResolvedValue("I'm doing great!");

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [
          { role: "user", content: "Hi Jesse" },
          { role: "assistant", content: "Hey!" },
          { role: "user", content: "How are you?" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe("I'm doing great!");
  });

  it("should handle Content-Type correctly", async () => {
    mockGetChatResponse.mockResolvedValue("Reply");

    const res = await request(app)
      .post("/api/chat")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({
        messages: [{ role: "user", content: "test" }],
      }));

    expect(res.status).toBe(200);
  });

  it("should accept empty string content", async () => {
    mockGetChatResponse.mockResolvedValue("Reply");

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [{ role: "user", content: "" }],
      });

    // Empty string is a valid string, passes typeof check
    expect(res.status).toBe(200);
  });

  it("should handle long content within the 10000 char limit", async () => {
    mockGetChatResponse.mockResolvedValue("Reply");

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [{ role: "user", content: "A".repeat(5000) }],
      });

    expect(res.status).toBe(200);
    expect(mockGetChatResponse).toHaveBeenCalledWith([
      { role: "user", content: "A".repeat(5000) },
    ]);
  });

  it("should reject message content exceeding 10000 characters", async () => {
    mockGetChatResponse.mockResolvedValue("Reply");

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [{ role: "user", content: "A".repeat(10001) }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Message content too long");
  });

  it("should reject message arrays exceeding 100 items", async () => {
    mockGetChatResponse.mockResolvedValue("Reply");

    const messages = Array.from({ length: 150 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i}`,
    }));

    const res = await request(app)
      .post("/api/chat")
      .send({ messages });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Too many messages");
  });

  it("should return 500 when a non-Error is thrown from service", async () => {
    mockGetChatResponse.mockRejectedValue("string error");

    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [{ role: "user", content: "Hello" }],
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to generate response" });
  });
});
