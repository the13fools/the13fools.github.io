// Static checks on the built site (dist/): every page exists, every figure
// placeholder was resolved, and every local link points at a real file and,
// if it has one, a real anchor.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, normalize } from "node:path";

const dist = "dist";
const problems = [];
const pages = ["index.html", "part-1.html", "part-2.html", "part-3.html", "part-4.html", "appendix.html"];
for (const p of pages) if (!existsSync(join(dist, p))) problems.push(`missing page ${p}`);

const files = [];
const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const f = join(d, e.name); if (e.isDirectory()) walk(f); else files.push(f); } };
walk(dist);

const ids = new Map();
const idsOf = (f) => { if (!ids.has(f)) ids.set(f, new Set([...readFileSync(f, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))); return ids.get(f); };

for (const f of files) {
  if (!/\.(html|js)$/.test(f)) continue;
  const text = readFileSync(f, "utf8");
  if (text.includes("{fig:")) problems.push(`${f}: unresolved {fig:…} placeholder`);
  if (!f.endsWith(".html")) continue;
  for (const m of text.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|data:)/.test(href)) continue;
    const [path, hash] = href.split("#");
    const target = path ? normalize(join(dirname(f), path)) : f;
    if (!existsSync(target)) { problems.push(`${f}: broken link ${href}`); continue; }
    if (hash && target.endsWith(".html") && !idsOf(target).has(hash)) problems.push(`${f}: no anchor #${hash} in ${target}`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`check-site: ${files.length} files, ${pages.length} pages, links and figure numbers OK`);
