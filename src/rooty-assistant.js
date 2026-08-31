import { streamAssistant } from "./api-client.js";

const icons = {
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`,
  send: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
};

const styles = `
  :host { --navy:#202944; --gold:#c8a951; --paper:#f7f5ef; color:#202944; font-family:Inter,Arial,sans-serif; }
  *, *::before, *::after { box-sizing:border-box; }
  button, textarea { font:inherit; }
  button { cursor:pointer; }
  svg { width:1.1rem; height:1.1rem; fill:none; stroke:currentColor; stroke-linecap:round; stroke-linejoin:round; stroke-width:2; }
  .rooty-dock { position:fixed; right:clamp(1rem,3vw,2rem); bottom:clamp(1rem,3vw,2rem); z-index:1000; display:flex; flex-direction:column; align-items:flex-end; gap:.75rem; }
  .launcher { position:relative; width:5rem; height:5rem; overflow:hidden; padding:0; border:.2rem solid var(--navy); border-radius:999px; background:#fff; box-shadow:0 .75rem 2.5rem rgb(32 41 68 / 28%); transition:transform 160ms ease, box-shadow 160ms ease; }
  .launcher:hover { transform:translateY(-2px); box-shadow:0 1rem 3rem rgb(32 41 68 / 32%); }
  .launcher img { width:100%; height:100%; object-fit:cover; }
  .launcher-label { position:absolute; right:4.6rem; top:50%; translate:0 -50%; width:max-content; padding:.45rem .7rem; border-radius:.3rem; background:var(--navy); color:#fff; font-size:.75rem; font-weight:700; box-shadow:0 .4rem 1.2rem rgb(32 41 68 / 20%); }
  .panel { width:min(25rem,calc(100vw - 2rem)); height:min(37rem,calc(100vh - 8rem)); overflow:hidden; display:grid; grid-template-rows:auto 1fr auto; border:1px solid rgb(32 41 68 / 18%); border-top:.3rem solid var(--gold); border-radius:.8rem; background:#fff; box-shadow:0 1.5rem 4rem rgb(32 41 68 / 28%); }
  .header { display:flex; align-items:center; gap:.7rem; padding:.85rem 1rem; background:var(--navy); color:#fff; }
  .header img { width:2.5rem; height:2.5rem; border:2px solid rgb(255 255 255 / 35%); border-radius:999px; object-fit:cover; }
  .title { min-width:0; flex:1; }
  .title strong { display:block; font-family:Georgia,serif; font-size:1.05rem; }
  .title span { display:block; margin-top:.1rem; color:rgb(255 255 255 / 72%); font-size:.72rem; }
  .icon-button { width:2.15rem; height:2.15rem; display:grid; place-items:center; border:0; border-radius:999px; background:transparent; color:#fff; }
  .icon-button:hover { background:rgb(255 255 255 / 13%); }
  .messages { overflow:auto; padding:1rem; background:linear-gradient(180deg,#f7f5ef 0,#fff 8rem); scroll-behavior:smooth; }
  .welcome { margin:0 0 1rem; padding:.85rem 1rem; border-left:.22rem solid var(--gold); background:#fff; color:#384152; font-size:.82rem; line-height:1.5; box-shadow:0 .25rem 1rem rgb(32 41 68 / 7%); }
  .message { display:flex; margin:.7rem 0; }
  .message.user { justify-content:flex-end; }
  .bubble { max-width:87%; padding:.7rem .85rem; border-radius:1rem; white-space:pre-wrap; overflow-wrap:anywhere; font-size:.86rem; line-height:1.52; }
  .assistant .bubble { border-bottom-left-radius:.25rem; background:#e9eaed; color:#202944; }
  .user .bubble { border-bottom-right-radius:.25rem; background:var(--navy); color:#fff; }
  .sources { margin:.5rem 0 0; padding:.65rem .75rem; border:1px solid rgb(32 41 68 / 14%); border-radius:.45rem; background:#fff; font-size:.74rem; }
  .sources strong { display:block; margin-bottom:.3rem; color:#5c6473; letter-spacing:.05em; text-transform:uppercase; }
  .sources a { display:block; color:var(--navy); font-weight:700; line-height:1.4; }
  .sources a + a { margin-top:.3rem; }
  .thinking { color:#697180; font-style:italic; }
  .composer { border-top:1px solid #dde0e5; background:#fff; padding:.75rem; }
  form { display:flex; align-items:flex-end; gap:.55rem; }
  textarea { width:100%; min-height:2.7rem; max-height:7rem; resize:none; border:1px solid #b9bec8; border-radius:.65rem; padding:.67rem .75rem; color:#202944; line-height:1.35; }
  textarea:focus { border-color:var(--navy); outline:.18rem solid rgb(200 169 81 / 45%); outline-offset:1px; }
  .send { width:2.7rem; height:2.7rem; flex:0 0 auto; display:grid; place-items:center; border:0; border-radius:999px; background:var(--navy); color:#fff; }
  .send:disabled { cursor:not-allowed; opacity:.45; }
  .privacy { margin:.45rem 0 0; color:#697180; font-size:.66rem; line-height:1.35; }
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  :focus-visible { outline:.18rem solid var(--gold); outline-offset:.15rem; }
  @media (max-width:36rem) {
    .rooty-dock { right:.75rem; bottom:.75rem; }
    .panel { width:calc(100vw - 1.5rem); height:min(38rem,calc(100vh - 6.8rem)); }
    .launcher { width:4.3rem; height:4.3rem; }
    .launcher-label { display:none; }
  }
  @media (prefers-reduced-motion:reduce) { * { scroll-behavior:auto !important; transition:none !important; } }
`;

function safeSourceUrl(value) {
  try {
    const url = new URL(value, globalThis.location?.origin || "https://example.invalid");
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export class RootyAssistant extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.isOpen = false;
    this.isBusy = false;
    this.messages = [];
    this.sources = [];
    this.statusText = "";
    this.assistantStream = streamAssistant;
    this.abortController = null;
    this.previousFocus = null;
    this.shadowRoot.addEventListener("click", (event) => this.onClick(event));
    this.shadowRoot.addEventListener("submit", (event) => this.onSubmit(event));
    this.shadowRoot.addEventListener("keydown", (event) => this.onKeyDown(event));
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  open() {
    if (this.isOpen) return;
    this.previousFocus = document.activeElement;
    this.isOpen = true;
    this.render();
    queueMicrotask(() => this.shadowRoot.querySelector("textarea")?.focus());
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.render();
    this.previousFocus?.focus?.();
  }

  reset() {
    this.abortController?.abort();
    this.abortController = null;
    this.isBusy = false;
    this.messages = [];
    this.sources = [];
    this.statusText = "";
    this.render();
    queueMicrotask(() => this.shadowRoot.querySelector("textarea")?.focus());
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="rooty-dock">
        ${
          this.isOpen
            ? `<section class="panel" role="dialog" aria-modal="false" aria-labelledby="rooty-title">
                <header class="header">
                  <img src="/images/mighty-banyans.jpeg" alt="" />
                  <div class="title"><strong id="rooty-title">Ask Rooty</strong><span>NCF senior thesis support</span></div>
                  <button class="icon-button" data-action="reset" type="button" aria-label="Start a new conversation">${icons.reset}</button>
                  <button class="icon-button" data-action="close" type="button" aria-label="Close Ask Rooty">${icons.close}</button>
                </header>
                <div class="messages" aria-live="polite" aria-relevant="additions text"></div>
                <div class="composer">
                  <form>
                    <label for="rooty-question" class="sr-only">Your thesis question</label>
                    <textarea id="rooty-question" name="question" maxlength="1200" rows="1" placeholder="Ask about your thesis process" required ${this.isBusy ? "disabled" : ""}></textarea>
                    <button class="send" type="submit" aria-label="Send message" ${this.isBusy ? "disabled" : ""}>${icons.send}</button>
                  </form>
                  <p class="privacy">For current NCF students. This conversation stays in this tab and is not saved after you leave.</p>
                </div>
              </section>`
            : ""
        }
        <div class="launcher-wrap">
          ${this.isOpen ? "" : '<span class="launcher-label">Ask Rooty</span>'}
          <button class="launcher" data-action="toggle" type="button" aria-expanded="${this.isOpen}" aria-label="${this.isOpen ? "Close Ask Rooty" : "Open Ask Rooty"}">
            <img src="/images/mighty-banyans.jpeg" alt="" />
          </button>
        </div>
      </div>`;
    this.renderMessages();
  }

  renderMessages() {
    const container = this.shadowRoot.querySelector(".messages");
    if (!container) return;
    container.replaceChildren();

    const welcome = document.createElement("p");
    welcome.className = "welcome";
    welcome.textContent =
      "Hi, I’m Rooty. Ask me about planning, research, writing, requirements, or preparing for your defense. I answer from NCF thesis materials.";
    container.append(welcome);

    this.messages.forEach((message, index) => {
      const row = document.createElement("div");
      row.className = `message ${message.role === "user" ? "user" : "assistant"}`;
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = message.content;
      row.append(bubble);
      container.append(row);

      if (message.role === "assistant" && index === this.messages.length - 1) {
        this.renderSources(container);
      }
    });

    if (this.isBusy && this.statusText) {
      const status = document.createElement("p");
      status.className = "thinking";
      status.setAttribute("role", "status");
      status.textContent = this.statusText;
      container.append(status);
    }
    container.scrollTop = container.scrollHeight;
  }

  renderSources(container) {
    const validSources = this.sources
      .map((source) => ({ ...source, safeUrl: safeSourceUrl(source.url) }))
      .filter((source) => source.safeUrl && source.title);
    if (validSources.length === 0) return;

    const box = document.createElement("div");
    box.className = "sources";
    const heading = document.createElement("strong");
    heading.textContent = "Sources";
    box.append(heading);
    for (const source of validSources) {
      const link = document.createElement("a");
      link.href = source.safeUrl;
      link.textContent = source.title;
      if (new URL(source.safeUrl).origin !== globalThis.location?.origin) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      box.append(link);
    }
    container.append(box);
  }

  onClick(event) {
    const action = event.target.closest?.("[data-action]")?.dataset.action;
    if (action === "toggle") this.isOpen ? this.close() : this.open();
    if (action === "close") this.close();
    if (action === "reset") this.reset();
  }

  onKeyDown(event) {
    if (event.key === "Escape") this.close();
    if (event.key === "Enter" && !event.shiftKey && event.target.matches("textarea")) {
      event.preventDefault();
      event.target.form?.requestSubmit();
    }
  }

  async onSubmit(event) {
    event.preventDefault();
    if (this.isBusy) return;
    const input = event.target.elements.question;
    const question = input.value.trim();
    if (!question) return;

    this.messages.push({ role: "user", content: question });
    this.sources = [];
    this.isBusy = true;
    this.statusText = "Sending your question securely.";
    this.abortController = new AbortController();
    this.render();

    let answer = "";
    try {
      for await (const eventData of this.assistantStream(this.messages.slice(-12), {
        signal: this.abortController.signal,
      })) {
        if (eventData.type === "intent" || eventData.type === "progress") {
          this.statusText = eventData.text;
          this.renderMessages();
        }
        if (eventData.type === "token") {
          this.statusText = "";
          answer += eventData.text;
          const lastMessage = this.messages.at(-1);
          if (lastMessage?.role === "assistant") lastMessage.content = answer;
          else this.messages.push({ role: "assistant", content: answer });
          this.renderMessages();
        }
        if (eventData.type === "sources") {
          this.sources = eventData.sources;
          this.renderMessages();
        }
      }
      if (!answer) {
        this.messages.push({
          role: "assistant",
          content: "I could not find a supported answer. Try asking about one specific part of the NCF thesis process.",
        });
      }
    } catch (error) {
      this.statusText = "";
      if (error.name !== "AbortError") {
        this.messages.push({ role: "assistant", content: error.message });
      }
    } finally {
      this.isBusy = false;
      this.statusText = "";
      this.abortController = null;
      this.render();
      queueMicrotask(() => this.shadowRoot.querySelector("textarea")?.focus());
    }
  }
}

if (!customElements.get("rooty-assistant")) {
  customElements.define("rooty-assistant", RootyAssistant);
}
