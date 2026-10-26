import { defineConfig, type Plugin } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The essay's pages, in reading order. Figure numbers run continuously
// through them in this order.
export const PAGES = ["index.html", "part-1.html", "part-2.html", "part-3.html", "appendix.html"];

// Figures are referenced by key, never by number: a caption is written
// `<b>Figure {fig:cradle}.</b>` and a reference `Figure {fig:cradle}`.
// This plugin numbers captions in reading order across all pages, so
// figures can be added, removed or moved without renumbering anything.
// Keys of the form A1 or B2 are appendix figures and keep their labels.
function figureNumbers(root: string): Map<string, string> {
  const order: string[] = [];
  for (const page of PAGES) {
    const html = readFileSync(resolve(root, page), "utf8");
    for (const m of html.matchAll(/<b>Figure \{fig:([A-Za-z0-9]+)\}\.<\/b>/g)) {
      const key = m[1]!;
      if (!order.includes(key)) order.push(key);
    }
  }
  const map = new Map<string, string>();
  let n = 0;
  for (const key of order) map.set(key, /^[A-Z]\d+$/.test(key) ? key : String(++n));
  return map;
}

function figures(): Plugin {
  let root = process.cwd();
  const substitute = (text: string, where: string) => {
    const map = figureNumbers(root);
    return text.replace(/\{fig:([A-Za-z0-9]+)\}/g, (_, key: string) => {
      const label = map.get(key);
      if (!label) throw new Error(`Figure "${key}" is referenced in ${where} but has no caption.`);
      return label;
    });
  };
  return {
    name: "figure-numbers",
    configResolved(config) {
      root = config.root;
    },
    transformIndexHtml: {
      order: "pre",
      handler: (html, ctx) => substitute(html, ctx.filename),
    },
    transform(code, id) {
      if (id.includes("/src/figures/") && code.includes("{fig:")) return { code: substitute(code, id), map: null };
      return undefined;
    },
  };
}

// Relative base so the built site works from any subpath (foolzone.com/blow-up,
// a GitHub Pages project URL, or a local preview) without a rebuild.
export default defineConfig({
  base: "./",
  plugins: [figures()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(PAGES.map((p) => [p.replace(".html", ""), p])),
    },
  },
});
