import "./rooty-assistant.js";
import { emojiToLucide } from "./icon-map.js";

const knownLinkRepairs = new Map([
  [
    "https://www.ncf.edu/about/administrative-offices/registrar/",
    "https://www.ncf.edu/departments/registrar/",
  ],
  [
    "https://www.ncf.edu/about/administrative-offices/office-of-the-provost/academic-policies/",
    "https://www.ncf.edu/wp-content/uploads/2025/08/4.3005-Academic-Honor-Code.pdf",
  ],
  [
    "https://www.ncf.edu/student-life/counseling-and-wellness-center/",
    "https://www.ncf.edu/life-at-new/health-wellness-services/counseling-services/",
  ],
]);

const contentReplacements = new Map([
  [
    "The honors college of Florida's most ambitious academic tradition — yours to own.",
    "Plan, research, write, and defend your NCF senior thesis.",
  ],
  [
    "Every great thesis starts with a single question you can't stop thinking about. You already have one — let's go find it.",
    "Write down the question you most want to answer, then discuss it with your faculty sponsor.",
  ],
  [
    "Your thesis journey from Contract 4 to graduation day.",
    "A general timeline from Contract 4 through graduation.",
  ],
  [
    "Banyan trees don't grow overnight — and neither do theses. The roots you put down now in Contract 5 are what hold up your canopy in Contract 8. Pace yourself.",
    "Start early, set manageable deadlines, and review the schedule with your faculty sponsor.",
  ],
  [
    "Everything you need to research, write, and submit your thesis.",
    "NCF resources, research tools, writing guides, and submission links.",
  ],
  [
    "Zotero is your best friend. Seriously. Future-you will thank present-you every time a bibliography auto-generates at midnight before a deadline.",
    "Set up Zotero early. Save each source as you find it so citations and the final bibliography are easier to manage.",
  ],
  [
    "AI is a tool, not a co-author. Your thesis sponsor signed on to mentor you — not a chatbot. The ideas in this thesis need to be yours. That's what makes them matter.",
    "Your thesis sponsor agreed to mentor your work. Keep the ideas, analysis, and prose yours, and discuss any AI use with your sponsor first.",
  ],
  [
    "Your thesis is a declaration of your intellectual ability. Always cite your sources, attribute borrowed ideas, and represent your work honestly. NCF takes academic honesty seriously — violations can jeopardize your degree.",
    "Cite your sources, attribute borrowed ideas, and represent your work honestly. Academic honesty violations can jeopardize your degree.",
  ],
  [
    "Stuck on your research question? Start with the Proposal Worksheet. Even filling in one blank is progress. A banyan has over 3,000 roots — you only need one idea to begin.",
    "If your research question is stuck, open the Proposal Worksheet and fill in one section. One concrete idea is enough to begin.",
  ],
  [
    "Library services, databases, and tools to power your research.",
    "Library services, databases, and research tools.",
  ],
  [
    "Pro tip:",
    "",
  ],
  [
    "Schedule a research consultation with a librarian early in your thesis process. They can save you dozens of hours by pointing you to the right databases and search strategies.",
    "Schedule a research consultation early. A librarian can help you choose databases and refine your search strategy.",
  ],
  [
    "The library isn't just where you submit your thesis — it's where the best research begins. The librarians know things Google Scholar doesn't. Use them.",
    "Cook Library staff can help with search strategies, databases, interlibrary loan, and bibliography work. Use them early.",
  ],
  [
    "Modern research tools to help you discover papers, manage citations, analyze sources, and write more effectively.",
    "Tools for finding papers, managing citations, analyzing sources, and revising your writing.",
  ],
  [
    "Remember: all AI tools should be used as supplements to — not replacements for — your own scholarly work.",
    "Use AI tools to supplement your own scholarly work, and discuss them with your sponsor.",
  ],
  [
    "A good researcher doesn't just find sources — they know which sources matter and why. These tools help you cast a wider net, but your critical judgment is what makes it scholarship.",
    "Use these tools to find more sources, then judge each source's relevance, methods, and evidence yourself.",
  ],
  [
    "Guidance for every stage — from blank page to final draft.",
    "People, programs, groups, and practical advice for finishing a draft.",
  ],
  [
    "Your sponsor is your guide — not your editor.",
    "Your sponsor guides the research and argument, while you remain responsible for the writing.",
  ],
  [
    "Remember: feedback is not failure. It's the process working as intended.",
    "Feedback is part of drafting. Ask questions until you understand what to revise.",
  ],
  [
    "A thesis is a marathon, not a sprint.",
    "Break the thesis into small daily or weekly goals.",
  ],
  [
    "Set small, achievable daily writing goals (even 200 words counts).",
    "On a difficult day, a 200-word goal still moves the draft forward.",
  ],
  [
    "If you're struggling emotionally, reach out — to your sponsor, to friends, to the Writing Resource Center, or to NCF Counseling & Wellness.",
    "If you're struggling emotionally, contact your sponsor, friends, the Writing Resource Center, or Counseling Services.",
  ],
  [
    "Asking for help is a sign of strength, not weakness. The thesis is supposed to challenge you; the challenge is what makes it worthwhile.",
    "",
  ],
  [
    "The thesis is hard. That's not a flaw in you — it's proof you're doing something real and original. Even banyans look chaotic mid-growth before the roots find the ground.",
    "Thesis work can be difficult and uneven. Talk with your sponsor or a campus support service before a hard week becomes a crisis.",
  ],
  [
    "Building the relationships that will shape your thesis.",
    "How to choose a sponsor, work with a committee, and prepare for your defense.",
  ],
  [
    "Choosing the right people and building strong working relationships with them is one of the most important things you can do for your thesis.",
    "Choose committee members whose expertise and feedback fit the work your thesis requires.",
  ],
  [
    "Your sponsor is your intellectual partner, not your boss. The best thesis relationships are built on mutual respect, honest communication, and shared curiosity.",
    "Treat your sponsor as an intellectual partner. Agree on communication, deadlines, and the kind of feedback you need.",
  ],
  [
    "The oral defense isn't a test you pass or fail — it's a conversation about the work you've been living with for months. You are the world's foremost expert on your thesis. Walk in knowing that.",
    "The oral defense is a focused conversation about your argument, methods, and findings. Prepare to explain your choices and respond to questions from your committee.",
  ],
  [
    "Every checked box is a root in the ground. By the time you check that last one, you'll have built something that will live in Cook Library forever. That's not nothing — that's everything.",
    "Complete one milestone at a time. Your final thesis and abstract will become part of Cook Library's permanent collection.",
  ],
]);

