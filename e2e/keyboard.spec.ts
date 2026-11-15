import { expect, test } from "@playwright/test";
import { gotoReady } from "./helpers";

test("tab order follows the screen and Enter focuses a pair", async ({
  page,
}) => {
  await gotoReady(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const inOrder = [
    page.getByLabel("Text", { exact: true }),
    page.getByLabel("Text color picker"),
    page.getByLabel("Background", { exact: true }),
    page.getByLabel("Background color picker"),
    page.getByLabel("Primary", { exact: true }),
    page.getByLabel("Primary color picker"),
    page.getByLabel("Secondary", { exact: true }),
    page.getByLabel("Secondary color picker"),
    page.getByLabel("Accent", { exact: true }),
    page.getByLabel("Accent color picker"),
    page.getByRole("button", { name: "Swap text and background" }),
    page.getByLabel("Level"),
    page.getByRole("switch", { name: "Accent as text" }),
    page.getByRole("button", { name: "Text on background" }),
  ];
  for (const target of inOrder) {
    await page.keyboard.press("Tab");
    await expect(target).toBeFocused();
  }

  await page.keyboard.press("Tab");
  const next = page.getByRole("button", { name: "Label on primary" });
  await expect(next).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(next).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("In focus · Label on primary")).toBeVisible();
});
