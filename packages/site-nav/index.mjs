// latype.com（打字）與 romanize.latype.com（轉換）共用的導覽
//
// 兩個站的頁首與 ⇄ 方向切換列都從這一份工具清單產生，在 Vite 建置時把 HTML 裡的
// <!--site-header--> 與 <!--direction-switch--> 換成實際的標記。之後加語言或工具只改 LANGUAGES。
//
// 導覽的邏輯是「先選語言，再選工具」：
// - 頁首：所有頁面一模一樣的語言分頁。換語言時，如果那個語言在目前這個站也有工具，
//   就留在同一個站（打字的人繼續打字、轉換的人繼續轉換）；沒有才跳到另一個站。
// - ⇄ 方向切換列：放在 h1 上面，左右兩側是輸入和輸出，⇄ 連到反方向的工具；
//   打字頁左側可以直接換輸入法（韓文的羅馬拼音／두벌식）。只有一個方向的語言不顯示。

/** @typedef {"type" | "romanize"} Site */
/** @typedef {"zh" | "en"} UiLang */

/** @type {Record<Site, string>} */
export const ORIGINS = {
  type: "https://latype.com",
  romanize: "https://romanize.latype.com",
};

// type：latype.com 上的輸入法（可以不只一種，例如韓文有羅馬拼音和두벌식）
// romanize：romanize.latype.com 上的轉換頁
// script：⇄ 列上代表這個語言的那一側；roman：轉換頁輸出的那一側
export const LANGUAGES = [
  {
    id: "ko",
    name: { zh: "韓文", en: "Korean" },
    roman: { zh: "羅馬拼音", en: "Romanization" },
    type: [
      { path: "/", label: { zh: "羅馬拼音", en: "Romanization" } },
      { path: "/dubeolsik/", label: { zh: "두벌식", en: "Dubeolsik" } },
    ],
    romanize: "/ko/",
  },
  {
    id: "ja",
    name: { zh: "日文", en: "Japanese" },
    roman: { zh: "羅馬字", en: "Romaji" },
    type: [{ path: "/ja/", label: { zh: "羅馬字", en: "Romaji" } }],
    romanize: "/ja/",
  },
  {
    id: "zh",
    name: { zh: "中文", en: "Chinese" },
    roman: { zh: "拼音", en: "Pinyin" },
    type: [],
    romanize: "/zh/",
  },
  {
    id: "th",
    name: { zh: "泰文", en: "Thai" },
    roman: { zh: "羅馬拼音", en: "Romanization" },
    type: [],
    romanize: "/th/",
  },
];

/** 一個語言的所有工具，攤平成 { site, path } */
function toolsOf(lang) {
  return [
    ...lang.type.map((t) => ({ site: /** @type {Site} */ ("type"), path: t.path })),
    { site: /** @type {Site} */ ("romanize"), path: lang.romanize },
  ];
}

/**
 * HTML 檔路徑（/en/ja/index.html、/ja/、/）→ 介面語言與不含 /en 的頁面路徑
 * @param {string} htmlPath
 * @returns {{ ui: UiLang, page: string }}
 */
export function parsePagePath(htmlPath) {
  let p = htmlPath.replace(/index\.html$/, "");
  if (!p.endsWith("/")) p += "/";
  if (p === "/en/" || p.startsWith("/en/")) return { ui: "en", page: p.slice(3) || "/" };
  return { ui: "zh", page: p };
}

/** @param {string} page @param {UiLang} ui */
function localize(page, ui) {
  return ui === "en" ? (page === "/" ? "/en/" : "/en" + page) : page;
}

/**
 * @param {{ site: Site, ui: UiLang, origins: Record<Site, string> }} from
 * @param {Site} site
 * @param {string} page
 */
function link(from, site, page) {
  const path = localize(page, from.ui);
  return site === from.site ? path : from.origins[site] + path;
}

/** @param {Site} site @param {string} page */
export function currentTool(site, page) {
  for (const lang of LANGUAGES) {
    const tool = toolsOf(lang).find((t) => t.site === site && t.path === page);
    if (tool) return { lang, tool };
  }
  return null;
}

/** @param {string} s */
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * @param {{ site: Site, htmlPath: string, origins?: Record<Site, string> }} opts
 */
