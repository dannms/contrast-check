import { expect, test } from "@playwright/test";
import { gotoReady, pairRow } from "./helpers";

test("only the name of the pair in focus is underlined", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/");
  const row = pairRow(page, "text-on-background");
  const name = row.getByTestId("pair-name");
  const meta = row.getByTestId("pair-meta");
  await expect(name).toHaveCSS("text-decoration-line", "underline");
  await expect(name).toHaveCSS("font-weight", "500");
  await expect(meta).toHaveCSS("text-decoration-line", "none");
  await expect(meta).toHaveCSS("font-weight", "400");

  const other = pairRow(page, "label-on-primary");
  await expect(other.getByTestId("pair-name")).toHaveCSS(
    "text-decoration-line",
    "none",
  );
});

const FAILING = "/?primary=93c5fd&accent=f97316";

test("rows have the same height with and without a Fix button", async ({
  page,
}) => {
  await gotoReady(page, FAILING);
  const rows = page.locator('tr[data-testid^="pair-"]');
  await expect(rows).toHaveCount(6);
  const heights: (number | undefined)[] = [];
  for (const row of await rows.all()) {
    heights.push((await row.boundingBox())?.height);
  }
  expect(new Set(heights).size).toBe(1);
});

for (const width of [390, 1280]) {
  test(`a fix that removes its button does not move the next rows at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoReady(page, FAILING);
    const next = pairRow(page, "label-on-secondary");
    const top = () =>
      next.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const before = await top();
    await page
      .getByRole("button", { name: "Fix primary against background" })
      .click();
    await expect(
      page.getByRole("button", { name: "Fix primary against background" }),
    ).toHaveCount(0);
    expect(await top()).toBe(before);
  });
}

test("each header sits over its column", async ({ page }) => {
  await gotoReady(page, "/?primary=93c5fd&accent=f97316");
  const row = pairRow(page, "text-on-background");
  const cells = row.getByRole("cell");
  const headers = ["Pair", "Ratio", "Minimum", "Result"];
  for (const [index, name] of headers.entries()) {
    const header = await page
      .getByRole("columnheader", { name, exact: true })
      .boundingBox();
    const cell = await cells.nth(index).boundingBox();
    expect(header?.x).toBe(cell?.x);
  }
});
