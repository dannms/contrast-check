import type { Locator, Page } from "@playwright/test";

export type Role = "text" | "background" | "primary" | "secondary" | "accent";

const LABELS: Record<Role, string> = {
  text: "Text",
  background: "Background",
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
};

/** The hex input of a role, by its exact label. */
export const field = (page: Page, role: Role): Locator =>
  page.getByLabel(LABELS[role], { exact: true });

/** The `<tr>` of a pair, by its id (for example "text-on-background"). */
export const pairRow = (page: Page, id: string): Locator =>
  page.getByTestId(`pair-${id}`);

/** The ratio of the pair in focus as a number ("16.09:1" gives 16.09). */
export async function focusRatio(page: Page): Promise<number> {
  const text = (await page.getByTestId("focus-ratio").textContent()) ?? "";
  return Number.parseFloat(text);
}
