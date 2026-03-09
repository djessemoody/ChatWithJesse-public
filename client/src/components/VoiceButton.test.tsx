import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoiceButton } from "./VoiceButton";

describe("VoiceButton", () => {
  it("should render a press to talk button", () => {
    render(
      <VoiceButton

        disabled={false}
        isRecording={false}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /press to talk/i })
    ).toBeInTheDocument();
  });

  it("should call onStartRecording when clicked while not recording", async () => {
    const onStartRecording = vi.fn();
    const user = userEvent.setup();

    render(
      <VoiceButton

        disabled={false}
        isRecording={false}
        onStartRecording={onStartRecording}
        onStopRecording={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /press to talk/i }));
    expect(onStartRecording).toHaveBeenCalledOnce();
  });

  it("should call onStopRecording when clicked while recording", async () => {
    const onStopRecording = vi.fn();
    const user = userEvent.setup();

    render(
      <VoiceButton

        disabled={false}
        isRecording={true}
        onStartRecording={vi.fn()}
        onStopRecording={onStopRecording}
      />
    );

    await user.click(screen.getByRole("button", { name: /click to send/i }));
    expect(onStopRecording).toHaveBeenCalledOnce();
  });

  it("should show recording state with click to send text when recording", () => {
    render(
      <VoiceButton

        disabled={false}
        isRecording={true}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
      />
    );

    expect(screen.getByText(/click to send/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /click to send/i })
    ).toBeInTheDocument();
  });

  it("should show wave animation bars when recording", () => {
    render(
      <VoiceButton

        disabled={false}
        isRecording={true}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
      />
    );

    const button = screen.getByRole("button", { name: /click to send/i });
    const waveBars = button.querySelectorAll(".animate-wave");
    expect(waveBars.length).toBe(5);
  });

  it("should not show wave animation when not recording", () => {
    render(
      <VoiceButton

        disabled={false}
        isRecording={false}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
      />
    );

    const button = screen.getByRole("button", { name: /press to talk/i });
    const waveBars = button.querySelectorAll(".animate-wave");
    expect(waveBars.length).toBe(0);
  });

  it("should be disabled when disabled prop is true", () => {
    render(
      <VoiceButton

        disabled={true}
        isRecording={false}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /press to talk/i })
    ).toBeDisabled();
  });

  it("should not call onStartRecording when disabled", async () => {
    const onStartRecording = vi.fn();
    const user = userEvent.setup();

    render(
      <VoiceButton

        disabled={true}
        isRecording={false}
        onStartRecording={onStartRecording}
        onStopRecording={vi.fn()}
      />
    );

    const button = screen.getByRole("button", { name: /press to talk/i });
    await user.click(button);
    expect(onStartRecording).not.toHaveBeenCalled();
  });

  it("should not call onStopRecording when disabled and recording", async () => {
    const onStopRecording = vi.fn();
    const user = userEvent.setup();

    render(
      <VoiceButton

        disabled={true}
        isRecording={true}
        onStartRecording={vi.fn()}
        onStopRecording={onStopRecording}
      />
    );

    const button = screen.getByRole("button", { name: /click to send/i });
    await user.click(button);
    expect(onStopRecording).not.toHaveBeenCalled();
  });

  it("should be disabled when both disabled and recording are true", () => {
    render(
      <VoiceButton
        disabled={true}
        isRecording={true}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
      />
    );

    const button = screen.getByRole("button", { name: /click to send/i });
    expect(button).toBeDisabled();
  });

  it("should handle rapid clicks without error", async () => {
    const onStartRecording = vi.fn();
    const onStopRecording = vi.fn();
    const user = userEvent.setup();

    render(
      <VoiceButton
        disabled={false}
        isRecording={false}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
      />
    );

    const button = screen.getByRole("button", { name: /press to talk/i });
    await user.click(button);
    await user.click(button);
    await user.click(button);

    // Since isRecording is false (static prop), all clicks call onStartRecording
    expect(onStartRecording).toHaveBeenCalledTimes(3);
    expect(onStopRecording).not.toHaveBeenCalled();
  });

  it("should have correct aria-label when not recording", () => {
    render(
      <VoiceButton
        disabled={false}
        isRecording={false}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Press to talk");
  });

  it("should have correct aria-label when recording", () => {
    render(
      <VoiceButton
        disabled={false}
        isRecording={true}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Click to send recording");
  });
});
