import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import chatRouter from "./routes/chat";
import voiceRouter from "./routes/voice";

const app = express();

// Trust reverse proxy (nginx/Cloudflare) for correct client IP in rate limiting
app.set("trust proxy", 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://static.cloudflareinsights.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      mediaSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", "https://cloudflareinsights.com"],
      fontSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS — restrict to configured origin in production
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : undefined;

app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));

// JSON body parsing with size limit
app.use(express.json({ limit: "1mb" }));

// Rate limiting — separate limits per endpoint type
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 chat requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  skip: () => process.env.NODE_ENV === "test",
});

const voiceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 voice requests per minute (more expensive API calls)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  skip: () => process.env.NODE_ENV === "test",
});

// API routes with rate limiting
app.use("/api/chat", chatLimiter, chatRouter);
app.use("/api/voice", voiceLimiter, voiceRouter);

// JSON 404 for unmatched API routes (before SPA catch-all)
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// In production, serve the built React frontend
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

export default app;
