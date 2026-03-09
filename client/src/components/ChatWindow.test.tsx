import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatWindow from "./ChatWindow";

describe("ChatWindow", () => {
  it("should show empty state when no messages", () => {
    render(<ChatWindow messages={[]} isLoading={false} activeMessageIndex={null} />);
    expect(screen.getByText("Say hello to AI Jesse!")).toBeInTheDocument();
  });

  it("should hide empty state when messages exist", () => {
    render(
      <ChatWindow
        messages={[{ role: "user", content: "Hi" }]}
        isLoading={false}
        activeMessageIndex={null}
      />
    );
    expect(screen.queryByText("Say hello to AI Jesse!")).not.toBeInTheDocument();
  });

  it("should render all messages", () => {
    const messages = [
      { role: "user" as const, content: "Hello" },
      { role: "assistant" as const, content: "Hey there!" },
      { role: "user" as const, content: "How are you?" },
    ];

    render(<ChatWindow messages={messages} isLoading={false} activeMessageIndex={null} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hey there!")).toBeInTheDocument();
    expect(screen.getByText("How are you?")).toBeInTheDocument();
  });

  it("should show typing indicator when loading", () => {
    const { container } = render(<ChatWindow messages={[]} isLoading={true} activeMessageIndex={null} />);
    expect(container.querySelector(".animate-bounce_dot")).toBeInTheDocument();
  });

  it("should hide typing indicator when not loading", () => {
    const { container } = render(<ChatWindow messages={[]} isLoading={false} activeMessageIndex={null} />);
    expect(container.querySelector(".animate-bounce_dot")).not.toBeInTheDocument();
  });

  it("should show messages AND typing indicator when loading with messages", () => {
    const { container } = render(
      <ChatWindow
        messages={[{ role: "user", content: "Hello" }]}
        isLoading={true}
        activeMessageIndex={null}
      />
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(container.querySelector(".animate-bounce_dot")).toBeInTheDocument();
  });

  it("should render messages in order", () => {
    const messages = [
      { role: "user" as const, content: "First" },
      { role: "assistant" as const, content: "Second" },
      { role: "user" as const, content: "Third" },
    ];

    const { container } = render(
      <ChatWindow messages={messages} isLoading={false} activeMessageIndex={null} />
    );

    const bubbles = container.querySelectorAll(".rounded-2xl");
    expect(bubbles[0].textContent).toBe("First");
    expect(bubbles[1].textContent).toBe("Second");
    expect(bubbles[2].textContent).toBe("Third");
  });

  it("should call scrollIntoView when messages change", () => {
    const scrollIntoView = vi.fn();
    HTMLDivElement.prototype.scrollIntoView = scrollIntoView;

    const { rerender } = render(
      <ChatWindow messages={[]} isLoading={false} activeMessageIndex={null} />
    );

    scrollIntoView.mockClear();

    rerender(
      <ChatWindow
        messages={[{ role: "user", content: "Hello" }]}
        isLoading={false}
        activeMessageIndex={null}
      />
    );

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("should call scrollIntoView when loading state changes", () => {
    const scrollIntoView = vi.fn();
    HTMLDivElement.prototype.scrollIntoView = scrollIntoView;

    const { rerender } = render(
      <ChatWindow messages={[{ role: "user", content: "Hi" }]} isLoading={false} activeMessageIndex={null} />
    );

    scrollIntoView.mockClear();

    rerender(
      <ChatWindow messages={[{ role: "user", content: "Hi" }]} isLoading={true} activeMessageIndex={null} />
    );

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("should render a large message list without issues", () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `Message ${i}`,
    }));

    render(<ChatWindow messages={messages} isLoading={false} activeMessageIndex={null} />);

    expect(screen.getByText("Message 0")).toBeInTheDocument();
    expect(screen.getByText("Message 99")).toBeInTheDocument();
  });
});
