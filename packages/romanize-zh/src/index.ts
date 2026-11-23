// 中文轉漢語拼音，讀音照台灣標準（教育部《國語辭典》）。
//
// 多音字（銀行／行走、長大／長度）要看整個詞才判斷得出來，所以讀音交給 pinyin-pro 的詞表。
// pinyin-pro 的詞表是簡體，繁體字直接丟進去會讀錯（們 → mén、還是 → huán shì、什麼 → shén mó），
// 所以先用 OpenCC 的繁→簡字形轉換（tw → cn，只換字形不換用詞）再查讀音。
// pinyin-pro 照大陸標準，查完再用 taiwan.ts 改成台灣念法：兩岸讀音不同的字詞，以及輕聲。
// 輸出只有拼音，原文還是使用者貼的那一份，簡體字不會出現在畫面上。

import * as OpenCC from "opencc-js/t2cn";
import { convert, pinyin } from "pinyin-pro";
import { CHAR_READINGS, NEUTRAL_KEEP, NEUTRAL_REDUPLICATION, WORD_READINGS } from "./taiwan.js";

export type ToneStyle = "mark" | "number" | "none";

export interface PinyinOptions {
  /** mark：nǐ hǎo；number：ni3 hao3（輕聲標 5）；none：ni hao */
  tone?: ToneStyle;
}

const toSimplified = OpenCC.Converter({ from: "tw", to: "cn" });
// pinyin-pro 的 customPinyin 是全域設定，加了之後會改變它切詞的方式（睡著了 變成 zhe），
// 所以整詞讀音不交給它，查完之後自己比對換掉
const OVERRIDE_WORDS = Object.keys(WORD_READINGS).sort((a, b) => b.length - a.length);

/** 回傳每個 token 位置要強制套用的讀音（只有落在 WORD_READINGS 裡的詞才有）。 */
function wordOverrides(tokens: { origin: string; isZh: boolean }[]): (string | undefined)[] {
  const result: (string | undefined)[] = new Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    for (const word of OVERRIDE_WORDS) {
      const chars = [...word];
      if (!chars.every((ch, k) => tokens[i + k]?.isZh && tokens[i + k].origin === ch)) continue;
      WORD_READINGS[word].split(" ").forEach((syl, k) => (result[i + k] = syl));
      i += chars.length - 1;
      break;
    }
  }
  return result;
}

// 全形標點換成半形，拼音行才不會夾著中文標點。開、閉分開處理，決定前後要不要空格。
const OPENING: Record<string, string> = { "「": '"', "『": '"', "“": '"', "‘": "'", "（": "(", "《": '"', "〈": '"', "【": "[" };
const CLOSING: Record<string, string> = {
  "」": '"', "』": '"', "”": '"', "’": "'", "）": ")", "》": '"', "〉": '"', "】": "]",
  "，": ",", "。": ".", "、": ",", "！": "!", "？": "?", "：": ":", "；": ";", "…": "...", "～": "~", "—": "-",
  ",": ",", ".": ".", "!": "!", "?": "?", ":": ":", ";": ";", ")": ")", "]": "]",
};
const ASCII_OPENING = new Set(["(", "["]);

type Kind = "start" | "syllable" | "latin" | "open" | "close" | "space";

/** 數字聲調的音節拆成拼法和聲調，例如 hou4 → ["hou", 4]，輕聲是 0。 */
function split(syllable: string): [string, number] {
  const m = /^(.*?)([0-4])$/.exec(syllable);
  return m ? [m[1], Number(m[2])] : [syllable, 0];
}

/** 大陸念輕聲、台灣不念輕聲的字，找回同一個拼法的本調（候 hou0 → hou4）。 */
function citationTone(char: string, base: string): string | null {
  const readings = pinyin(char, { multiple: true, type: "array", toneType: "num" });
  return readings.find((r) => {
    const [b, t] = split(r);
    return b === base && t > 0;
  }) ?? null;
}

/** 把一個漢字的大陸讀音（數字聲調）改成台灣讀音。 */
function toTaiwan(char: string, syllable: string, prevChar: string | null): string {
  let [base, tone] = split(syllable);
  let result = syllable;
  if (tone === 0 && !NEUTRAL_KEEP.has(char) && !(char === prevChar && NEUTRAL_REDUPLICATION.has(char))) {
    result = citationTone(char, base) ?? syllable;
    [base, tone] = split(result);
  }
  const override = CHAR_READINGS[char];
  if (override && override.from.includes(base)) result = override.to;
  return result;
}

function format(syllable: string, tone: ToneStyle): string {
  const [base, t] = split(syllable);
  if (tone === "none") return base;
  if (tone === "number") return `${base}${t === 0 ? 5 : t}`;
  return t === 0 ? base : convert(syllable, { format: "numToSymbol" });
}

export function hanziToPinyin(line: string, options: PinyinOptions = {}): string {
  const tone = options.tone ?? "mark";
  const tokens = pinyin(toSimplified(line), { type: "all", toneType: "num", nonZh: "consecutive" });
  const overrides = wordOverrides(tokens);

  let out = "";
  let prev: Kind = "start";
  let prevChar: string | null = null;
  const needsSpaceBeforeWord = () => prev === "syllable" || prev === "latin" || prev === "close";

  tokens.forEach((token, i) => {
    if (token.isZh && token.pinyin) {
      if (needsSpaceBeforeWord()) out += " ";
      out += format(overrides[i] ?? toTaiwan(token.origin, token.pinyin, prevChar), tone);
      prev = "syllable";
      prevChar = token.origin;
      return;
    }
    prevChar = null;
    for (const ch of token.origin) {
      if (/\s/.test(ch)) {
        if (prev !== "start" && prev !== "space" && prev !== "open") {
          out += " ";
          prev = "space";
        }
      } else if (ch in OPENING || ASCII_OPENING.has(ch)) {
        if (needsSpaceBeforeWord()) out += " ";
        out += OPENING[ch] ?? ch;
        prev = "open";
      } else if (ch in CLOSING) {
        if (prev === "space") out = out.trimEnd();
        out += CLOSING[ch];
        prev = "close";
      } else {
        // 英文、數字、其他沒有讀音的字照原樣留著
        if (prev === "syllable" || prev === "close") out += " ";
        out += ch;
        prev = "latin";
      }
    }
  });
  return out.trimEnd();
}
