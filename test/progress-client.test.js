import { afterEach, describe, expect, it, vi } from "vitest";
import { loadProgress, saveProgress } from "../src/progress-client.js";

afterEach(() => vi.unstubAllGlobals());

describe("student progress client", () => {
  it("loads a bounded checklist document", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: { "0-1": true }, updatedAt: null }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetch);
    await expect(loadProgress()).resolves.toEqual({ "0-1": true });
    expect(fetch).toHaveBeenCalledWith("/api/progress", { headers: { Accept: "application/json" } });
  });

  it("replaces the student's document through the same-origin API", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    await saveProgress({ "0-1": true });
    expect(fetch).toHaveBeenCalledWith("/api/progress", {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ items: { "0-1": true } }),
    });
  });

  it("rejects malformed server state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: { bad: true } }))));
    await expect(loadProgress()).rejects.toThrow("Invalid progress response");
  });
});
