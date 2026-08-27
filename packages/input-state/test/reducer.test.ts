import { describe, it, expect } from "vitest";
import { initialState, reduce } from "../src/reducer.js";
import { toPlainText } from "../src/serialize.js";
import type { InputState } from "../src/types.js";

function typeChars(state: InputState, text: string): InputState {
  return [...text].reduce((s, ch) => reduce(s, { type: "char", char: ch }), state);
}

describe("基本組字與確定", () => {
  it("打字時候選會更新，空白確定成 word 段 + 空白段", () => {
    let state = typeChars(initialState(), "gaeul");
    expect(state.composing).not.toBeNull();
    expect(state.composing!.candidates.length).toBeGreaterThan(0);

    state = reduce(state, { type: "space" });
    expect(state.composing).toBeNull();
    expect(state.segments).toEqual([
      { kind: "word", spelling: "gaeul", hangul: "개울" }, // claude.md 4.4 已知難詞：預設貪婪解是 개울
      { kind: "literal", text: " " },
    ]);
    expect(toPlainText(state)).toBe("개울 ");
  });

  it("Enter 確定但不加空白", () => {
    let state = typeChars(initialState(), "annyeong");
    state = reduce(state, { type: "enter" });
    expect(state.segments).toEqual([{ kind: "word", spelling: "annyeong", hangul: "안녕" }]);
  });
});

describe("候選切換（↓/↑/數字鍵）", () => {
  it("↓ 在候選間循環移動，數字鍵直接跳到指定候選但不送出", () => {
    let state = typeChars(initialState(), "gaeul");
    const candidates = state.composing!.candidates;
    expect(candidates.length).toBeGreaterThanOrEqual(2);

    state = reduce(state, { type: "arrow", dir: "down" });
    expect(state.composing!.selectedIndex).toBe(1);

    // 循環：一路按到底要繞回 0
    for (let i = 0; i < candidates.length - 1; i++) {
      state = reduce(state, { type: "arrow", dir: "down" });
    }
    expect(state.composing!.selectedIndex).toBe(0);

    state = reduce(state, { type: "digit", n: 2 });
    expect(state.composing!.selectedIndex).toBe(1);
    expect(state.composing).not.toBeNull(); // 數字鍵只是選取，不會自動送出

    state = reduce(state, { type: "space" });
    expect(state.segments[0]).toEqual({ kind: "word", spelling: "gaeul", hangul: candidates[1].hangul });
  });

  it("數字鍵超出候選數時 no-op", () => {
    let state = typeChars(initialState(), "gaeul");
    const before = state.composing!.selectedIndex;
    state = reduce(state, { type: "digit", n: 3 });
    // 只有 2 個候選時，按 3 應該沒反應
    if (state.composing!.candidates.length < 3) {
      expect(state.composing!.selectedIndex).toBe(before);
    }
  });
});

describe("Backspace", () => {
  it("組字中刪一個羅馬字母並重算", () => {
    let state = typeChars(initialState(), "gaeu");
    state = reduce(state, { type: "backspace" });
    expect(state.composing!.spelling).toBe("gae");
  });

  it("組字中刪到空就取消組字", () => {
    let state = typeChars(initialState(), "g");
    state = reduce(state, { type: "backspace" });
    expect(state.composing).toBeNull();
  });

  it("非組字中刪一個韓文音節；多音節詞刪空前先降級成 literal", () => {
    let state = typeChars(initialState(), "annyeong");
    state = reduce(state, { type: "enter" }); // -> 안녕
    state = reduce(state, { type: "backspace" });
    expect(state.segments).toEqual([{ kind: "literal", text: "안" }]);
    state = reduce(state, { type: "backspace" });
    expect(state.segments).toEqual([]);
  });

  it("非組字中刪空白/標點段", () => {
    let state = typeChars(initialState(), "a");
    state = reduce(state, { type: "space" });
    state = reduce(state, { type: "backspace" });
    expect(state.segments).toHaveLength(1); // 空白段被刪掉，只剩 word 段
    expect(state.segments[0].kind).toBe("word");
  });
});

describe("Esc：保留羅馬字原文不轉換", () => {
  it("Esc 之後候選收起，繼續打字不轉換，確定時直接輸出原文", () => {
    let state = typeChars(initialState(), "abc");
    state = reduce(state, { type: "escape" });
    expect(state.composing!.converting).toBe(false);
    expect(state.composing!.candidates).toEqual([]);

    state = typeChars(state, "def");
    expect(state.composing!.spelling).toBe("abcdef");
    expect(state.composing!.candidates).toEqual([]);

    state = reduce(state, { type: "space" });
    expect(state.segments[0]).toEqual({ kind: "literal", text: "abcdef" });
  });
});

