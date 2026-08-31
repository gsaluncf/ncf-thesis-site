import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("static deployment configuration", () => {
  it("tests main before deploying the built artifact to the named Pages project", async () => {
    const workflow = await readFile(
      new URL("../.github/workflows/deploy-pages.yml", import.meta.url),
      "utf8",
    );

    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("npm run test:e2e");
    expect(workflow).toContain("pages deploy dist --project-name=ncf-thesis-site");
    expect(workflow).toContain("CLOUDFLARE_API_TOKEN");
    expect(workflow).toContain("CLOUDFLARE_ACCOUNT_ID");
    expect(workflow).not.toMatch(/api[_-]?token:\s*[^$\s]/i);
  });

  it("gives Manu a static-only update path", async () => {
    const guide = await readFile(
      new URL("../docs/MANU_DEPLOYMENT.md", import.meta.url),
      "utf8",
    );

    expect(guide).toContain("Manu");
    expect(guide).toContain("pull request");
    expect(guide).toContain("npm run import:upstream");
    expect(guide).toContain("does not contain the private assistant");
    expect(guide).not.toContain("—");
  });
});
