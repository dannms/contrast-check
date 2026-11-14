import { expect, test } from "@playwright/test";
import { backgroundInput, ratioText, ratioValue, textInput } from "./helpers";

test("typing colors updates the ratio and the criteria", async ({ page }) => {
  await page.goto("/");

  await textInput(page).fill("#000000");
  await backgroundInput(page).fill("#FFFFFF");
  await expect(ratioText(page)).toHaveText("21.00:1");
  for (const id of ["aa-normal", "aa-large", "aaa-normal", "aaa-large", "ui"]) {
    await expect(page.getByTestId(id)).toContainText("Pass");
  }

  await textInput(page).fill("#777");
  await backgroundInput(page).fill("#FFF");
  await expect(ratioText(page)).toHaveText("4.48:1");
  await expect(page.getByTestId("aa-normal")).toContainText("Fail");
  await expect(page.getByTestId("aa-large")).toContainText("Pass");
  await expect(page.getByTestId("aaa-normal")).toContainText("Fail");
  await expect(page.getByTestId("ui")).toContainText("Pass");
});

test("invalid hex shows an accessible error", async ({ page }) => {
  await page.goto("/");
  const input = textInput(page);
  await input.fill("#12");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(/valid hex color/);
  await input.fill("#123456");
  await expect(input).toHaveAttribute("aria-invalid", "false");
});

test("swap colors exchanges text and background", async ({ page }) => {
  await page.goto("/");
  await textInput(page).fill("#112233");
  await backgroundInput(page).fill("#FFEEDD");
  await page.getByRole("button", { name: "Swap colors" }).click();
  await expect(textInput(page)).toHaveValue("#FFEEDD");
  await expect(backgroundInput(page)).toHaveValue("#112233");
});

test("color picker stays in sync with the hex input", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Text color picker").fill("#ff0000");
  await expect(textInput(page)).toHaveValue("#FF0000");
  await textInput(page).fill("#00ff00");
  await expect(page.getByLabel("Text color picker")).toHaveValue("#00ff00");
});

test("suggest produces a text color that passes AA", async ({ page }) => {
  await page.goto("/?fg=777777&bg=ffffff");
  await expect(page.getByTestId("aa-normal")).toContainText("Fail");
  await page
    .getByRole("button", { name: "Suggest accessible text color" })
    .click();
  await expect(page.getByTestId("aa-normal")).toContainText("Pass");
  expect(await ratioValue(page)).toBeGreaterThanOrEqual(4.5);
});

test("suggest reports when the target is unreachable", async ({ page }) => {
  await page.goto("/?fg=888888&bg=777777");
  await page.getByLabel("Target level").selectOption("AAA");
  await page
    .getByRole("button", { name: "Suggest accessible text color" })
    .click();
  await expect(page.getByText(/can reach AAA/)).toBeVisible();
  await expect(textInput(page)).toHaveValue("#888888");
});

test("state is read from the URL and written back", async ({ page }) => {
  await page.goto("/?fg=767676&bg=ffffff");
  await expect(textInput(page)).toHaveValue("#767676");
  await expect(backgroundInput(page)).toHaveValue("#FFFFFF");
  await expect(ratioText(page)).toHaveText("4.54:1");

  await textInput(page).fill("#000000");
  await expect(page).toHaveURL(/fg=000000/);
  await expect(page).toHaveURL(/bg=ffffff/);
});

test("live summary updates when the colors change", async ({ page }) => {
  await page.goto("/");
  const summary = page.getByTestId("live-summary");
  await expect(summary).toHaveAttribute("aria-live", "polite");

  await textInput(page).fill("#000000");
  await backgroundInput(page).fill("#FFFFFF");
  await expect(summary).toHaveText("21.00:1. Passes all criteria.");

  await textInput(page).fill("#777777");
  await expect(summary).toHaveText(/^4\.48:1\. Passes AA large text/);
  await expect(summary).toContainText("Fails AA normal text");

  await textInput(page).fill("#12");
  await expect(summary).toHaveText(
    "Enter two valid hex colors to see the contrast ratio.",
  );
});

test("shows an approved pair exactly as chosen", async ({ page }) => {
  await page.goto("/?fg=000000&bg=FFFFFF");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS(
    "color",
    "rgb(0, 0, 0)",
  );
  await expect(page.getByTestId("app-root")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
});

test("shows a one-sentence verdict under the ratio", async ({ page }) => {
  await page.goto("/?fg=777777&bg=FFFFFF");
  await expect(
    page.getByText("Large text and UI only. Normal text needs 4.5:1."),
  ).toBeVisible();
});
