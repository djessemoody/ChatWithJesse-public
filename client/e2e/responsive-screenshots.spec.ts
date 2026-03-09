import { test, expect } from "@playwright/test";

/**
 * Responsive screenshot tests.
 *
 * Captures screenshots of every view at each configured viewport size
 * (mobile portrait, mobile landscape, tablet, small desktop, large desktop).
 *
 * Screenshots are saved to client/screenshots/ with names like:
 *   chat-empty-mobile-portrait.png
 *   how-its-made-tablet.png
 *
 * Run: cd client && npx playwright test
 * Then ask Claude to review the screenshots/ directory.
 */

test.describe("Responsive Screenshots", () => {
  test("chat view — empty state", async ({ page }, testInfo) => {
    await page.goto("/");
    // Wait for the app to render
    await expect(page.locator("nav[aria-label='Main navigation']")).toBeVisible();
    // Small delay for animations to settle
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `screenshots/chat-empty-${testInfo.project.name}.png`,
      fullPage: false,
    });
  });

  test("chat view — with messages", async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page.locator("nav[aria-label='Main navigation']")).toBeVisible();

    // Type and send a message to populate the chat
    const input = page.locator('input[type="text"], textarea').first();
    await input.fill("Tell me about yourself");
    await input.press("Enter");

    // Wait for the user message to appear
    await expect(page.locator("text=Tell me about yourself")).toBeVisible();

    // Wait a moment for any loading state to show
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `screenshots/chat-with-message-${testInfo.project.name}.png`,
      fullPage: false,
    });
  });

  test("how it's made view", async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page.locator("nav[aria-label='Main navigation']")).toBeVisible();

    // Click the "How I Built This" tab
    await page.click("text=How I Built This");
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `screenshots/how-its-made-${testInfo.project.name}.png`,
      fullPage: false,
    });
  });

  test("how it's made view — scrolled", async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page.locator("nav[aria-label='Main navigation']")).toBeVisible();

    // Click the "How I Built This" tab
    await page.click("text=How I Built This");
    await page.waitForTimeout(300);

    // Scroll down to show more content
    const scrollable = page.locator(".overflow-auto").first();
    await scrollable.evaluate((el) => el.scrollTo(0, el.scrollHeight / 2));
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `screenshots/how-its-made-scrolled-${testInfo.project.name}.png`,
      fullPage: false,
    });
  });
});
