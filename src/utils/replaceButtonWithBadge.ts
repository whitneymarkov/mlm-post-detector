import { createBadge } from "./createBadge";

/**
 * Replace the button with a badge element
 * @param button
 * @param shortCode
 */
export function replaceButtonWithBadge(
  button: HTMLButtonElement,
  shortCode: string
) {
  const badge = createBadge(shortCode);

  // Copy the shortcode for reference.
  badge.setAttribute("data-shortcode", shortCode);

  // Replace the button with badge in the DOM
  button.parentElement?.replaceChild(badge, button);
}
