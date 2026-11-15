import { expect, test } from "@playwright/test";
import { gotoReady } from "./helpers";

test("the export shows the theme with the label aliases", async ({ page }) => {
  await gotoReady(page, "/");
  const code = page.getByTestId("export-code");
  await expect(code).toContainText("@theme {");
  await expect(code).toContainText("--color-primary-label");
});

test("copy shows the result as an icon on the button", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoReady(page, "/");
  const button = page.getByRole("button", { name: "Copy theme" });
  await expect(button).toHaveAttribute("data-state", "idle");
  const before = (await button.boundingBox())?.width;

  await button.click();
  await expect(button).toHaveAttribute("data-state", "copied");
  await expect(page.getByTestId("copy-announcement")).toHaveText(
    "Theme copied.",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "@theme {",
  );
  expect((await button.boundingBox())?.width).toBe(before);
  // The results message is only for Fix.
  await expect(page.getByTestId("message")).toBeEmpty();

  await expect(button).toHaveAttribute("data-state", "idle");
  await expect(page.getByTestId("copy-announcement")).toBeEmpty();
});
