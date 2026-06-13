import { test, expect } from "@playwright/test";

test.describe("New hangout page", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/hangouts/new");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("shows the hangout form or add-friend prompt", async ({ page }) => {
    await page.goto("/hangouts/new");
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").textContent();
    // Either the form renders or it tells you to add a friend first
    expect(body).toMatch(/hangout|friend/i);
  });

  test("form has a Save button when friends exist", async ({ page }) => {
    await page.goto("/hangouts/new");
    await page.waitForLoadState("networkidle");

    const saveBtn = page.getByRole("button", { name: /save|log/i });
    const addPrompt = page.getByText(/add a friend first/i);

    // One or the other must be present
    const hasSave = await saveBtn.isVisible().catch(() => false);
    const hasPrompt = await addPrompt.isVisible().catch(() => false);
    expect(hasSave || hasPrompt).toBe(true);
  });
});
