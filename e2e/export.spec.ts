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

test("when the clipboard is blocked the code gets selected", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    document.execCommand = () => false;
  });
  await gotoReady(page, "/");
  await page.getByRole("button", { name: "Copy theme" }).click();

  await expect(
    page.getByRole("button", { name: "Copy theme" }),
  ).toHaveAttribute("data-state", "failed");
  await expect(page.getByTestId("copy-announcement")).toHaveText(
    "Copy failed. The code is selected, copy it with your keyboard.",
  );
  expect(
    await page.evaluate(() => window.getSelection()?.toString()),
  ).toContain("@theme {");
  await expect(page.getByTestId("export-code")).toBeFocused();
  await expect(page.getByTestId("copy-error")).toHaveCount(0);

  await expect(
    page.getByRole("button", { name: "Copy theme" }),
  ).toHaveAttribute("data-state", "idle");
});
