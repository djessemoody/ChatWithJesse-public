import { useState, useCallback, useRef, useEffect } from "react";
import { transcribeAudio } from "../services/api";

const SILENCE_THRESHOLD = 0.01;
const SILENCE_DURATION_MS = 1500;
const ANALYSIS_INTERVAL_MS = 100;

interface UseVoiceOptions {
  onTranscription?: (text: string) => void;
}

export function useVoice(options?: UseVoiceOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const monitorIntervalRef = useRef<number | null>(null);

  const cleanupAudioAnalysis = useCallback(() => {
    if (monitorIntervalRef.current !== null) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    silenceStartRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    cleanupAudioAnalysis();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  }, [cleanupAudioAnalysis]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        try {
          const text = await transcribeAudio(audioBlob);
          options?.onTranscription?.(text);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed");
        }
      };

      recorder.start();
      setIsRecording(true);

      // Set up silence detection with Web Audio API
      try {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Float32Array(analyser.fftSize);

        monitorIntervalRef.current = window.setInterval(() => {
          analyser.getFloatTimeDomainData(dataArray);

          // Calculate RMS volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);

          if (rms < SILENCE_THRESHOLD) {
            if (silenceStartRef.current === null) {
              silenceStartRef.current = Date.now();
            } else if (Date.now() - silenceStartRef.current >= SILENCE_DURATION_MS) {
              // Silence detected long enough — auto-stop
              stopRecording();
            }
          } else {
            // Sound detected — reset silence timer
            silenceStartRef.current = null;
          }
        }, ANALYSIS_INTERVAL_MS);
      } catch {
        // Silence detection is a nice-to-have; don't fail recording if it errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Microphone access denied");
      setIsRecording(false);
    }
  }, [isRecording, options, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioAnalysis();
    };
  }, [cleanupAudioAnalysis]);

  return { isRecording, error, startRecording, stopRecording };
}
