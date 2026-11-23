export interface Locale {
  copy: string;
  copied: string;
  loadingDict: string;
  loadFailed: string;
}

const zh: Locale = {
  copy: "複製",
  copied: "已複製",
  loadingDict: "正在載入日文詞典（約 17 MB，第一次比較久）…",
  loadFailed: "日文詞典載入失敗，請重新整理頁面再試一次。",
};

const en: Locale = {
  copy: "Copy",
  copied: "Copied",
  loadingDict: "Loading the Japanese dictionary (about 17 MB, slower the first time)…",
  loadFailed: "The Japanese dictionary failed to load. Please reload the page and try again.",
};

export function currentLocale(): Locale {
  return document.documentElement.lang.startsWith("en") ? en : zh;
}