describe("連字號：標記強制的音節邊界", () => {
  it("ga-eul 強制切成 가+을，跟預設貪婪解的 개울 不同", () => {
    let withoutHyphen = typeChars(initialState(), "gaeul");
    expect(withoutHyphen.composing!.candidates[0].hangul).toBe("개울");

    let withHyphen = typeChars(initialState(), "ga-eul");
    expect(withHyphen.composing!.candidates).toEqual([{ hangul: "가을", spelling: "ga-eul" }]);
  });

  it("大寫字母視同連字號", () => {
    const state = typeChars(initialState(), "gaEul");
    expect(state.composing!.spelling).toBe("ga-eul");
    expect(state.composing!.candidates).toEqual([{ hangul: "가을", spelling: "ga-eul" }]);
  });

  it("只在一個邊界插連字號，兩側仍可以是多音節：chijeubol-i 切成 치즈볼+이", () => {
    // 迴歸測試：舊實作要求每一段「剛好一個音節」，chijeubol 這一段有 3 個音節就會直接判定失敗，
    // 回傳空候選——但使用者只是想釘住 bol/i 這個邊界，兩側各自照多音節排序取最佳解才是預期行為。
    const state = typeChars(initialState(), "chijeubol-i");
    expect(state.composing!.candidates).toEqual([{ hangul: "치즈볼이", spelling: "chijeubol-i" }]);
  });

  it("某段完全無法組成合法音節時沒有候選", () => {
    const state = typeChars(initialState(), "g-eul");
    expect(state.composing!.candidates).toEqual([]);
  });
});

describe("標點符號：視同確定，直接輸出", () => {
  it("組字中打標點，先確定候選再插入標點", () => {
    let state = typeChars(initialState(), "annyeong");
    state = reduce(state, { type: "punct", char: "." });
    expect(state.segments).toEqual([
      { kind: "word", spelling: "annyeong", hangul: "안녕" },
      { kind: "literal", text: "." },
    ]);
    expect(state.composing).toBeNull();
  });
});

describe("點擊修正", () => {
  it("點擊已確定的詞會重開候選，且能重選、能對回原本選的候選", () => {
    let state = typeChars(initialState(), "gaeul");
    state = reduce(state, { type: "digit", n: 2 }); // 選第二個候選（가을）
    const secondChoice = state.composing!.candidates[1].hangul;
    state = reduce(state, { type: "space" });
    expect(state.segments[0].kind).toBe("word");

    state = reduce(state, { type: "clickWord", index: 0 });
    expect(state.segments).toHaveLength(1); // word 段被暫時移除，只剩空白段
    expect(state.composing!.spelling).toBe("gaeul");
    expect(state.composing!.candidates[state.composing!.selectedIndex].hangul).toBe(secondChoice);
  });

  it("點擊句子中間的 gap 會移動游標，之後打字插入在該位置", () => {
    let state = typeChars(initialState(), "an");
    state = reduce(state, { type: "space" }); // segments: [안, " "], cursor=2
    state = typeChars(state, "nyeong");
    state = reduce(state, { type: "enter" }); // segments: [안, " ", 녕], cursor=3

    state = reduce(state, { type: "clickGap", index: 2 }); // 游標移到「空白」跟「녕」中間
    state = typeChars(state, "i");
    state = reduce(state, { type: "enter" });

    expect(state.segments).toEqual([
      { kind: "word", spelling: "an", hangul: "안" },
      { kind: "literal", text: " " },
      { kind: "word", spelling: "i", hangul: "이" },
      { kind: "word", spelling: "nyeong", hangul: "녕" },
    ]);
  });

  it("點擊發生時若別處還在組字，會先自動確定再正確算出點擊目標（index 位移）", () => {
    let state = typeChars(initialState(), "an");
    state = reduce(state, { type: "space" }); // segments: [안, " "], cursor=2
    state = typeChars(state, "i");
    state = reduce(state, { type: "enter" }); // segments: [안, " ", 이], cursor=3

    // 重新點開第一個字，並在還沒送出時，點擊第三個字（index 2，這是點擊發生「前」的索引）
    state = reduce(state, { type: "clickWord", index: 0 });
    expect(state.composing).not.toBeNull(); // 안 被重開，segments 變成 [" ", 이]，cursor=0

    state = reduce(state, { type: "clickWord", index: 1 }); // 點擊前的 index=1 對應「이」（在自動確定 안 之前的陣列裡）
    expect(state.composing!.spelling).toBe("i");
  });
});

describe("candidates.length===0 時的確定行為", () => {
  it("無法解析的拼字，確定時直接當作 literal 輸出", () => {
    let state = typeChars(initialState(), "xyz"); // x/y/z 不在任何對照表裡
    expect(state.composing!.candidates).toEqual([]);
    state = reduce(state, { type: "space" });
    expect(state.segments[0]).toEqual({ kind: "literal", text: "xyz" });
  });
});
