import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const navigationLabels = [
  "Home",
  "Sponsor & Committee",
  "Resources & Tools",
  "Formatting & Citations",
  "Writing Support",
  "My Progress",
  "Bacc Defense",
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
    await expect(page.locator("nav img.thesis-icon")).toHaveCount(navigationLabels.length);
  }
});

test("the hero action opens Rooty and a streamed answer stays in the page", async ({
  page,
}) => {
  await page.route("**/api/chat", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        'event: intent\ndata: {"kind":"question","text":"I have your question."}\n\n',
        'event: progress\ndata: {"stage":"retrieval","text":"Searching the NCF thesis materials."}\n\n',
        'event: token\ndata: {"text":"**Start** with your working question.\\n\\n- Write it down\\n- Ask your sponsor"}\n\n',
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

  await expect(assistant.locator(".message.assistant.status .bubble")).toContainText(
    "Question received",
  );
  await expect(assistant.locator(".message.assistant .bubble strong")).toHaveText("Start");
  await expect(assistant.locator(".message.assistant .bubble li")).toHaveCount(2);
  await expect(assistant.locator(".message-meta")).toHaveCount(2);
  await expect(assistant.locator(".message-meta").last()).toContainText(/\+\d+ ms/);
  await expect(assistant.getByRole("link", { name: "NCF Thesis Guide" })).toBeVisible();
  expect(
    await page.evaluate(() => ({ ...localStorage, ...sessionStorage })),
  ).toEqual({});
});

test("faculty videos use the intended media", async ({ page }) => {
  await page.goto("/");
  await page.locator("#section-faculty-videos > button").click();

  const videos = page.locator(
    '#section-faculty-videos iframe[src^="https://player.vimeo.com/video/"]',
  );
  await expect(videos).toHaveCount(2);
  await expect(videos.nth(0)).toHaveAttribute("title", /Heidi Harley/);
  await expect(videos.nth(1)).toHaveAttribute("title", /Rory Renzy/);
});

test("no view offers a player for the unpublished recordings", async ({ page }) => {
  await page.goto("/");
  const featured = page.locator("#section-what-is .thesis-video-frame iframe");
  await expect(featured).toHaveAttribute("src", /player\.vimeo\.com/);
  await expect(featured).toHaveAttribute("title", /Heidi Harley/);

  // Only these views shipped a player for a recording that was never published.
  for (const label of ["Home", "Writing Support", "Bacc Defense", "My Progress"]) {
    await page.locator("nav button", { hasText: label }).first().click();
    const sections = page.locator("main section[id] > button[aria-expanded='false']");
    for (let index = await sections.count(); index > 0; index -= 1) {
      await sections.first().click();
    }
    await expect(page.locator("main video")).toHaveCount(0);
    await expect(page.locator("#section-videos")).toHaveCount(0);
  }
});

test("home keeps Manu's four quick links", async ({ page }) => {
  await page.goto("/");
  const quickLinks = page.locator('main a[href^="#section-"]');
  await expect(quickLinks).toHaveText([
    "What Is a Senior Thesis?",
    "What Should I Do Right Now?",
    "Getting Ready & Build a Plan",
    "Thesis Timeline",
  ]);
});

test("My Progress saves and restores the signed-in student's checklist", async ({ page }) => {
  let items = {};
  await page.route("**/api/progress", async (route) => {
    if (route.request().method() === "PUT") {
      items = route.request().postDataJSON().items;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items, updatedAt: "2026-09-01T12:00:00Z" }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /My Progress/ }).first().click();
  const firstItem = page.locator('input[type="checkbox"]').first();
  await firstItem.check();
  await expect.poll(() => items["0-0"]).toBe(true);
  await expect(page.locator("[data-thesis-progress-status]")).toContainText("Saved securely");

  await page.reload();
  await page.getByRole("button", { name: /My Progress/ }).first().click();
  await expect(page.locator('input[type="checkbox"]').first()).toBeChecked();
});

test("interior views use the compact shell and current official guidance", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Resources & Tools/ }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-thesis-view", "interior");

  await page.getByRole("button", { name: /Writing Support/ }).first().click();
  await expect(page.locator("[data-thesis-writing-note]")).toContainText("Schedules change");

  await page.getByRole("button", { name: /Formatting & Citations/ }).first().click();
  await expect(page.locator("main")).not.toContainText("Sponsor signature: Required");
  await expect(page.locator("main")).toContainText("Print copies are optional");
  await expect(page.locator("[data-thesis-submission-note] a")).toHaveAttribute(
    "href",
    "https://www.ncf.edu/library/services/",
  );

  await page.getByRole("button", { name: /My Progress/ }).first().click();
  await expect(page.locator("main")).not.toContainText("Email submission:");
  await expect(page.locator("[data-thesis-submission-note]")).toContainText(
    "Library submission instructions",
  );
});

test("no view links to the known dead NCF pages", async ({ page }) => {
  const deadLinks = [
    "https://www.ncf.edu/about/administrative-offices/registrar/",
    "https://www.ncf.edu/about/administrative-offices/office-of-the-provost/academic-policies/",
    "https://www.ncf.edu/student-life/counseling-and-wellness-center/",
    "https://www.ncf.edu/academics/isps/",
  ];
  await page.goto("/");
  for (const label of navigationLabels) {
    await page.locator("nav button", { hasText: label }).first().click();
    for (const href of deadLinks) {
      await expect(page.locator(`a[href="${href}"]`)).toHaveCount(0);
    }
  }
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
