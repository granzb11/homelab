import { test, expect } from "@playwright/test";

test.describe("Plan a trip page", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/plans/new");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("shows the plan form with a Save plan button", async ({ page }) => {
    await page.goto("/plans/new");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /plan a trip/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /save plan/i })).toBeVisible();
  });

  test("dashboard exposes a Plan a trip entry point", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /plan a trip/i })).toBeVisible();
  });
});
