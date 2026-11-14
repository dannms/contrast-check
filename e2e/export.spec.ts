import { expect, test } from "@playwright/test";

test("the export shows the theme with the label aliases", async ({ page }) => {
  await page.goto("/");
  const code = page.getByTestId("export-code");
  await expect(code).toContainText("@theme {");
  await expect(code).toContainText("--color-primary-label");
});

test("copy reports success", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(page.getByTestId("message")).toHaveText("Theme copied.");
});
