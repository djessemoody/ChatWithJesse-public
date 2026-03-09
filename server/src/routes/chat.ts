import { Router, Request, Response } from "express";
import { getChatResponse } from "../services/openai";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    if (messages.length > 100) {
      res.status(400).json({ error: "Too many messages (max 100)" });
      return;
    }

    const validRoles = ["user", "assistant", "system"];
    for (const msg of messages) {
      if (!msg.role || !validRoles.includes(msg.role)) {
        res.status(400).json({ error: "Each message must have a valid role (user, assistant, or system)" });
        return;
      }
      if (typeof msg.content !== "string") {
        res.status(400).json({ error: "Each message must have a string content field" });
        return;
      }
      if (msg.content.length > 10000) {
        res.status(400).json({ error: "Message content too long (max 10000 characters)" });
        return;
      }
    }

    const reply = await getChatResponse(messages);
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

export default router;
