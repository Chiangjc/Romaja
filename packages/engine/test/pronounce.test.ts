import { describe, it, expect } from "vitest";
import { hangulToPronunciation } from "../src/pronounce.js";
import { SYLLABLE_BASE, SYLLABLE_END } from "../src/compose.js";

// 期望值以國立國語院 Revised Romanization（transcription）為準：反映音變，但不標經音化。
const CASES: [string, string][] = [
  // 沒有音變
  ["사랑해", "saranghae"],
  ["서울", "seoul"],
  ["가을", "gaeul"],
  ["생일", "saengil"],
  ["대한민국", "daehanminguk"],
  ["희망", "huimang"],
  // 收音代表音
  ["꽃", "kkot"],
  ["부엌", "bueok"],
  ["밖", "bak"],
  ["여덟", "yeodeol"],
  ["읽다", "ikda"],
  ["맑게", "malge"],
  ["밟다", "bapda"],
  // 連音
  ["오늘은", "oneureun"],
  ["한국어", "hangugeo"],
  ["있어요", "isseoyo"],
  ["맛있어요", "masisseoyo"],
  ["읽어요", "ilgeoyo"],
  ["닭이", "dalgi"],
  ["앉아", "anja"],
  ["없어요", "eopseoyo"],
  // ㅎ 脫落與送氣
  ["좋아요", "joayo"],
  ["많이", "mani"],
  ["싫어", "sireo"],
  ["괜찮아요", "gwaenchanayo"],
  ["좋다", "jota"],
  ["축하해요", "chukahaeyo"],
  ["못해요", "motaeyo"],
  ["앉히다", "anchida"],
  ["놓는", "nonneun"],
  ["좋습니다", "josseumnida"],
  // 口蓋音化
  ["같이", "gachi"],
  ["굳이", "guji"],
  ["닫히다", "dachida"],
  // 鼻音化
  ["감사합니다", "gamsahamnida"],
  ["학생입니다", "haksaengimnida"],
  ["국물", "gungmul"],
  ["백마", "baengma"],
  ["있는", "inneun"],
  // 流音化與 ㄹ 的鼻音化
  ["신라", "silla"],
  ["설날", "seollal"],
  ["종로", "jongno"],
  ["국립", "gungnip"],
];

describe("hangulToPronunciation", () => {
  it.each(CASES)("%s → %s", (hangul, expected) => {
    expect(hangulToPronunciation(hangul)).toBe(expected);
  });

  it("整句：標點、空白照抄，空白是音變的邊界", () => {
    expect(hangulToPronunciation("안녕하세요, 저는 학생입니다!")).toBe("annyeonghaseyo, jeoneun haksaengimnida!");
    expect(hangulToPronunciation("한국 어")).toBe("hanguk eo");
  });

  it("英文與數字照抄", () => {
    expect(hangulToPronunciation("BTS 노래 2곡")).toBe("BTS norae 2gok");
  });

  it("音節分隔：分隔的是音變之後的音節", () => {
    expect(hangulToPronunciation("사랑해요", { separator: "-" })).toBe("sa-rang-hae-yo");
    expect(hangulToPronunciation("있어요", { separator: "-" })).toBe("i-sseo-yo");
    expect(hangulToPronunciation("설날 좋아요", { separator: "-" })).toBe("seol-lal jo-a-yo");
  });

  it("全部 11,172 個音節單獨轉換都只產生小寫 ASCII 字母", () => {
    const bad: string[] = [];
    for (let cp = SYLLABLE_BASE; cp <= SYLLABLE_END; cp++) {
      const ch = String.fromCodePoint(cp);
      const out = hangulToPronunciation(ch);
      if (!/^[a-z]+$/.test(out)) bad.push(`${ch} -> "${out}"`);
    }
    expect(bad).toEqual([]);
  });

  it("任兩個音節的組合都不會丟例外、也只產生小寫 ASCII 字母", () => {
    // 每個終聲 × 每個初聲，涵蓋所有邊界規則的分支
    const bad: string[] = [];
    for (let jong = 0; jong < 28; jong++) {
      for (let cho = 0; cho < 19; cho++) {
        for (const jung of [0, 20]) {
          const a = String.fromCodePoint(SYLLABLE_BASE + jong);
          const b = String.fromCodePoint(SYLLABLE_BASE + cho * 588 + jung * 28);
          const out = hangulToPronunciation(a + b);
          if (!/^[a-z]+$/.test(out)) bad.push(`${a}${b} -> "${out}"`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
