import { expect, test } from "@playwright/test";
import { pairRow } from "./helpers";

const FAILING = "/?primary=93c5fd&accent=f97316";
const WAS_PASSING = [
  "text-on-background",
  "label-on-primary",
  "label-on-secondary",
];

test("fix repairs one pair without breaking the ones that passed", async ({
  page,
}) => {
  await page.goto(FAILING);
  await expect(page.getByTestId("palette-verdict")).toHaveText(
    "Fails AA · 3 of 6 pairs fail",
  );
  await expect(pairRow(page, "accent-vs-background")).toContainText("Fail");

  await page
    .getByRole("button", { name: "Fix accent against background" })
    .click();

  await expect(pairRow(page, "accent-vs-background")).toContainText("Pass");
  await expect(page.getByTestId("message")).toContainText(/^Accent set to #/);
  for (const id of WAS_PASSING) {
    await expect(pairRow(page, id)).toContainText("Pass");
  }
  await expect(page).toHaveURL(/accent=f97316\./);
});

test("fix: blocked fix keeps the layout", async ({ page }) => {
  await page.goto(FAILING);
  const row = pairRow(page, "text-on-background");
  const before = await row.boundingBox();
  await page
    .getByRole("button", { name: "Fix accent against background" })
    .click();
  await expect(page.getByTestId("message")).not.toBeEmpty();
  const after = await row.boundingBox();
  expect(after?.y).toBe(before?.y);
});

test("only failing rows have a Fix button", async ({ page }) => {
  await page.goto(FAILING);
  await expect(page.getByRole("button", { name: /^Fix / })).toHaveCount(3);
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^Fix / })).toHaveCount(0);
});
