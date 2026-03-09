export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendMessage(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(`Chat request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}

export async function speakText(text: string): Promise<Blob> {
  const res = await fetch("/api/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Speech request failed: ${res.status}`);
  }

  return res.blob();
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");

  const res = await fetch("/api/voice/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Transcription request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.text;
}
