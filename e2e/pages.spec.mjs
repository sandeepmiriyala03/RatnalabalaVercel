import { expect, test } from "@playwright/test";

const pages = [
  "/", "/aksharamala", "/chitramala", "/guninta",
  "/kathamala", "/khatiMala", "/lipimala", "/mira", "/mirapoems",
  "/padalamala", "/parabhava", "/poems", "/PoemTitles", "/rahasyabhasha", "/samasa",
  "/sametalu", "/sandhi", "/shailimala", "/shatakamu", "/smruthimala", "/swaramala",
];

for (const path of pages) {
  test(`${path} పేజీ సరిగ్గా రెండర్ అవుతుంది`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response, `${path} పేజీకి స్పందన లేదు`).not.toBeNull();
    expect(response?.status(), `${path} పేజీ లోపాన్ని ఇచ్చింది`).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
  });
}
