import { useEffect, useRef } from "react";
import { ChatMessage } from "../services/api";
import MessageBubble from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  activeMessageIndex: number | null;
  isSpeaking?: boolean;
  onPlayMessage?: (text: string, index: number) => void;
  onStopMessage?: () => void;
}

export default function ChatWindow({
  messages,
  isLoading,
  activeMessageIndex,
  isSpeaking,
  onPlayMessage,
  onStopMessage,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center text-gray-500 text-sm">
          Say hello to AI Jesse!
        </div>
      )}
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          role={msg.role}
          content={msg.content}
          isActive={activeMessageIndex === i}
          isSpeaking={isSpeaking && activeMessageIndex === i}
          onPlay={onPlayMessage ? () => onPlayMessage(msg.content, i) : undefined}
          onStop={onStopMessage}
        />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
