import { test, expect } from "@playwright/test";

test.describe("API health checks", () => {
  test("GET /api/friends returns 200", async ({ request }) => {
    const res = await request.get("/api/friends");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /api/events returns 200", async ({ request }) => {
    const res = await request.get("/api/events");
    expect(res.status()).toBe(200);
  });
});
