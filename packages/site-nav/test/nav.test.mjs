import { describe, expect, it } from "vitest";
import { parsePagePath, renderDirectionSwitch, renderHeader } from "../index.mjs";

describe("parsePagePath", () => {
  it("分出介面語言與頁面", () => {
    expect(parsePagePath("/index.html")).toEqual({ ui: "zh", page: "/" });
    expect(parsePagePath("/en/index.html")).toEqual({ ui: "en", page: "/" });
    expect(parsePagePath("/en/ja/index.html")).toEqual({ ui: "en", page: "/ja/" });
    expect(parsePagePath("/dubeolsik/")).toEqual({ ui: "zh", page: "/dubeolsik/" });
  });
});

describe("renderHeader", () => {
  it("換語言時留在同一個站，沒有才跳站", () => {
    const html = renderHeader({ site: "type", htmlPath: "/ja/index.html" });
    expect(html).toContain('<a href="/">韓文</a>');
    expect(html).toContain('<a href="/ja/" aria-current="page">日文</a>');
    expect(html).toContain('<a href="https://romanize.latype.com/zh/">中文</a>');
    expect(html).toContain('<a href="https://romanize.latype.com/th/">泰文</a>');
    expect(html).toContain('href="/en/ja/"');
  });

  it("轉換站的語言分頁都留在轉換站", () => {
    const html = renderHeader({ site: "romanize", htmlPath: "/en/th/index.html" });
    expect(html).toContain('<a href="/en/ko/">Korean</a>');
    expect(html).toContain('<a href="/en/th/" aria-current="page">Thai</a>');
    expect(html).toContain('<a class="lang-toggle" href="/th/"');
  });

  it("두벌식頁亮韓文，韓文分頁連回本頁", () => {
    const html = renderHeader({ site: "type", htmlPath: "/dubeolsik/index.html" });
    expect(html).toContain('<a href="/dubeolsik/" aria-current="page">韓文</a>');
  });

  it("沒有對應工具的頁面（首頁、隱私權）不亮任何語言", () => {
    expect(renderHeader({ site: "type", htmlPath: "/privacy/index.html" })).not.toContain("aria-current");
    expect(renderHeader({ site: "romanize", htmlPath: "/index.html" })).not.toContain("aria-current");
  });
});

describe("renderDirectionSwitch", () => {
  it("轉換頁：⇄ 連到打字頁", () => {
    const html = renderDirectionSwitch({ site: "romanize", htmlPath: "/ko/index.html" });
    expect(html).toContain('<span class="dir-side dir-from">韓文</span>');
    expect(html).toContain('href="https://latype.com/"');
    expect(html).toContain('<span class="dir-side">羅馬拼音</span>');
  });

  it("韓文打字頁：左邊可以換輸入法，⇄ 連到轉換頁", () => {
    const html = renderDirectionSwitch({ site: "type", htmlPath: "/dubeolsik/index.html" });
    expect(html).toContain('<a href="/">羅馬拼音</a><a href="/dubeolsik/" aria-current="page">두벌식</a>');
    expect(html).toContain('href="https://romanize.latype.com/ko/"');
  });

  it("英文頁連到英文版", () => {
    const html = renderDirectionSwitch({ site: "type", htmlPath: "/en/ja/index.html" });
    expect(html).toContain('<span class="dir-side dir-from">Romaji</span>');
    expect(html).toContain('href="https://romanize.latype.com/en/ja/"');
  });

  it("只有轉換頁的語言、首頁不顯示", () => {
    expect(renderDirectionSwitch({ site: "romanize", htmlPath: "/zh/index.html" })).toBe("");
    expect(renderDirectionSwitch({ site: "romanize", htmlPath: "/index.html" })).toBe("");
  });
});
