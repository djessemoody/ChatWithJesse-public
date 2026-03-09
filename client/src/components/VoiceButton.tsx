interface VoiceButtonProps {
  disabled: boolean;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

function WaveAnimation() {
  return (
    <span className="inline-flex items-center gap-0.5 mx-1" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="inline-block w-0.5 bg-white rounded-full animate-wave"
          style={{
            height: "12px",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </span>
  );
}

export function VoiceButton({
  disabled,
  isRecording,
  onStartRecording,
  onStopRecording,
}: VoiceButtonProps) {
  const handleClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isRecording ? "Click to send recording" : "Press to talk"}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
        isRecording
          ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25"
          : "bg-white/10 border border-white/10 hover:bg-white/15"
      }`}
    >
      {isRecording ? (
        <span className="flex items-center">
          Click to send
          <WaveAnimation />
        </span>
      ) : (
        "Press to talk"
      )}
    </button>
  );
}
