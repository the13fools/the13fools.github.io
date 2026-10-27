// Static checks on the built site (dist/): every page exists, every figure
// placeholder was resolved, and every local link points at a real file and,
// if it has one, a real anchor.
import katex from "katex";
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
  const allIds=[...text.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  const seen=new Set();
  for(const id of allIds){if(seen.has(id))problems.push(`${f}: duplicate id ${id}`);seen.add(id);}
  const prose=text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  if(pages.includes(f.slice(dist.length+1))) {
    const stack=[];
    for(const m of prose.matchAll(/<(\/?)(main|div|section|details|aside)\b[^>]*>/g)) {
      if(!m[1])stack.push(m[2]);
      else if(stack.pop()!==m[2])problems.push(`${f}: mismatched structural closing tag ${m[2]}`);
    }
    if(stack.length)problems.push(`${f}: unclosed structural tags ${stack.join(", ")}`);
  }
  const equations=[...prose.matchAll(/<div class="eq tex">([\s\S]*?)<\/div>/g)].map(m=>m[1]);
  const inline=[...prose.matchAll(/\$([^$]+)\$/g)].map(m=>m[1]);
  for(const source of [...equations,...inline]){
    const math=source.replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&");
    try{katex.renderToString(math,{throwOnError:true});}catch(e){problems.push(`${f}: invalid TeX ${math.slice(0,100)}: ${e.message}`);}
    if(/[\x00-\x08\x0b\x0c\x0e-\x1f\t]/.test(math))problems.push(`${f}: control character in TeX ${JSON.stringify(math)}`);
  }
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
console.log(`check-site: ${files.length} files, ${pages.length} pages, links, unique IDs, TeX, and figure numbers OK`);
