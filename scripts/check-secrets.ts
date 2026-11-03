import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const targets = ["src", "index.html"];
const forbidden = [/service_role/i, /SUPABASE_SERVICE_ROLE/i];
const matches: string[] = [];

function scan(path: string): void {
  const absolute = join(root, path);
  const stat = statSync(absolute);

  if (stat.isDirectory()) {
    for (const entry of readdirSync(absolute)) {
      scan(join(path, entry));
    }
    return;
  }

  const content = readFileSync(absolute, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(content)) {
      matches.push(`${relative(root, absolute)}: ${pattern}`);
    }
  }
}

for (const target of targets) scan(target);

if (matches.length > 0) {
  console.error("Forbidden service-role references found in client code:");
  for (const match of matches) console.error(`- ${match}`);
  process.exit(1);
}

console.log("No service-role references in client code.");
