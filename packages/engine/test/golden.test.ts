import { describe, it, expect } from "vitest";
import { hangulToRoman } from "../src/romanize.js";
import { toHangulText } from "../src/text.js";
import {
  GOLDEN_SET,
  BASIC_VOWELS,
  DOUBLE_CONSONANTS,
  DOUBLE_BATCHIM,
  SENTENCES,
  MIXED_ENGLISH_NUMBERS,
  VERB_CONJUGATIONS,
  KNOWN_HARD_WORDS,
} from "./fixtures/golden-set.js";

// claude.md 6.3：只設下限，避免調規則調出局部退步；不對已知難詞單獨斷言必須失敗，
// 因為之後規則改進讓它們變對是好事，不該讓測試變紅。
const MIN_ACCURACY = 0.75;

function checkAccuracy(label: string, words: string[]) {
  const failures: string[] = [];
  for (const original of words) {
    const roman = hangulToRoman(original);
    const result = toHangulText(roman);
    if (result !== original) {
      failures.push(`${original} -> "${roman}" -> ${result}`);
    }
  }
  const passed = words.length - failures.length;
  const rate = words.length === 0 ? 1 : passed / words.length;
  console.log(`[${label}] ${passed}/${words.length} (${(rate * 100).toFixed(1)}%)`);
  if (failures.length > 0) {
    console.log(`  失敗：${failures.join("；")}`);
  }
  return rate;
}

describe("黃金測試集正確率（claude.md 6.1 / 6.3）", () => {
  it("各分類正確率報告", () => {
    checkAccuracy("基本母音/複合母音", BASIC_VOWELS);
    checkAccuracy("雙子音", DOUBLE_CONSONANTS);
    checkAccuracy("雙收音", DOUBLE_BATCHIM);
    checkAccuracy("句子（空格/標點）", SENTENCES);
    checkAccuracy("英文/數字混輸", MIXED_ENGLISH_NUMBERS);
    checkAccuracy("動詞變化", VERB_CONJUGATIONS);
    checkAccuracy("已知難詞（4.4）", KNOWN_HARD_WORDS);
  });

  it(`整體正確率至少 ${MIN_ACCURACY * 100}%`, () => {
    const rate = checkAccuracy("全部", GOLDEN_SET);
    expect(rate).toBeGreaterThanOrEqual(MIN_ACCURACY);
  });
});
