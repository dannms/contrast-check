import { expect, test } from "@playwright/test";
import { field, focusRatio, gotoReady, pairRow } from "./helpers";

test("the default palette passes AA and shows the first pair in focus", async ({
  page,
}) => {
  await gotoReady(page, "/");
  await expect(page.getByTestId("palette-verdict")).toHaveText(
    "Passes AA · 6 of 6 pairs",
  );
  await expect(page.getByTestId("focus-ratio")).toHaveText("16.09:1");
});

test("typing colors updates the ratio", async ({ page }) => {
  await gotoReady(page, "/");
  await field(page, "text").fill("#000000");
  await field(page, "background").fill("#FFFFFF");
  await expect(page.getByTestId("focus-ratio")).toHaveText("21.00:1");
  expect(await focusRatio(page)).toBe(21);
});

test("invalid hex shows an accessible error", async ({ page }) => {
  await gotoReady(page, "/");
  const input = field(page, "primary");
  await input.fill("#12");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(/Enter 3 or 6 hex digits/);
  await input.fill("#123456");
  await expect(input).toHaveAttribute("aria-invalid", "false");
});

test("color picker stays in sync with the hex input", async ({ page }) => {
  await gotoReady(page, "/");
  await page.getByLabel("Accent color picker").fill("#ff0000");
  await expect(field(page, "accent")).toHaveValue("#FF0000");
  await field(page, "accent").fill("#00ff00");
  await expect(page.getByLabel("Accent color picker")).toHaveValue("#00ff00");
});

test("swap exchanges text and background", async ({ page }) => {
  await gotoReady(page, "/");
  await field(page, "text").fill("#112233");
  await field(page, "background").fill("#FFEEDD");
  await page.getByRole("button", { name: "Swap text and background" }).click();
  await expect(field(page, "text")).toHaveValue("#FFEEDD");
  await expect(field(page, "background")).toHaveValue("#112233");
});

test("level AAA raises the text minimum", async ({ page }) => {
  await gotoReady(page, "/");
  await page.getByLabel("Level").selectOption("AAA");
  await expect(pairRow(page, "text-on-background")).toContainText("7:1");
  await expect(page.getByTestId("palette-verdict")).toContainText("AAA");
});

test("turning accent as text off removes its pair", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(pairRow(page, "accent-as-text")).toBeVisible();
  await page.getByRole("switch", { name: "Accent as text" }).click();
  await expect(pairRow(page, "accent-as-text")).toHaveCount(0);
});

test("state is read from the url and written back", async ({ page }) => {
  await gotoReady(page, "/?text=767676&background=ffffff");
  await expect(field(page, "text")).toHaveValue("#767676");
  await expect(field(page, "background")).toHaveValue("#FFFFFF");
  await expect(page.getByTestId("focus-ratio")).toHaveText("4.54:1");

  await field(page, "text").fill("#000000");
  await expect(page).toHaveURL(/text=000000/);
  await expect(page).toHaveURL(/background=ffffff/);
});

test("shows the chosen surface exactly", async ({ page }) => {
  await gotoReady(page, "/?text=000000&background=ffffff");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS(
    "color",
    "rgb(0, 0, 0)",
  );
  await expect(page.getByTestId("app-root")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
});

test("contrast: partial hex keeps the last valid palette", async ({ page }) => {
  await gotoReady(page, "/");
  await field(page, "primary").fill("#12");
  await expect(field(page, "primary")).toHaveAttribute("aria-invalid", "true");
  const rows = page.locator('tr[data-testid^="pair-"]');
  await expect(rows).toHaveCount(6);
  for (const row of await rows.all()) {
    await expect(row).toContainText(/\d+\.\d{2}:1/);
  }
  await expect(page.getByTestId("export-code")).not.toContainText("NaN");
  await expect(page.getByTestId("palette-verdict")).toHaveText(
    "Passes AA · 6 of 6 pairs",
  );
});

test("contrast: legacy and malformed urls load", async ({ page }) => {
  await gotoReady(page, "/?fg=777&bg=fff");
  await expect(field(page, "text")).toHaveValue("#777777");
  await expect(field(page, "background")).toHaveValue("#FFFFFF");

  await gotoReady(page, "/?primary=zzz&level=x");
  await expect(field(page, "primary")).toHaveValue("#2F5BD8");
  await expect(page.getByLabel("Level")).toHaveValue("AA");
  await expect(page.getByTestId("palette-verdict")).toHaveText(
    "Passes AA · 6 of 6 pairs",
  );
});

test("the live summary announces the state", async ({ page }) => {
  await gotoReady(page, "/");
  const summary = page.getByTestId("live-summary");
  await expect(summary).toHaveText(
    "Text on background, 16.09 to 1. Passes AA · 6 of 6 pairs.",
  );
  await expect(summary).toHaveAttribute("aria-live", "polite");
});
