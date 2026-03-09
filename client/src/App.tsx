import { useState, useEffect, useRef } from "react";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import { VoiceButton } from "./components/VoiceButton";
import { ProfileSidebar } from "./components/ProfileSidebar";
import { HowItsMade } from "./components/HowItsMade";
import { ParallaxBackground } from "./components/ParallaxBackground";
import { useChat } from "./hooks/useChat";
import { useVoice } from "./hooks/useVoice";
import { useAudioPlayback } from "./hooks/useAudioPlayback";

type ActiveView = "chat" | "how-its-made";

export default function App() {
  const { messages, isLoading, send } = useChat();
  const { isRecording, startRecording, stopRecording } = useVoice({
    onTranscription: (text) => {
      if (text.trim()) {
        send(text);
      }
    },
  });
  const {
    isLoading: isSpeaking,
    activeMessageIndex,
    play,
    stop,
  } = useAudioPlayback();
  const [voiceMode, setVoiceMode] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const prevMessageCountRef = useRef(messages.length);

  useEffect(() => {
    if (
      voiceMode &&
      messages.length > prevMessageCountRef.current &&
      messages[messages.length - 1]?.role === "assistant"
    ) {
      const lastMsg = messages[messages.length - 1];
      play(lastMsg.content, messages.length - 1);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, voiceMode, play]);

  return (
    <div className="flex flex-col md:flex-row h-dvh overflow-hidden bg-slate-950">
      <ProfileSidebar />
      <div className="flex flex-col flex-1 min-w-0 min-h-0 chat-bg relative">
        <ParallaxBackground />
        <header className="relative z-10 flex items-center justify-center py-3 landscape-compact-py border-b border-white/10 glass gap-4 flex-col md:flex-row">
          <nav className="flex gap-1 rounded-lg bg-white/5 p-1" aria-label="Main navigation">
            <button
              onClick={() => setActiveView("chat")}
              className={`text-sm px-4 py-1.5 rounded-md transition-all duration-200 ${
                activeView === "chat"
                  ? "bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              aria-current={activeView === "chat" ? "page" : undefined}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveView("how-its-made")}
              className={`text-sm px-4 py-1.5 rounded-md transition-all duration-200 ${
                activeView === "how-its-made"
                  ? "bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              aria-current={activeView === "how-its-made" ? "page" : undefined}
            >
              How I Built This
            </button>
          </nav>
          {activeView === "chat" && (
            <button
              onClick={() => setVoiceMode(!voiceMode)}
              className={`text-xs px-3 py-1 rounded-full transition-all duration-200 ${
                voiceMode
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/10 text-gray-300 hover:bg-white/15"
              }`}
              aria-label={voiceMode ? "Disable voice mode" : "Enable voice mode"}
            >
              {voiceMode ? "Voice On" : "Voice Off"}
            </button>
          )}
        </header>
        {activeView === "chat" ? (
          <div className="relative z-10 flex flex-col flex-1 min-h-0">
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              activeMessageIndex={activeMessageIndex}
              isSpeaking={isSpeaking}
              onPlayMessage={play}
              onStopMessage={stop}
            />
            <ChatInput onSend={send} disabled={isLoading} />
            <div className="flex justify-center pb-2 landscape-compact-py">
              <VoiceButton
                disabled={isLoading}
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
              />
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex-1 min-h-0 overflow-auto">
            <HowItsMade />
          </div>
        )}
      </div>
    </div>
  );
}