const emojiPattern =
  /\p{Extended_Pictographic}(?:[\uFE0E\uFE0F]|\u200D\p{Extended_Pictographic})*/gu;

function removeCannedRooty(scope) {
  for (const button of scope.querySelectorAll(
    '[aria-label="Open Rooty chat"], [aria-label="Close Rooty chat"]',
  )) {
    const widget = button.closest("div.fixed") || button.parentElement;
    widget?.remove();
  }
}

function mountAssistant(scope) {
  if (scope.querySelector("rooty-assistant")) return;
  scope.body.append(scope.createElement("rooty-assistant"));
}

function addHeroFeature(scope) {
  if (scope.querySelector("#ask-rooty")) return;
  const heroContent = scope.querySelector("header div.relative.z-10");
  if (!heroContent) return;

  const feature = scope.createElement("aside");
  feature.id = "ask-rooty";
  feature.className = "thesis-hero-feature";
  feature.setAttribute("aria-labelledby", "ask-rooty-heading");
  feature.innerHTML = `
    <img class="thesis-feature-icon" src="/enhancements/icons/message-circle.svg" alt="" />
    <div class="thesis-feature-copy">
      <span>Current student support</span>
      <h2 id="ask-rooty-heading">Get help with your thesis</h2>
      <p>Ask about planning, research, writing, requirements, or your defense. Rooty answers from the NCF thesis materials behind this dashboard.</p>
    </div>
    <button type="button" data-open-rooty="true">
      Ask Rooty
      <img src="/enhancements/icons/arrow-right.svg" alt="" />
    </button>`;
  feature.querySelector("button").addEventListener("click", () => {
    scope.querySelector("rooty-assistant")?.open();
  });
  heroContent.append(feature);
}

function repairLinks(scope) {
  for (const link of scope.querySelectorAll("a[href]")) {
    const replacement = knownLinkRepairs.get(link.href);
    if (replacement && link.href !== replacement) link.href = replacement;
    if (link.target === "_blank") link.rel = "noopener noreferrer";
  }
}

const campusCardArtwork = new Map([
  ["Cook Library", "cook-library"],
  ["Writing Resource Center", "writing-quill"],
  ["Office of the Registrar", "college-hall"],
]);

function decorateCampusCards(scope) {
  for (const heading of scope.querySelectorAll("h3")) {
    const artwork = campusCardArtwork.get(heading.textContent.trim());
    if (!artwork) continue;
    const card = heading.closest("a.group.relative");
    const background = card?.querySelector(':scope > div[style*="background-image"]');
    if (!card || !background) continue;
    card.dataset.campusArt = artwork;
    background.style.backgroundImage = `url("/enhancements/art/${artwork}.svg")`;
  }
}

function replaceEmojiAndDashes(scope) {
  const walker = scope.createTreeWalker(scope.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentElement?.closest("script,style,textarea,template")) {
        return NodeFilter.FILTER_REJECT;
      }
      emojiPattern.lastIndex = 0;
      const hasContentReplacement = [...contentReplacements.keys()].some((source) =>
        node.nodeValue.includes(source),
      );
      return emojiPattern.test(node.nodeValue) ||
        node.nodeValue.includes("—") ||
        hasContentReplacement
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    let value = node.nodeValue;
    for (const [source, replacement] of contentReplacements) {
      value = value.replaceAll(source, replacement);
    }
    value = value.replaceAll("—", "-");
    emojiPattern.lastIndex = 0;
    if (!emojiPattern.test(value)) {
      node.nodeValue = value;
      continue;
    }
    emojiPattern.lastIndex = 0;
    const fragment = scope.createDocumentFragment();
    let cursor = 0;
    for (const match of value.matchAll(emojiPattern)) {
      if (match.index > cursor) fragment.append(value.slice(cursor, match.index));
      const emoji = match[0].replace(/[\uFE0E\uFE0F]/gu, "");
      const iconName = emojiToLucide[emoji] || "circle";
      const icon = scope.createElement("img");
      icon.className = "thesis-icon";
      icon.src = `/enhancements/icons/${iconName}.svg`;
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      fragment.append(icon);
      cursor = match.index + match[0].length;
    }
    if (cursor < value.length) fragment.append(value.slice(cursor));
    node.replaceWith(fragment);
  }
}

export function enhanceDashboard(scope = document) {
  if (!scope.body) return;
  removeCannedRooty(scope);
  mountAssistant(scope);
  addHeroFeature(scope);
  repairLinks(scope);
  replaceEmojiAndDashes(scope);
  decorateCampusCards(scope);
  scope.documentElement.dataset.thesisEnhancements = "ready";
}

if (typeof document !== "undefined") {
  enhanceDashboard(document);
  const root = document.querySelector("#root");
  if (root) {
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        enhanceDashboard(document);
      });
    });
    observer.observe(root, { childList: true, subtree: true });
  }
}
