import { describe, expect, it, vi } from "vitest";
import { streamAssistant } from "../src/api-client.js";

function sseResponse(chunks, init = {}) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" }, ...init },
  );
}

describe("streamAssistant", () => {
  it("posts the browser-memory conversation and parses split SSE frames", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      sseResponse([
        'event: token\ndata: {"text":"Start"}\n',
        '\nevent: token\ndata: {"text":" here"}\n\n',
        'event: sources\ndata: {"sources":[{"title":"Handbook","url":"/handouts/guide.pdf"}]}\n\n',
        "event: done\ndata: {}\n\n",
      ]),
    );
    const messages = [{ role: "user", content: "How do I start?" }];

    const events = [];
    for await (const event of streamAssistant(messages, { fetchImpl })) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "token", text: "Start" },
      { type: "token", text: " here" },
      {
        type: "sources",
        sources: [{ title: "Handbook", url: "/handouts/guide.pdf" }],
      },
      { type: "done" },
    ]);
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        headers: expect.objectContaining({ Accept: "text/event-stream" }),
        body: JSON.stringify({ messages }),
      }),
    );
  });

  it("rejects an HTML Access response with a useful sign-in error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("<html>Sign in</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    await expect(async () => {
      for await (const _event of streamAssistant([], { fetchImpl })) {
        // Consume the stream.
      }
    }).rejects.toThrow("sign in");
  });

  it("forwards abort signals and reports API failures", async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('{"error":"Too many requests"}', {
        status: 429,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(async () => {
      for await (const _event of streamAssistant([], {
        fetchImpl,
        signal: controller.signal,
      })) {
        // Consume the stream.
      }
    }).rejects.toThrow("Too many requests");
    expect(fetchImpl.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
