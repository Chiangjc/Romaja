import { CHOONPU, HATSUON, MORA_TABLE, SOKUON, type KanaPair } from "./table.js";

export interface ResolvedUnit extends KanaPair {
  raw: string;
  literal?: boolean;
}

const MAX_KEY_LEN = 3;

const PROPER_PREFIXES = new Set<string>();
for (const key of Object.keys(MORA_TABLE)) {
  for (let len = 1; len < key.length; len++) {
    PROPER_PREFIXES.add(key.slice(0, len));
  }
}

const VOWELS = new Set(["a", "i", "u", "e", "o"]);

function isConsonantLetter(ch: string): boolean {
  return /^[a-z]$/.test(ch) && !VOWELS.has(ch) && ch !== "n";
}

/**
 * 把一段還沒確定的羅馬字（只含小寫字母與撇號）盡量轉成假名。
 * 回傳已確定的音節，以及剩下還在等後續字母的殘餘（例如打完 "k" 還在等母音）。
 * 一次呼叫只會處理已經在手上的字元，不會對還沒打的字元做任何假設，
 * 所以可以每打一個字母就呼叫一次，行為跟真的日文輸入法一樣。
 */
export function tryConvert(buffer: string): { resolved: ResolvedUnit[]; pending: string } {
  const resolved: ResolvedUnit[] = [];
  let i = 0;

  while (i < buffer.length) {
    let matched = false;
    for (let len = MAX_KEY_LEN; len >= 1; len--) {
      if (i + len > buffer.length) continue;
      const token = buffer.slice(i, i + len);
      const pair = MORA_TABLE[token];
      if (pair) {
        resolved.push({ raw: token, ...pair });
        i += len;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const tail = buffer.slice(i);
    if (PROPER_PREFIXES.has(tail)) {
      return { resolved, pending: tail };
    }

    const c0 = buffer[i];
    if (c0 === "n") {
      if (buffer[i + 1] === "'") {
        resolved.push({ raw: "n'", ...HATSUON });
        i += 2;
      } else {
        resolved.push({ raw: "n", ...HATSUON });
        i += 1;
      }
      continue;
    }

    if (isConsonantLetter(c0) && buffer[i + 1] === c0) {
      resolved.push({ raw: c0, ...SOKUON });
      i += 1;
      continue;
    }

    resolved.push({ raw: c0, hira: c0, kata: c0, literal: true });
    i += 1;
  }

  return { resolved, pending: "" };
}

/**
 * 遇到分隔符號（空白、Enter、標點）時，把還卡著的殘餘做最後判斷。
 * 目前只有單獨的 "n" 能確定是「ん」；其他無法完成的殘餘交給呼叫端當作
 * 未轉換的文字原樣顯示，不會憑空消失。
 */
export function finalizePending(pending: string): ResolvedUnit | null {
  if (pending === "n") {
    return { raw: "n", ...HATSUON };
  }
  return null;
}

export function dashUnit(): ResolvedUnit {
  return { raw: "-", ...CHOONPU };
}
