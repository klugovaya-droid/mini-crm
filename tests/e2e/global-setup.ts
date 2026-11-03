import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // server is still starting
    }
    await delay(500);
  }
  throw new Error(`E2E server did not start at ${baseUrl}`);
}

export default async function setup(): Promise<() => Promise<void>> {
  execFileSync("npm", ["run", "build"], {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  });

  const server: ChildProcess = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    {
      cwd: projectRoot,
      stdio: "inherit",
      env: process.env,
    },
  );

  await waitForServer();

  return async () => {
    server.kill("SIGTERM");
    await delay(500);
    if (!server.killed) server.kill("SIGKILL");
  };
}
