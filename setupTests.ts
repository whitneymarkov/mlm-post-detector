import { vi } from "vitest";

// Global chrome stub
(global as any).chrome = {
  runtime: {
    getURL: vi.fn((path: string) => {
      if (path === "global.css") {
        return "chrome-extension://extensionID/global.css";
      }

      return `chrome-extension://extensionID/${path}`;
    }),
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn((keys: string[], callback: Function) =>
        callback({ isScanning: false })
      ),
      set: vi.fn((data: any, callback?: Function) => callback && callback()),
    },
    onChanged: {
      addListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn((query, callback) => {
      callback([{ id: 1, url: "https://www.instagram.com/" }]);
    }),
    sendMessage: vi.fn(),
    onUpdated: {
      addListener: vi.fn(),
    },
    onActivated: {
      addListener: vi.fn(),
    },
  },
  action: {
    setIcon: vi.fn(),
  },
};
