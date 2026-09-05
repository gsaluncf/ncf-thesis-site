import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getProgressStatus,
  loadProgress,
  saveProgress,
  subscribeProgressStatus,
} from "../src/progress-client.js";

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
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ updatedAt: "2026-09-04T18:00:00Z" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetch);
    const statuses = [];
    const unsubscribe = subscribeProgressStatus((status) => statuses.push(status));
    await saveProgress({ "0-1": true });
    unsubscribe();
    expect(fetch).toHaveBeenCalledWith("/api/progress", {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ items: { "0-1": true } }),
    });
    expect(statuses.map(({ state }) => state)).toEqual(["saving", "saved"]);
    expect(getProgressStatus()).toEqual({
      state: "saved",
      updatedAt: "2026-09-04T18:00:00Z",
    });
  });

  it("exposes a failed save instead of silently swallowing it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    await expect(saveProgress({ "0-1": true })).rejects.toThrow("Progress could not be saved");
    expect(getProgressStatus().state).toBe("save-error");
  });

  it("serializes overlapping saves so an older document cannot finish last", async () => {
    const responses = [];
    const fetch = vi.fn(
      () => new Promise((resolve) => responses.push(resolve)),
    );
    vi.stubGlobal("fetch", fetch);

    const first = saveProgress({ "0-1": true });
    const second = saveProgress({ "0-1": false, "0-2": true });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    responses.shift()(new Response(JSON.stringify({ updatedAt: "2026-09-04T18:00:00Z" })));
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    responses.shift()(new Response(JSON.stringify({ updatedAt: "2026-09-04T18:01:00Z" })));
    await Promise.all([first, second]);

    expect(fetch.mock.calls.map(([, options]) => options.body)).toEqual([
      JSON.stringify({ items: { "0-1": true } }),
      JSON.stringify({ items: { "0-1": false, "0-2": true } }),
    ]);
    expect(getProgressStatus()).toEqual({
      state: "saved",
      updatedAt: "2026-09-04T18:01:00Z",
    });
  });

  it("distinguishes a load failure from a save failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    await expect(loadProgress()).rejects.toThrow("Progress could not be loaded");
    expect(getProgressStatus().state).toBe("load-error");
  });

  it("rejects malformed server state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: { bad: true } }))));
    await expect(loadProgress()).rejects.toThrow("Invalid progress response");
  });
});
