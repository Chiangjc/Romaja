export interface Locale {
  imeWarning: string;
  copy: string;
  copied: string;
  loadingDict: string;
  loadFailed: string;
}

const zh: Locale = {
  imeWarning: "偵測到系統輸入法，請切換成英文輸入再打字。",
  copy: "複製",
  copied: "已複製",
  loadingDict: "正在載入日文詞典（約 17 MB，第一次比較久）…",
  loadFailed: "日文詞典載入失敗，請重新整理頁面再試一次。",
};

const en: Locale = {
  imeWarning: "A system IME is active — switch to English input to type here.",
  copy: "Copy",
  copied: "Copied",
  loadingDict: "Loading the Japanese dictionary (about 17 MB, slower the first time)…",
  loadFailed: "The Japanese dictionary failed to load. Please reload the page and try again.",
};

export function currentLocale(): Locale {
  return document.documentElement.lang.startsWith("en") ? en : zh;
}
