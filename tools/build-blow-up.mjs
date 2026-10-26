import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "_sources/blow-up");
const destination = resolve(root, "play/hironaka-blow-up");

if (!existsSync(resolve(source, "node_modules"))) {
  console.error("Install the pinned dependencies first: npm ci --prefix _sources/blow-up");
  process.exit(1);
}

const check = spawnSync("npm", ["run", "check"], { cwd: source, stdio: "inherit" });
if (check.error) throw check.error;
if (check.status !== 0) process.exit(check.status ?? 1);

// Hash-named assets from earlier builds may remain, so existing shared URLs
// continue to load. HTML and current assets are refreshed from the checked build.
cpSync(resolve(source, "dist"), destination, { recursive: true });
console.log(`Checked essay ready to publish at ${destination}`);

// Keep already published chapter links working after the address change.
const legacy = resolve(root, "hironaka-blow-up");
const pages = ["index.html", "part-1.html", "part-2.html", "part-3.html", "part-4.html", "appendix.html", "extras/cradle.html", "extras/physics.html", "extras/two-ways.html"];
for (const page of pages) {
  const target = `/play/hironaka-blow-up/${page === "index.html" ? "" : page}`;
  const path = resolve(legacy, page);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Blow-up essay — moved</title><link rel="canonical" href="https://foolzone.com${target}">
<meta http-equiv="refresh" content="0;url=${target}"></head>
<body><p>The essay has moved. <a href="${target}">Continue reading.</a></p>
<script>location.replace(${JSON.stringify(target)} + location.search + location.hash);</script></body></html>
`);
}
