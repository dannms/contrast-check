import { expect, test } from "@playwright/test";
import { gotoReady } from "./helpers";

test("the export shows the theme with the label aliases", async ({ page }) => {
  await gotoReady(page, "/");
  const code = page.getByTestId("export-code");
  await expect(code).toContainText("@theme {");
  await expect(code).toContainText("--color-primary-label");
});

test("copy confirms on the button and goes back to Copy", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoReady(page, "/");
  const button = page.getByTestId("copy-button");
  await expect(button).toHaveText("Copy");
  const before = (await button.boundingBox())?.width;

  await button.click();
  await expect(button).toHaveText("Copied");
  await expect(page.getByTestId("copy-announcement")).toHaveText(
    "Theme copied.",
  );
  await expect(page.getByTestId("copy-error")).toBeEmpty();
  expect((await button.boundingBox())?.width).toBe(before);
  // The results message is only for Fix.
  await expect(page.getByTestId("message")).toBeEmpty();

  await expect(button).toHaveText("Copy");
  await expect(page.getByTestId("copy-announcement")).toBeEmpty();
});

test("copy failure shows the error under the header", async ({ page }) => {
  await gotoReady(page, "/");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      configurable: true,
    });
  });
  await page.getByTestId("copy-button").click();
  await expect(page.getByTestId("copy-error")).toHaveText(
    "Copy failed. Select the code and copy it.",
  );
  await expect(page.getByTestId("copy-button")).toHaveText("Copy");
});
