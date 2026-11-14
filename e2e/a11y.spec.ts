import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PREVIEW = '[data-testid="preview"]';

test("has no axe violations on the default page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).exclude(PREVIEW).analyze();
  expect(results.violations).toEqual([]);
});

test("has no axe violations with an invalid hex", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Primary", { exact: true }).fill("#12");
  const results = await new AxeBuilder({ page }).exclude(PREVIEW).analyze();
  expect(results.violations).toEqual([]);
});

test("keeps the chrome accessible with a failing palette, outside the preview", async ({
  page,
}) => {
  await page.goto("/?primary=93c5fd&accent=f97316");
  await expect(page.getByTestId("preview")).toBeVisible();
  const results = await new AxeBuilder({ page }).exclude(PREVIEW).analyze();
  expect(results.violations).toEqual([]);
});

test("has no axe violations on a dark palette", async ({ page }) => {
  await page.goto("/?text=f5f5f4&background=12151c");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).exclude(PREVIEW).analyze();
  expect(results.violations).toEqual([]);
});
