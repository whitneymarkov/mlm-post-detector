import { labels } from "./labels";

/**
 * Create a button element to analyse the post
 *
 * @param shortCode
 * @returns HTMLButtonElement
 */
export function createButton(
  shortCode: string,
  onClick: (event: MouseEvent) => void
) {
  const button = document.createElement("button");
  button.textContent = labels.Button.default;
  button.classList.add("mlm-detector-button");
  button.setAttribute("data-mlm-detector", "button");
  button.setAttribute("data-shortcode", shortCode);
  button.addEventListener("click", onClick);

  return button;
}
