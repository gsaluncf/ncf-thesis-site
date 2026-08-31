import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { usedIconNames } from "../src/icon-map.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");
const enhancementRoot = join(outputRoot, "enhancements");
const iconOutputRoot = join(enhancementRoot, "icons");
const copiedRoots = ["assets", "handouts", "images"];

await rm(outputRoot, { recursive: true, force: true });
await mkdir(enhancementRoot, { recursive: true });
await mkdir(iconOutputRoot, { recursive: true });

for (const path of copiedRoots) {
  await cp(join(projectRoot, path), join(outputRoot, path), { recursive: true });
}
await cp(join(projectRoot, "vite.svg"), join(outputRoot, "vite.svg"));
await cp(join(projectRoot, "src", "site.css"), join(enhancementRoot, "site.css"));
await cp(join(projectRoot, "src", "enhance.js"), join(enhancementRoot, "enhance.js"));
await cp(join(projectRoot, "src", "api-client.js"), join(enhancementRoot, "api-client.js"));
await cp(join(projectRoot, "src", "icon-map.js"), join(enhancementRoot, "icon-map.js"));
await cp(
  join(projectRoot, "src", "rooty-assistant.js"),
  join(enhancementRoot, "rooty-assistant.js"),
);
for (const iconName of usedIconNames) {
  await cp(
    join(projectRoot, "node_modules", "lucide-static", "icons", `${iconName}.svg`),
    join(iconOutputRoot, `${iconName}.svg`),
  );
}

const sourceHtml = await readFile(join(projectRoot, "index.html"), "utf8");
const enhancements = [
  '    <link rel="stylesheet" href="/enhancements/site.css" />',
  '    <script type="module" src="/enhancements/enhance.js"></script>',
].join("\n");
const outputHtml = sourceHtml.replace("  </head>", `${enhancements}\n  </head>`);
await writeFile(join(outputRoot, "index.html"), outputHtml, "utf8");

const notFoundHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Page not found | NCF Senior Thesis Support</title>
    <link rel="icon" type="image/png" href="/images/ncf-shield.png" />
    <style>
      :root { color-scheme: light; font-family: Inter, Arial, sans-serif; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f7f5ef; color: #202944; }
      main { width: min(36rem, calc(100% - 3rem)); border-top: .4rem solid #c8a951; background: #fff; padding: clamp(2rem, 6vw, 4rem); box-shadow: 0 1.5rem 4rem rgb(32 41 68 / 12%); }
      img { width: 3.5rem; height: auto; }
      p:first-of-type { color: #6b7280; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
      h1 { font-family: Georgia, serif; font-size: clamp(2.2rem, 8vw, 4rem); margin: .5rem 0 1rem; }
      p { line-height: 1.65; }
      nav { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 2rem; }
      a { color: #202944; border: 2px solid #202944; padding: .75rem 1rem; font-weight: 700; text-decoration: none; }
      a:first-child { color: #fff; background: #202944; }
      a:focus-visible { outline: 3px solid #c8a951; outline-offset: 3px; }
    </style>
  </head>
  <body>
    <main>
      <img src="/images/ncf-shield.png" alt="New College of Florida" />
      <p>Error 404</p>
      <h1>Page not found</h1>
      <p>The address may have changed. Return to the thesis dashboard or ask Rooty for help finding the right resource.</p>
      <nav aria-label="Recovery options">
        <a href="/">Open the dashboard</a>
        <a href="/#ask-rooty">Ask Rooty</a>
      </nav>
    </main>
  </body>
</html>
`;
await writeFile(join(outputRoot, "404.html"), notFoundHtml, "utf8");

const headers = `/*
  Cache-Control: no-store
  Content-Security-Policy: default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self' https://fonts.gstatic.com; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
  Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=86400

/handouts/*
  Cache-Control: private, no-store
`;
await writeFile(join(outputRoot, "_headers"), headers, "utf8");
