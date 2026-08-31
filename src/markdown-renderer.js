import createDOMPurify from "dompurify";
import { marked } from "marked";

marked.setOptions({
  breaks: true,
  gfm: true,
});

const purifier = createDOMPurify(globalThis.window);

export function renderMarkdown(markdown) {
  const html = marked.parse(markdown || "");
  return purifier.sanitize(html, {
    USE_PROFILES: { html: true },
  });
}