export function renderHeader({ site, htmlPath, origins = ORIGINS }) {
  const { ui, page } = parsePagePath(htmlPath);
  const from = { site, ui, origins };
  const current = currentTool(site, page);

  const tabs = LANGUAGES.map((lang) => {
    const active = current?.lang === lang;
    // 目前語言連回本頁；其他語言優先留在同一個站
    const tools = toolsOf(lang);
    const target = active ? current.tool : (tools.find((t) => t.site === site) ?? tools[0]);
    const attr = active ? ' aria-current="page"' : "";
    return `            <a href="${esc(link(from, target.site, target.path))}"${attr}>${esc(lang.name[ui])}</a>`;
  });

  const other = ui === "en" ? localize(page, "zh") : localize(page, "en");
  const toggle =
    ui === "en"
      ? `<a class="lang-toggle" href="${other}" aria-label="切換成中文">中文</a>`
      : `<a class="lang-toggle" href="${other}" aria-label="Switch to English">EN</a>`;

  return `<header class="site-header">
      <div class="site-header-inner">
        <a class="site-name" href="${localize("/", ui)}">latype</a>
        <div class="header-nav">
          <nav class="tool-switch" aria-label="${ui === "en" ? "Language" : "語言"}">
${tabs.join("\n")}
          </nav>
          <span class="header-divider" aria-hidden="true"></span>
          ${toggle}
        </div>
      </div>
    </header>`;
}

/**
 * ⇄ 方向切換列：左邊是輸入、右邊是輸出，⇄ 連到反方向的工具。
 * 打字頁的左邊列出這個語言所有的輸入法（韓文：羅馬拼音／두벌식），可以直接換。
 * 只有轉換頁的語言（中文、泰文）沒有反方向，不顯示。
 * @param {{ site: Site, htmlPath: string, origins?: Record<Site, string> }} opts
 */
export function renderDirectionSwitch({ site, htmlPath, origins = ORIGINS }) {
  const { ui, page } = parsePagePath(htmlPath);
  const current = currentTool(site, page);
  if (!current || current.lang.type.length === 0) return "";
  const { lang } = current;
  const from = { site, ui, origins };
  const name = lang.name[ui];
  const roman = lang.roman[ui];

  let left;
  let right;
  let swapHref;
  let swapLabel;
  if (site === "type") {
    if (lang.type.length === 1) {
      left = `<span class="dir-side dir-from">${esc(lang.type[0].label[ui])}</span>`;
    } else {
      const choices = lang.type.map((t) => {
        const attr = t.path === page ? ' aria-current="page"' : "";
        return `<a href="${esc(link(from, "type", t.path))}"${attr}>${esc(t.label[ui])}</a>`;
      });
      left = `<span class="dir-side dir-from dir-choices">${choices.join("")}</span>`;
    }
    right = `<span class="dir-side">${esc(name)}</span>`;
    swapHref = link(from, "romanize", lang.romanize);
    swapLabel = ui === "en" ? `Switch to ${name} → ${roman.toLowerCase()}` : `切換成${name}轉${roman}`;
  } else {
    left = `<span class="dir-side dir-from">${esc(name)}</span>`;
    right = `<span class="dir-side">${esc(roman)}</span>`;
    swapHref = link(from, "type", lang.type[0].path);
    swapLabel = ui === "en" ? `Switch to typing ${name} with ${roman.toLowerCase()}` : `切換成用${lang.type[0].label[ui]}打${name}`;
  }
  const label = ui === "en" ? "Direction" : "轉換方向";
  return `<nav class="direction-switch" aria-label="${label}">
          ${left}
          <a class="dir-swap" href="${esc(swapHref)}" title="${esc(swapLabel)}" aria-label="${esc(swapLabel)}">⇄</a>
          ${right}
        </nav>`;
}

/**
 * Vite 外掛：把 HTML 裡的 <!--site-header--> 與 <!--direction-switch--> 換成導覽
 * @param {{ site: Site, origins?: Record<Site, string> }} opts
 */
export function siteNav({ site, origins = ORIGINS }) {
  return {
    name: "latype-site-nav",
    transformIndexHtml: {
      order: "pre",
      /** @param {string} html @param {{ path: string }} ctx */
      handler(html, ctx) {
        const opts = { site, htmlPath: ctx.path, origins };
        return html
          .replace("<!--site-header-->", renderHeader(opts))
          .replace("<!--direction-switch-->", renderDirectionSwitch(opts));
      },
    },
  };
}

/** 開發時兩個站各跑在自己的 port，跨站連結也要指到本機 */
export const DEV_ORIGINS = {
  type: "http://localhost:5173",
  romanize: "http://localhost:5174",
};
