// main.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { updateUI } from "../popup";

describe("Popup UI functions", () => {
  beforeEach(() => {
    // Create elems
    document.body.innerHTML = `
      <div id="popup">
        <p id="scanning-status"></p>
        <button id="toggle-btn">
          <span class="pointer-events-none">
            <span class="opacity-100">Off Icon</span>
            <span class="opacity-0">On Icon</span>
          </span>
        </button>
      </div>
    `;
  });

  it('Should update UI to show "ON" when actively scanning', () => {
    updateUI(true, true);

    const status = document.getElementById("scanning-status")?.textContent;
    const toggleButton = document.getElementById("toggle-btn");

    expect(status).toBe("ON");
    expect(toggleButton?.getAttribute("aria-checked")).toBe("true");
    expect(toggleButton?.classList.contains("bg-pink-500")).toBe(true);
  });

  it('Should update UI to show "OFF" when not scanning', () => {
    updateUI(false, true);

    const status = document.getElementById("scanning-status")?.textContent;
    const toggleButton = document.getElementById("toggle-btn");

    expect(status).toBe("OFF");
    expect(toggleButton?.getAttribute("aria-checked")).toBe("false");
    expect(toggleButton?.classList.contains("bg-pink-500")).toBe(false);
  });

  it('Should update UI to show "DISABLED" when not on Instagram', () => {
    updateUI(false, false);

    const status = document.getElementById("scanning-status")?.textContent;
    const toggleButton = document.getElementById("toggle-btn");

    expect(status).toBe("DISABLED");
    expect(toggleButton?.getAttribute("aria-checked")).toBe("false");
    expect(toggleButton?.classList.contains("bg-pink-500")).toBe(false);
  });
});
