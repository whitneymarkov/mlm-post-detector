import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBadge } from "../createBadge";
import { replaceButtonWithBadge } from "../replaceButtonWithBadge";

vi.mock("../createBadge", () => ({
  createBadge: vi.fn((shortCode: string) => {
    const badge = document.createElement("span");
    badge.setAttribute("data-mlm-detector", "badge");
    badge.textContent = "Badge for " + shortCode;
    return badge;
  }),
}));

describe("replaceButtonWithBadge", () => {
  let container: HTMLElement;
  let button: HTMLButtonElement;
  const shortCode = "abc123";

  beforeEach(() => {
    // Setup container el with a button inside
    container = document.createElement("div");
    button = document.createElement("button");
    button.textContent = "Analyse post";

    // Set some attrs
    button.setAttribute("data-mlm-detector", "button");
    button.setAttribute("data-shortcode", shortCode);
    container.appendChild(button);
  });

  it("Should replace the button with a badge element", () => {
    replaceButtonWithBadge(button, shortCode);

    expect(createBadge).toHaveBeenCalledWith(shortCode);

    expect(container.contains(button)).toBe(false);

    const badge = container.firstChild as HTMLElement;
    expect(badge).toBeDefined();
    expect(badge.tagName).toBe("SPAN");

    expect(badge.getAttribute("data-shortcode")).toBe(shortCode);
    expect(badge.textContent).toBe("Badge for " + shortCode);
  });
});
