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
        <section class="campus-cards">
          <a class="group relative"><div style="background-image:url('remote')"></div><div class="bg-navy/75"></div><div class="text-white"><span>🏛️</span><h3>Cook Library</h3></div></a>
          <a class="group relative"><div style="background-image:url('remote')"></div><div class="bg-navy/75"></div><div class="text-white"><span>✍️</span><h3>Writing Resource Center</h3></div></a>
          <a class="group relative"><div style="background-image:url('remote')"></div><div class="bg-navy/75"></div><div class="text-white"><span>📋</span><h3>Office of the Registrar</h3></div></a>
        </section>
        <footer>New College of Florida • The Mighty Banyans 🌳</footer>
        <div class="fixed bottom-5 right-5"><button aria-label="Open Rooty chat">Ask Rooty 🌳</button></div>
      </div>
    </div>`;
}

function refinementFixture() {
  document.body.innerHTML = `
    <div id="root">
      <header><div class="relative z-10"><h1>Your Senior Thesis Journey Starts Here</h1></div></header>
      <nav>
        <button>Home</button>
        <button aria-current="page">Research Tools</button>
      </nav>
      <main>
        <section class="mb-8"><h3>AI Tools - Use Thoughtfully</h3><p>Duplicated AI directory</p></section>
        <section><h3>Motivation Wall</h3><p>Generic quotations</p></section>
        <section class="mb-8"><h3>Citation Style Quick-Reference</h3><table></table></section>
        <section><h3>NCF Writing Program & Writing Resource Center</h3><p>Current hours</p></section>
        <section><h2>My Progress</h2><p>Track your thesis milestones from start to finish.</p></section>
      </main>
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
    expect(document.querySelectorAll('img.thesis-icon[src^="/enhancements/icons/"]')).toHaveLength(6);
  });

  it("repairs the known NCF links", () => {
    dashboardFixture();
    enhanceDashboard(document);

    expect(document.querySelector("main a").href).toBe(
      "https://www.ncf.edu/departments/registrar/",
    );
  });

  it("uses local campus artwork and marks white-on-blue SVG icons", () => {
    dashboardFixture();

    enhanceDashboard(document);

    const cards = [...document.querySelectorAll(".campus-cards a")];
    expect(cards.map((card) => card.dataset.campusArt)).toEqual([
      "cook-library",
      "writing-quill",
      "college-hall",
    ]);
    expect(
      cards.map((card) => card.querySelector("div[style]").style.backgroundImage),
    ).toEqual([
      'url("/enhancements/art/cook-library.svg")',
      'url("/enhancements/art/writing-quill.svg")',
      'url("/enhancements/art/college-hall.svg")',
    ]);
    expect(document.querySelectorAll(".text-white img.thesis-icon")).toHaveLength(3);
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

  it("uses a compact interior shell and removes duplicated or generic sections", () => {
    refinementFixture();

    enhanceDashboard(document);

    expect(document.documentElement.dataset.thesisView).toBe("interior");
    expect(document.body.textContent).not.toContain("Duplicated AI directory");
    expect(document.body.textContent).not.toContain("Generic quotations");
    expect(document.querySelector("[data-thesis-citation-note]")).not.toBeNull();
    expect(document.querySelector("[data-thesis-writing-note]")).not.toBeNull();
  });

  it("replaces obsolete physical and email submission instructions", () => {
    dashboardFixture();
    const main = document.querySelector("main");
    main.append(
      "Sponsor signs abstract. Unbound, in envelope; PDF + abstract to thesis@ncf.edu. Sponsor signature: Required before submission. Your sponsor must sign your abstract.",
    );

    enhanceDashboard(document);

    expect(main.textContent).toContain("Library submission form");
    expect(main.textContent).toContain("Print copies are optional");
    expect(main.textContent).not.toContain("Sponsor signs abstract");
    expect(main.textContent).not.toContain("must sign your abstract");
  });
});
