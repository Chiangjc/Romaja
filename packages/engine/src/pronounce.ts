import { CHO, JUNG, JONG } from "./tables.js";
import { decompose } from "./compose.js";

/**
 * 韓文 → 發音式羅馬拼音（Revised Romanization 的 transcription，跟唱、念讀用）。
 *
 * 跟 romanize.ts 的 hangulToRoman 方向一樣、目的不同：
 * - hangulToRoman：轉寫式，逐字對應拼寫，學생입니다 → hagsaengibnida（等於本站鍵盤的打法）
 * - hangulToPronunciation：發音式，套用표준발음법，학생입니다 → haksaengimnida
 *
 * claude.md 3.1 說發音式「反推不回原字」，那是指羅馬字 → 韓文的方向。
 * 韓文 → 發音是順向，音變規則可以直接套，不需要詞表。
 *
 * 純規則，已知做不到的（都需要詞表才能判斷）：
 * - ㄴ 添加（솜이불 [솜니불]）
 * - 사이시옷／詞彙性的經音化（RR 本來就不標經音，影響不大）
 * - 合成詞邊界上的代表音連音（맛없다 [마덥따]，本模組給 mas-eop-）
 * - 名詞中 ㄱㄷㅂ + ㅎ 不送氣的 RR 例外（묵호 Mukho），本模組一律照發音送氣
 */

interface Syllable {
  cho: string; // 初聲 jamo，ㅇ 表示無聲
  jung: number; // 中聲 index，音變不會動到
  jong: string; // 終聲 jamo，"" 表示無終聲
}

// 終聲 → 連音時移到下一個音節的初聲。雙收音只移第二個，第一個留下。
const LIAISON: Record<string, { stay: string; move: string }> = {
  ㄱ: { stay: "", move: "ㄱ" },
  ㄲ: { stay: "", move: "ㄲ" },
  ㄳ: { stay: "ㄱ", move: "ㅅ" },
  ㄴ: { stay: "", move: "ㄴ" },
  ㄵ: { stay: "ㄴ", move: "ㅈ" },
  ㄶ: { stay: "", move: "ㄴ" }, // ㅎ 脫落，ㄴ 連過去：많이 [마니]
  ㄷ: { stay: "", move: "ㄷ" },
  ㄹ: { stay: "", move: "ㄹ" },
  ㄺ: { stay: "ㄹ", move: "ㄱ" },
  ㄻ: { stay: "ㄹ", move: "ㅁ" },
  ㄼ: { stay: "ㄹ", move: "ㅂ" },
  ㄽ: { stay: "ㄹ", move: "ㅅ" },
  ㄾ: { stay: "ㄹ", move: "ㅌ" },
  ㄿ: { stay: "ㄹ", move: "ㅍ" },
  ㅀ: { stay: "", move: "ㄹ" }, // 싫어 [시러]
  ㅁ: { stay: "", move: "ㅁ" },
  ㅂ: { stay: "", move: "ㅂ" },
  ㅄ: { stay: "ㅂ", move: "ㅅ" },
  ㅅ: { stay: "", move: "ㅅ" },
  ㅆ: { stay: "", move: "ㅆ" },
  ㅈ: { stay: "", move: "ㅈ" },
  ㅊ: { stay: "", move: "ㅊ" },
  ㅋ: { stay: "", move: "ㅋ" },
  ㅌ: { stay: "", move: "ㅌ" },
  ㅍ: { stay: "", move: "ㅍ" },
};

// 終聲 + 下一字初聲 ㅎ → 送氣音（축하 [추카]、못해 [모태]、앉히다 [안치다]）。
const ASPIRATE_BEFORE_H: Record<string, { stay: string; next: string }> = {
  ㄱ: { stay: "", next: "ㅋ" },
  ㄲ: { stay: "", next: "ㅋ" },
  ㄳ: { stay: "", next: "ㅋ" },
  ㄺ: { stay: "ㄹ", next: "ㅋ" },
  ㄷ: { stay: "", next: "ㅌ" },
  ㅅ: { stay: "", next: "ㅌ" },
  ㅆ: { stay: "", next: "ㅌ" },
  ㅊ: { stay: "", next: "ㅌ" },
  ㅌ: { stay: "", next: "ㅌ" },
  ㅈ: { stay: "", next: "ㅊ" },
  ㄵ: { stay: "ㄴ", next: "ㅊ" },
  ㅂ: { stay: "", next: "ㅍ" },
  ㅍ: { stay: "", next: "ㅍ" },
  ㅄ: { stay: "", next: "ㅍ" },
  ㄼ: { stay: "ㄹ", next: "ㅍ" },
};

// 終聲 ㅎ 系列（ㅎ、ㄶ、ㅀ）：ㅎ 去掉之後剩下的部分
const H_REMAINDER: Record<string, string> = { ㅎ: "", ㄶ: "ㄴ", ㅀ: "ㄹ" };
const H_ASPIRATE: Record<string, string> = { ㄱ: "ㅋ", ㄷ: "ㅌ", ㅈ: "ㅊ", ㅅ: "ㅆ" };

// 收音的七個代表音（표준발음법 9–11 항）
const NEUTRAL: Record<string, string> = {
  ㄱ: "ㄱ", ㄲ: "ㄱ", ㅋ: "ㄱ", ㄳ: "ㄱ", ㄺ: "ㄱ",
  ㄴ: "ㄴ", ㄵ: "ㄴ", ㄶ: "ㄴ",
  ㄷ: "ㄷ", ㅅ: "ㄷ", ㅆ: "ㄷ", ㅈ: "ㄷ", ㅊ: "ㄷ", ㅌ: "ㄷ", ㅎ: "ㄷ",
  ㄹ: "ㄹ", ㄼ: "ㄹ", ㄽ: "ㄹ", ㄾ: "ㄹ", ㅀ: "ㄹ",
  ㅁ: "ㅁ", ㄻ: "ㅁ",
  ㅂ: "ㅂ", ㅍ: "ㅂ", ㅄ: "ㅂ", ㄿ: "ㅂ",
  ㅇ: "ㅇ",
};

