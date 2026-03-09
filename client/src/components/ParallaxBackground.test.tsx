import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParallaxBackground } from "./ParallaxBackground";

describe("ParallaxBackground", () => {
  it("should render the parallax container", () => {
    render(<ParallaxBackground />);
    expect(screen.getByTestId("parallax-background")).toBeInTheDocument();
  });

  it("should be hidden from accessibility tree", () => {
    render(<ParallaxBackground />);
    const container = screen.getByTestId("parallax-background");
    expect(container).toHaveAttribute("aria-hidden", "true");
  });

  it("should render multiple floating shapes", () => {
    render(<ParallaxBackground />);
    const container = screen.getByTestId("parallax-background");
    const shapes = container.children;
    expect(shapes.length).toBeGreaterThanOrEqual(10);
  });

  it("should have the parallax-bg class", () => {
    render(<ParallaxBackground />);
    const container = screen.getByTestId("parallax-background");
    expect(container.className).toContain("parallax-bg");
  });

  it("should apply pointer-events none to shapes", () => {
    render(<ParallaxBackground />);
    const shape = screen.getByTestId("parallax-shape-1");
    expect(shape.style.pointerEvents).toBe("none");
  });

  it("should apply varying opacity to shapes", () => {
    render(<ParallaxBackground />);
    const shape1 = screen.getByTestId("parallax-shape-1");
    const shape11 = screen.getByTestId("parallax-shape-11");
    const opacity1 = parseFloat(shape1.style.opacity);
    const opacity11 = parseFloat(shape11.style.opacity);
    expect(opacity1).toBeGreaterThan(0);
    expect(opacity11).toBeGreaterThan(0);
    expect(opacity1).not.toBe(opacity11);
  });
});
