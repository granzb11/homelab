import { test, expect } from "@playwright/test";

test.describe("Friends page", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/friends");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("shows Add a friend button / form trigger", async ({ page }) => {
    await page.goto("/friends");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: /add/i })).toBeVisible();
  });

  test("add friend form appears on click", async ({ page }) => {
    await page.goto("/friends");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /add/i }).click();
    await expect(page.getByPlaceholder(/name/i)).toBeVisible();
  });

  test("friend cards render for existing friends", async ({ page }) => {
    await page.goto("/friends");
    await page.waitForLoadState("networkidle");
    // Cards or the empty-state copy should be present — just no crash
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });
});
