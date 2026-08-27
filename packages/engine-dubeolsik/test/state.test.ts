import { describe, expect, it } from "vitest";
import {
  feedBackspace,
  feedKey,
  feedLiteral,
  finalizeState,
  initialDubeolsikState,
  toPlainText,
  type DubeolsikState,
} from "../src/state.js";

/** 依序打一串物理鍵位（小寫字母 = 不按 Shift，大寫字母 = 按 Shift）。 */
function type(keys: string): DubeolsikState {
  let state = initialDubeolsikState();
  for (const ch of keys) {
    const shift = ch >= "A" && ch <= "Z";
    state = feedKey(state, ch.toLowerCase(), shift);
  }
  return state;
}

describe("基本音節組字", () => {
  it("가나：ㄱㅏㄴㅏ", () => {
    expect(toPlainText(finalizeState(type("rksk")))).toBe("가나");
  });

  it("안녕：ㅇㅏㄴㄴㅕㅇ", () => {
    expect(toPlainText(finalizeState(type("dkssud")))).toBe("안녕");
  });

  it("사랑해：ㅅㅏㄹㅏㅇㅎㅐ", () => {
    expect(toPlainText(finalizeState(type("tkfkdgo")))).toBe("사랑해");
  });

  it("사랑：終聲 ㄹ 被下一個音節的母音搶走，不是 삵", () => {
    expect(toPlainText(finalizeState(type("tkfkd")))).toBe("사랑");
  });

  it("안녕하세요：多音節長句，終聲搶字跟一般組字混在一起", () => {
    expect(toPlainText(finalizeState(type("dkssudgktpy")))).toBe("안녕하세요");
  });

  it("감사합니다：連續好幾個「暫定終聲又被搶走」", () => {
    expect(toPlainText(finalizeState(type("rkatkgkqslek")))).toBe("감사합니다");
  });
});

describe("複合母音合併", () => {
  it("과자：ㅗ+ㅏ 合併成 ㅘ", () => {
    expect(toPlainText(finalizeState(type("rhkwk")))).toBe("과자");
  });

  it("의사：ㅡ+ㅣ 合併成 ㅢ", () => {
    expect(toPlainText(finalizeState(type("dmltk")))).toBe("의사");
  });
});

describe("複合終聲合併", () => {
  it("값：ㅂ+ㅅ 合併成 ㅄ", () => {
    expect(toPlainText(finalizeState(type("rkqt")))).toBe("값");
  });

  it("닭：ㄹ+ㄱ 合併成 ㄺ", () => {
    expect(toPlainText(finalizeState(type("ekfr")))).toBe("닭");
  });
});

describe("終聲拆給下一個字當初聲", () => {
  it("單一終聲：간+ㅏ 應該拆成 가나，不是 간아", () => {
    // r,k,s 先組出「간」（暫定終聲 ㄴ），再按 k（ㅏ）應該把 ㄴ 整個搶去當下一個字的初聲
    expect(toPlainText(finalizeState(type("rksk")))).toBe("가나");
  });

  it("複合終聲：닭 沒有先按 ㅇ 就接母音，只有後半部件會被搶走（달기，不是닭이）", () => {
    expect(toPlainText(finalizeState(type("ekfrl")))).toBe("달기");
  });

  it("複合終聲：닭 後面先按明確的 ㅇ 鍵再接母音，才會是 닭이", () => {
    expect(toPlainText(finalizeState(type("ekfrdl")))).toBe("닭이");
  });
});

describe("退化成獨立字母", () => {
  it("兩個子音中間沒有母音：前一個子音退化成獨立字母", () => {
    const state = finalizeState(type("rs")); // ㄱ 後面直接接 ㄴ，沒有母音
    expect(toPlainText(state)).toBe("ㄱㄴ");
  });

  it("雙子音（ㅃㄸㅉ）不能當終聲，接在完整音節後面時直接開新字", () => {
    // 바 (q,k) 已經是完整音節（無終聲），再打 Shift+q（ㅃ）不能合併也不能當終聲，開新字
    const state = finalizeState(type("qkQ"));
    expect(toPlainText(state)).toBe("바ㅃ");
  });
});

describe("標點、空白、backspace", () => {
  it("空白鍵定案目前的字，不影響已定案的內容", () => {
    let state = type("rk"); // 가（composing）
    state = feedLiteral(state, " ");
    state = type2(state, "sk"); // 나（composing）
    expect(toPlainText(finalizeState(state))).toBe("가 나");
  });

  it("backspace 依 jong → jung → cho → 已定案字元的順序刪", () => {
    let state = type("rkq"); // 갑（cho=ㄱ,jung=ㅏ,jong=ㅂ 暫定）
    state = feedBackspace(state); // 拿掉 jong → 가（composing，無終聲）
    expect(toPlainText(finalizeState(state))).toBe("가");

    state = type("rkq");
    state = feedBackspace(state); // 拿掉 jong
    state = feedBackspace(state); // 拿掉 jung → 只剩 cho=ㄱ
    expect(toPlainText(finalizeState(state))).toBe("ㄱ");

    state = feedBackspace(state); // 拿掉 cho → 完全空白
    expect(toPlainText(finalizeState(state))).toBe("");
  });
});

function type2(state: DubeolsikState, keys: string): DubeolsikState {
  let next = state;
  for (const ch of keys) {
    const shift = ch >= "A" && ch <= "Z";
    next = feedKey(next, ch.toLowerCase(), shift);
  }
  return next;
}
