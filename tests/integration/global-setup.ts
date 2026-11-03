import { execFileSync } from "node:child_process";

export default function setup(): void {
  execFileSync("npm", ["run", "db:prepare"], { stdio: "inherit", env: process.env });
}
