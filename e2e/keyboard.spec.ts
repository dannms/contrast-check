import { expect, test } from "@playwright/test";
import { backgroundInput, ratioValue, textInput } from "./helpers";

test("full flow works with the keyboard only", async ({ page }) => {
  await page.goto("/");
  const { keyboard } = page;

  await keyboard.press("Tab");
  await expect(textInput(page)).toBeFocused();
  await keyboard.press("Control+A");
  await keyboard.type("#777777");

  await keyboard.press("Tab");
  await expect(page.getByLabel("Text color picker")).toBeFocused();

  await keyboard.press("Tab");
  await expect(backgroundInput(page)).toBeFocused();
  await keyboard.press("Control+A");
  await keyboard.type("#FFFFFF");

  await keyboard.press("Tab");
  await expect(page.getByLabel("Background color picker")).toBeFocused();

  await keyboard.press("Tab");
  const swap = page.getByRole("button", { name: "Swap colors" });
  await expect(swap).toBeFocused();
  await keyboard.press("Enter");
  await expect(textInput(page)).toHaveValue("#FFFFFF");
  await keyboard.press("Enter");
  await expect(textInput(page)).toHaveValue("#777777");

  await keyboard.press("Tab");
  const target = page.getByLabel("Target level");
  await expect(target).toBeFocused();
  await keyboard.press("ArrowDown");
  await expect(target).toHaveValue("AAA");

  await keyboard.press("Tab");
  const suggest = page.getByRole("button", {
    name: "Suggest accessible text color",
  });
  await expect(suggest).toBeFocused();
  await keyboard.press("Enter");

  await expect(page.getByTestId("aaa-normal")).toContainText("Pass");
  expect(await ratioValue(page)).toBeGreaterThanOrEqual(7);
});
