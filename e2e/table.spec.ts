import { expect, test } from "@playwright/test";
import { pairRow } from "./helpers";

test("only the name of the pair in focus is underlined", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
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
