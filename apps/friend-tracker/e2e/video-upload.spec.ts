/**
 * Video upload + playback test
 *
 * Requires IMG_8842.MOV to exist in one of: ~/Downloads, ~/Desktop, ~/Movies.
 * Drop the file there and re-run if the test is skipped.
 *
 * What it does:
 *   1. Creates a test hangout via the API (needs at least one friend in the DB)
 *   2. Navigates to the hangout detail page
 *   3. Uploads IMG_8842.MOV via the media upload zone
 *   4. Opens the lightbox and asserts the video plays (currentTime advances)
 *   5. Cleans up the hangout after the test
 */

import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";

const VIDEO_FILENAME = "IMG_8842.MOV";

function findVideoFile(): string | null {
  const candidates = [
    // Project test-data folder
    path.join(__dirname, "..", "test-data", VIDEO_FILENAME),
    path.join(__dirname, "..", "test-data", VIDEO_FILENAME.toLowerCase()),
    // Playwright fixtures folder
    path.join(__dirname, "fixtures", VIDEO_FILENAME),
    path.join(__dirname, "fixtures", VIDEO_FILENAME.toLowerCase()),
    // Common drop spots
    path.join(os.homedir(), "Downloads", VIDEO_FILENAME),
    path.join(os.homedir(), "Desktop", VIDEO_FILENAME),
    path.join(os.homedir(), "Movies", VIDEO_FILENAME),
    path.join(os.homedir(), "Downloads", VIDEO_FILENAME.toLowerCase()),
    path.join(os.homedir(), "Desktop", VIDEO_FILENAME.toLowerCase()),
    path.join(os.homedir(), "Movies", VIDEO_FILENAME.toLowerCase()),
  ];
  const found = candidates.find((p) => fs.existsSync(p)) ?? null;
  if (found) console.log(`Found video at: ${found}`);
  else console.log(`Looked in:\n${candidates.join("\n")}`);
  return found;
}

test.describe("Video upload and playback", () => {
  let hangoutId: string | null = null;
  const baseURL = process.env.BASE_URL ?? "http://friend-tracker.home";

  test.beforeAll(async ({ request }) => {
    // Grab the first friend so we can create a hangout
    const friendsRes = await request.get(`${baseURL}/api/friends`);
    const friends = await friendsRes.json();

    if (!friends?.length) {
      console.warn("No friends in DB — skipping video test setup");
      return;
    }

    const friendId = friends[0].id;

    const res = await request.post(`${baseURL}/api/events`, {
      data: {
        friendIds: [friendId],
        startDate: new Date().toISOString().split("T")[0],
        title: "[TEST] Video upload test hangout",
        eventType: "Other",
      },
    });

    expect(res.ok()).toBe(true);
    const event = await res.json();
    hangoutId = event.id;
  });

  test.afterAll(async ({ request }) => {
    if (hangoutId) {
      await request.delete(`${baseURL}/api/events/${hangoutId}`);
    }
  });

  test("uploads MOV video and plays it in the lightbox", async ({ page }) => {
    const videoPath = findVideoFile();
    if (!videoPath) {
      test.skip(true, `${VIDEO_FILENAME} not found in ~/Downloads, ~/Desktop, or ~/Movies — drop it there and re-run`);
      return;
    }

    if (!hangoutId) {
      test.skip(true, "No friends in DB — add a friend first");
      return;
    }

    await page.goto(`/hangouts/${hangoutId}`);
    await page.waitForLoadState("networkidle");

    // --- Upload ---
    const uploadZone = page.getByRole("button", { name: /upload photos or videos/i });
    await expect(uploadZone).toBeVisible();

    // Set the file on the hidden input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);

    // Wait for the upload to complete — the video thumbnail should appear in the grid
    const videoThumb = page.locator('.break-inside-avoid').first();
    await expect(videoThumb).toBeVisible({ timeout: 60_000 });

    // Confirm the play-button overlay is rendered (confirms it was recognised as video)
    const playBadge = videoThumb.locator("svg");
    await expect(playBadge).toBeVisible();

    // --- Open lightbox ---
    await videoThumb.click();

    const lightboxVideo = page.locator('video[controls]');
    await expect(lightboxVideo).toBeVisible({ timeout: 10_000 });

    // The video element should have a valid src pointing to our media route
    const src = await lightboxVideo.getAttribute("src");
    expect(src).toMatch(/\/api\/media\/.+\.mov$/i);

    // --- Assert playback ---
    // autoPlay is set; wait for the browser to begin playing
    await expect.poll(
      () => lightboxVideo.evaluate((v: HTMLVideoElement) => v.readyState),
      { timeout: 15_000, message: "video never became ready" }
    ).toBeGreaterThanOrEqual(2); // HAVE_CURRENT_DATA

    // Collect currentTime after a brief real-time wait to confirm it advances
    const t0 = await lightboxVideo.evaluate((v: HTMLVideoElement) => v.currentTime);

    await page.waitForTimeout(1_500);

    const t1 = await lightboxVideo.evaluate((v: HTMLVideoElement) => v.currentTime);

    expect(t1, "video currentTime should advance while playing").toBeGreaterThan(t0);
  });
});
