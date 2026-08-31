import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { classifyLinkResult } from "./link-policy.mjs";

const localPort = 4175;
const target = process.env.CHECK_URL || `http://127.0.0.1:${localPort}`;
const targetOrigin = new URL(target).origin;
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

let preview;
if (!process.env.CHECK_URL) {
  preview = spawn(process.execPath, ["scripts/serve.mjs"], {
    env: { ...process.env, PORT: String(localPort) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await fetch(target).then(() => true).catch(() => false)) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const discovered = new Set();

try {
  await page.goto(target, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("nav button");
  for (const label of navigationLabels) {
    await page.locator("nav button", { hasText: label }).first().click();
    await page.waitForTimeout(30);
    const links = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.href),
    );
    for (const link of links) discovered.add(link);
  }
  await page.goto(new URL("/missing-link-audit-page", target).href);
  for (const link of await page.locator("a[href]").evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.href),
  )) {
    discovered.add(link);
  }
} finally {
  await browser.close();
}

const urls = [...discovered]
  .filter((url) => ["http:", "https:"].includes(new URL(url).protocol))
  .map((url) => {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.href;
  })
  .filter((url, index, all) => all.indexOf(url) === index)
  .sort();

async function requestStatus(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const headers = {
    "User-Agent": "Mozilla/5.0 NCF-Thesis-Link-Audit/1.0",
  };
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers,
      signal: controller.signal,
    });
    if (response.status >= 400) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { ...headers, Range: "bytes=0-1023" },
        signal: controller.signal,
      });
      await response.body?.cancel();
    }
    return { status: response.status, finalUrl: response.url };
  } catch (error) {
    return { error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

const results = new Array(urls.length);
let nextIndex = 0;
async function worker() {
  while (nextIndex < urls.length) {
    const index = nextIndex;
    nextIndex += 1;
    const url = urls[index];
    const sameOrigin = new URL(url).origin === targetOrigin;
    const response = await requestStatus(url);
    results[index] = {
      url,
      sameOrigin,
      ...response,
      result: classifyLinkResult({ ...response, sameOrigin }),
    };
  }
}
await Promise.all(Array.from({ length: Math.min(8, urls.length) }, () => worker()));

preview?.kill();

const counts = Object.fromEntries(
  ["ok", "blocked", "unreachable", "dead"].map((result) => [
    result,
    results.filter((entry) => entry.result === result).length,
  ]),
);
process.stdout.write(`${JSON.stringify({ checked: results.length, counts }, null, 2)}\n`);
for (const entry of results.filter(({ result }) => result !== "ok")) {
  process.stdout.write(
    `${entry.result.toUpperCase()} ${entry.status || entry.error || "unknown"} ${entry.url}\n`,
  );
}
if (counts.dead > 0) process.exitCode = 1;
