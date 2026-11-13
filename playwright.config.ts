import { defineConfig, devices } from "@playwright/test";

type App = {
  name: string;
  port: number;
  /** Directory of the app, relative to the repo root. */
  cwd: string;
  /** Command that builds the app and serves it on `port`. */
  command: (port: number) => string;
};

// To add another app, append an entry here with its own port.
const apps: App[] = [
  {
    name: "next",
    port: 3100,
    cwd: "apps/next",
    command: (port) => `bun run build && bunx next start -p ${port}`,
  },
  {
    name: "nuxt",
    port: 3200,
    cwd: "apps/nuxt",
    command: (port) => `bun run build && bunx nuxt preview --port ${port}`,
  },
];

const url = (app: App) => `http://localhost:${app.port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  projects: apps.map((app) => ({
    name: app.name,
    use: { ...devices["Desktop Chrome"], baseURL: url(app) },
  })),
  webServer: apps.map((app) => ({
    command: app.command(app.port),
    cwd: app.cwd,
    url: url(app),
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  })),
});
