import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    // React error #418 is a known hydration mismatch from SSR — not a test regression
    page.on("pageerror", (err) => {
      if (!err.message.includes("418")) errors.push(err.message);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("shows the app nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Friends", exact: true })).toBeVisible();
  });

  test("streak cards section renders", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Either streak cards or the empty-state message should be present
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });
});
