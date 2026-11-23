import { resolve } from "node:path";
import { defineConfig } from "vite";
import { DEV_ORIGINS, ORIGINS, siteNav } from "../site-nav/index.mjs";

export default defineConfig(({ command }) => ({
  // 頁首與工具分頁由 site-nav 產生，開發時跨站連結指到本機的另一個 dev server
  plugins: [siteNav({ site: "romanize", origins: command === "serve" ? DEV_ORIGINS : ORIGINS })],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5174,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        en: resolve(__dirname, "en/index.html"),
        ko: resolve(__dirname, "ko/index.html"),
        enKo: resolve(__dirname, "en/ko/index.html"),
        zh: resolve(__dirname, "zh/index.html"),
        enZh: resolve(__dirname, "en/zh/index.html"),
        ja: resolve(__dirname, "ja/index.html"),
        enJa: resolve(__dirname, "en/ja/index.html"),
        th: resolve(__dirname, "th/index.html"),
        enTh: resolve(__dirname, "en/th/index.html"),
      },
    },
  },
}));
