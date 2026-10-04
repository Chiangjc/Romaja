import { hangulToRoman } from "@romanization/engine";
import type { InputState, Segment } from "./types.js";

function segmentText(seg: Segment): string {
  return seg.kind === "word" ? seg.hangul : seg.text;
}

export function toPlainText(state: InputState): string {
  const before = state.segments.slice(0, state.cursor).map(segmentText).join("");
  const after = state.segments.slice(state.cursor).map(segmentText).join("");

  let composingText = "";
  if (state.composing && state.composing.spelling.length > 0) {
    const { spelling, converting, candidates, selectedIndex } = state.composing;
    composingText =
      converting && candidates.length > 0 ? candidates[Math.min(selectedIndex, candidates.length - 1)].hangul : spelling;
  }

  return before + composingText + after;
}

/**
 * toPlainText 的反向：把一段已經是韓文的文字（例如從韓轉拼音頁帶過來的）還原成輸入狀態。
 * 連續的韓文音節變成 word 段落，拼法用轉寫式羅馬字補上，點下去一樣可以重開候選；
 * 其他字元（空白、標點、英文、換行）各自是一個 literal，跟 reducer 產生的段落一致。
 */
export function fromPlainText(text: string): InputState {
  const segments: Segment[] = [];
  for (const match of text.matchAll(/[가-힣]+|[^가-힣]/gu)) {
    const chunk = match[0];
    segments.push(
      /[가-힣]/.test(chunk) ? { kind: "word", spelling: hangulToRoman(chunk), hangul: chunk } : { kind: "literal", text: chunk },
    );
  }
  return { segments, cursor: segments.length, composing: null };
}
