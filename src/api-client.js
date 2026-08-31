function parseEvent(frame) {
  let eventType = "message";
  const dataLines = [];

  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith("event:")) eventType = line.slice(6).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;

  const payload = JSON.parse(dataLines.join("\n"));
  if (eventType === "token" || eventType === "delta") {
    return { type: "token", text: payload.text ?? "" };
  }
  if (eventType === "sources") {
    return { type: "sources", sources: payload.sources ?? [] };
  }
  if (eventType === "done") return { type: "done" };
  if (eventType === "error") {
    throw new Error(payload.message || "The assistant could not answer right now.");
  }
  return { type: eventType, ...payload };
}

async function responseError(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await response.json().catch(() => ({}));
    return body.error || body.message || `Request failed (${response.status})`;
  }
  return `Request failed (${response.status})`;
}

export async function* streamAssistant(
  messages,
  { fetchImpl = globalThis.fetch, signal } = {},
) {
  const response = await fetchImpl("/api/chat", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
    signal,
  });
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/html")) {
    throw new Error("Please sign in with your ncf.edu account and try again.");
  }
  if (!response.ok) throw new Error(await responseError(response));
  if (!contentType.includes("text/event-stream") || !response.body) {
    throw new Error("The assistant returned an unexpected response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const event = parseEvent(frame);
      if (event) yield event;
    }
    if (done) break;
  }

  if (buffer.trim()) {
    const event = parseEvent(buffer);
    if (event) yield event;
  }
}
