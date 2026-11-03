import { execFileSync } from "node:child_process";

function run(command: string, args: string[]): void {
  execFileSync(command, args, { stdio: "inherit", env: process.env });
}

try {
  execFileSync("npx", ["supabase", "status"], { stdio: "ignore", env: process.env });
} catch {
  run("npm", ["run", "db:start"]);
}

run("npm", ["run", "env:local"]);
run("npm", ["run", "db:reset"]);
run("npm", ["run", "seed:local"]);
