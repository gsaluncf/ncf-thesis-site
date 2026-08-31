import { describe, expect, it } from "vitest";
import { classifyLinkResult } from "../scripts/link-policy.mjs";

describe("link audit policy", () => {
  it("fails missing pages everywhere and any local client error", () => {
    expect(classifyLinkResult({ status: 404, sameOrigin: false })).toBe("dead");
    expect(classifyLinkResult({ status: 410, sameOrigin: false })).toBe("dead");
    expect(classifyLinkResult({ status: 500, sameOrigin: true })).toBe("dead");
  });

  it("distinguishes authentication and bot blocks from dead links", () => {
    expect(classifyLinkResult({ status: 401, sameOrigin: false })).toBe("blocked");
    expect(classifyLinkResult({ status: 403, sameOrigin: false })).toBe("blocked");
    expect(classifyLinkResult({ status: 429, sameOrigin: false })).toBe("blocked");
  });

  it("reports network and upstream server failures for review", () => {
    expect(classifyLinkResult({ error: new Error("timeout"), sameOrigin: false })).toBe(
      "unreachable",
    );
    expect(classifyLinkResult({ status: 503, sameOrigin: false })).toBe("unreachable");
    expect(classifyLinkResult({ status: 200, sameOrigin: false })).toBe("ok");
  });
});
