import { CHO, JUNG, JONG } from "./tables.js";
import { compose } from "./compose.js";
import { parseWord, type SyllableMatch } from "./parser.js";

function syllableCompare(x: SyllableMatch, y: SyllableMatch): number {
  const choLenX = CHO[x.cho].latin.length;
  const choLenY = CHO[y.cho].latin.length;
  if (choLenX !== choLenY) return choLenY - choLenX; // 初聲長的優先

  const jungLenX = JUNG[x.jung].latin.length;
  const jungLenY = JUNG[y.jung].latin.length;
  if (jungLenX !== jungLenY) return jungLenY - jungLenX; // 中聲長的優先

  // 終聲：無終聲優先，其次 latin 長度短的優先
  const jongRankX = x.jong === 0 ? -1 : JONG[x.jong].latin.length;
  const jongRankY = y.jong === 0 ? -1 : JONG[y.jong].latin.length;
  return jongRankX - jongRankY;
}

export function compareCandidates(a: SyllableMatch[], b: SyllableMatch[]): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const cmp = syllableCompare(a[i], b[i]);
    if (cmp !== 0) return cmp;
  }
  return a.length - b.length;
}

export function rankCandidates(candidates: SyllableMatch[][]): SyllableMatch[][] {
  return candidates.slice().sort(compareCandidates);
}

function toHangul(candidate: SyllableMatch[]): string {
  return candidate.map((s) => compose(s.cho, s.jung, s.jong)).join("");
}

export function toHangulCandidates(word: string): string[] {
  const ranked = rankCandidates(parseWord(word));
  return ranked.map(toHangul);
}

export function best(word: string): string | null {
  const candidates = toHangulCandidates(word);
  return candidates.length > 0 ? candidates[0] : null;
}

export interface RankedCandidate {
  hangul: string;
  spelling: string; // 標示切法，例如 "ga-eul"
}

export function rankedCandidatesWithSpelling(word: string): RankedCandidate[] {
  const ranked = rankCandidates(parseWord(word));
  return ranked.map((syllables) => {
    let pos = 0;
    const parts = syllables.map((s) => {
      const part = word.slice(pos, pos + s.length);
      pos += s.length;
      return part;
    });
    return {
      hangul: toHangul(syllables),
      spelling: parts.join("-"),
    };
  });
}
