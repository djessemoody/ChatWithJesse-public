import fs from "fs";
import path from "path";
import { buildSystemPrompt } from "../services/persona";

// Mock fs to control persona file contents
jest.mock("fs");

const mockedFs = jest.mocked(fs);

const PERSONA_DIR = path.join(__dirname, "..", "persona");

function mockPersonaFiles(files: Record<string, string>) {
  mockedFs.readFileSync.mockImplementation((filePath: fs.PathOrFileDescriptor) => {
    const p = filePath.toString();
    for (const [name, content] of Object.entries(files)) {
      if (p === path.join(PERSONA_DIR, name)) {
        return content;
      }
    }
    throw new Error(`ENOENT: no such file or directory, open '${p}'`);
  });
}

describe("buildSystemPrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should build a prompt with all persona files present", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({
        name: "Jesse",
        tone: "friendly",
        traits: ["curious", "helpful"],
        speakingStyle: "casual",
        instructions: "Be yourself.",
      }),
      "bio.md": "# Bio\nSoftware engineer from Austin.",
      "knowledge.md": "# Knowledge\nExpert in TypeScript.",
      "links.json": JSON.stringify({
        links: [
          { label: "GitHub", url: "https://github.com/jesse", description: "My GitHub" },
        ],
      }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).toContain("You are Jesse");
    expect(prompt).toContain("Be yourself.");
    expect(prompt).toContain("friendly");
    expect(prompt).toContain("casual");
    expect(prompt).toContain("curious, helpful");
    expect(prompt).toContain("Software engineer from Austin");
    expect(prompt).toContain("Expert in TypeScript");
    expect(prompt).toContain("GitHub");
    expect(prompt).toContain("https://github.com/jesse");
  });

  it("should use defaults when jesse.json is missing", () => {
    mockPersonaFiles({
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({ links: [] }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).toContain("You are Jesse");
    expect(prompt).toContain("friendly and conversational");
    expect(prompt).toContain("casual but knowledgeable");
  });

  it("should handle missing bio.md and knowledge.md gracefully", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({ name: "Jesse", traits: [] }),
      "links.json": JSON.stringify({ links: [] }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).toContain("You are Jesse");
    // Should not contain section headers for empty content
    expect(prompt).not.toContain("## About Me");
    expect(prompt).not.toContain("## My Work & Expertise");
  });

  it("should filter out links with empty URLs", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({ name: "Jesse", traits: [] }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({
        links: [
          { label: "LinkedIn", url: "", description: "My LinkedIn" },
          { label: "GitHub", url: "https://github.com/jesse", description: "My code" },
        ],
      }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).not.toContain("LinkedIn");
    expect(prompt).toContain("GitHub");
    expect(prompt).toContain("https://github.com/jesse");
  });

  it("should handle all files missing", () => {
    mockPersonaFiles({});

    const prompt = buildSystemPrompt();
    expect(prompt).toContain("You are Jesse");
    expect(prompt).toContain("Remember: You ARE Jesse");
  });

  it("should always end with response style instructions", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({ name: "Jesse", traits: [] }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({ links: [] }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).toContain("Remember: You ARE Jesse");
    expect(prompt).toContain("## Response Style");
    expect(prompt).toContain("short and conversational");
    expect(prompt).toContain("text-to-speech");
  });

  // BUG: If links.json exists but has no "links" key, this will crash
  // because linksData.links will be undefined and .filter() throws
  it("should handle links.json without a links array", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({ name: "Jesse", traits: [] }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({ website: "https://jesse.dev" }),
    });

    expect(() => buildSystemPrompt()).not.toThrow();
  });

  // BUG: If jesse.json contains invalid JSON (not empty, but malformed),
  // readFileIfExists returns the string, but JSON.parse will throw
  it("should handle malformed jesse.json", () => {
    mockPersonaFiles({
      "jesse.json": "{ invalid json",
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({ links: [] }),
    });

    expect(() => buildSystemPrompt()).not.toThrow();
  });

  // BUG: If links.json contains invalid JSON
  it("should handle malformed links.json", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({ name: "Jesse", traits: [] }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": "not json",
    });

    expect(() => buildSystemPrompt()).not.toThrow();
  });

  it("should include the name from jesse.json in the prompt", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({ name: "CustomName", traits: [] }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({ links: [] }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).toContain("You are CustomName");
  });

  it("should include traits as comma-separated list", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({
        name: "Jesse",
        traits: ["smart", "funny", "kind"],
      }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({ links: [] }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).toContain("smart, funny, kind");
  });

  it("should include whitespace-only bio and knowledge sections", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({ name: "Jesse", traits: [] }),
      "bio.md": "   \n  ",
      "knowledge.md": "  \t  ",
      "links.json": JSON.stringify({ links: [] }),
    });

    const prompt = buildSystemPrompt();
    // Whitespace-only content is truthy, so sections should appear
    expect(prompt).toContain("## About Me");
    expect(prompt).toContain("## My Work & Expertise");
  });

  it("should use defaults for falsy name, tone, and speakingStyle", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({
        name: "",
        tone: "",
        speakingStyle: "",
        traits: [],
      }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({ links: [] }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).toContain("You are Jesse");
    expect(prompt).toContain("friendly and conversational");
    expect(prompt).toContain("casual but knowledgeable");
  });

  it("should handle link with missing label and description", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({ name: "Jesse", traits: [] }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({
        links: [{ url: "https://example.com" }],
      }),
    });

    const prompt = buildSystemPrompt();
    // Should fall back to URL as label and omit description
    expect(prompt).toContain("https://example.com");
    expect(prompt).not.toContain("undefined");
  });

  it("should handle traits as a string instead of an array", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({
        name: "Jesse",
        traits: "curious and kind",
      }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({ links: [] }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).toContain("curious and kind");
  });

  it("should include building-this.md content when present", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({ name: "Jesse", traits: [] }),
      "bio.md": "",
      "knowledge.md": "",
      "building-this.md": "Built with Claude Code over a weekend.",
      "links.json": JSON.stringify({ links: [] }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).toContain("## How This App Was Built");
    expect(prompt).toContain("Built with Claude Code over a weekend.");
  });

  it("should omit build story section when building-this.md is missing", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({ name: "Jesse", traits: [] }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({ links: [] }),
    });

    const prompt = buildSystemPrompt();
    expect(prompt).not.toContain("## How This App Was Built");
  });

  it("should handle traits as an object without throwing", () => {
    mockPersonaFiles({
      "jesse.json": JSON.stringify({
        name: "Jesse",
        traits: { primary: "curious" },
      }),
      "bio.md": "",
      "knowledge.md": "",
      "links.json": JSON.stringify({ links: [] }),
    });

    expect(() => buildSystemPrompt()).not.toThrow();
  });
});
