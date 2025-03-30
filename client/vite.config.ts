import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        popup: "popup.html",
        content: "src/content.ts",
        background: "src/background.ts",
      },
      output: {
        entryFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          // If it's a CSS file, output with a fixed name
          if (assetInfo.names[0] && assetInfo.names[0].endsWith(".css")) {
            return "global.css";
          }
          // Otherwise, use the default naming with hash.
          return "[name].[hash].[ext]";
        },
      },
    },
    target: "es2015",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./setupTests.ts",
    coverage: {
      exclude: [
        "**/dist/**",
        "**/public/**",
        "**/node_modules/**",
        "**/*.config.{js,ts}",
        "**/src/types.ts",
        "**/*.d.ts",
      ],
    },
  },
});
