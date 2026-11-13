import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const scheme of ["light", "dark"] as const) {
  test(`has no axe violations in the ${scheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test(`has no axe violations with an invalid color in the ${scheme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await page.getByLabel("Text", { exact: true }).fill("#12");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("keeps the interface accessible with a failing pair, outside the specimen", async ({
  page,
}, testInfo) => {
  // Enabled once the Nuxt app receives the redesign.
  test.skip(testInfo.project.name === "nuxt");
  await page.goto("/?fg=EEEEEE&bg=FFFFFF");
  await expect(page.getByTestId("specimen")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .exclude('[data-testid="specimen"]')
    .analyze();
  expect(results.violations).toEqual([]);
});
