import { describe, it, expect, vi } from "vitest";
import { createButton } from "../createButton";
import { labels } from "../labels";

describe("createButton", () => {
  it("Should create a button with the correct text, classes, and attributes", () => {
    const onClick = vi.fn();
    const shortCode = "abc123";
    const button = createButton(shortCode, onClick);

    // Type and text
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button.textContent).toBe(labels.Button.default);

    // Classes and attrs
    expect(button.classList.contains("mlm-detector-button")).toBe(true);
    expect(button.getAttribute("data-mlm-detector")).toBe("button");
    expect(button.getAttribute("data-shortcode")).toBe(shortCode);
  });

  it("should call onClick when the button is clicked", () => {
    const onClick = vi.fn();
    const shortCode = "abc123";
    const button = createButton(shortCode, onClick);

    button.click();

    expect(onClick).toHaveBeenCalled();
  });
});
