// 跟 @romanization/engine 的組字算式完全一樣，但刻意不共用套件——
// claude.md 的核心原則是「Parser 與組字器必須解耦」，這裡也比照辦理，讓兩個引擎互相獨立。

const SYLLABLE_BASE = 0xac00;
const JUNG_COUNT = 21;
const JONG_COUNT = 28;

/** cho/jung 都確定才組得成完整音節；jong 可以是 0（無終聲）。 */
export function compose(cho: number, jung: number, jong: number): string {
  const codepoint = SYLLABLE_BASE + cho * JUNG_COUNT * JONG_COUNT + jung * JONG_COUNT + jong;
  return String.fromCodePoint(codepoint);
}
