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

type Shot = {
  file: string;
  query: string;
  width: number;
  height: number;
};

// Full-page captures; the page takes the chosen background, so each pair is its own theme.
const shots: Shot[] = [
  // Failing AA normal and AAA normal, passing the large-text and UI criteria.
  {
    file: "screenshot-red.png",
    query: "?fg=FF3211&bg=FFFFFF",
    width: 1280,
    height: 900,
  },
  // A dark surface: the interface follows the chosen colors, not the OS theme.
  {
    file: "screenshot-dark.png",
    query: "?fg=5B7BB5&bg=12151C",
    width: 1280,
    height: 900,
  },
  // Failing pair: the specimen almost disappears, the interface stays legible.
  {
    file: "screenshot-failing.png",
    query: "?fg=EEEEEE&bg=FFFFFF",
    width: 1280,
    height: 900,
  },
  {
    file: "screenshot-mobile.png",
    query: "?fg=FF3211&bg=FFFFFF",
    width: 390,
    height: 844,
  },
];

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
  for (const { file, query, width, height } of shots) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/${query}`);
    await page.getByTestId("specimen").waitFor();
    // Let the DM Mono faces finish loading before the capture.
    await page.evaluate(() => document.fonts.ready);
    const path = join(outDir, file);
    await page.screenshot({ path, fullPage: true });
    console.log(`Saved ${path}`);
    await context.close();
  }
  await browser.close();
} finally {
  server.kill();
}
