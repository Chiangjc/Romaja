import { describe, it, expect } from "vitest";
import { pronunciationVariants } from "../src/pronunciation-rules.js";
import { computeCandidates } from "../src/candidates.js";

describe("pronunciationVariants", () => {
  it("沒有音變痕跡時回傳空陣列", () => {
    expect(pronunciationVariants("annyeong")).toEqual([]);
  });

  it("單一出現位置只產生一個變體", () => {
    expect(pronunciationVariants("hamnida")).toEqual(["habnida"]);
  });

  it("多個出現位置各自獨立，產生全組合", () => {
    const variants = pronunciationVariants("mnxmn").sort();
    expect(variants).toEqual(["bnxbn", "bnxmn", "mnxbn"].sort());
  });
});

describe("computeCandidates：常見音變猜測（claude.md 12.2 的縮小版）", () => {
  it("hamnida：字面 함니다 第一名，猜測還原的 합니다 也在候選裡", () => {
    const candidates = computeCandidates("hamnida");
    expect(candidates[0].hangul).toBe("함니다");
    expect(candidates.some((c) => c.hangul === "합니다")).toBe(true);
  });

  it("gamsahamnida：감사합니다 可以被猜到", () => {
    const candidates = computeCandidates("gamsahamnida");
    expect(candidates.some((c) => c.hangul === "감사합니다")).toBe(true);
  });

  it("gungmul（ㄱ→ㅇ 鼻音化）：국물 可以被猜到", () => {
    const candidates = computeCandidates("gungmul");
    expect(candidates.some((c) => c.hangul === "국물")).toBe(true);
  });

  it("連字號路徑不套用音變猜測", () => {
    const candidates = computeCandidates("ham-ni-da");
    expect(candidates).toEqual([{ hangul: "함니다", spelling: "ham-ni-da" }]);
  });

  it("沒有音變痕跡的一般詞不受影響", () => {
    const candidates = computeCandidates("annyeong");
    expect(candidates[0].hangul).toBe("안녕");
  });
});
