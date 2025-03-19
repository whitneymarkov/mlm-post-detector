import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { InstagramPostHandler } from "../post";
import { analysisResults } from "../../utils/analysisResults";
import { DetectionResult } from "../../types";

import { instagramApi } from "../../api/instagramApi";
import { extractShortcodeFromUrl } from "../../utils/shortCode";
import { createBadge } from "../../utils/createBadge";
import { addElementToArticle } from "../../utils/addElementToArticle";

vi.mock("../../api/instagramApi", () => ({
  instagramApi: {
    fetchPost: vi.fn(),
  },
}));

vi.mock("../../utils/shortCode", () => ({
  extractShortcodeFromUrl: vi.fn(),
}));

vi.mock("../../utils/createBadge", () => ({
  createBadge: vi.fn((shortCode: string, loading = false) => {
    const badge = document.createElement("span");
    badge.setAttribute("data-mlm-detector", "badge");
    badge.setAttribute("data-shortcode", shortCode);
    badge.textContent = loading ? "Loading..." : "Badge for " + shortCode;
    return badge;
  }),
}));

vi.mock("../../utils/addElementToArticle", () => ({
  addElementToArticle: vi.fn((element: Element, article: HTMLElement) => {
    article.appendChild(element);
  }),
}));

describe("InstagramPostHandler", () => {
  let originalConsoleWarn: (...args: any[]) => void;

  beforeEach(() => {
    document.body.innerHTML = `<article></article>`;
    analysisResults.clear();

    (chrome.runtime.sendMessage as any) = vi.fn();

    originalConsoleWarn = console.warn;
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
    console.warn = originalConsoleWarn;
  });

  it("Should warn and do nothing when no shortcode is found", async () => {
    (extractShortcodeFromUrl as any).mockReturnValue(null);

    new InstagramPostHandler("/invalid/path");

    expect(console.warn).toHaveBeenCalledWith(
      "No shortcode found in URL:",
      "/invalid/path"
    );
    expect(analysisResults.size).toBe(0);
  });

  it("Should display result immediately when analysisResults already has the shortcode", async () => {
    const shortcode = "abc123";

    // Pre-populate analysisResults
    analysisResults.set(shortcode, {
      prediction: DetectionResult.MLM,
      confidence: 99,
      raw_confidence_score: 99.999,
      word_scores: null,
      cleaned_text: "example text",
      reported: false,
    });
    (extractShortcodeFromUrl as any).mockReturnValue(shortcode);

    new InstagramPostHandler("/p/abc123/");

    expect(createBadge).toHaveBeenCalledWith(shortcode, false);
    expect(addElementToArticle).toHaveBeenCalled();
  });

  it("Should fetch post, send message, update analysisResults, and display badge when shortcode is not present", async () => {
    const analysisRes = {
      prediction: DetectionResult.General,
      confidence: 99,
      raw_confidence_score: 99.999,
      word_scores: null,
      cleaned_text: "example text",
      reported: false,
    };

    const shortcode = "def456";
    (extractShortcodeFromUrl as any).mockReturnValue(shortcode);

    // Mock instagramApi.fetchPost to resolve with caption
    const caption = "This is a caption";
    (instagramApi.fetchPost as any).mockResolvedValue(caption);

    // Simulate a response with a prediction.
    (chrome.runtime.sendMessage as any).mockImplementation(
      (_: any, cb: any) => {
        cb(analysisRes);
      }
    );

    // Instantiate the handler
    new InstagramPostHandler("/p/def456/");

    // Time delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(instagramApi.fetchPost).toHaveBeenCalledWith(shortcode);
    expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    expect(analysisResults.has(shortcode)).toBe(true);
    expect(analysisResults.get(shortcode)).toEqual(analysisRes);

    // createBadge called twice (loading true and loading false)
    expect(createBadge).toHaveBeenCalledWith(shortcode, true);
    expect(createBadge).toHaveBeenCalledWith(shortcode, false);
  });
});
