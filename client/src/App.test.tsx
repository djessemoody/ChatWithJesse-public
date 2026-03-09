import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

// Mock hooks
vi.mock("./hooks/useChat", () => ({
  useChat: vi.fn(),
}));

vi.mock("./hooks/useVoice", () => ({
  useVoice: vi.fn(),
}));

vi.mock("./hooks/useAudioPlayback", () => ({
  useAudioPlayback: vi.fn(),
}));

// Mock child components to isolate App logic
vi.mock("./components/ChatWindow", () => ({
  default: ({ messages, isLoading }: { messages: unknown[]; isLoading: boolean }) => (
    <div data-testid="chat-window" data-messages={JSON.stringify(messages)} data-loading={isLoading} />
  ),
}));

vi.mock("./components/ChatInput", () => ({
  default: ({ onSend, disabled }: { onSend: (t: string) => void; disabled: boolean }) => (
    <div data-testid="chat-input" data-disabled={disabled} onClick={() => onSend("test")} />
  ),
}));

vi.mock("./components/HowItsMade", () => ({
  HowItsMade: () => <div data-testid="how-its-made" />,
}));

vi.mock("./components/VoiceButton", () => ({
  VoiceButton: ({
    disabled,
    isRecording,
    onStartRecording,
    onStopRecording,
  }: {
    disabled: boolean;
    isRecording: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
  }) => (
    <div
      data-testid="voice-button"
      data-disabled={disabled}
      data-recording={isRecording}
      data-start={!!onStartRecording}
      data-stop={!!onStopRecording}
    />
  ),
}));

import { useChat } from "./hooks/useChat";
import { useVoice } from "./hooks/useVoice";
import { useAudioPlayback } from "./hooks/useAudioPlayback";

const mockUseChat = useChat as ReturnType<typeof vi.fn>;
const mockUseVoice = useVoice as ReturnType<typeof vi.fn>;
const mockUseAudioPlayback = useAudioPlayback as ReturnType<typeof vi.fn>;

const mockSend = vi.fn();
const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn();
const mockPlay = vi.fn();
const mockStop = vi.fn();

