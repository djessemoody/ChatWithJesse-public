import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioPlayback } from "./useAudioPlayback";

vi.mock("../services/api", () => ({
  speakText: vi.fn(),
}));

import { speakText } from "../services/api";

const mockSpeakText = speakText as ReturnType<typeof vi.fn>;

// Mock HTMLAudioElement
class MockAudio {
  src = "";
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;

  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
}

function setupMockAudio(): MockAudio {
  const mockAudio = new MockAudio();
  vi.spyOn(globalThis, "Audio").mockImplementation(() => mockAudio as unknown as HTMLAudioElement);
  return mockAudio;
}

describe("useAudioPlayback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it("should start with default state", () => {
    const { result } = renderHook(() => useAudioPlayback());

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeMessageIndex).toBeNull();
  });

  it("should set isLoading and activeMessageIndex when play is called", async () => {
    const mockAudio = setupMockAudio();
    mockSpeakText.mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" }));

    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("Hello", 2);
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeMessageIndex).toBe(2);
    expect(mockAudio.play).toHaveBeenCalled();
  });

  it("should call speakText with the provided text", async () => {
    setupMockAudio();
    mockSpeakText.mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" }));

    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("Test message", 0);
    });

    expect(mockSpeakText).toHaveBeenCalledWith("Test message");
  });

  it("should create and revoke object URLs", async () => {
    setupMockAudio();
    mockSpeakText.mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" }));

    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("Hello", 0);
    });

    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it("should reset state when audio ends", async () => {
    const mockAudio = setupMockAudio();
    mockSpeakText.mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" }));

    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("Hello", 1);
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      mockAudio.onended?.();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeMessageIndex).toBeNull();
  });

  it("should reset state on audio error", async () => {
    const mockAudio = setupMockAudio();
    mockSpeakText.mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" }));

    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("Hello", 1);
    });

    act(() => {
      mockAudio.onerror?.();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeMessageIndex).toBeNull();
  });

  it("should reset state when speakText fails", async () => {
    setupMockAudio();
    mockSpeakText.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("Hello", 0);
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeMessageIndex).toBeNull();
  });

  it("should stop playback when stop is called", async () => {
    const mockAudio = setupMockAudio();
    mockSpeakText.mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" }));

    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("Hello", 0);
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(mockAudio.pause).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeMessageIndex).toBeNull();
  });

  it("should clean up previous audio when playing new message", async () => {
    const mockAudio = setupMockAudio();
    mockSpeakText.mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" }));

    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("First", 0);
    });

    await act(async () => {
      await result.current.play("Second", 1);
    });

    expect(result.current.activeMessageIndex).toBe(1);
    // pause should have been called when switching to new audio
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it("should cleanup on unmount", async () => {
    const mockAudio = setupMockAudio();
    mockSpeakText.mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" }));

    const { result, unmount } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("Hello", 0);
    });

    unmount();

    expect(mockAudio.pause).toHaveBeenCalled();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should be safe to call stop when nothing is playing", () => {
    setupMockAudio();
    const { result } = renderHook(() => useAudioPlayback());

    act(() => {
      result.current.stop();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeMessageIndex).toBeNull();
  });

  it("should handle audio.play() rejection", async () => {
    const mockAudio = setupMockAudio();
    mockAudio.play.mockRejectedValue(new Error("NotAllowedError"));
    mockSpeakText.mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" }));

    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("Hello", 0);
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeMessageIndex).toBeNull();
  });

  it("should revoke object URL when audio ends", async () => {
    const mockAudio = setupMockAudio();
    mockSpeakText.mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" }));

    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play("Hello", 0);
    });

    act(() => {
      mockAudio.onended?.();
    });

    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
