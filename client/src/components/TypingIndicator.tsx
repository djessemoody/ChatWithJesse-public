export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3 animate-fade-in-up">
      <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1 border border-white/5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce_dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
