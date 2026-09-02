// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { RootyAssistant } from "../src/rooty-assistant.js";

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

function mount() {
  const element = new RootyAssistant();
  document.body.append(element);
  return element;
}

describe("RootyAssistant", () => {
  it("preserves the Rooty launcher and opens an accessible dialog", async () => {
    const element = mount();
    const root = element.shadowRoot;
    const launcher = root.querySelector('[data-action="toggle"]');

    expect(launcher.getAttribute("aria-label")).toBe("Open Ask Rooty");
    expect(root.querySelector('[role="dialog"]')).toBeNull();

    launcher.click();
    await Promise.resolve();

    expect(root.querySelector('[role="dialog"][aria-modal="false"]')).not.toBeNull();
    expect(root.querySelector("textarea")).toBe(root.activeElement);
    expect(root.textContent).not.toMatch(/[🌳📖📋🎓✍️🦉📚]/u);
    expect(root.textContent).not.toContain("—");
  });

  it("streams an answer, shows sources, and retains the conversation only in memory", async () => {
    const element = mount();
    element.assistantStream = vi.fn(async function* (messages) {
      expect(messages).toEqual([{ role: "user", content: "How do I choose a topic?" }]);
      yield { type: "token", text: "Start with a question " };
      yield { type: "token", text: "you genuinely want to answer." };
      yield {
        type: "sources",
        sources: [{ title: "NCF Thesis Guide", url: "https://www.ncf.edu/thesis" }],
      };
      yield { type: "done" };
    });
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");

    element.open();
    const root = element.shadowRoot;
    const input = root.querySelector("textarea");
    input.value = "How do I choose a topic?";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    root.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(root.textContent).toContain(
        "Start with a question you genuinely want to answer.",
      );
    });

    const source = root.querySelector('.sources a[href="https://www.ncf.edu/thesis"]');
    expect(source.textContent).toContain("NCF Thesis Guide");
    expect(storageSpy).not.toHaveBeenCalled();
    expect(element.messages.map(({ role, content }) => ({ role, content }))).toEqual([
      { role: "user", content: "How do I choose a topic?" },
      { role: "assistant", content: "Start with a question you genuinely want to answer." },
    ]);
    storageSpy.mockRestore();
  });

  it("renders assistant Markdown as sanitized HTML", async () => {
    const element = mount();
    element.assistantStream = vi.fn(async function* () {
      yield {
        type: "token",
        text: "**Start here.**\n\n- Read the guide\n- Ask your sponsor\n\n[Unsafe](javascript:alert(1))",
      };
      yield { type: "done" };
    });

    element.open();
    const root = element.shadowRoot;
    root.querySelector("textarea").value = "What should I do?";
    root.querySelector("form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => expect(root.querySelector(".assistant .bubble strong")).not.toBeNull());
    expect(root.querySelectorAll(".assistant .bubble li")).toHaveLength(2);
    expect(root.querySelector('.assistant .bubble a[href^="javascript:"]')).toBeNull();
  });

  it("shows an immediate status bubble and timestamps every chat bubble", async () => {
    const element = mount();
    let release;
    const waiting = new Promise((resolve) => {
      release = resolve;
    });
    element.assistantStream = vi.fn(async function* () {
      await waiting;
      yield { type: "intent", kind: "question", text: "I have your question." };
      yield { type: "token", text: "The answer." };
      yield { type: "done" };
    });

    element.open();
    const root = element.shadowRoot;
    root.querySelector("textarea").value = "How do I start?";
    root.querySelector("form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(root.querySelector(".message.assistant.status .bubble").textContent).toContain(
      "Question received",
    );
    expect(root.querySelector(".message.assistant.status .working-spinner")).not.toBeNull();
    expect(root.querySelector(".message.assistant.status .message-meta").textContent).toContain(
      "+0 ms",
    );
    expect(root.querySelector(".message.user .message-meta")).not.toBeNull();

    release();
    await vi.waitFor(() => expect(root.textContent).toContain("The answer."));
    expect(root.querySelector(".message.assistant:not(.status) .message-meta")).not.toBeNull();
  });

  it("keeps the student informed every ten seconds while background work continues", async () => {
    vi.useFakeTimers();
    const element = mount();
    element.assistantStream = async function* () {
      await new Promise(() => {});
    };

    element.open();
    const root = element.shadowRoot;
    root.querySelector("textarea").value = "What comes after my prospectus?";
    root.querySelector("form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await vi.advanceTimersByTimeAsync(10_000);
    expect(root.querySelector(".message.assistant.status .bubble").textContent).toContain(
      "Still searching the NCF thesis materials.",
    );

    await vi.advanceTimersByTimeAsync(10_000);
    expect(root.querySelector(".message.assistant.status .bubble").textContent).toContain(
      "Reviewing the most relevant sources.",
    );
    element.reset();
  });

  it("stops background work after two minutes and offers a retry", async () => {
    vi.useFakeTimers();
    const element = mount();
    element.assistantStream = async function* (_messages, { signal }) {
      await new Promise((resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          { once: true },
        );
      });
      yield { type: "done" };
    };

    element.open();
    const root = element.shadowRoot;
    root.querySelector("textarea").value = "Help me organize my literature review.";
    root.querySelector("form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await vi.advanceTimersByTimeAsync(120_000);
    await Promise.resolve();

    expect(root.textContent).toContain(
      "This is taking longer than expected. Please try again.",
    );
    expect(root.querySelector(".message.assistant.status")).toBeNull();
    expect(root.querySelector("textarea").disabled).toBe(false);
  });

  it("shows progressive status immediately without adding it to conversation history", async () => {
    const element = mount();
    let releaseAnswer;
    const waitForAnswer = new Promise((resolve) => {
      releaseAnswer = resolve;
    });
    element.assistantStream = vi.fn(async function* () {
      yield {
        type: "intent",
        kind: "question",
        text: "I have your question. I am checking the NCF thesis materials now.",
      };
      yield {
        type: "progress",
        stage: "retrieval",
        text: "Searching the NCF thesis materials.",
      };
      await waitForAnswer;
      yield { type: "token", text: "Your grounded answer." };
      yield { type: "done" };
    });

    element.open();
    const root = element.shadowRoot;
    root.querySelector("textarea").value = "What should I do first?";
    root.querySelector("form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => {
      expect(root.textContent).toContain("Searching the NCF thesis materials.");
    });
    expect(element.messages.map(({ role, content }) => ({ role, content }))).toEqual([
      { role: "user", content: "What should I do first?" },
    ]);

    releaseAnswer();
    await vi.waitFor(() => {
      expect(root.textContent).toContain("Your grounded answer.");
    });
    expect(root.textContent).not.toContain("Searching the NCF thesis materials.");
  });

  it("clears browser-memory messages without reloading the page", async () => {
    const element = mount();
    element.open();
    element.messages = [{ role: "user", content: "A private draft question" }];
    element.renderMessages();

    element.shadowRoot.querySelector('[data-action="reset"]').click();

    expect(element.messages).toEqual([]);
    expect(element.shadowRoot.textContent).not.toContain("A private draft question");
    expect(element.shadowRoot.textContent).toContain("not saved after you leave");
  });
});
