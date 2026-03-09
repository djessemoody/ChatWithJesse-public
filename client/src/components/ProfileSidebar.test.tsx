import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProfileSidebar } from "./ProfileSidebar";

describe("ProfileSidebar", () => {
  it("renders profile images with correct alt text and src", () => {
    render(<ProfileSidebar />);
    const images = screen.getAllByAltText("Jesse Moody");
    expect(images.length).toBeGreaterThanOrEqual(1);
    images.forEach((img) => {
      expect(img).toHaveAttribute("src", "/jesse-profile.png");
    });
  });

  it("renders the name and title", () => {
    render(<ProfileSidebar />);
    expect(screen.getAllByText("Jesse Moody").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Engineering leader/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders GitHub link with correct URL", () => {
    render(<ProfileSidebar />);
    const links = screen.getAllByRole("link", { name: /GitHub/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    links.forEach((link) => {
      expect(link).toHaveAttribute(
        "href",
        "https://github.com/djessemoody/ChatWithJesse-public",
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("renders LinkedIn link with correct URL", () => {
    render(<ProfileSidebar />);
    const links = screen.getAllByRole("link", { name: /LinkedIn/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    links.forEach((link) => {
      expect(link).toHaveAttribute(
        "href",
        "https://linkedin.com/in/djessemoody",
      );
    });
  });

  it("renders Prior ML Inventions link with correct URL", () => {
    render(<ProfileSidebar />);
    const links = screen.getAllByRole("link", { name: /Prior ML Inventions/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    links.forEach((link) => {
      expect(link).toHaveAttribute(
        "href",
        "https://tinyurl.com/moodypatent",
      );
    });
  });

  it("renders Resume link with correct URL", () => {
    render(<ProfileSidebar />);
    const links = screen.getAllByRole("link", { name: /Resume/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "/jesse-moody-resume.pdf");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("has navigation landmarks with accessible label", () => {
    render(<ProfileSidebar />);
    const navs = screen.getAllByRole("navigation", { name: "Profile links" });
    expect(navs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders links in both mobile and desktop views", () => {
    render(<ProfileSidebar />);
    const links = screen.getAllByRole("link");
    // 4 links x 2 views (mobile + desktop)
    expect(links).toHaveLength(8);
  });

  it("renders mobile banner", () => {
    render(<ProfileSidebar />);
    expect(screen.getByTestId("profile-mobile")).toBeInTheDocument();
  });

  it("renders desktop sidebar", () => {
    render(<ProfileSidebar />);
    expect(screen.getByTestId("profile-desktop")).toBeInTheDocument();
  });
});
