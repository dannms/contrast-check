import { expect, test } from "@playwright/test";

test("on a phone the actions share the same left edge", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const left = async (locator: ReturnType<typeof page.locator>) =>
    (await locator.boundingBox())?.x;

  const select = await left(page.getByLabel("Level"));
  const swap = await left(
    page.getByRole("button", { name: "Swap text and background" }),
  );
  const toggle = await left(
    page.getByRole("switch", { name: "Accent as text" }),
  );
  expect(select).toBeDefined();
  expect(swap).toBe(select);
  expect(toggle).toBe(select);

  // The label sits above the select.
  const label = await page.getByText("Level", { exact: true }).boundingBox();
  const box = await page.getByLabel("Level").boundingBox();
  expect((label?.y ?? 0) + (label?.height ?? 0)).toBeLessThanOrEqual(
    box?.y ?? 0,
  );
});

test("from md the level label sits beside the select", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto("/");
  const label = await page.getByText("Level", { exact: true }).boundingBox();
  const box = await page.getByLabel("Level").boundingBox();
  expect(label?.y).toBeLessThan((box?.y ?? 0) + (box?.height ?? 0));
  expect((label?.x ?? 0) + (label?.width ?? 0)).toBeLessThanOrEqual(
    box?.x ?? 0,
  );
  expect(box?.width).toBe(128);
});
