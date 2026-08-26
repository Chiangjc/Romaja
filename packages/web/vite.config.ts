import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        en: resolve(__dirname, "en/index.html"),
        privacy: resolve(__dirname, "privacy/index.html"),
        enPrivacy: resolve(__dirname, "en/privacy/index.html"),
        ja: resolve(__dirname, "ja/index.html"),
        enJa: resolve(__dirname, "en/ja/index.html"),
      },
    },
  },
});
