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
