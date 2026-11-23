import { describe, expect, it } from "vitest";
import { parsePagePath, renderDirectionSwitch, renderHeader, renderToolIndex } from "../index.mjs";

describe("parsePagePath", () => {
  it("分出介面語言與頁面", () => {
    expect(parsePagePath("/index.html")).toEqual({ ui: "zh", page: "/" });
    expect(parsePagePath("/en/index.html")).toEqual({ ui: "en", page: "/" });
    expect(parsePagePath("/en/ja/index.html")).toEqual({ ui: "en", page: "/ja/" });
    expect(parsePagePath("/romanize/th/")).toEqual({ ui: "zh", page: "/romanize/th/" });
  });
});

describe("renderHeader", () => {
  it("打字頁換語言時優先留在打字工具，沒有才換到轉換頁", () => {
    const html = renderHeader({ htmlPath: "/ja/index.html" });
    expect(html).toContain('<a href="/">韓文</a>');
    expect(html).toContain('<a href="/ja/" aria-current="page">日文</a>');
    expect(html).toContain('<a href="/romanize/zh/">中文</a>');
    expect(html).toContain('<a href="/romanize/th/">泰文</a>');
    expect(html).toContain('href="/en/ja/"');
  });

  it("轉換頁的語言分頁都留在轉換頁", () => {
    const html = renderHeader({ htmlPath: "/en/romanize/th/index.html" });
    expect(html).toContain('<a href="/en/romanize/">Korean</a>');
    expect(html).toContain('<a href="/en/romanize/ja/">Japanese</a>');
    expect(html).toContain('<a href="/en/romanize/th/" aria-current="page">Thai</a>');
    expect(html).toContain('<a class="lang-toggle" href="/romanize/th/"');
  });

  it("두벌식頁亮韓文，韓文分頁連回本頁", () => {
    const html = renderHeader({ htmlPath: "/dubeolsik/index.html" });
    expect(html).toContain('<a href="/dubeolsik/" aria-current="page">韓文</a>');
  });

  it("隱私權頁不亮任何語言", () => {
    expect(renderHeader({ htmlPath: "/privacy/index.html" })).not.toContain("aria-current");
  });
});

describe("renderDirectionSwitch", () => {
  it("轉換頁：⇄ 連到打字頁", () => {
    const html = renderDirectionSwitch({ htmlPath: "/romanize/index.html" });
    expect(html).toContain('<span class="dir-side dir-from">韓文</span>');
    expect(html).toContain('class="dir-swap" href="/"');
    expect(html).toContain('<span class="dir-side">羅馬拼音</span>');
  });

  it("韓文打字頁：左邊可以換輸入法，⇄ 連到轉換頁", () => {
    const html = renderDirectionSwitch({ htmlPath: "/dubeolsik/index.html" });
    expect(html).toContain('<a href="/">羅馬拼音</a><a href="/dubeolsik/" aria-current="page">두벌식</a>');
    expect(html).toContain('class="dir-swap" href="/romanize/"');
  });

  it("英文頁連到英文版", () => {
    const html = renderDirectionSwitch({ htmlPath: "/en/ja/index.html" });
    expect(html).toContain('<span class="dir-side dir-from">Romaji</span>');
    expect(html).toContain('class="dir-swap" href="/en/romanize/ja/"');
  });

  it("只有轉換頁的語言、隱私權頁不顯示", () => {
    expect(renderDirectionSwitch({ htmlPath: "/romanize/zh/index.html" })).toBe("");
    expect(renderDirectionSwitch({ htmlPath: "/privacy/index.html" })).toBe("");
  });
});

describe("renderToolIndex", () => {
  it("列出全部七個工具，目前這頁標成 aria-current", () => {
    const html = renderToolIndex({ htmlPath: "/en/romanize/zh/index.html" });
    expect(html.match(/class="lang-card"/g)).toHaveLength(7);
    expect(html).toContain("All tools");
    expect(html).toContain('href="/en/dubeolsik/"');
    expect(html).toContain('href="/en/romanize/zh/" aria-current="page"');
  });
});
