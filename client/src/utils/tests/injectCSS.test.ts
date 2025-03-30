import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { injectCSS } from "../injectCSS";

describe("injectCSS", () => {
  beforeEach(() => {
    document.head.innerHTML = "";

    global.fetch = vi.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(`@font-face { src: url("/font.woff2"); }`),
      } as Response)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should inject a style element with absolute URLs and proper attribute", async () => {
    injectCSS();

    // Time delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Find injected style elem
    const styleElement = document.querySelector(
      'style[data-extension-style="mlm-detector"]'
    );
    expect(styleElement).toBeDefined();

    expect(styleElement?.textContent).toContain(
      `url("chrome-extension://extensionID/font.woff2")`
    );
  });
});
