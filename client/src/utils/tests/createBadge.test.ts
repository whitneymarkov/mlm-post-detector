import { describe, it, expect, beforeEach, vi } from "vitest";
import { createBadge } from "../createBadge";
import { DetectionResult } from "../../types";
import { analysisResults } from "../analysisResults";
import { labels } from "../labels";
import * as shapPopoverModule from "../shapPopover";

describe("createBadge", () => {
  const shortCode = "abc123";

  beforeEach(() => {
    analysisResults.clear();
    vi.clearAllMocks();
  });

  it('Should create a badge with "unknown" class and text "Unknown" when no prediction and loading is false', () => {
    const badge = createBadge(shortCode, false);

    expect(badge.tagName).toBe("SPAN");
    expect(badge.classList.contains("mlm-detector-badge")).toBe(true);
    expect(badge.classList.contains("unknown")).toBe(true);
    expect(badge.textContent).toBe("Unknown");
    expect(badge.getAttribute("data-shortcode")).toBe(shortCode);
  });

  it('Should create a badge with "unknown" class and text "Analysing..." when no prediction and loading is true', () => {
    const badge = createBadge(shortCode, true);

    expect(badge.classList.contains("unknown")).toBe(true);
    expect(badge.textContent).toBe("Analysing...");
  });

  it('Should create a badge with "detected" class and proper text when prediction is MLM', () => {
    analysisResults.set(shortCode, {
      prediction: DetectionResult.MLM,
      confidence: 99,
      raw_confidence_score: 99.999,
      word_scores: null,
      cleaned_text: "example text",
      reported: false,
    });

    const badge = createBadge(shortCode, false);

    expect(badge.classList.contains("detected")).toBe(true);
    expect(badge.textContent).toBe(labels.Badge.MLM + " (99%)");
  });

  it('Should create a badge with "not-detected" class and proper text when prediction is General', () => {
    analysisResults.set(shortCode, {
      prediction: DetectionResult.General,
      confidence: 99,
      raw_confidence_score: 99.999,
      word_scores: null,
      cleaned_text: "example text",
      reported: false,
    });

    const badge = createBadge(shortCode, false);

    expect(badge.classList.contains("not-detected")).toBe(true);
    expect(badge.textContent).toBe(labels.Badge.General + " (99%)");
  });

  it("Should initialise Tippy popover when word_scores exist", () => {
    const result = {
      prediction: DetectionResult.MLM,
      confidence: 80,
      raw_confidence_score: 80,
      word_scores: [{ word: "test", value: 0.5 }],
      cleaned_text: "example text",
      reported: false,
    };
    analysisResults.set(shortCode, result);

    const attachPopoverSpy = vi.spyOn(shapPopoverModule, "attachPopover");

    createBadge(shortCode, false);

    expect(attachPopoverSpy).toHaveBeenCalled();
  });

  it("Should not initialise Tippy popover when word_scores is empty", () => {
    const result = {
      prediction: DetectionResult.MLM,
      confidence: 80,
      raw_confidence_score: 80,
      word_scores: [],
      cleaned_text: "example text",
      reported: false,
    };
    analysisResults.set(shortCode, result);

    const attachPopoverSpy = vi.spyOn(shapPopoverModule, "attachPopover");

    createBadge(shortCode, false);

    expect(attachPopoverSpy).not.toHaveBeenCalled();
  });
});
