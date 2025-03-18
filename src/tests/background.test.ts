import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { handleAnalyseMessage, updateIcon } from "../background";

describe("updateIcon", () => {
  it("Should set active icons when URL includes instagram.com", () => {
    updateIcon(1, "https://www.instagram.com/somepath");
    expect(chrome.action.setIcon).toHaveBeenCalledWith({
      tabId: 1,
      path: {
        "16": "icons/icon16-active.png",
        "48": "icons/icon48-active.png",
        "128": "icons/icon128-active.png",
      },
    });
  });

  it("Should set disabled icons when URL does not include instagram.com", () => {
    updateIcon(1, "https://example.com");
    expect(chrome.action.setIcon).toHaveBeenCalledWith({
      tabId: 1,
      path: {
        "16": "icons/icon16-disabled.png",
        "48": "icons/icon48-disabled.png",
        "128": "icons/icon128-disabled.png",
      },
    });
  });
});

describe("handleAnalyseMessage", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("Should call sendResponse with data on a successful fetch", async () => {
    const data = { prediction: "mlm" };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const sendResponse = vi.fn();
    handleAnalyseMessage(
      { type: "ANALYSE", payload: { post_content: "test" } } as any,
      sendResponse
    );

    // Time delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sendResponse).toHaveBeenCalledWith(data);
  });

  it("Should call sendResponse with an error on fetch failure", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));
    const sendResponse = vi.fn();
    handleAnalyseMessage(
      { type: "ANALYSE", payload: { post_content: "test" } } as any,
      sendResponse
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sendResponse).toHaveBeenCalledWith({
      error: "Network request failed",
    });
  });
});
