import { describe, it, expect, beforeEach, vi } from "vitest";
import tippy from "tippy.js";
import {
  attachPopover,
  createPopoverContent,
  getShapWordStyles,
} from "../shapPopover";
import { DetectionResult } from "../../types";
import { analysisResults } from "../analysisResults";

vi.mock("tippy.js", () => {
  return {
    __esModule: true,
    default: vi.fn((_el, opts) => {
      const fakePopper = document.createElement("div");
      fakePopper.innerHTML = opts.content;
      const fakeInstance = { popper: fakePopper };
      // Invoke onShown for event listeners
      if (opts.onShown) {
        opts.onShown(fakeInstance);
      }
      return fakeInstance;
    }),
  };
});

describe("shapPopover", () => {
  beforeEach(() => {
    analysisResults.clear();
    vi.clearAllMocks();
  });

  describe("getShapWordStyles", () => {
    it("Should return accurate red styles for highly positive values", () => {
      const style = getShapWordStyles(0.15);
      expect(style).toContain("bg-red-300");
      expect(style).toContain("text-red-900");
      expect(style).toContain("rounded");
    });

    it("Should return accurate red styles for moderate positive values", () => {
      const style = getShapWordStyles(0.07);
      expect(style).toContain("bg-red-200");
      expect(style).toContain("text-red-800");
    });

    it("Should return accurate red styles for weak positive values", () => {
      const style = getShapWordStyles(0.03);
      expect(style).toContain("bg-red-100");
      expect(style).toContain("text-red-700");
    });

    it("Should return accurate neutral styles for values near zero", () => {
      const style = getShapWordStyles(0);
      expect(style).toContain("bg-transparent");
      expect(style).toContain("text-gray-900");
    });

    it("Should return accurate blue styles for weak negative values", () => {
      const style = getShapWordStyles(-0.03);
      expect(style).toContain("bg-sky-100");
      expect(style).toContain("text-sky-700");
    });

    it("Should return accurate blue styles for moderate negative values", () => {
      const style = getShapWordStyles(-0.07);
      expect(style).toContain("bg-sky-200");
      expect(style).toContain("text-sky-800");
    });

    it("Should return accurate blue styles for highly negative values", () => {
      const style = getShapWordStyles(-0.15);
      expect(style).toContain("bg-sky-300");
      expect(style).toContain("text-sky-900");
    });
  });

  describe("createPopoverContent", () => {
    it("Should render popover content with disagree prompt for non-reported result", () => {
      const result = {
        prediction: DetectionResult.MLM,
        confidence: 80,
        raw_confidence_score: 80,
        word_scores: [{ word: "test", value: 0.03 }],
        cleaned_text: "example text",
        reported: false,
      };

      const content = createPopoverContent(result);
      expect(content).toContain("80% confident");
      expect(content).toContain("Disagree with this result?");
      expect(content).toContain("mlm-detector-disagree-btn");
      expect(content).toContain("test");
    });

    it("Should render thank-you message for reported results", () => {
      const result = {
        prediction: DetectionResult.MLM,
        confidence: 80,
        raw_confidence_score: 80,
        word_scores: [{ word: "test", value: 0.03 }],
        cleaned_text: "example text",
        reported: true,
      };

      const content = createPopoverContent(result);
      // Should directly display the thank-you message.
      expect(content).toContain("Thanks for letting us know!");
      // And not include the disagree button.
      expect(content).not.toContain("mlm-detector-disagree-btn");
    });
  });

  describe("attachPopover", () => {
    it("Should set the badge cursor and update reported status on disagree click", () => {
      (chrome.runtime.sendMessage as any).mockImplementation(
        (_: any, cb: any) => {
          cb("ok");
        }
      );
      const shortCode = "testCode";
      const badge = document.createElement("span");
      const result = {
        prediction: DetectionResult.MLM,
        confidence: 80,
        raw_confidence_score: 80,
        word_scores: [{ word: "test", value: 0.03 }],
        cleaned_text: "example text",
        reported: false,
      };
      analysisResults.set(shortCode, result);

      // Mocked tippy will immediately call onShown with a fake instance.
      attachPopover(shortCode, badge, result);

      // Retrieve the fake instance
      const instance = (tippy as any).mock.results[0].value;

      expect(badge.style.cursor).toBe("pointer");

      const disagreeButton = instance.popper.querySelector(
        ".mlm-detector-disagree-btn"
      );
      expect(disagreeButton).toBeTruthy();

      // Simulate click
      disagreeButton.dispatchEvent(new Event("click", { bubbles: true }));

      // Analysis result is updated to reported
      expect(analysisResults.get(shortCode)?.reported).toBe(true);

      const disagreeContainer = instance.popper.querySelector(
        ".disagree-container"
      );
      expect(disagreeContainer.innerHTML).toContain(
        "Thanks for letting us know!"
      );
    });
  });
});
