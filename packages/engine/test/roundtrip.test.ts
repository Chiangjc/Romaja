import { describe, it, expect } from "vitest";
import { best } from "../src/rank.js";
import { hangulToRoman } from "../src/romanize.js";
import { SYLLABLE_BASE, SYLLABLE_END } from "../src/compose.js";

describe("全域對拍：11,172 個音節 round-trip", () => {
  it("toHangul(toRoman(x)) === x for every syllable", () => {
    const failures: string[] = [];
    for (let cp = SYLLABLE_BASE; cp <= SYLLABLE_END; cp++) {
      const ch = String.fromCodePoint(cp);
      const roman = hangulToRoman(ch);
      const result = best(roman);
      if (result !== ch) {
        failures.push(`${ch} (U+${cp.toString(16)}) -> "${roman}" -> ${result}`);
      }
    }
    if (failures.length > 0) {
      console.error(`${failures.length} 個音節對拍失敗，前 20 個：\n${failures.slice(0, 20).join("\n")}`);
    }
    expect(failures.length).toBe(0);
  });
});
