import { createHash } from "node:crypto";
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";

const execFile = promisify(execFileCallback);
const repository =
  "https://github.com/mlopezzafra-ncf/ncf-senior-thesis-dashboardv3-04252026";
const commit = "36f923350916a30b7abce91cbe32395e9d3e601f";
// Manu publishes this build to GitHub Pages under a project subpath.
const upstreamBasePath = "/ncf-senior-thesis-dashboardv3-04252026/";
const importedRoots = ["assets", "handouts", "images", "index.html", "vite.svg"];
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

const temporaryRoot = await mkdtemp(join(tmpdir(), "ncf-thesis-upstream-"));
const checkout = join(temporaryRoot, "checkout");

try {
  await execFile("git", ["clone", "--quiet", "--no-checkout", repository, checkout]);
  await execFile("git", ["-C", checkout, "checkout", "--quiet", "--detach", commit]);

  for (const path of importedRoots) {
    await rm(join(projectRoot, path), { recursive: true, force: true });
    await cp(join(checkout, path), join(projectRoot, path), {
      recursive: true,
      preserveTimestamps: true,
    });
  }

  const indexPath = join(projectRoot, "index.html");
  const indexHtml = await readFile(indexPath, "utf8");
  await writeFile(indexPath, indexHtml.replaceAll(upstreamBasePath, "./"), "utf8");

  const importedPaths = [];
  for (const root of importedRoots) {
    const fullPath = join(projectRoot, root);
    const files = (await readdir(fullPath).catch(() => null))
      ? await listFiles(fullPath)
      : [fullPath];
    for (const file of files) {
      const contents = await readFile(file);
      importedPaths.push({
        path: relative(projectRoot, file).replaceAll("\\", "/"),
        sha256: createHash("sha256").update(contents).digest("hex"),
      });
    }
  }

  const manifest = {
    repository,
    commit,
    importedAt: new Date().toISOString(),
    importedPaths: importedPaths.map(({ path }) => path),
    files: importedPaths,
  };
  await writeFile(
    join(projectRoot, "upstream-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
