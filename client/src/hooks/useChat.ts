import { useState, useCallback } from "react";
import { ChatMessage, sendMessage } from "../services/api";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const send = useCallback(async (text: string) => {
    const userMessage: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setIsLoading(true);

    try {
      const reply = await sendMessage(updated);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return { messages, isLoading, send };
}
