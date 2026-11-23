// 泰文 → RTGS 羅馬字
//
// 泰文詞與詞之間不留空格，所以先用瀏覽器內建的 Intl.Segmenter（ICU 的泰文詞典）切詞，
// 再把每個詞切成音節轉寫。不需要另外下載詞典。

import { thaiWordToSyllables } from "./syllable.js";

export { thaiWordToSyllables } from "./syllable.js";

export interface ThaiOptions {
  /** 音節之間加連字號（sa-wat-di），預設 true；false 則照 RTGS 慣例連寫（sawatdi） */
  hyphenate?: boolean;
}

const THAI = /[฀-๿]/;
const THAI_DIGITS = /[๐-๙]/g;

const segmenter: Intl.Segmenter | null =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("th", { granularity: "word" }) : null;

function segments(text: string): string[] {
  if (!segmenter) return text.split(/(\s+)/).filter(Boolean);
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

function romanizeWord(word: string, sep: string): string[] {
  // ๆ 重複前一個詞：เร็วๆ = reo reo；ฯ 是縮寫記號，不發音
  const parts = word.replace(/ฯลฯ/g, "").replace(/ฯ/g, "").split("ๆ");
  const words: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] !== "") words.push(thaiWordToSyllables(parts[i]).join(sep));
    if (i < parts.length - 1 && words.length > 0) words.push(words[words.length - 1]);
  }
  return words.filter(Boolean);
}

const OPENING = /[(\[{“‘"']$/;

export function thaiToRoman(text: string, opts: ThaiOptions = {}): string {
  const sep = opts.hyphenate === false ? "" : "-";
  let out = "";
  // 要不要在下一個詞前面補空格：前面是詞（泰文或拉丁字）才補
  let needSpace = false;
  let lastWord = "";
  for (const seg of segments(text.replace(THAI_DIGITS, (d) => String(d.charCodeAt(0) - 0x0e50)))) {
    if (/^\s+$/.test(seg)) {
      out += seg.includes("\n") ? seg.replace(/[^\n]/g, "") : " ";
      needSpace = false;
      continue;
    }
    if (THAI.test(seg)) {
      const words = seg === "ๆ" ? (lastWord ? [lastWord] : []) : romanizeWord(seg, sep);
      for (const w of words) {
        if (needSpace && !OPENING.test(out)) out += " ";
        out += w;
        needSpace = true;
        lastWord = w;
      }
      if (words.length === 0 && seg.includes("ฯลฯ")) out += (needSpace ? " " : "") + "etc.";
      continue;
    }
    const isWord = /[\p{L}\p{N}]/u.test(seg);
    if (isWord && needSpace && !OPENING.test(out)) out += " ";
    out += seg;
    needSpace = isWord || /[.,!?;:)\]}”’]$/.test(seg);
  }
  return out.replace(/ +$/gm, "");
}

