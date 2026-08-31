import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("the Cloudflare Pages artifact", () => {
  beforeAll(async () => {
    await execFileAsync(process.execPath, ["scripts/build.mjs"]);
  });

  it("copies the dashboard and injects the enhancement layer", async () => {
    const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

    expect(html).toContain('src="/enhancements/enhance.js"');
    expect(html).toContain('href="/enhancements/site.css"');
    expect((await stat(new URL("../dist/assets", import.meta.url))).isDirectory()).toBe(
      true,
    );
    expect((await stat(new URL("../dist/handouts", import.meta.url))).isDirectory()).toBe(
      true,
    );
    expect(
      (await stat(new URL("../dist/enhancements/icons/house.svg", import.meta.url))).isFile(),
    ).toBe(true);
  });

  it("ships a useful custom 404 page", async () => {
    const html = await readFile(new URL("../dist/404.html", import.meta.url), "utf8");

    expect(html).toContain("Page not found");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/#ask-rooty"');
  });

  it("sets restrictive browser headers without caching HTML", async () => {
    const headers = await readFile(new URL("../dist/_headers", import.meta.url), "utf8");

    expect(headers).toContain("Content-Security-Policy:");
    expect(headers).toContain("Cache-Control: no-store");
    expect(headers).toContain("Referrer-Policy: no-referrer");
  });
});
