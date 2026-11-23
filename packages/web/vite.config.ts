import { resolve } from "node:path";
import { defineConfig } from "vite";
import { DEV_ORIGINS, ORIGINS, siteNav } from "../site-nav/index.mjs";

export default defineConfig(({ command }) => ({
  // 頁首與工具分頁由 site-nav 產生，開發時跨站連結指到本機的另一個 dev server
  plugins: [siteNav({ site: "type", origins: command === "serve" ? DEV_ORIGINS : ORIGINS })],
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
        dubeolsik: resolve(__dirname, "dubeolsik/index.html"),
        enDubeolsik: resolve(__dirname, "en/dubeolsik/index.html"),
      },
    },
  },
}));
