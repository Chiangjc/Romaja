// latype.com 的導覽
//
// 頁首、⇄ 方向切換列、頁面底部的工具清單都從這一份工具清單產生，在 Vite 建置時把 HTML 裡的
// <!--site-header-->、<!--direction-switch-->、<!--tool-index--> 換成實際的標記。
// 之後加語言或工具只改 LANGUAGES。
//
// 導覽的邏輯是「先選語言，再選工具」：
// - 頁首：所有頁面一模一樣的語言分頁。換語言時，打字的人繼續打字、轉換的人繼續轉換；
//   那個語言沒有同一種工具，才換到另一種。
// - ⇄ 方向切換列：放在 h1 上面，左右兩側是輸入和輸出，⇄ 連到反方向的工具；
//   打字頁左側可以直接換輸入法（韓文的羅馬拼音／두벌식）。只有一個方向的語言不顯示。
// - 工具清單：每頁 main 的最後列出全部工具，讓從搜尋進來的人看得到其他工具，也讓每頁互相連結。

/** @typedef {"type" | "romanize"} Kind */
/** @typedef {"zh" | "en"} UiLang */
/** @typedef {{ zh: string, en: string }} Text */
/** @typedef {{ path: string, label: Text, title: Text, sample: [string, string] }} Tool */

// type：用英文鍵盤打這個語言的輸入法（可以不只一種，例如韓文有羅馬拼音和두벌식）
// romanize：把這個語言轉成羅馬拼音的轉換頁
// name：⇄ 列上代表這個語言的那一側；roman：轉換頁輸出的那一側
// title：工具清單上的名稱；sample：工具清單上的範例（輸入 → 輸出）
export const LANGUAGES = [
  {
    id: "ko",
    name: { zh: "韓文", en: "Korean" },
    roman: { zh: "羅馬拼音", en: "Romanization" },
    type: [
      {
        path: "/",
        label: { zh: "羅馬拼音", en: "Romanization" },
        title: { zh: "用羅馬拼音打韓文", en: "Type Korean with romanization" },
        sample: ["annyeong", "안녕"],
      },
      {
        path: "/dubeolsik/",
        label: { zh: "두벌식", en: "Dubeolsik" },
        title: { zh: "用두벌식鍵盤打韓文", en: "Type Korean on Dubeolsik" },
        sample: ["dkssud", "안녕"],
      },
    ],
    romanize: {
      path: "/romanize/",
      title: { zh: "韓文轉羅馬拼音", en: "Korean to romanization" },
      sample: ["감사합니다", "gamsahamnida"],
    },
  },
  {
    id: "ja",
    name: { zh: "日文", en: "Japanese" },
    roman: { zh: "羅馬字", en: "Romaji" },
    type: [
      {
        path: "/ja/",
        label: { zh: "羅馬字", en: "Romaji" },
        title: { zh: "用羅馬字打日文", en: "Type Japanese with romaji" },
        sample: ["arigatou", "ありがとう"],
      },
    ],
    romanize: {
      path: "/romanize/ja/",
      title: { zh: "日文轉羅馬字", en: "Japanese to romaji" },
      sample: ["ありがとう", "arigatou"],
    },
  },
  {
    id: "zh",
    name: { zh: "中文", en: "Chinese" },
    roman: { zh: "拼音", en: "Pinyin" },
    type: [],
    romanize: {
      path: "/romanize/zh/",
      title: { zh: "中文轉拼音", en: "Chinese to pinyin" },
      sample: ["我愛你", "wǒ ài nǐ"],
    },
  },
  {
    id: "th",
    name: { zh: "泰文", en: "Thai" },
    roman: { zh: "羅馬拼音", en: "Romanization" },
    type: [],
    romanize: {
      path: "/romanize/th/",
      title: { zh: "泰文轉羅馬拼音", en: "Thai to romanization" },
      sample: ["สวัสดี", "sa-wat-di"],
    },
  },
];

