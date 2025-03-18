import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContentScript } from "../content";
import { InstagramPostHandler } from "../instagram/post";
import { NavigateEvent, ToggleScanningEvent } from "../types";
import { injectCSS } from "../utils/injectCSS";
import { injectNavigateScript } from "../utils/injectNavigateScript";

vi.mock("../utils/injectCSS", () => ({
  injectCSS: vi.fn(() => {
    return;
  }),
}));

vi.mock("../utils/injectNavigateScript", () => ({
  injectNavigateScript: vi.fn(() => {
    return;
  }),
}));

vi.mock("../instagram/post", () => ({
  InstagramPostHandler: vi.fn(),
}));

describe("ContentScript", () => {
  let cs: any;

  beforeEach(() => {
    // Clear doc body between tests
    document.body.innerHTML = "";

    // Instantiate new ContentScript
    cs = new ContentScript();

    // Override instagramFeedObserver methods to isolate behaviour
    vi.spyOn(cs.instagramFeedObserver, "startObserving").mockImplementation(
      () => {}
    );
    vi.spyOn(cs.instagramFeedObserver, "stopObserving").mockImplementation(
      () => {}
    );
  });

  it("Should call injectCSS and injectNavigateScript when constructed", () => {
    expect(injectCSS).toHaveBeenCalled();
    expect(injectNavigateScript).toHaveBeenCalled();
  });

  describe("handleMessage", () => {
    it("Should call handleLocationChange on NAVIGATE_EVENT when scanning is active", () => {
      cs.isScanningActive = true;

      const locationSpy = vi
        .spyOn(cs, "handleLocationChange")
        .mockImplementation(() => {});

      cs.handleMessage({
        type: "NAVIGATE_EVENT",
        pathname: "/p/test/",
      } as NavigateEvent);

      expect(locationSpy).toHaveBeenCalledWith("/p/test/");

      locationSpy.mockRestore();
    });

    it("Should not call handleLocationChange on NAVIGATE_EVENT when scanning is off", () => {
      cs.isScanningActive = false;

      const locationSpy = vi
        .spyOn(cs, "handleLocationChange")
        .mockImplementation(() => {});

      cs.handleMessage({
        type: "NAVIGATE_EVENT",
        pathname: "/p/test/",
      } as NavigateEvent);

      expect(locationSpy).not.toHaveBeenCalled();

      locationSpy.mockRestore();
    });

    it("Should call handleLocationChange on TOGGLE_SCANNING true", () => {
      // Setup window.location.pathname
      Object.defineProperty(window, "location", {
        value: { pathname: "/" },
        writable: true,
      });

      const locationSpy = vi
        .spyOn(cs, "handleLocationChange")
        .mockImplementation(() => {});

      cs.handleMessage({
        type: "TOGGLE_SCANNING",
        isScanning: true,
      } as ToggleScanningEvent);

      expect(locationSpy).toHaveBeenCalledWith("/");

      locationSpy.mockRestore();
    });

    it("Should call instagramFeedObserver.stopObserving and removeMLMDetectorElements on TOGGLE_SCANNING false", () => {
      cs.isScanningActive = true;

      const stopSpy = vi.spyOn(cs.instagramFeedObserver, "stopObserving");

      const removeSpy = vi
        .spyOn(cs, "removeMLMDetectorElements")
        .mockImplementation(() => {});

      cs.handleMessage({
        type: "TOGGLE_SCANNING",
        isScanning: false,
      } as ToggleScanningEvent);

      expect(stopSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();

      stopSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  describe("handleLocationChange", () => {
    it("Should do nothing if scanning is off", () => {
      cs.isScanningActive = false;

      const observeSpy = vi.spyOn(cs.instagramFeedObserver, "startObserving");

      cs.handleLocationChange("/");

      expect(observeSpy).not.toHaveBeenCalled();

      observeSpy.mockRestore();
    });

    it('Should call instagramFeedObserver.startObserving when pathname is "/" and scanning is active', () => {
      cs.isScanningActive = true;

      const observeSpy = vi
        .spyOn(cs.instagramFeedObserver, "startObserving")
        .mockImplementation(() => {});

      cs.handleLocationChange("/");

      expect(observeSpy).toHaveBeenCalled();

      observeSpy.mockRestore();
    });

    it('Should instantiate InstagramPostHandler when pathname includes "/p/" or "/reel/" and scanning is active', () => {
      cs.isScanningActive = true;

      cs.handleLocationChange("/p/abc/");

      expect(InstagramPostHandler).toHaveBeenCalledWith("/p/abc/");

      cs.handleLocationChange("/reel/abc/");

      expect(InstagramPostHandler).toHaveBeenCalledWith("/reel/abc/");
    });
  });

  describe("removeMLMDetectorElements", () => {
    it("Should remove all elements with data-mlm-detector attribute", () => {
      const elem = document.createElement("div");
      elem.setAttribute("data-mlm-detector", "test");
      document.body.appendChild(elem);

      cs.removeMLMDetectorElements();

      expect(document.querySelector("[data-mlm-detector]")).toBeNull();
    });
  });
});
