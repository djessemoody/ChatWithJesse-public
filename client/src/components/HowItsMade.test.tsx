import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HowItsMade } from "./HowItsMade";

describe("HowItsMade", () => {
  it("should render the main heading", () => {
    render(<HowItsMade />);
    expect(screen.getByText("How I Built This")).toBeInTheDocument();
  });

  it("should render the introductory paragraph with Claude Code link", () => {
    render(<HowItsMade />);
    const link = screen.getByRole("link", { name: "Claude Code" });
    expect(link).toHaveAttribute("href", "https://claude.ai/code");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("should render all stats", () => {
    render(<HowItsMade />);
    expect(screen.getByText("35+")).toBeInTheDocument();
    expect(screen.getByText("PRs Merged")).toBeInTheDocument();
    expect(screen.getByText("296")).toBeInTheDocument();
    expect(screen.getByText("Tests Written")).toBeInTheDocument();
    expect(screen.getByText("2 days")).toBeInTheDocument();
    expect(screen.getByText("Mini Sessions, One Weekend")).toBeInTheDocument();
    expect(screen.getByText("5,600+")).toBeInTheDocument();
  });

  it("should render My Approach section", () => {
    render(<HowItsMade />);
    expect(screen.getByText("My Approach")).toBeInTheDocument();
    expect(screen.getByText("starting with a clear plan")).toBeInTheDocument();
  });

  it("should render all timeline entries", () => {
    render(<HowItsMade />);
    expect(screen.getByText("The Plan")).toBeInTheDocument();
    expect(screen.getByText("Scaffold to Working Chat")).toBeInTheDocument();
    expect(screen.getByText("Tests Before Features")).toBeInTheDocument();
    expect(screen.getByText("Voice In, Voice Out")).toBeInTheDocument();
    expect(screen.getByText("The Deep Test Pass")).toBeInTheDocument();
    expect(screen.getByText("Visual Testing")).toBeInTheDocument();
    expect(screen.getByText("Making It Personal")).toBeInTheDocument();
    expect(screen.getByText("Design & Polish")).toBeInTheDocument();
  });

  it("should render timeline phase labels", () => {
    render(<HowItsMade />);
    expect(screen.getByText("Phase 1")).toBeInTheDocument();
    expect(screen.getByText("Phase 6")).toBeInTheDocument();
    expect(screen.getByText("Phase 7")).toBeInTheDocument();
  });

  it("should render What I Learned section", () => {
    render(<HowItsMade />);
    expect(screen.getByText("What I Learned")).toBeInTheDocument();
    expect(screen.getByText("The plan is everything.")).toBeInTheDocument();
    expect(screen.getByText("Actually look at what's being built.")).toBeInTheDocument();
    expect(screen.getByText("Tests catch what you miss.")).toBeInTheDocument();
    expect(screen.getByText("Multi-agent for breadth, single-agent for depth.")).toBeInTheDocument();
  });

  it("should render the tech stack section", () => {
    render(<HowItsMade />);
    expect(screen.getByText("Tech Stack")).toBeInTheDocument();
    expect(screen.getByText("React 19, TypeScript, Vite, Tailwind CSS")).toBeInTheDocument();
    expect(screen.getByText("Claude Code (Anthropic)")).toBeInTheDocument();
  });

  it("should render the GitHub source link", () => {
    render(<HowItsMade />);
    const link = screen.getByRole("link", { name: "github.com/djessemoody/ChatWithJesse-public" });
    expect(link).toHaveAttribute("href", "https://github.com/djessemoody/ChatWithJesse-public");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("should have scrollable container", () => {
    const { container } = render(<HowItsMade />);
    const scrollContainer = container.firstElementChild;
    expect(scrollContainer).toHaveClass("overflow-y-auto");
  });
});
