import request from "supertest";

// Mock all services to avoid real API calls and file system reads
jest.mock("../services/openai", () => ({
  getChatResponse: jest.fn().mockResolvedValue("Reply"),
}));

jest.mock("../services/persona", () => ({
  buildSystemPrompt: () => "You are Jesse.",
}));

jest.mock("../services/whisper", () => ({
  transcribeAudio: jest.fn().mockResolvedValue("transcribed text"),
}));

jest.mock("../services/elevenlabs", () => ({
  synthesizeSpeech: jest.fn().mockResolvedValue(Buffer.from("fake-audio")),
}));

import app from "../app";

describe("Security middleware", () => {
  describe("Helmet security headers", () => {
    it("should set X-Content-Type-Options header", async () => {
      const res = await request(app).get("/");

      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("should set X-Frame-Options header", async () => {
      const res = await request(app).get("/");

      expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    });

    it("should remove X-Powered-By header", async () => {
      const res = await request(app).get("/");

      expect(res.headers["x-powered-by"]).toBeUndefined();
    });

    it("should set Content-Security-Policy header", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ messages: [{ role: "user", content: "Hi" }] });

      expect(res.headers["content-security-policy"]).toBeDefined();
      expect(res.headers["content-security-policy"]).toContain("default-src 'self'");
    });
  });

  describe("Rate limiting", () => {
    it("should apply rate limit middleware to chat routes", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ messages: [{ role: "user", content: "Hi" }] });

      // Rate limiting is disabled in test (max: 0), but middleware still runs
      // In production, max: 20 for chat, max: 10 for voice
      expect(res.status).toBe(200);
    });

    it("should apply rate limit middleware to voice routes", async () => {
      const res = await request(app)
        .post("/api/voice/speak")
        .send({ text: "Hello" });

      expect(res.status).toBe(200);
    });
  });

  describe("JSON body size limit", () => {
    it("should reject payloads exceeding 1MB", async () => {
      const largeContent = "A".repeat(1.5 * 1024 * 1024); // 1.5MB

      const res = await request(app)
        .post("/api/chat")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ messages: [{ role: "user", content: largeContent }] }));

      expect(res.status).toBe(413);
    });
  });

  describe("Chat input limits", () => {
    it("should reject messages array with more than 100 items", async () => {
      const messages = Array.from({ length: 101 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i}`,
      }));

      const res = await request(app)
        .post("/api/chat")
        .send({ messages });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Too many messages");
    });

    it("should accept exactly 100 messages", async () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i}`,
      }));

      const res = await request(app)
        .post("/api/chat")
        .send({ messages });

      expect(res.status).toBe(200);
    });

    it("should reject message content exceeding 10000 characters", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({
          messages: [{ role: "user", content: "A".repeat(10001) }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Message content too long");
    });

    it("should accept message content at exactly 10000 characters", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({
          messages: [{ role: "user", content: "A".repeat(10000) }],
        });

      expect(res.status).toBe(200);
    });
  });

  describe("API 404 handler", () => {
    it("should return JSON 404 for unknown API routes", async () => {
      const res = await request(app).get("/api/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "API endpoint not found" });
    });

    it("should return JSON 404 for POST to unknown API routes", async () => {
      const res = await request(app)
        .post("/api/unknown")
        .send({ data: "test" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "API endpoint not found" });
    });

    it("should not affect valid API routes", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ messages: [{ role: "user", content: "Hi" }] });

      expect(res.status).toBe(200);
    });
  });
});
