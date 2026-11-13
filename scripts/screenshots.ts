/**
 * Captures the README screenshots from a production build of the Next app.
 * Run with `bun run screenshots` (it builds the app first). Not part of the test suite.
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "..");
const appDir = join(root, "apps", "next");
const outDir = join(root, "docs");
const port = 3101;
const baseUrl = `http://localhost:${port}`;

// Failing AA normal and AAA normal, passing the large-text and UI criteria.
const sampleQuery = "?fg=777777&bg=FFFFFF";

async function waitForServer(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server not accepting connections yet.
    }
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const nextBin = join(
  dirname(
    createRequire(join(appDir, "package.json")).resolve("next/package.json"),
  ),
  "dist",
  "bin",
  "next",
);
const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
  cwd: appDir,
  stdio: "inherit",
});

try {
  await waitForServer(baseUrl, 30_000);
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  for (const colorScheme of ["light", "dark"] as const) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme,
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/${sampleQuery}`);
    await page.getByTestId("ratio").waitFor();
    const path = join(outDir, `screenshot-${colorScheme}.png`);
    await page.screenshot({ path, fullPage: true });
    console.log(`Saved ${path}`);
    await context.close();
  }
  await browser.close();
} finally {
  server.kill();
}