function setupMocks(overrides?: {
  messages?: { role: string; content: string }[];
  isLoading?: boolean;
  isRecording?: boolean;
}) {
  mockUseChat.mockReturnValue({
    messages: overrides?.messages ?? [],
    isLoading: overrides?.isLoading ?? false,
    send: mockSend,
  });

  mockUseAudioPlayback.mockReturnValue({
    isPlaying: false,
    isLoading: false,
    activeMessageIndex: null,
    play: mockPlay,
    stop: mockStop,
  });

  mockUseVoice.mockImplementation((opts?: { onTranscription?: (text: string) => void }) => {
    // Store the callback so tests can invoke it
    (mockUseVoice as ReturnType<typeof vi.fn> & { lastOnTranscription?: (text: string) => void }).lastOnTranscription =
      opts?.onTranscription;
    return {
      isRecording: overrides?.isRecording ?? false,
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
    };
  });
}

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it("should render nav tabs, ChatWindow, ChatInput, and VoiceButton", () => {
    render(<App />);

    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("How I Built This")).toBeInTheDocument();
    expect(screen.getByTestId("chat-window")).toBeInTheDocument();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
    expect(screen.getByTestId("voice-button")).toBeInTheDocument();
  });

  it("should pass messages and isLoading to ChatWindow", () => {
    const messages = [{ role: "user", content: "Hi" }];
    setupMocks({ messages, isLoading: true });

    render(<App />);

    const chatWindow = screen.getByTestId("chat-window");
    expect(chatWindow.dataset.messages).toBe(JSON.stringify(messages));
    expect(chatWindow.dataset.loading).toBe("true");
  });

  it("should pass send and disabled to ChatInput", () => {
    setupMocks({ isLoading: false });

    render(<App />);

    const chatInput = screen.getByTestId("chat-input");
    expect(chatInput.dataset.disabled).toBe("false");
  });

  it("should disable ChatInput when isLoading is true", () => {
    setupMocks({ isLoading: true });

    render(<App />);

    const chatInput = screen.getByTestId("chat-input");
    expect(chatInput.dataset.disabled).toBe("true");
  });

  it("should pass recording state and callbacks to VoiceButton", () => {
    setupMocks({ isRecording: true, isLoading: false });

    render(<App />);

    const voiceButton = screen.getByTestId("voice-button");
    expect(voiceButton.dataset.recording).toBe("true");
    expect(voiceButton.dataset.disabled).toBe("false");
    expect(voiceButton.dataset.start).toBe("true");
    expect(voiceButton.dataset.stop).toBe("true");
  });

  it("should disable VoiceButton when isLoading is true", () => {
    setupMocks({ isLoading: true });

    render(<App />);

    const voiceButton = screen.getByTestId("voice-button");
    expect(voiceButton.dataset.disabled).toBe("true");
  });

  it("should trim whitespace and call send on transcription callback", () => {
    setupMocks();

    render(<App />);

    const onTranscription = (mockUseVoice as ReturnType<typeof vi.fn> & { lastOnTranscription?: (text: string) => void })
      .lastOnTranscription;
    expect(onTranscription).toBeDefined();

    onTranscription!("  Hello Jesse  ");
    expect(mockSend).toHaveBeenCalledWith("  Hello Jesse  ");
  });

  it("should not call send when transcription is only whitespace", () => {
    setupMocks();

    render(<App />);

    const onTranscription = (mockUseVoice as ReturnType<typeof vi.fn> & { lastOnTranscription?: (text: string) => void })
      .lastOnTranscription;
    expect(onTranscription).toBeDefined();

    onTranscription!("   ");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should not call send when transcription is empty string", () => {
    setupMocks();

    render(<App />);

    const onTranscription = (mockUseVoice as ReturnType<typeof vi.fn> & { lastOnTranscription?: (text: string) => void })
      .lastOnTranscription;
    expect(onTranscription).toBeDefined();

    onTranscription!("");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should wire ChatInput onSend to send function", () => {
    setupMocks();

    render(<App />);

    const chatInput = screen.getByTestId("chat-input");
    chatInput.click();
    expect(mockSend).toHaveBeenCalledWith("test");
  });

  it("should show HowItsMade and hide chat when 'How I Built This' tab is clicked", () => {
    setupMocks();

    render(<App />);

    fireEvent.click(screen.getByText("How I Built This"));

    expect(screen.getByTestId("how-its-made")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-window")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chat-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("voice-button")).not.toBeInTheDocument();
  });

  it("should switch back to chat when 'Chat' tab is clicked", () => {
    setupMocks();

    render(<App />);

    fireEvent.click(screen.getByText("How I Built This"));
    expect(screen.getByTestId("how-its-made")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Chat"));
    expect(screen.getByTestId("chat-window")).toBeInTheDocument();
    expect(screen.queryByTestId("how-its-made")).not.toBeInTheDocument();
  });

  it("should hide voice toggle when on How I Built This view", () => {
    setupMocks();

    render(<App />);

    expect(screen.getByText("Voice On")).toBeInTheDocument();

    fireEvent.click(screen.getByText("How I Built This"));
    expect(screen.queryByText("Voice On")).not.toBeInTheDocument();
    expect(screen.queryByText("Voice Off")).not.toBeInTheDocument();
  });

  it("should set aria-current on active tab", () => {
    setupMocks();

    render(<App />);

    expect(screen.getByText("Chat")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("How I Built This")).not.toHaveAttribute("aria-current");

    fireEvent.click(screen.getByText("How I Built This"));
    expect(screen.getByText("How I Built This")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Chat")).not.toHaveAttribute("aria-current");
  });
});
