import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageBubble from "./MessageBubble";

describe("MessageBubble", () => {
  it("should render the message content", () => {
    render(<MessageBubble role="user" content="Hello Jesse!" />);
    expect(screen.getByText("Hello Jesse!")).toBeInTheDocument();
  });

  it("should render user messages aligned right", () => {
    const { container } = render(
      <MessageBubble role="user" content="Hi" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-end");
  });

  it("should render assistant messages aligned left", () => {
    const { container } = render(
      <MessageBubble role="assistant" content="Hey!" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-start");
  });

  it("should apply gradient styling to user messages", () => {
    render(<MessageBubble role="user" content="Hi" />);
    const bubble = screen.getByText("Hi");
    expect(bubble.className).toContain("from-indigo-500");
  });

  it("should apply glass styling to assistant messages", () => {
    render(<MessageBubble role="assistant" content="Hey!" />);
    const bubble = screen.getByText("Hey!").closest(".rounded-2xl");
    expect(bubble?.className).toContain("bg-white/10");
  });

  it("should render long messages without truncation", () => {
    const longMessage = "A".repeat(1000);
    render(<MessageBubble role="user" content={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it("should render messages with special characters", () => {
    render(
      <MessageBubble role="assistant" content="Hello <world> & 'friends'" />
    );
    expect(
      screen.getByText("Hello <world> & 'friends'")
    ).toBeInTheDocument();
  });

  it("should render empty content string without crashing", () => {
    const { container } = render(
      <MessageBubble role="user" content="" />
    );
    const bubble = container.querySelector(".rounded-2xl");
    expect(bubble).toBeInTheDocument();
    expect(bubble?.textContent).toBe("");
  });

  it("should render a very long single word without spaces", () => {
    const longWord = "A".repeat(500);
    render(<MessageBubble role="assistant" content={longWord} />);
    expect(screen.getByText(longWord)).toBeInTheDocument();
  });

  it("should not apply gradient to assistant messages", () => {
    render(<MessageBubble role="assistant" content="Hey!" />);
    const bubble = screen.getByText("Hey!").closest(".rounded-2xl");
    expect(bubble?.className).not.toContain("from-indigo-500");
  });

  it("should not apply glass background to user messages", () => {
    render(<MessageBubble role="user" content="Hi" />);
    const bubble = screen.getByText("Hi");
    expect(bubble.className).not.toContain("bg-white/10");
  });

  it("should render markdown in assistant messages", () => {
    render(
      <MessageBubble role="assistant" content="This is **bold** and *italic*" />
    );
    const bubble = screen.getByText("bold").closest(".prose-chat");
    expect(bubble).toBeInTheDocument();
    const bold = screen.getByText("bold");
    expect(bold.tagName).toBe("STRONG");
    const italic = screen.getByText("italic");
    expect(italic.tagName).toBe("EM");
  });

  it("should not render markdown in user messages", () => {
    render(<MessageBubble role="user" content="This is **not bold**" />);
    expect(screen.getByText("This is **not bold**")).toBeInTheDocument();
    expect(screen.queryByText("not bold")).not.toBeInTheDocument();
  });

  it("should render assistant empty content without crashing", () => {
    const { container } = render(
      <MessageBubble role="assistant" content="" />
    );
    const bubble = container.querySelector(".rounded-2xl");
    expect(bubble).toBeInTheDocument();
  });

  it("should show play button on assistant messages when onPlay is provided", () => {
    render(
      <MessageBubble
        role="assistant"
        content="Hey!"
        onPlay={() => {}}
        onStop={() => {}}
      />
    );
    expect(screen.getByLabelText("Play audio")).toBeInTheDocument();
  });

  it("should not show play button on user messages", () => {
    render(
      <MessageBubble
        role="user"
        content="Hi"
        onPlay={() => {}}
        onStop={() => {}}
      />
    );
    expect(screen.queryByLabelText("Play audio")).not.toBeInTheDocument();
  });

  it("should not show audio controls when onPlay/onStop not provided", () => {
    render(<MessageBubble role="assistant" content="Hey!" />);
    expect(screen.queryByLabelText("Play audio")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Stop audio")).not.toBeInTheDocument();
  });

  it("should show stop button when isActive and not speaking", () => {
    render(
      <MessageBubble
        role="assistant"
        content="Hey!"
        isActive={true}
        isSpeaking={false}
        onPlay={() => {}}
        onStop={() => {}}
      />
    );
    expect(screen.getByLabelText("Stop audio")).toBeInTheDocument();
  });

  it("should show loading indicator when isActive and isSpeaking", () => {
    render(
      <MessageBubble
        role="assistant"
        content="Hey!"
        isActive={true}
        isSpeaking={true}
        onPlay={() => {}}
        onStop={() => {}}
      />
    );
    expect(screen.getByText("Loading audio...")).toBeInTheDocument();
  });

  it("should call onPlay when play button is clicked", () => {
    const onPlay = vi.fn();
    render(
      <MessageBubble
        role="assistant"
        content="Hey!"
        onPlay={onPlay}
        onStop={() => {}}
      />
    );
    fireEvent.click(screen.getByLabelText("Play audio"));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("should call onStop when stop button is clicked", () => {
    const onStop = vi.fn();
    render(
      <MessageBubble
        role="assistant"
        content="Hey!"
        isActive={true}
        isSpeaking={false}
        onPlay={() => {}}
        onStop={onStop}
      />
    );
    fireEvent.click(screen.getByLabelText("Stop audio"));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
