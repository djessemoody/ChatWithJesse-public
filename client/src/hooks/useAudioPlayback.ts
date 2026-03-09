import { useState, useCallback, useRef, useEffect } from "react";
import { speakText } from "../services/api";

interface UseAudioPlaybackReturn {
  isPlaying: boolean;
  isLoading: boolean;
  activeMessageIndex: number | null;
  play: (text: string, messageIndex: number) => Promise<void>;
  stop: () => void;
}

export function useAudioPlayback(): UseAudioPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMessageIndex, setActiveMessageIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
    setIsLoading(false);
    setActiveMessageIndex(null);
  }, [cleanup]);

  const play = useCallback(async (text: string, messageIndex: number) => {
    cleanup();

    setIsLoading(true);
    setActiveMessageIndex(messageIndex);

    try {
      const audioBlob = await speakText(text);
      const url = URL.createObjectURL(audioBlob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setActiveMessageIndex(null);
        cleanup();
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        setActiveMessageIndex(null);
        cleanup();
      };

      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch {
      setIsPlaying(false);
      setIsLoading(false);
      setActiveMessageIndex(null);
    }
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isPlaying, isLoading, activeMessageIndex, play, stop };
}
