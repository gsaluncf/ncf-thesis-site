import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const EXPECTED_REPOSITORY =
  "https://github.com/mlopezzafra-ncf/ncf-senior-thesis-dashboardv3-04252026";
const EXPECTED_COMMIT = "36f923350916a30b7abce91cbe32395e9d3e601f";

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
