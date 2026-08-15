export interface TableEntry {
  jamo: string;
  latin: string;
  altLatin?: string[];
}

// 初聲 19（index 0–18）
export const CHO: TableEntry[] = [
  { jamo: "ㄱ", latin: "g" },
  { jamo: "ㄲ", latin: "kk" },
  { jamo: "ㄴ", latin: "n" },
  { jamo: "ㄷ", latin: "d" },
  { jamo: "ㄸ", latin: "tt" },
  { jamo: "ㄹ", latin: "l", altLatin: ["r"] },
  { jamo: "ㅁ", latin: "m" },
  { jamo: "ㅂ", latin: "b" },
  { jamo: "ㅃ", latin: "pp" },
  { jamo: "ㅅ", latin: "s" },
  { jamo: "ㅆ", latin: "ss" },
  { jamo: "ㅇ", latin: "" },
  { jamo: "ㅈ", latin: "j" },
  { jamo: "ㅉ", latin: "jj" },
  { jamo: "ㅊ", latin: "ch" },
  { jamo: "ㅋ", latin: "k" },
  { jamo: "ㅌ", latin: "t" },
  { jamo: "ㅍ", latin: "p" },
  { jamo: "ㅎ", latin: "h" },
];

// 中聲 21（index 0–20）
export const JUNG: TableEntry[] = [
  { jamo: "ㅏ", latin: "a" },
  { jamo: "ㅐ", latin: "ae" },
  { jamo: "ㅑ", latin: "ya" },
  { jamo: "ㅒ", latin: "yae" },
  { jamo: "ㅓ", latin: "eo" },
  { jamo: "ㅔ", latin: "e" },
  { jamo: "ㅕ", latin: "yeo" },
  { jamo: "ㅖ", latin: "ye" },
  { jamo: "ㅗ", latin: "o" },
  { jamo: "ㅘ", latin: "wa" },
  { jamo: "ㅙ", latin: "wae" },
  { jamo: "ㅚ", latin: "oe" },
  { jamo: "ㅛ", latin: "yo" },
  { jamo: "ㅜ", latin: "u" },
  { jamo: "ㅝ", latin: "wo" },
  { jamo: "ㅞ", latin: "we" },
  { jamo: "ㅟ", latin: "wi" },
  { jamo: "ㅠ", latin: "yu" },
  { jamo: "ㅡ", latin: "eu" },
  { jamo: "ㅢ", latin: "ui" },
  { jamo: "ㅣ", latin: "i" },
];

// 終聲 28（index 0–27，index 0 = 無終聲）
export const JONG: TableEntry[] = [
  { jamo: "", latin: "" },
  { jamo: "ㄱ", latin: "g" },
  { jamo: "ㄲ", latin: "kk" },
  { jamo: "ㄳ", latin: "gs" },
  { jamo: "ㄴ", latin: "n" },
  { jamo: "ㄵ", latin: "nj" },
  { jamo: "ㄶ", latin: "nh" },
  { jamo: "ㄷ", latin: "d" },
  { jamo: "ㄹ", latin: "l", altLatin: ["r"] },
  { jamo: "ㄺ", latin: "lg" },
  { jamo: "ㄻ", latin: "lm" },
  { jamo: "ㄼ", latin: "lb" },
  { jamo: "ㄽ", latin: "ls" },
  { jamo: "ㄾ", latin: "lt" },
  { jamo: "ㄿ", latin: "lp" },
  { jamo: "ㅀ", latin: "lh" },
  { jamo: "ㅁ", latin: "m" },
  { jamo: "ㅂ", latin: "b" },
  { jamo: "ㅄ", latin: "bs" },
  { jamo: "ㅅ", latin: "s" },
  { jamo: "ㅆ", latin: "ss" },
  { jamo: "ㅇ", latin: "ng" },
  { jamo: "ㅈ", latin: "j" },
  { jamo: "ㅊ", latin: "ch" },
  { jamo: "ㅋ", latin: "k" },
  { jamo: "ㅌ", latin: "t" },
  { jamo: "ㅍ", latin: "p" },
  { jamo: "ㅎ", latin: "h" },
];