const NASAL: Record<string, string> = { ㄱ: "ㅇ", ㄷ: "ㄴ", ㅂ: "ㅁ" };

const JONG_LATIN: Record<string, string> = {
  ㄱ: "k", ㄴ: "n", ㄷ: "t", ㄹ: "l", ㅁ: "m", ㅂ: "p", ㅇ: "ng",
};

const CHO_LATIN: Record<string, string> = Object.fromEntries(CHO.map((e) => [e.jamo, e.latin]));
const JUNG_I = JUNG.findIndex((e) => e.jamo === "ㅣ");

function neutralize(jong: string, nextCho: string | null, char: string): string {
  if (jong === "ㄺ" && nextCho === "ㄱ") return "ㄹ"; // 맑게 [말께]
  if (jong === "ㄼ" && char === "밟") return "ㅂ"; // 밟다 [밥따]，其餘 ㄼ 念 ㄹ（여덟 [여덜]）
  return NEUTRAL[jong] ?? jong;
}

function palatalize(cho: string, jung: number): string {
  if (jung !== JUNG_I) return cho;
  if (cho === "ㄷ") return "ㅈ"; // 굳이 [구지]
  if (cho === "ㅌ") return "ㅊ"; // 같이 [가치]、닫히다 [다치다]
  return cho;
}

/** 處理第 i 個音節的終聲與下一個音節初聲之間的音變。next 為 null 表示詞尾。 */
function applyBoundary(cur: Syllable, next: Syllable | null, char: string) {
  if (next === null) {
    cur.jong = neutralize(cur.jong, null, char);
    return;
  }

  if (next.cho === "ㅇ" && cur.jong !== "" && cur.jong !== "ㅇ") {
    if (cur.jong === "ㅎ") {
      cur.jong = ""; // 좋아 [조아]
      return;
    }
    const { stay, move } = LIAISON[cur.jong];
    cur.jong = stay;
    next.cho = palatalize(move, next.jung);
  } else if (cur.jong in H_REMAINDER) {
    const remainder = H_REMAINDER[cur.jong];
    if (next.cho in H_ASPIRATE) {
      next.cho = H_ASPIRATE[next.cho]; // 좋다 [조타]、좋소 [조쏘]
      cur.jong = remainder;
    } else {
      // ㅎ 單獨在 ㄴ 前念 ㄴ（놓는 [논는]），交給下面的鼻音化從代表音 ㄷ 推出來
      cur.jong = remainder || "ㄷ";
    }
  } else if (next.cho === "ㅎ" && cur.jong in ASPIRATE_BEFORE_H) {
    const { stay, next: aspirated } = ASPIRATE_BEFORE_H[cur.jong];
    cur.jong = stay;
    next.cho = palatalize(aspirated, next.jung);
  }

  if (cur.jong === "") return;
  cur.jong = neutralize(cur.jong, next.cho, char);

  // 流音化：ㄴ+ㄹ、ㄹ+ㄴ → ㄹㄹ（신라 [실라]、설날 [설랄]）
  if (cur.jong === "ㄴ" && next.cho === "ㄹ") cur.jong = "ㄹ";
  else if (cur.jong === "ㄹ" && next.cho === "ㄴ") next.cho = "ㄹ";
  // ㄹ 的鼻音化：ㄹ 以外的收音後面，ㄹ 念 ㄴ（종로 [종노]、국립 [국닙→궁닙]）
  else if (next.cho === "ㄹ" && cur.jong !== "ㄹ") next.cho = "ㄴ";

  // 鼻音化：ㄱㄷㅂ 在 ㄴㅁ 前（합니다 [함니다]、국물 [궁물]、있는 [인는]）
  if ((next.cho === "ㄴ" || next.cho === "ㅁ") && cur.jong in NASAL) {
    cur.jong = NASAL[cur.jong];
  }
}

function romanizeWord(chars: string[], separator: string): string {
  const syllables: Syllable[] = chars.map((ch) => {
    const d = decompose(ch)!;
    return { cho: CHO[d.cho].jamo, jung: d.jung, jong: JONG[d.jong].jamo };
  });

  for (let i = 0; i < syllables.length; i++) {
    applyBoundary(syllables[i], syllables[i + 1] ?? null, chars[i]);
  }

  return syllables
    .map((s, i) => {
      const prevJong = i > 0 ? syllables[i - 1].jong : "";
      // ㄹ 在詞首與母音間寫 r，ㄹㄹ 寫 ll
      const cho = s.cho === "ㄹ" && prevJong !== "ㄹ" ? "r" : CHO_LATIN[s.cho];
      return cho + JUNG[s.jung].latin + (JONG_LATIN[s.jong] ?? "");
    })
    .join(separator);
}

export interface PronunciationOptions {
  /** 音節之間的分隔字元，例如 "-" 會得到 sa-rang-hae。預設不分隔。 */
  separator?: string;
}

/**
 * 連續的韓文音節視為一個詞套用音變；空白、標點、英文、數字照抄，也是詞的邊界。
 */
export function hangulToPronunciation(text: string, options: PronunciationOptions = {}): string {
  const separator = options.separator ?? "";
  let result = "";
  let word: string[] = [];
  const flush = () => {
    if (word.length > 0) result += romanizeWord(word, separator);
    word = [];
  };
  for (const char of text) {
    if (decompose(char) !== null) {
      word.push(char);
    } else {
      flush();
      result += char;
    }
  }
  flush();
  return result;
}