/** 一個語言的所有工具，攤平成 { kind, path, title, sample } */
function toolsOf(lang) {
  return [
    ...lang.type.map((t) => ({ kind: /** @type {Kind} */ ("type"), ...t })),
    { kind: /** @type {Kind} */ ("romanize"), ...lang.romanize },
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

/** @param {string} page */
export function currentTool(page) {
  for (const lang of LANGUAGES) {
    const tool = toolsOf(lang).find((t) => t.path === page);
    if (tool) return { lang, tool };
  }
  return null;
}

/** @param {string} s */
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** @param {{ htmlPath: string }} opts */
export function renderHeader({ htmlPath }) {
  const { ui, page } = parsePagePath(htmlPath);
  const current = currentTool(page);
  const kind = current?.tool.kind ?? "type";

  const tabs = LANGUAGES.map((lang) => {
    const active = current?.lang === lang;
    // 目前語言連回本頁；其他語言優先找同一種工具
    const tools = toolsOf(lang);
    const target = active ? current.tool : (tools.find((t) => t.kind === kind) ?? tools[0]);
    const attr = active ? ' aria-current="page"' : "";
    return `            <a href="${esc(localize(target.path, ui))}"${attr}>${esc(lang.name[ui])}</a>`;
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
 * @param {{ htmlPath: string }} opts
 */
export function renderDirectionSwitch({ htmlPath }) {
  const { ui, page } = parsePagePath(htmlPath);
  const current = currentTool(page);
  if (!current || current.lang.type.length === 0) return "";
  const { lang, tool } = current;
  const name = lang.name[ui];
  const roman = lang.roman[ui];

  let left;
  let right;
  let swapHref;
  let swapLabel;
  if (tool.kind === "type") {
    if (lang.type.length === 1) {
      left = `<span class="dir-side dir-from">${esc(lang.type[0].label[ui])}</span>`;
    } else {
      const choices = lang.type.map((t) => {
        const attr = t.path === page ? ' aria-current="page"' : "";
        return `<a href="${esc(localize(t.path, ui))}"${attr}>${esc(t.label[ui])}</a>`;
      });
      left = `<span class="dir-side dir-from dir-choices">${choices.join("")}</span>`;
    }
    right = `<span class="dir-side">${esc(name)}</span>`;
    swapHref = localize(lang.romanize.path, ui);
    swapLabel = ui === "en" ? `Switch to ${name} → ${roman.toLowerCase()}` : `切換成${name}轉${roman}`;
  } else {
    left = `<span class="dir-side dir-from">${esc(name)}</span>`;
    right = `<span class="dir-side">${esc(roman)}</span>`;
    swapHref = localize(lang.type[0].path, ui);
    swapLabel = ui === "en" ? `Switch to typing ${name} with ${roman.toLowerCase()}` : `切換成用${lang.type[0].label[ui]}打${name}`;
  }
  const label = ui === "en" ? "Direction" : "轉換方向";
  return `<nav class="direction-switch" aria-label="${label}">
          ${left}
          <a class="dir-swap" href="${esc(swapHref)}" title="${esc(swapLabel)}" aria-label="${esc(swapLabel)}">⇄</a>
          ${right}
        </nav>`;
}

// 工具清單分兩組：英文鍵盤 → 外文（輸入法）、外文 → 羅馬字（轉換）
const TOOL_GROUPS = [
  { kind: /** @type {Kind} */ ("type"), title: { zh: "用英文鍵盤打外文", en: "Type on an English keyboard" } },
  { kind: /** @type {Kind} */ ("romanize"), title: { zh: "外文轉羅馬拼音", en: "Convert to Roman letters" } },
];

/**
 * 工具清單：輸入法和轉換分成兩組，每個工具一張卡片，目前這頁標成 aria-current
 * @param {{ htmlPath: string }} opts
 */
export function renderToolIndex({ htmlPath }) {
  const { ui, page } = parsePagePath(htmlPath);
  const all = LANGUAGES.flatMap(toolsOf);
  const groups = TOOL_GROUPS.map((g) => {
    const cards = all
      .filter((t) => t.kind === g.kind)
      .map((t) => {
        const attr = t.path === page ? ' aria-current="page"' : "";
        return `            <li>
              <a class="lang-card" href="${esc(localize(t.path, ui))}"${attr}>
                <span class="lang-card-name">${esc(t.title[ui])}</span>
                <span class="lang-card-sample"><span class="lang-card-src">${esc(t.sample[0])}</span> → ${esc(t.sample[1])}</span>
              </a>
            </li>`;
      });
    return `          <h3 class="tool-group-title">${esc(g.title[ui])}</h3>
          <ul class="lang-list">
${cards.join("\n")}
          </ul>`;
  });
  const heading = ui === "en" ? "All tools" : "所有工具";
  return `<section class="section tool-index" aria-labelledby="tool-index-title">
          <h2 id="tool-index-title">${heading}</h2>
${groups.join("\n")}
        </section>`;
}

/** Vite 外掛：把 HTML 裡的導覽標記換成實際的標記 */
export function siteNav() {
  return {
    name: "latype-site-nav",
    transformIndexHtml: {
      order: "pre",
      /** @param {string} html @param {{ path: string }} ctx */
      handler(html, ctx) {
        const opts = { htmlPath: ctx.path };
        return html
          .replace("<!--site-header-->", renderHeader(opts))
          .replace("<!--direction-switch-->", renderDirectionSwitch(opts))
          .replace("<!--tool-index-->", renderToolIndex(opts));
      },
    },
  };
}
