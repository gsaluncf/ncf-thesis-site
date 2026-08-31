import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const navigationLabels = [
  "Home",
  "Timeline",
  "Resources & Tools",
  "Templates",
  "Formatting & Citations",
  "Research Tools",
  "Writing Support",
  "Your Advisor",
  "My Progress",
];

test("all dashboard views render without emoji, em dashes, or canned Rooty", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Senior Thesis Journey");
  await expect(page.locator('[aria-label="Open Rooty chat"]')).toHaveCount(0);
  await expect(page.locator("rooty-assistant")).toHaveCount(1);

  for (const label of navigationLabels) {
    await page.locator("nav button", { hasText: label }).first().click();
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(text).not.toContain("—");
    await expect(page.locator("nav img.thesis-icon")).toHaveCount(9);
  }
});

test("the hero action opens Rooty and a streamed answer stays in the page", async ({
  page,
}) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        'event: intent\ndata: {"kind":"question","text":"I have your question."}\n\n',
        'event: progress\ndata: {"stage":"retrieval","text":"Searching the NCF thesis materials."}\n\n',
        'event: token\ndata: {"text":"Start with your working question."}\n\n',
        'event: sources\ndata: {"sources":[{"title":"NCF Thesis Guide","url":"https://www.ncf.edu/academics/senior-thesis-project/"}]}\n\n',
        "event: done\ndata: {}\n\n",
      ].join(""),
    });
  });
  await page.goto("/");

  await page.locator('[data-open-rooty="true"]').click();
  const assistant = page.locator("rooty-assistant");
  await assistant.locator("textarea").fill("How should I begin?");
  await assistant.locator('button[aria-label="Send message"]').click();

  await expect(assistant).toContainText("Start with your working question.");
  await expect(assistant.getByRole("link", { name: "NCF Thesis Guide" })).toBeVisible();
  expect(
    await page.evaluate(() => ({ ...localStorage, ...sessionStorage })),
  ).toEqual({});
});

test("the known NCF dead links are repaired", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Office of the Registrar" })).toHaveAttribute(
    "href",
    "https://www.ncf.edu/departments/registrar/",
  );

  await page.getByRole("button", { name: /Resources & Tools/ }).first().click();
  await expect(page.getByRole("link", { name: /Academic Honesty Policy/ })).toHaveAttribute(
    "href",
    "https://www.ncf.edu/wp-content/uploads/2025/08/4.3005-Academic-Honor-Code.pdf",
  );

  await page.getByRole("button", { name: /Writing Support/ }).first().click();
  await expect(page.getByRole("link", { name: /Counseling/ })).toHaveAttribute(
    "href",
    "https://www.ncf.edu/life-at-new/health-wellness-services/counseling-services/",
  );
});

test("home and Rooty have no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => ["serious", "critical"].includes(impact))).toEqual(
    [],
  );

  await page.locator('[data-open-rooty="true"]').click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => ["serious", "critical"].includes(impact))).toEqual(
    [],
  );
});

test("the mobile layout keeps the hero action and Rooty usable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await expect(page.locator("#ask-rooty")).toBeInViewport();
  await page.locator('[data-open-rooty="true"]').click();
  const panel = page.locator("rooty-assistant").locator('[role="dialog"]');
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
});

test("unknown routes return the custom 404 with both recovery links", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-page");
  expect(response.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the dashboard" })).toHaveAttribute(
    "href",
    "/",
  );
  await expect(page.getByRole("link", { name: "Ask Rooty" })).toHaveAttribute(
    "href",
    "/#ask-rooty",
  );
});
