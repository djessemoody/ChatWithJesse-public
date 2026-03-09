import { useState, FormEvent } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 landscape-compact-p border-t border-white/10">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-base text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:from-indigo-400 hover:to-purple-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-indigo-500/20"
      >
        Send
      </button>
    </form>
  );
}
