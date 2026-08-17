import { rankedCandidatesWithSpelling } from "@romanization/engine";
import type { Candidate } from "./types.js";
import { pronunciationVariants } from "./pronunciation-rules.js";

const MAX_CANDIDATES = 3;

/**
 * 照字面拼字的候選，加上「常見音變」猜測還原出來的候選（見 pronunciation-rules.ts）。
 * 字面候選永遠排前面，猜測還原的接在後面，用 hangul 去重——不動 engine 的排序邏輯。
 *
 * 字面候選本身有時就已經有好幾個切法歧義（跟音變無關），若直接把猜測還原的候選接在
 * 最後面再裁切到 MAX_CANDIDATES，常常會被字面的其他歧義擠出候選框。所以固定保留至少
 * 一格給猜測還原的候選（若存在），字面候選永遠至少留一格。
 *
 * 已知限制：如果猜測還原出來的變體字串本身又有雙收音（ㅆ／ㅄ 之類）造成的額外切法歧義
 * （例如 없습니다／있습니다 這種詞），目標答案可能排到猜測候選自己的第 3 名以後，保留的
 * 這一格搶救不到——這種複合歧義需要詞頻表才能穩定解決，這次刻意不做（見 plan 的範圍界線）。
 */
function candidatesWithPronunciationGuesses(spelling: string): Candidate[] {
  const literal = rankedCandidatesWithSpelling(spelling);
  const seen = new Set(literal.map((c) => c.hangul));
  const guessed: Candidate[] = [];
  for (const variant of pronunciationVariants(spelling)) {
    for (const candidate of rankedCandidatesWithSpelling(variant)) {
      if (!seen.has(candidate.hangul)) {
        seen.add(candidate.hangul);
        guessed.push(candidate);
      }
    }
  }
  const reserved = Math.min(guessed.length, MAX_CANDIDATES - 1);
  return [...literal.slice(0, MAX_CANDIDATES - reserved), ...guessed];
}

/**
 * claude.md 4.6：連字號語意是「兩個連字號之間恰好一個音節」，在這一層處理，
 * 不進 engine（parser/rank 保持跟連字號無關，職責分離）。
 */
export function computeCandidates(spelling: string): Candidate[] {
  if (!spelling.includes("-")) {
    return candidatesWithPronunciationGuesses(spelling).slice(0, MAX_CANDIDATES);
  }

  const segments = spelling.split("-");
  if (segments.some((s) => s.length === 0)) {
    return []; // 還在打，例如剛打完 "-" 或連續 "--"
  }

  const perSegment = segments.map(
    (s) => rankedCandidatesWithSpelling(s).find((c) => c.hangul.length === 1) ?? null
  );
  if (perSegment.some((c) => c === null)) {
    return []; // 某段無法組成單一音節
  }

  return [
    {
      hangul: perSegment.map((c) => c!.hangul).join(""),
      spelling: segments.join("-"),
    },
  ];
}
