import type { TableEntry } from "./tables.js";

export interface Match {
  length: number;
  index: number;
}

/**
 * 在 text 的 pos 位置，回傳這個對照表裡所有能匹配到的 (消耗長度, 表格索引)，
 * 依長度由長到短排列。latin 為空字串的項目（ㅇ 初聲、無終聲）視為長度 0 的匹配。
 */
export function matchAt(table: TableEntry[], text: string, pos: number): Match[] {
  const matches: Match[] = [];
  for (let index = 0; index < table.length; index++) {
    const entry = table[index];
    const candidates = [entry.latin, ...(entry.altLatin ?? [])];
    for (const candidate of candidates) {
      if (candidate.length === 0) {
        matches.push({ length: 0, index });
        break; // 空字串只需要記一次
      }
      if (text.startsWith(candidate, pos)) {
        matches.push({ length: candidate.length, index });
      }
    }
  }
  matches.sort((a, b) => b.length - a.length);
  return matches;
}
