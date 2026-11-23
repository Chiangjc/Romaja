// 泰文單字 → RTGS（皇家泰語通用轉寫）音節
//
// 泰文的難處不在字母對照，而在音節切分：大量母音不寫出來（คน = khon、สบาย = sa-bai），
// 前置母音寫在子音前面（เ แ โ ใ ไ），子音字母又可能是首音、尾音或不發音。
// 做法是列出每個位置所有合法的音節形狀，用動態規劃挑「代價」最低的切法：
// 寫出來的母音代價最低，隱含的 o 次之，隱含的 a 最貴，詞尾的隱含 a 更貴。
// 規則猜不到的常用詞放在 EXCEPTIONS，同樣參與動態規劃，所以複合詞裡也找得到。

import { EXCEPTIONS } from "./exceptions.js";

const INITIAL: Record<string, string> = {
  ก: "k", ข: "kh", ฃ: "kh", ค: "kh", ฅ: "kh", ฆ: "kh", ง: "ng", จ: "ch", ฉ: "ch", ช: "ch",
  ซ: "s", ฌ: "ch", ญ: "y", ฎ: "d", ฏ: "t", ฐ: "th", ฑ: "th", ฒ: "th", ณ: "n", ด: "d",
  ต: "t", ถ: "th", ท: "th", ธ: "th", น: "n", บ: "b", ป: "p", ผ: "ph", ฝ: "f", พ: "ph",
  ฟ: "f", ภ: "ph", ม: "m", ย: "y", ร: "r", ล: "l", ว: "w", ศ: "s", ษ: "s", ส: "s",
  ห: "h", ฬ: "l", อ: "", ฮ: "h",
};

// 尾音：塞音一律清化成 k / t / p，ร ล 收成 n，ย ว 是滑音，接在母音後面寫 i / o
const FINAL: Record<string, string> = {
  ก: "k", ข: "k", ค: "k", ฆ: "k", ง: "ng", จ: "t", ช: "t", ซ: "t", ฌ: "t", ญ: "n",
  ฎ: "t", ฏ: "t", ฐ: "t", ฑ: "t", ฒ: "t", ณ: "n", ด: "t", ต: "t", ถ: "t", ท: "t",
  ธ: "t", น: "n", บ: "p", ป: "p", พ: "p", ฟ: "p", ภ: "p", ม: "m", ย: "i", ร: "n",
  ล: "n", ว: "o", ศ: "t", ษ: "t", ส: "t", ฬ: "n",
};

// 真複輔音：第二個子音照念
const TRUE_CLUSTERS = new Set([
  "กร", "กล", "กว", "ขร", "ขล", "ขว", "คร", "คล", "คว", "ตร", "ปร", "ปล",
  "พร", "พล", "ผล", "บร", "บล", "ดร", "ฟร", "ฟล",
]);
// 假複輔音：ทร 念 s，其餘的 ร 不發音
const FALSE_CLUSTERS: Record<string, string> = { ทร: "s", จร: "ch", ซร: "s", ศร: "s", สร: "s" };
// ห 帶頭的低音子音，ห 不發音只改聲調
const SILENT_H = new Set("งญนมยรลว");
// 帶前置母音時可以當「前導子音」的字母（เสมอ = sa-moe、แสดง = sa-daeng）
const LEADERS = new Set("ขฉถผฝสศษกจตปดบ");

const PRE_VOWELS = new Set("เแโใไ");

type FinalRule = "none" | "opt" | "req";
interface Body {
  marks: string;
  vowel: string;
  final: FinalRule;
}

function b(marks: string, vowel: string, final: FinalRule): Body {
  return { marks, vowel, final };
}

