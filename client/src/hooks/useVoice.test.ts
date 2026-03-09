import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoice } from "./useVoice";

// Mock the api module
vi.mock("../services/api", () => ({
  sendMessage: vi.fn(),
  transcribeAudio: vi.fn(),
}));

import { transcribeAudio } from "../services/api";

const mockTranscribeAudio = transcribeAudio as ReturnType<typeof vi.fn>;

// Mock MediaRecorder
const mockMediaRecorderInstance = {
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null as ((event: { data: Blob }) => void) | null,
  onstop: null as (() => void) | null,
  state: "inactive" as string,
};

const MockMediaRecorder = vi.fn().mockImplementation(() => {
  mockMediaRecorderInstance.state = "inactive";
  return mockMediaRecorderInstance;
});

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();

// Mock AudioContext for silence detection
const mockAnalyser = {
  fftSize: 0,
  getFloatTimeDomainData: vi.fn(),
};

const mockAudioContextInstance = {
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
  }),
  createAnalyser: vi.fn().mockReturnValue(mockAnalyser),
  close: vi.fn(),
};

const MockAudioContext = vi.fn().mockImplementation(() => mockAudioContextInstance);

beforeEach(() => {
  vi.stubGlobal("MediaRecorder", MockMediaRecorder);
  vi.stubGlobal("AudioContext", MockAudioContext);
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: mockGetUserMedia,
    },
  });
});

describe("useVoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockMediaRecorderInstance.state = "inactive";
    mockMediaRecorderInstance.ondataavailable = null;
    mockMediaRecorderInstance.onstop = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with isRecording false and no error", () => {
    const { result } = renderHook(() => useVoice());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should expose startRecording and stopRecording functions", () => {
    const { result } = renderHook(() => useVoice());

    expect(typeof result.current.startRecording).toBe("function");
    expect(typeof result.current.stopRecording).toBe("function");
  });

  it("should request microphone access when startRecording is called", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it("should set isRecording to true after starting", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
  });

  it("should create MediaRecorder with the audio stream", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(MockMediaRecorder).toHaveBeenCalledWith(mockStream);
  });

  it("should set isRecording to false after stopping", async () => {
    const mockStop = vi.fn();
    const mockStream = { getTracks: () => [{ stop: mockStop }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    await act(async () => {
      result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);
  });

  it("should set error when microphone access is denied", async () => {
    mockGetUserMedia.mockRejectedValue(new DOMException("Permission denied"));

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it("should call transcribeAudio with recorded audio blob after stopping", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);
    mockTranscribeAudio.mockResolvedValue("Hello Jesse");

    const onTranscription = vi.fn();
    const { result } = renderHook(() => useVoice({ onTranscription }));

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate MediaRecorder producing audio data and stopping
    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    await act(async () => {
      mockMediaRecorderInstance.ondataavailable?.({ data: audioBlob });
      mockMediaRecorderInstance.onstop?.();
    });

    expect(mockTranscribeAudio).toHaveBeenCalledWith(expect.any(Blob));
  });

  it("should call onTranscription callback with transcribed text", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);
    mockTranscribeAudio.mockResolvedValue("Hello Jesse");

    const onTranscription = vi.fn();
    const { result } = renderHook(() => useVoice({ onTranscription }));

    await act(async () => {
      await result.current.startRecording();
    });

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    await act(async () => {
      mockMediaRecorderInstance.ondataavailable?.({ data: audioBlob });
      mockMediaRecorderInstance.onstop?.();
    });

    expect(onTranscription).toHaveBeenCalledWith("Hello Jesse");
  });

  it("should set error when transcription fails", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);
    mockTranscribeAudio.mockRejectedValue(new Error("Transcription failed"));

    const { result } = renderHook(() => useVoice({ onTranscription: vi.fn() }));

    await act(async () => {
      await result.current.startRecording();
    });

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    await act(async () => {
      mockMediaRecorderInstance.ondataavailable?.({ data: audioBlob });
      mockMediaRecorderInstance.onstop?.();
    });

    expect(result.current.error).toBeTruthy();
  });

  it("should stop media stream tracks when stopping recording", async () => {
    const mockTrackStop = vi.fn();
    const mockStream = { getTracks: () => [{ stop: mockTrackStop }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      result.current.stopRecording();
    });

    expect(mockTrackStop).toHaveBeenCalled();
  });

  it("should not start recording if already recording", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    // Try to start again
    await act(async () => {
      await result.current.startRecording();
    });

    // getUserMedia should only have been called once
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
  });

  it("should set up AudioContext for silence detection", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(MockAudioContext).toHaveBeenCalled();
    expect(mockAudioContextInstance.createMediaStreamSource).toHaveBeenCalledWith(mockStream);
    expect(mockAudioContextInstance.createAnalyser).toHaveBeenCalled();
  });

  it("should clean up AudioContext when stopping", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      result.current.stopRecording();
    });

    expect(mockAudioContextInstance.close).toHaveBeenCalled();
  });

  it("should auto-stop recording after sustained silence", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    // Make analyser report silence (all zeros = RMS of 0)
    mockAnalyser.getFloatTimeDomainData.mockImplementation((arr: Float32Array) => {
      arr.fill(0);
    });

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    // Advance timers past the silence detection threshold (1500ms + buffer)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isRecording).toBe(false);
  });

  it("should not auto-stop when sound is detected", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    // Make analyser report loud sound
    mockAnalyser.getFloatTimeDomainData.mockImplementation((arr: Float32Array) => {
      arr.fill(0.5);
    });

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    // Advance timers well past silence threshold
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Should still be recording since there's sound
    expect(result.current.isRecording).toBe(true);

    // Clean up
    await act(async () => {
      result.current.stopRecording();
    });
  });

  it("should not auto-stop when RMS is just above threshold", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    // Fill with value that produces RMS clearly above 0.01 threshold
    mockAnalyser.getFloatTimeDomainData.mockImplementation((arr: Float32Array) => {
      arr.fill(0.02);
    });

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startRecording();
    });

    // Advance well past silence duration
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // RMS of 0.02 is > 0.01 threshold, so should still be recording
    expect(result.current.isRecording).toBe(true);

    await act(async () => {
      result.current.stopRecording();
    });
  });

  it("should not call onTranscription when transcription fails", async () => {
    const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
    mockGetUserMedia.mockResolvedValue(mockStream);
    mockTranscribeAudio.mockRejectedValue(new Error("API error"));

    const onTranscription = vi.fn();
    const { result } = renderHook(() => useVoice({ onTranscription }));

    await act(async () => {
      await result.current.startRecording();
    });

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });
    await act(async () => {
      mockMediaRecorderInstance.ondataavailable?.({ data: audioBlob });
      mockMediaRecorderInstance.onstop?.();
    });

    expect(onTranscription).not.toHaveBeenCalled();
    expect(result.current.error).toBeTruthy();
  });

  it("should handle rapid start/stop cycles", async () => {
    const mockTrackStop = vi.fn();
    const mockStream = { getTracks: () => [{ stop: mockTrackStop }] };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useVoice());

    // Start and immediately stop
    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);

    // Start again
    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    await act(async () => {
      result.current.stopRecording();
    });
  });
});
