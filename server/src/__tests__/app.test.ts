import request from "supertest";

// Mock all services to avoid real API calls and file system reads
jest.mock("../services/openai", () => ({
  getChatResponse: jest.fn(),
}));

jest.mock("../services/persona", () => ({
  buildSystemPrompt: () => "You are Jesse.",
}));

jest.mock("../services/whisper", () => ({
  transcribeAudio: jest.fn(),
}));

import app from "../app";

describe("App middleware and routing", () => {
  describe("CORS", () => {
    it("should include CORS headers on responses", async () => {
      const res = await request(app).get("/api/chat");

      expect(res.headers["access-control-allow-origin"]).toBeDefined();
    });

    it("should respond to OPTIONS preflight requests", async () => {
      const res = await request(app)
        .options("/api/chat")
        .set("Origin", "http://localhost:5173")
        .set("Access-Control-Request-Method", "POST");

      expect(res.status).toBe(204);
      expect(res.headers["access-control-allow-origin"]).toBeDefined();
    });
  });

  describe("JSON body parsing", () => {
    it("should parse JSON request bodies", async () => {
      const res = await request(app)
        .post("/api/chat")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ messages: [] }));

      // Should get 400 (empty messages validation), not a parse error
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("API route handling", () => {
    it("should route to /api/chat", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ messages: [] });

      // 400 from validation, not 404
      expect(res.status).toBe(400);
    });

    it("should route to /api/voice/transcribe", async () => {
      const res = await request(app)
        .post("/api/voice/transcribe")
        .send({});

      // 400 from validation, not 404
      expect(res.status).toBe(400);
    });
  });

  describe("SPA fallback", () => {
    it("should return something for non-API routes (SPA fallback or 404)", async () => {
      const res = await request(app).get("/some/client/route");

      // In test environment, client/dist may not exist so sendFile may 404
      // The key point is it doesn't match an API route
      expect([200, 404]).toContain(res.status);
    });

    it("should return JSON 404 for unknown API routes", async () => {
      const res = await request(app).get("/api/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "API endpoint not found" });
    });
  });

  describe("Unknown routes", () => {
    it("should return JSON 404 for GET /api/chat (wrong method)", async () => {
      const res = await request(app).get("/api/chat");

      // Chat route only handles POST, GET falls through to API 404 handler
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "API endpoint not found" });
    });
  });
});
