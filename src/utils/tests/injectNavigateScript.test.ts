import { describe, it, expect, beforeEach } from "vitest";
import { injectNavigateScript } from "../injectNavigateScript";

describe("injectNavigateScript", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.documentElement.innerHTML = "";
  });

  it("Should inject a script element with correct attributes", () => {
    injectNavigateScript();

    const script = document.querySelector(
      'script[data-extension-script="mlm-detector"]'
    );
    expect(script).toBeDefined();
    expect(script?.parentElement).toBe(
      document.head || document.documentElement
    );
    expect(script?.getAttribute("src")).toBe(
      "chrome-extension://extensionID/navigate.js"
    );
  });
});
