import { Router } from "express";
import multer from "multer";
import { transcribeAudio } from "../services/whisper";
import { synthesizeSpeech } from "../services/elevenlabs";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max audio file
    files: 1,
  },
});

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No audio file provided" });
      return;
    }

    const text = await transcribeAudio(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ text });
  } catch (err) {
    console.error("Transcription failed:", err);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

router.post("/speak", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Missing or invalid 'text' field" });
      return;
    }

    if (text.length > 5000) {
      res.status(400).json({ error: "Text exceeds maximum length of 5000 characters" });
      return;
    }

    const audioBuffer = await synthesizeSpeech(text);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length.toString(),
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error("Speech synthesis failed:", err);
    res.status(500).json({ error: "Failed to synthesize speech" });
  }
});

export default router;
