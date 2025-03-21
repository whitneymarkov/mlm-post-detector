import { describe, it, expect, beforeEach, vi } from "vitest";
import { updateScanningUI } from "../popup";

describe("Popup UI functions", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="popup">
        <p id="scanning-status"></p>
        <button id="toggle-btn"></button>
        <div id="model-toggles">
          <input type="radio" id="model-basic" name="model-type">
          <input type="radio" id="model-advanced" name="model-type">
          <input type="checkbox" id="explanations-checkbox">
        </div>
      </div>
    `;

    vi.clearAllMocks();
  });

  describe("Scanning UI", () => {
    it('Should update UI to show "ON" when actively scanning', () => {
      updateScanningUI(true, true);

      const status = document.getElementById("scanning-status")?.textContent;
      const toggleButton = document.getElementById(
        "toggle-btn"
      ) as HTMLButtonElement;

      expect(status).toBe("ON");
      expect(toggleButton.getAttribute("aria-checked")).toBe("true");
      expect(toggleButton.disabled).toBe(false);
    });

    it('Should update UI to show "OFF" when not scanning but on Instagram', () => {
      updateScanningUI(false, true);

      const status = document.getElementById("scanning-status")?.textContent;
      const toggleButton = document.getElementById(
        "toggle-btn"
      ) as HTMLButtonElement;

      expect(status).toBe("OFF");
      expect(toggleButton.getAttribute("aria-checked")).toBe("false");
      expect(toggleButton.disabled).toBe(false);
    });

    it('Should update UI to show "DISABLED" when not on Instagram', () => {
      updateScanningUI(false, false);

      const status = document.getElementById("scanning-status")?.textContent;
      const toggleButton = document.getElementById(
        "toggle-btn"
      ) as HTMLButtonElement;

      expect(status).toBe("DISABLED");
      expect(toggleButton.getAttribute("aria-checked")).toBe("false");
      expect(toggleButton.disabled).toBe(true);
    });
  });

  describe("Model toggles and explanations", () => {
    it("Should update model toggle UI for basic model (explanations disabled)", () => {
      (chrome.storage.local.get as any).mockImplementation(
        (_keys: string[], callback: Function) => {
          callback({ modelType: "basic", explanations: false });
        }
      );

      // Simulate DOMContentLoaded
      document.dispatchEvent(new Event("DOMContentLoaded"));

      const basicRadio = document.getElementById(
        "model-basic"
      ) as HTMLInputElement;
      const advancedRadio = document.getElementById(
        "model-advanced"
      ) as HTMLInputElement;
      const explanationsCheckbox = document.getElementById(
        "explanations-checkbox"
      ) as HTMLInputElement;

      expect(basicRadio.checked).toBe(true);
      expect(advancedRadio.checked).toBe(false);
      expect(explanationsCheckbox.checked).toBe(false);
      expect(explanationsCheckbox.disabled).toBe(true);
    });

    it("Should update model toggle UI for advanced model (explanations enabled)", () => {
      (chrome.storage.local.get as any).mockImplementation(
        (_keys: string[], callback: Function) => {
          callback({ modelType: "advanced", explanations: true });
        }
      );

      document.dispatchEvent(new Event("DOMContentLoaded"));

      const basicRadio = document.getElementById(
        "model-basic"
      ) as HTMLInputElement;
      const advancedRadio = document.getElementById(
        "model-advanced"
      ) as HTMLInputElement;
      const explanationsCheckbox = document.getElementById(
        "explanations-checkbox"
      ) as HTMLInputElement;

      expect(basicRadio.checked).toBe(false);
      expect(advancedRadio.checked).toBe(true);
      expect(explanationsCheckbox.checked).toBe(true);
      expect(explanationsCheckbox.disabled).toBe(false);
    });
  });

  describe("Input onChange events", () => {
    beforeEach(() => {
      document.dispatchEvent(new Event("DOMContentLoaded"));
    });

    it("Should update storage and disable the explanations checkbox when basic radio is selected", () => {
      const basicRadio = document.getElementById(
        "model-basic"
      ) as HTMLInputElement;
      const explanationsCheckbox = document.getElementById(
        "explanations-checkbox"
      ) as HTMLInputElement;

      // Simulate select basic model
      basicRadio.checked = true;
      basicRadio.dispatchEvent(new Event("change", { bubbles: true }));

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        modelType: "basic",
      });
      expect(explanationsCheckbox.disabled).toBe(true);
    });

    it("Should update storage and enable the explanations checkbox when advanced radio is selected", () => {
      const advancedRadio = document.getElementById(
        "model-advanced"
      ) as HTMLInputElement;
      const explanationsCheckbox = document.getElementById(
        "explanations-checkbox"
      ) as HTMLInputElement;

      // Simulate select advanced model
      advancedRadio.checked = true;
      advancedRadio.dispatchEvent(new Event("change", { bubbles: true }));

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        modelType: "advanced",
      });
      expect(explanationsCheckbox.disabled).toBe(false);
    });

    it("Should update storage when the explanations checkbox value changes", () => {
      const explanationsCheckbox = document.getElementById(
        "explanations-checkbox"
      ) as HTMLInputElement;

      // Simulate unchecking
      explanationsCheckbox.checked = false;
      explanationsCheckbox.dispatchEvent(
        new Event("change", { bubbles: true })
      );

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        explanations: false,
      });

      // Simulate checking
      explanationsCheckbox.checked = true;
      explanationsCheckbox.dispatchEvent(
        new Event("change", { bubbles: true })
      );

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        explanations: true,
      });
    });
  });
});
