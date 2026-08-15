import { best } from "./rank.js";

/**
 * 句子級的薄封裝：把輸入切成「連續英文字母」與「其他字元」兩種 token。
 * 字母 token 丟給 best() 轉換，轉不出來就原樣保留；其他字元（空白、標點、數字）照抄。
 *
 * 這不是 Phase 2 的 InputState——沒有組字狀態、沒有候選記憶、沒有鍵盤事件處理，
 * 純函式，只是為了讓黃金測試集能放整句範例。
 */
export function toHangulText(text: string): string {
  return text.replace(/[A-Za-z]+/g, (word) => best(word.toLowerCase()) ?? word);
}
