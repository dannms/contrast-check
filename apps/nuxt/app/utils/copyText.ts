/**
 * Copies `text` to the clipboard. Tries the async clipboard API first and falls
 * back to selecting `region` and calling `document.execCommand("copy")`. If both
 * fail the code stays selected and the region gets the focus, so the person can
 * copy it with the keyboard. Returns whether the copy worked.
 */
export async function copyText(
  text: string,
  region: HTMLElement | null,
): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Blocked or refused: use the fallback below.
  }
  if (!region) return false;

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(region);
  selection?.removeAllRanges();
  selection?.addRange(range);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  if (copied) {
    selection?.removeAllRanges();
  } else {
    region.focus();
  }
  return copied;
}
