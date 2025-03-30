import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DetectionResult } from "../../types";
import { InstagramFeedObserver } from "../feed";
import { analysisResults } from "../../utils/analysisResults";
import { instagramApi } from "../../api/instagramApi";

import * as createButtonModule from "../../utils/createButton";
import * as replaceButtonWithBadgeModule from "../../utils/replaceButtonWithBadge";

vi.mock("../././api/instagramApi", () => ({
  instagramApi: {
    fetchPost: vi.fn(),
  },
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

vi.mock("../../utils/createButton", () => ({
  createButton: vi.fn(
    (shortCode: string, onClick: (event: MouseEvent) => void) => {
      const button = document.createElement("button");
      button.textContent = "Analyse post";
      button.setAttribute("data-mlm-detector", "button");
      button.setAttribute("data-shortcode", shortCode);
      button.addEventListener("click", onClick);
      return button;
    }
  ),
}));

vi.mock("../../utils/replaceButtonWithBadge", () => ({
  replaceButtonWithBadge: vi.fn(
    (button: HTMLButtonElement, shortCode: string) => {
      const badge = document.createElement("span");
      badge.setAttribute("data-mlm-detector", "badge");
      badge.setAttribute("data-shortcode", shortCode);
      badge.textContent = "Badge for " + shortCode;
      if (button.parentElement) {
        button.parentElement.replaceChild(badge, button);
      }
    }
  ),
}));

vi.mock("../../utils/addElementToArticle", () => ({
  addElementToArticle: vi.fn((element: Element, article: HTMLElement) => {
    article.appendChild(element);
  }),
}));

describe("InstagramFeedObserver", () => {
  let observer: InstagramFeedObserver;

  beforeEach(() => {
    // Clear the document body.
    document.body.innerHTML = "";
    // Clear our global analysisResults map.
    analysisResults.clear();
    // Instantiate a fresh observer.
    observer = new InstagramFeedObserver();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("processAllArticles and addOrUpdateInteractiveElement", () => {
    it("Should create a button if no interactive element exists and analysisResults does not have the shortcode", () => {
      // Article elem with a link that returns a shortcode
      const article = document.createElement("article");
      const link = document.createElement("a");
      link.href = "/p/abc123/";
      article.appendChild(link);
      document.body.appendChild(article);

      const createButtonSpy = vi.spyOn(createButtonModule, "createButton");

      observer.startObserving();

      expect(createButtonSpy).toHaveBeenCalled();
      createButtonSpy.mockRestore();
    });

    it("Should replace a button with a badge if analysisResults has the shortcode", () => {
      // Article elem with a link that returns a shortcode
      const article = document.createElement("article");
      const link = document.createElement("a");
      link.href = "/p/def456/";
      article.appendChild(link);
      document.body.appendChild(article);

      // Pre-populate analysisResults
      analysisResults.set("def456", { prediction: DetectionResult.MLM });

      // Button
      const button = document.createElement("button");
      button.setAttribute("data-mlm-detector", "button");
      button.setAttribute("data-shortcode", "def456");
      article.appendChild(button);

      // Spy on replaceButtonWithBadge
      const replaceSpy = vi.spyOn(
        replaceButtonWithBadgeModule,
        "replaceButtonWithBadge"
      );

      observer.startObserving();

      expect(replaceSpy).toHaveBeenCalledWith(button, "def456");
      replaceSpy.mockRestore();
    });
  });

  describe("handleButtonClick", () => {
    it("Should update button text to loading, disable it, and then replace it with a badge on successful analysis", async () => {
      // Article and button
      const article = document.createElement("article");
      const button = document.createElement("button");
      button.setAttribute("data-mlm-detector", "button");
      button.setAttribute("data-shortcode", "ghi789");
      button.textContent = "Analyse post";
      article.appendChild(button);
      document.body.appendChild(article);

      // Spy on replaceButtonWithBadge
      const replaceSpy = vi.spyOn(
        replaceButtonWithBadgeModule,
        "replaceButtonWithBadge"
      );

      // Mock instagramApi.fetchPost to resolve with caption
      const fetchPostMock = vi
        .spyOn(instagramApi, "fetchPost")
        .mockResolvedValue("This is a caption");

      // Simulate a response with a prediction.
      (chrome.runtime.sendMessage as any).mockImplementation(
        (_: any, cb: any) => {
          cb({ prediction: DetectionResult.MLM });
        }
      );

      await (observer as any).handleButtonClick({
        currentTarget: button,
      } as any);

      expect(button.textContent).not.toBe("Analyse post");
      expect(replaceSpy).toHaveBeenCalledWith(button, "ghi789");

      fetchPostMock.mockRestore();
      replaceSpy.mockRestore();
    });
  });

  describe("stopObserving", () => {
    it("Should disconnect the observer and clear the articleShortcodes map", () => {
      const disconnectSpy = vi.fn();
      (observer as any).mainObserver = { disconnect: disconnectSpy };
      (observer as any).articleShortcodes.set(
        document.createElement("article"),
        "test"
      );

      observer.stopObserving();

      expect(disconnectSpy).toHaveBeenCalled();
      expect((observer as any).mainObserver).toBeNull();
      expect((observer as any).articleShortcodes.size).toBe(0);
    });
  });
});
