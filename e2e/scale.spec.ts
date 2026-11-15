import { expect, test } from "@playwright/test";
import { field, focusRatio, gotoReady } from "./helpers";

test("a scale step is selected by the arrow keys and sets the role", async ({
  page,
}) => {
  await gotoReady(page, "/");
  const group = page.getByRole("radiogroup", { name: "Primary scale" });
  const step600 = group.getByRole("radio", { name: /^600,/ });
  await expect(step600).toBeChecked();

  await page
    .getByRole("button", { name: "Primary against background" })
    .click();
  const before = await focusRatio(page);

  await step600.focus();
  await page.keyboard.press("ArrowRight");

  const step700 = group.getByRole("radio", { name: /^700,/ });
  await expect(step700).toBeChecked();
  await expect(step700).toBeFocused();
  const label = (await step700.getAttribute("aria-label")) ?? "";
  const hex = /#[0-9A-F]{6}/i.exec(label)?.[0] ?? "";
  expect(hex).not.toBe("");
  await expect(field(page, "primary")).toHaveValue(hex.toUpperCase());
  await expect.poll(() => focusRatio(page)).not.toBe(before);
});

test("Home and End move to the first and last step", async ({ page }) => {
  await gotoReady(page, "/");
  const group = page.getByRole("radiogroup", { name: "Primary scale" });
  await group.getByRole("radio", { name: /^600,/ }).focus();
  await page.keyboard.press("End");
  await expect(group.getByRole("radio", { name: /^950,/ })).toBeChecked();
  await page.keyboard.press("Home");
  await expect(group.getByRole("radio", { name: /^50,/ })).toBeChecked();
});

test("each step shows its ratio on one line at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/");
  const group = page.getByRole("radiogroup", { name: "Primary scale" });
  const ratios = group.getByTestId("step-ratio");
  await expect(ratios).toHaveCount(11);
  for (const ratio of await ratios.all()) {
    expect((await ratio.boundingBox())?.height).toBe(16);
  }
  await expect(ratios.first()).toHaveText(/^\d+\.\d{2}$/);
});
