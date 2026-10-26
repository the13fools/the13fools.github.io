import { cpSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "_sources/blow-up");
const destination = resolve(root, "hironaka-blow-up");

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
