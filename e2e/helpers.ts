import type { Page } from "@playwright/test";

export const textInput = (page: Page) =>
  page.getByLabel("Text", { exact: true });
export const backgroundInput = (page: Page) =>
  page.getByLabel("Background", { exact: true });
export const ratioText = (page: Page) => page.getByTestId("ratio");

export async function ratioValue(page: Page): Promise<number> {
  const text = (await ratioText(page).textContent()) ?? "";
  return Number.parseFloat(text);
}
