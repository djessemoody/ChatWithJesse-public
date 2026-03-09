import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TypingIndicator } from "./TypingIndicator";

describe("TypingIndicator", () => {
  it("should render three bouncing dots", () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll(".animate-bounce_dot");
    expect(dots).toHaveLength(3);
  });

  it("should have staggered animation delays", () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll(".animate-bounce_dot");
    expect((dots[0] as HTMLElement).style.animationDelay).toBe("0s");
    expect((dots[1] as HTMLElement).style.animationDelay).toBe("0.2s");
    expect((dots[2] as HTMLElement).style.animationDelay).toBe("0.4s");
  });

  it("should have fade-in-up animation on wrapper", () => {
    const { container } = render(<TypingIndicator />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("animate-fade-in-up");
  });
});
