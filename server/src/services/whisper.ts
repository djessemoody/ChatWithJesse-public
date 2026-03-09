import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  mimetype: string = "audio/webm"
): Promise<string> {
  const file = new File([audioBuffer], filename, { type: mimetype });

  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
  });

  return response.text ?? "";
}
