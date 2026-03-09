import OpenAI from "openai";
import { buildSystemPrompt } from "./persona";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const systemPrompt = buildSystemPrompt();

export async function getChatResponse(messages: ChatMessage[]): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  return response.choices[0]?.message?.content ?? "Sorry, I couldn't come up with a response.";
}
