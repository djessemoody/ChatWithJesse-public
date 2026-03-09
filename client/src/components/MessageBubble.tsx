import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isActive?: boolean;
  isSpeaking?: boolean;
  onPlay?: () => void;
  onStop?: () => void;
}

export default function MessageBubble({
  role,
  content,
  isActive,
  isSpeaking,
  onPlay,
  onStop,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 animate-fade-in-up`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md shadow-lg shadow-indigo-500/20"
            : "bg-white/10 text-gray-100 rounded-bl-md backdrop-blur-sm border border-white/5"
        }`}
      >
        {isAssistant ? (
          <div className="prose-chat">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          content
        )}
        {isAssistant && (onPlay || onStop) && (
          <div className="mt-1.5 flex items-center">
            {isActive && isSpeaking ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                <svg className="w-3 h-3 animate-spin-slow" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
                </svg>
                Loading audio...
              </span>
            ) : isActive && !isSpeaking ? (
              <button
                onClick={onStop}
                className="text-xs text-gray-400 hover:text-white transition-colors"
                aria-label="Stop audio"
              >
                &#9632; Stop
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="text-xs text-gray-400 hover:text-white transition-colors"
                aria-label="Play audio"
              >
                &#9654; Play
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
