import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const EXPECTED_REPOSITORY =
  "https://github.com/mlopezzafra-ncf/ncf-senior-thesis-dashboard";
const EXPECTED_COMMIT = "68b6fc6b0992f35ed16add1b526dd218d3e43fa4";

describe("the imported upstream snapshot", () => {
  it("records the authoritative repository and exact commit", async () => {
    const raw = await readFile(
      new URL("../upstream-manifest.json", import.meta.url),
      "utf8",
    );
    const manifest = JSON.parse(raw);

    expect(manifest.repository).toBe(EXPECTED_REPOSITORY);
    expect(manifest.commit).toBe(EXPECTED_COMMIT);
    expect(manifest.importedPaths).toContain("index.html");
    expect(manifest.importedPaths.some((path) => path.startsWith("assets/"))).toBe(
      true,
    );
  });
});
