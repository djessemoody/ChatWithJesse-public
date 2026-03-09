import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatInput from "./ChatInput";

describe("ChatInput", () => {
  it("should render an input and send button", () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />);
    expect(
      screen.getByPlaceholderText("Type a message...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("should call onSend with trimmed text on submit", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} disabled={false} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "  Hello Jesse!  ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith("Hello Jesse!");
  });

  it("should clear input after sending", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} disabled={false} />);

    const input = screen.getByPlaceholderText(
      "Type a message..."
    ) as HTMLInputElement;
    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(input.value).toBe("");
  });

  it("should not call onSend when input is empty", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} disabled={false} />);
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("should not call onSend when input is only whitespace", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} disabled={false} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "   ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("should disable input and button when disabled is true", () => {
    render(<ChatInput onSend={vi.fn()} disabled={true} />);

    expect(screen.getByPlaceholderText("Type a message...")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("should not call onSend when disabled even with text", async () => {
    const onSend = vi.fn();

    render(<ChatInput onSend={onSend} disabled={true} />);

    // Can't type when disabled, but test the submit path
    const form = screen.getByRole("button", { name: "Send" }).closest("form")!;
    form.dispatchEvent(new Event("submit", { bubbles: true }));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("should submit on Enter key", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} disabled={false} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Hello{Enter}");

    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  it("should disable send button when input is empty", () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("should handle unicode and emoji input", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} disabled={false} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Hello 👋 café");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith("Hello 👋 café");
  });

  it("should handle very long input strings", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} disabled={false} />);

    const input = screen.getByPlaceholderText("Type a message...");
    const longText = "A".repeat(5000);
    // Use fireEvent for long strings to avoid userEvent.type timeout
    fireEvent.change(input, { target: { value: longText } });
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith(longText);
  });

  it("should re-enable send button as user types", async () => {
    const user = userEvent.setup();

    render(<ChatInput onSend={vi.fn()} disabled={false} />);

    const button = screen.getByRole("button", { name: "Send" });
    expect(button).toBeDisabled();

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "H");

    expect(button).not.toBeDisabled();
  });
});