// 依前置母音分組的母音形狀。順序無所謂，動態規劃會比代價。
const BODIES: Record<string, Body[]> = {
  "": [
    b("ะ", "a", "none"), b("ัวะ", "ua", "none"), b("ัว", "ua", "none"), b("ั", "a", "req"),
    b("า", "a", "opt"), b("ำ", "am", "none"),
    b("ิ", "i", "opt"), b("ี", "i", "opt"), b("ึ", "ue", "opt"), b("ือ", "ue", "none"), b("ื", "ue", "req"),
    b("ุ", "u", "opt"), b("ู", "u", "opt"),
    b("็อ", "o", "req"), b("อ", "o", "opt"), b("ว", "ua", "req"),
  ],
  เ: [
    b("าะ", "o", "none"), b("า", "ao", "none"), b("อะ", "oe", "none"), b("อ", "oe", "opt"),
    b("ิ", "oe", "req"), b("ียะ", "ia", "none"), b("ีย", "ia", "opt"), b("ือะ", "uea", "none"),
    b("ือ", "uea", "opt"), b("ะ", "e", "none"), b("็", "e", "req"), b("", "e", "opt"),
  ],
  แ: [b("ะ", "ae", "none"), b("็", "ae", "req"), b("", "ae", "opt")],
  โ: [b("ะ", "o", "none"), b("", "o", "opt")],
  ไ: [b("", "ai", "none"), b("ย", "ai", "none")],
  ใ: [b("", "ai", "none")],
};

const COST_IMPLICIT_O = 0.5;
const COST_IMPLICIT_A = 1.5;
const COST_FINAL_IMPLICIT_A = 3;
const COST_LEADER = 0.9;
// อ 當首音又不寫母音（อด、อน）很少見，通常是前一個音節的尾音切錯了（ตลอด 不是 ton-ot）
const COST_SILENT_O_IMPLICIT = 1;
const COST_SILENT_VOWEL = 0.3;
const COST_FALLBACK = 10;

export function isThaiConsonant(c: string | undefined): boolean {
  return c !== undefined && c >= "ก" && c <= "ฮ" && c !== "ฤ" && c !== "ฦ";
}

interface Initial {
  len: number;
  roman: string;
}

function initials(s: string, j: number): Initial[] {
  const c = s[j];
  if (!isThaiConsonant(c)) return [];
  const out: Initial[] = [{ len: 1, roman: INITIAL[c] }];
  const n = s[j + 1];
  if (!isThaiConsonant(n)) return out;
  const pair = c + n;
  if (TRUE_CLUSTERS.has(pair)) out.push({ len: 2, roman: INITIAL[c] + ({ ร: "r", ล: "l", ว: "w" } as Record<string, string>)[n] });
  if (pair in FALSE_CLUSTERS) out.push({ len: 2, roman: FALSE_CLUSTERS[pair] });
  if (c === "ห" && SILENT_H.has(n)) out.push({ len: 2, roman: INITIAL[n] });
  if (pair === "อย") out.push({ len: 2, roman: "y" });
  return out;
}

interface Match {
  end: number;
  syllables: string[];
  cost: number;
}

function startsWith(s: string, at: number, marks: string): boolean {
  return s.startsWith(marks, at);
}

// 母音之後接尾音（或不接），每一種可能都回傳
function withFinal(s: string, k: number, end: number, vowel: string, rule: FinalRule, pre: string, cost: number): Match[] {
  const out: Match[] = [];
  if (rule !== "req") out.push({ end: k, syllables: [vowel], cost });
  if (rule === "none") return out;
  const f = s[k];
  if (!isThaiConsonant(f) || !(f in FINAL)) return out;
  let v = vowel;
  if (f === "ย" && pre === "เ" && vowel === "e") v = "oe"; // เลย = loei
  const syl = v + FINAL[f];
  out.push({ end: k + 1, syllables: [syl], cost });
  // 巴利梵語借詞詞尾不發音的 ิ ุ：ชาติ chat、เหตุ het、ภูมิ phum
  if ((s[k + 1] === "ิ" || s[k + 1] === "ุ") && k + 2 === end) {
    out.push({ end: k + 2, syllables: [syl], cost: cost + COST_SILENT_VOWEL });
  }
  return out;
}

