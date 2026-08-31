// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { enhanceDashboard } from "../src/enhance.js";

afterEach(() => {
  document.body.replaceChildren();
  delete document.documentElement.dataset.thesisEnhancements;
});

function dashboardFixture() {
  document.body.innerHTML = `
    <div id="root">
      <div class="min-h-screen">
        <header class="relative overflow-hidden">
          <div class="relative z-10"><h1>Your Senior Thesis Journey Starts Here</h1><p>The honors college of Florida's most ambitious academic tradition — yours to own.</p></div>
        </header>
        <nav><button><span>🏠</span><span>Home</span></button><button>📅 Timeline</button></nav>
        <main><a href="https://www.ncf.edu/about/administrative-offices/registrar/">Registrar</a></main>
        <footer>New College of Florida • The Mighty Banyans 🌳</footer>
        <div class="fixed bottom-5 right-5"><button aria-label="Open Rooty chat">Ask Rooty 🌳</button></div>
      </div>
    </div>`;
}

describe("enhanceDashboard", () => {
  it("removes canned Rooty, mounts the live assistant, and adds one hero feature", () => {
    dashboardFixture();

    enhanceDashboard(document);
    enhanceDashboard(document);

    expect(document.querySelector('[aria-label="Open Rooty chat"]')).toBeNull();
    expect(document.querySelectorAll("rooty-assistant")).toHaveLength(1);
    expect(document.querySelectorAll("#ask-rooty")).toHaveLength(1);
    expect(document.querySelector("#ask-rooty").textContent).toContain(
      "Get help with your thesis",
    );
  });

  it("opens the live assistant from the featured hero action", () => {
    dashboardFixture();
    enhanceDashboard(document);
    const assistant = document.querySelector("rooty-assistant");
    const openSpy = vi.spyOn(assistant, "open");

    document.querySelector('[data-open-rooty="true"]').click();

    expect(openSpy).toHaveBeenCalledOnce();
  });

  it("uses Lucide SVG files for visible emoji and removes em dashes", () => {
    dashboardFixture();

    enhanceDashboard(document);

    expect(document.body.textContent).not.toMatch(/[🏠📅🌳]/u);
    expect(document.body.textContent).not.toContain("—");
    expect(document.querySelectorAll('img.thesis-icon[src^="/enhancements/icons/"]')).toHaveLength(3);
  });

  it("repairs the known NCF links", () => {
    dashboardFixture();
    enhanceDashboard(document);

    expect(document.querySelector("main a").href).toBe(
      "https://www.ncf.edu/departments/registrar/",
    );
  });

  it("replaces mascot metaphors and inflated copy with direct student guidance", () => {
    dashboardFixture();
    const main = document.querySelector("main");
    main.append(
      "Every great thesis starts with a single question you can't stop thinking about. You already have one — let's go find it.",
    );

    enhanceDashboard(document);

    expect(document.querySelector("header p").textContent).toBe(
      "Plan, research, write, and defend your NCF senior thesis.",
    );
    expect(main.textContent).toContain(
      "Write down the question you most want to answer, then discuss it with your faculty sponsor.",
    );
    expect(main.textContent).not.toContain("Every great thesis");
  });
});
