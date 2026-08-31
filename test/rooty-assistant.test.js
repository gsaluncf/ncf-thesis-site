// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { RootyAssistant } from "../src/rooty-assistant.js";

afterEach(() => {
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
    expect(element.messages).toEqual([
      { role: "user", content: "How do I choose a topic?" },
      {
        role: "assistant",
        content: "Start with a question you genuinely want to answer.",
      },
    ]);
    storageSpy.mockRestore();
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
