import { describe, it, expect } from "vitest";
import {
  feedLetter,
  feedBackspace,
  feedDash,
  finalizeState,
  initialJaState,
  toPlainText,
  type JaState,
} from "../src/state.js";

/** 模擬真實打字：一次餵一個字元，跟使用者實際按鍵順序一致，最後模擬按空白鍵收字。 */
function typeAll(spelling: string): JaState {
  let state = initialJaState();
  for (const ch of spelling) {
    state = feedLetter(state, ch);
  }
  return finalizeState(state);
}

describe("逐字餵入的羅馬字轉假名", () => {
  const cases: Array<[string, string, string]> = [
    ["konnichiwa", "こんにちわ", "コンニチワ"],
    ["arigatou", "ありがとう", "アリガトウ"],
    ["gakkou", "がっこう", "ガッコウ"],
    ["kekkon", "けっこん", "ケッコン"],
    ["chotto", "ちょっと", "チョット"],
    ["kyou", "きょう", "キョウ"],
    ["shinbun", "しんぶん", "シンブン"],
    ["kaisha", "かいしゃ", "カイシャ"],
    ["ohayou", "おはよう", "オハヨウ"],
    ["senpai", "せんぱい", "センパイ"],
  ];

  it.each(cases)("%s -> %s / %s", (spelling, hira, kata) => {
    const state = typeAll(spelling);
    expect(toPlainText(state, "hiragana")).toBe(hira);
    expect(toPlainText(state, "katakana")).toBe(kata);
  });

  it("末尾單獨的 n 打完先卡在 pending，不會馬上變成 ん", () => {
    let state = initialJaState();
    state = feedLetter(state, "k");
    state = feedLetter(state, "a");
    state = feedLetter(state, "n");
    expect(state.pending).toBe("n");
    expect(toPlainText(state, "hiragana")).toBe("かn"); // 即時顯示含未定案殘餘，供編輯區畫底線用

    const afterA = feedLetter(state, "a");
    expect(afterA.pending).toBe("");
    expect(toPlainText(afterA, "hiragana")).toBe("かな"); // 補上母音變成 な，不是 かん + あ
  });

  it("nn 明確表示 ん", () => {
    expect(toPlainText(typeAll("anna"), "hiragana")).toBe("あんな");
  });

  it("n' 明確收尾成 ん", () => {
    expect(toPlainText(typeAll("kon'yaku"), "hiragana")).toBe("こんやく");
  });

  it("shi/si、chi/ti、tsu/tu、fu/hu 是同一個音的不同拼法", () => {
    expect(toPlainText(typeAll("shi"), "hiragana")).toBe(toPlainText(typeAll("si"), "hiragana"));
    expect(toPlainText(typeAll("chi"), "hiragana")).toBe(toPlainText(typeAll("ti"), "hiragana"));
    expect(toPlainText(typeAll("tsu"), "hiragana")).toBe(toPlainText(typeAll("tu"), "hiragana"));
    expect(toPlainText(typeAll("fuji"), "hiragana")).toBe(toPlainText(typeAll("huzi"), "hiragana"));
  });

  it("- 直接輸出長音記號", () => {
    const state = feedDash(typeAll("ka"));
    expect(toPlainText(state, "katakana")).toBe("カー");
  });

  it("句尾單獨的 n 收字時定案為 ん", () => {
    expect(toPlainText(typeAll("hon"), "hiragana")).toBe("ほん");
  });

  it("backspace 先刪還沒定案的殘餘，再整個音刪掉", () => {
    let state = initialJaState();
    state = feedLetter(state, "k");
    state = feedLetter(state, "a"); // 確定 か
    state = feedLetter(state, "k"); // pending "k"，等母音
    expect(state.pending).toBe("k");
    state = feedBackspace(state); // 先清掉 pending 的 k
    expect(state.pending).toBe("");
    expect(toPlainText(state, "hiragana")).toBe("か");
    state = feedBackspace(state); // 再刪掉整個 か
    expect(toPlainText(state, "hiragana")).toBe("");
  });
});