// 從 j 開始、首音已經決定好的情況下，列出母音加尾音的所有切法
function rest(s: string, k: number, end: number, pre: string, init: string): Match[] {
  const silentO = init === "" ? COST_SILENT_O_IMPLICIT : 0;
  const out: Match[] = [];
  const add = (ms: Match[]) => {
    for (const m of ms) out.push({ ...m, syllables: m.syllables.map((v) => init + v) });
  };
  for (const body of BODIES[pre]) {
    if (body.marks !== "" && !startsWith(s, k, body.marks)) continue;
    add(withFinal(s, k + body.marks.length, end, body.vowel, body.final, pre, 1));
  }
  if (pre !== "") return out;

  // รร：กรรม kam、สรรค์ san、ธรรมดา
  if (startsWith(s, k, "รร")) {
    const ms = withFinal(s, k + 2, end, "a", "opt", "", 1);
    add(ms.map((m) => (m.end === k + 2 ? { ...m, syllables: ["an"] } : m)));
  }
  // ฤ：อังกฤษ angkrit、พฤษภาคม phruet-
  if (s[k] === "ฤ") {
    const v = "กตทปศส".includes(s[k - 1] ?? "") ? "ri" : "rue";
    add(withFinal(s, k + 1, end, v, "opt", "", 1));
  }
  // 沒寫母音：後面有尾音念 o（คน khon），沒有尾音念 a（สบาย 的 ส）
  const f = s[k];
  if (isThaiConsonant(f) && f in FINAL && f !== "ย" && f !== "ว") {
    add([{ end: k + 1, syllables: ["o" + FINAL[f]], cost: 1 + COST_IMPLICIT_O + silentO }]);
  }
  add([{ end: k, syllables: ["a"], cost: 1 + COST_IMPLICIT_A + silentO + (k === end ? COST_FINAL_IMPLICIT_A : 0) }]);
  return out;
}

function matchesAt(s: string, i: number, end: number, exceptions: [string, string[]][]): Match[] {
  const out: Match[] = [];
  for (const [key, syllables] of exceptions) {
    if (s.startsWith(key, i)) out.push({ end: i + key.length, syllables, cost: syllables.length * 0.6 });
  }

  // 獨立的 ฤ ฦ：ฤดู rue-du
  if (s[i] === "ฤ" || s[i] === "ฦ") {
    out.push(...withFinal(s, i + 1, end, s[i] === "ฤ" ? "rue" : "lue", "opt", "", 1));
  }

  const pre = PRE_VOWELS.has(s[i]) ? s[i] : "";
  const j = i + pre.length;
  for (const init of initials(s, j)) {
    out.push(...rest(s, j + init.len, end, pre, init.roman));
  }
  // 前導子音：前置母音其實屬於第二個子音，第一個子音念 a
  if (pre !== "" && LEADERS.has(s[j]) && isThaiConsonant(s[j + 1])) {
    const lead = INITIAL[s[j]] + "a";
    for (const init of initials(s, j + 1)) {
      for (const m of rest(s, j + 1 + init.len, end, pre, init.roman)) {
        out.push({ end: m.end, syllables: [lead, ...m.syllables], cost: m.cost + COST_LEADER });
      }
    }
  }
  // 保底：任何字元都能單獨吃掉，確保整個詞一定切得完
  out.push({ end: i + 1, syllables: isThaiConsonant(s[i]) ? [INITIAL[s[i]] + "a"] : [], cost: COST_FALLBACK });
  return out;
}

// 不發音的字母（การันต์ ์）跟聲調符號都不影響 RTGS，先拿掉
export function cleanThai(word: string): string {
  return word
    .replace(/ํา/g, "ำ")
    .replace(/[ตทด]ร์/g, "") // จันทร์ chan、ศาสตร์ sat
    .replace(/[ก-ฮ][ิุ]?์/g, "") // เสาร์ sao、ฤทธิ์ rit
    .replace(/[่-๋ํ๎]/g, "");
}

const CLEANED_EXCEPTIONS: [string, string[]][] = Object.entries(EXCEPTIONS).map(([k, v]) => [cleanThai(k), v.split("-")]);

export function thaiWordToSyllables(word: string): string[] {
  const s = cleanThai(word);
  const end = s.length;
  if (end === 0) return [];
  const exceptions = CLEANED_EXCEPTIONS.filter(([k]) => s.includes(k));

  // best[i]：從 i 切到詞尾的最低代價
  const best: { cost: number; syllables: string[] }[] = new Array(end + 1);
  best[end] = { cost: 0, syllables: [] };
  for (let i = end - 1; i >= 0; i--) {
    let top: { cost: number; syllables: string[] } | undefined;
    for (const m of matchesAt(s, i, end, exceptions)) {
      const tail = best[m.end];
      if (!tail) continue;
      const cost = m.cost + tail.cost;
      if (!top || cost < top.cost) top = { cost, syllables: [...m.syllables, ...tail.syllables] };
    }
    best[i] = top!;
  }
  return best[0].syllables.filter((x) => x !== "");
}
