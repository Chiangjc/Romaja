import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { siteNav } from "../site-nav/index.mjs";

// 每一頁右下角的回饋按鈕：把 src/feedback.ts 插進所有頁面。
// 開發時沒有 Worker，/api/feedback 由這裡假裝收下，內容印在 dev server 的 log。
function feedback(): Plugin {
  return {
    name: "latype-feedback",
    transformIndexHtml: {
      order: "pre",
      handler: () => [{ tag: "script", attrs: { type: "module", src: "/src/feedback.ts" }, injectTo: "body" }],
    },
    configureServer(server) {
      server.middlewares.use("/api/feedback", (req, res) => {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          console.log("[feedback] (dev，沒有真的寄出)", body);
          res.setHeader("Content-Type", "application/json");
          res.end('{"ok":true}');
        });
      });
    },
  };
}

export default defineConfig({
  // 頁首、⇄ 方向切換列、工具清單由 site-nav 產生
  plugins: [siteNav(), feedback()],
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
        romanize: resolve(__dirname, "romanize/index.html"),
        enRomanize: resolve(__dirname, "en/romanize/index.html"),
        romanizeJa: resolve(__dirname, "romanize/ja/index.html"),
        enRomanizeJa: resolve(__dirname, "en/romanize/ja/index.html"),
        romanizeZh: resolve(__dirname, "romanize/zh/index.html"),
        enRomanizeZh: resolve(__dirname, "en/romanize/zh/index.html"),
        romanizeTh: resolve(__dirname, "romanize/th/index.html"),
        enRomanizeTh: resolve(__dirname, "en/romanize/th/index.html"),
      },
    },
  },
});
