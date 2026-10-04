import { describe, it, expect } from "vitest";
import { fromPlainText, toPlainText } from "../src/serialize.js";
import { reduce } from "../src/reducer.js";

describe("fromPlainText", () => {
  it("toPlainText(fromPlainText(x)) === x", () => {
    for (const text of ["", "감사합니다", "안녕하세요, 저는 학생입니다!", "BTS 노래 2곡\n사랑해요"]) {
      expect(toPlainText(fromPlainText(text))).toBe(text);
    }
  });

  it("韓文變成 word 段落並補上轉寫式拼法，其他字元各自是 literal", () => {
    expect(fromPlainText("같이 가요!").segments).toEqual([
      { kind: "word", spelling: "gati", hangul: "같이" },
      { kind: "literal", text: " " },
      { kind: "word", spelling: "gayo", hangul: "가요" },
      { kind: "literal", text: "!" },
    ]);
  });

  it("游標在最後面，可以接著打字", () => {
    let state = fromPlainText("감사합니다 ");
    for (const ch of "yo") state = reduce(state, { type: "char", char: ch });
    state = reduce(state, { type: "space" });
    expect(toPlainText(state)).toBe("감사합니다 요 ");
  });
});
