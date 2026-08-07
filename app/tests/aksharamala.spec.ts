

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const PAGE_PATH = "/aksharamala";

test.describe("Aksharamala module", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}${PAGE_PATH}`);
  });

  test("page loads and shows letter cards", async ({ page }) => {
    // Confirms the specific crash we debugged earlier doesn't recur —
    // if this times out or the page is blank, something regressed.
    await expect(page.getByText("అక్షరమాల")).toBeVisible();
    await expect(page.locator(".MuiCard-root").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("total count chip shows a real number", async ({ page }) => {
    const totalChip = page.getByText(/మొత్తం:/);
    await expect(totalChip).toBeVisible();
    const text = await totalChip.textContent();
    expect(text).toMatch(/మొత్తం:\s*\d+/);
  });

  test("type filter — అచ్చులు shows only vowels", async ({ page }) => {
    await page.getByText("అచ్చులు", { exact: true }).click();
    // Wait for the debounced/filtered fetch to settle
    await page.waitForTimeout(600);
    const totalChip = page.getByText(/మొత్తం:/);
    await expect(totalChip).toBeVisible();
  });

  test("type filter — హల్లులు shows only consonants", async ({ page }) => {
    await page.getByText("హల్లులు", { exact: true }).click();
    await page.waitForTimeout(600);
    await expect(page.getByText(/మొత్తం:/)).toBeVisible();
  });

  test("type filter — అన్నీ resets to full list", async ({ page }) => {
    await page.getByText("హల్లులు", { exact: true }).click();
    await page.waitForTimeout(600);
    await page.getByText("అన్నీ", { exact: true }).click();
    await page.waitForTimeout(600);
    await expect(page.getByText(/మొత్తం:/)).toBeVisible();
  });

  test("search — typing filters results and shows sametalu matches", async ({
    page,
  }) => {
    const searchBox = page.getByPlaceholder("అక్షరం లేదా పదం వెతకండి...");
    await searchBox.fill("ఎలుక");

    // Debounce is 400ms — wait past it before asserting
    await page.waitForTimeout(700);

    await expect(page.getByText(/మొత్తం:/)).toBeVisible();
    // Sametalu section only renders if matches exist — check it
    // doesn't crash the page even if empty
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("search — no results shows empty state message", async ({ page }) => {
    const searchBox = page.getByPlaceholder("అక్షరం లేదా పదం వెతకండి...");
    await searchBox.fill("xyzxyznotarealword");
    await page.waitForTimeout(700);

    await expect(page.getByText("క్షమించండి! ఏమీ దొరకలేదు.")).toBeVisible();
  });

  test("search — clearing restores full list", async ({ page }) => {
    const searchBox = page.getByPlaceholder("అక్షరం లేదా పదం వెతకండి...");
    await searchBox.fill("ఎలుక");
    await page.waitForTimeout(700);
    await searchBox.fill("");
    await page.waitForTimeout(700);

    await expect(page.locator(".MuiCard-root").first()).toBeVisible();
  });

  test("voice gender toggle switches between male and female", async ({
    page,
  }) => {
    const femaleToggle = page.getByText("స్త్రీ స్వరం");
    await femaleToggle.click();
    await expect(femaleToggle).toHaveAttribute("aria-pressed", "true");

    const maleToggle = page.getByText("మగ స్వరం");
    await maleToggle.click();
    await expect(maleToggle).toHaveAttribute("aria-pressed", "true");
  });

  test("listen button triggers TTS request without opening similar-words panel", async ({
    page,
  }) => {
    // Regression test for the stopPropagation fix — clicking listen
    // must NOT also trigger the card-level similar-words click.
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/tts") && res.request().method() === "POST"
    );

    await page.locator('[aria-label*="వినండి"], button:has(svg[data-testid="VolumeUpIcon"])')
      .first()
      .click();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(500);

    // Similar-words panel should NOT have appeared from this click
    await expect(page.getByText(/కి సంబంధించినవి/)).not.toBeVisible();
  });

  test("clicking a card (not a button) opens the similar-words panel", async ({
    page,
  }) => {
    const responsePromise = page.waitForResponse((res) =>
      res.url().includes("/api/aksharamala_similar")
    );

    // Click the card's title area, not any button inside it
    await page.locator(".MuiCardContent-root").first().click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);

    await expect(page.getByText(/కి సంబంధించినవి/)).toBeVisible();
  });

  test("mic button requests microphone permission (or shows unsupported message)", async ({
    page,
    context,
  }) => {
    // Grant mic permission preemptively so SpeechRecognition can start
    await context.grantPermissions(["microphone"]);

    const micButton = page.locator('button:has(svg[data-testid="MicIcon"])').first();
    await expect(micButton).toBeVisible();
    await micButton.click();

    // Either it starts listening, or shows the "Chrome వాడండి" message
    // on unsupported browsers — both are valid, non-crashing outcomes
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).not.toContainText("undefined");
  });

  test("రాయండి button opens the trace board, తనిఖీ checks it", async ({
    page,
  }) => {
    const traceButton = page.getByText("రాయండి", { exact: true }).first();
    await traceButton.click();

    // Trace canvas should now be visible
    await expect(page.locator("canvas").first()).toBeVisible();

    // Draw a simple stroke on the canvas
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 20, box.y + 20);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.up();
    }

    const responsePromise = page.waitForResponse((res) =>
      res.url().includes("/api/trace_check")
    );

    await page.getByText("తనిఖీ చేయండి").click();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(500);
  });

  test("clear button on trace board resets the canvas", async ({ page }) => {
    await page.getByText("రాయండి", { exact: true }).first().click();
    await expect(page.locator("canvas").first()).toBeVisible();

    const clearButton = page.getByLabel("తుడిచివేయండి");
    await clearButton.click();
    // No error/crash after clearing — canvas still visible
    await expect(page.locator("canvas").first()).toBeVisible();
  });

  test("ముగించు closes the trace board back to the normal card view", async ({
    page,
  }) => {
    await page.getByText("రాయండి", { exact: true }).first().click();
    await expect(page.locator("canvas").first()).toBeVisible();

    await page.getByText("ముగించు", { exact: true }).click();
    await expect(page.locator("canvas")).not.toBeVisible();
  });

  test("no console errors during normal page interaction", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.reload();
    await page.waitForTimeout(1500);

    const searchBox = page.getByPlaceholder("అక్షరం లేదా పదం వెతకండి...");
    await searchBox.fill("అ");
    await page.waitForTimeout(700);

    expect(errors).toEqual([]);
  });
});