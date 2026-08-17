export interface Locale {
  imeWarning: string;
  copied: string;
}

const zh: Locale = {
  imeWarning: "偵測到系統輸入法，請切換成英文輸入再打字。",
  copied: "已複製",
};

const en: Locale = {
  imeWarning: "A system IME is active — switch to English input to type here.",
  copied: "Copied",
};

export function currentLocale(): Locale {
  return document.documentElement.lang.startsWith("en") ? en : zh;
}
