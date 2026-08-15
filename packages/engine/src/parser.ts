import { CHO, JUNG, JONG } from "./tables.js";
import { matchAt } from "./match.js";

export interface SyllableMatch {
  cho: number;
  jung: number;
  jong: number;
  length: number;
}

// 工程防呆：單一位置的候選數上限，避免病態輸入組合爆炸。
// 常見詞平均只有 3.9 種候選，正常輸入不會碰到這個上限。
const MAX_CANDIDATES_PER_POSITION = 200;

/**
 * 輸入一段沒有分隔的羅馬字（小寫），回傳所有合法的音節序列切法。
 */
export function parseWord(word: string): SyllableMatch[][] {
  const memo = new Map<number, SyllableMatch[][]>();

  function parseFrom(pos: number): SyllableMatch[][] {
    if (pos === word.length) {
      return [[]];
    }
    const cached = memo.get(pos);
    if (cached) {
      return cached;
    }

    const results: SyllableMatch[][] = [];

    outer: for (const choMatch of matchAt(CHO, word, pos)) {
      const posAfterCho = pos + choMatch.length;
      for (const jungMatch of matchAt(JUNG, word, posAfterCho)) {
        const posAfterJung = posAfterCho + jungMatch.length;
        for (const jongMatch of matchAt(JONG, word, posAfterJung)) {
          const posAfterJong = posAfterJung + jongMatch.length;
          const syllable: SyllableMatch = {
            cho: choMatch.index,
            jung: jungMatch.index,
            jong: jongMatch.index,
            length: posAfterJong - pos,
          };
          const rest = parseFrom(posAfterJong);
          for (const restPath of rest) {
            results.push([syllable, ...restPath]);
            if (results.length >= MAX_CANDIDATES_PER_POSITION) {
              break outer;
            }
          }
        }
      }
    }

    memo.set(pos, results);
    return results;
  }

  return parseFrom(0);
}
