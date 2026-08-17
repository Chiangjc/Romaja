import type { Action, ComposingState, InputState, Segment } from "./types.js";
import { computeCandidates } from "./candidates.js";

export function initialState(): InputState {
  return { segments: [], cursor: 0, composing: null };
}

function startComposing(): ComposingState {
  return { spelling: "", converting: true, candidates: [], selectedIndex: 0 };
}

function recompute(composing: ComposingState): ComposingState {
  if (!composing.converting) {
    return { ...composing, candidates: [] };
  }
  return { ...composing, candidates: computeCandidates(composing.spelling), selectedIndex: 0 };
}

/** 把目前的 composing（若有）確定成一個 segment，插入 cursor 位置。空 buffer 視為沒東西可確定。 */
function commitComposing(state: InputState): { segments: Segment[]; cursor: number } {
  const composing = state.composing;
  if (!composing || composing.spelling.length === 0) {
    return { segments: state.segments, cursor: state.cursor };
  }
  const { spelling, converting, candidates, selectedIndex } = composing;
  let segment: Segment;
  if (converting && candidates.length > 0) {
    const chosen = candidates[Math.min(selectedIndex, candidates.length - 1)];
    segment = { kind: "word", spelling, hangul: chosen.hangul };
  } else {
    segment = { kind: "literal", text: spelling };
  }
  const segments = [...state.segments];
  segments.splice(state.cursor, 0, segment);
  return { segments, cursor: state.cursor + 1 };
}

/** clickWord/clickGap 傳入的 index 是根據「送出這個 action 之前」的 segments 陣列算的；
 * 若途中觸發了自動確定（插入一個新 segment），且插入點在 index 之前或等於 index，index 要跟著 +1。 */
function adjustIndexAfterCommit(state: InputState, index: number): number {
  const willCommit = state.composing !== null && state.composing.spelling.length > 0;
  return willCommit && state.cursor <= index ? index + 1 : index;
}

function charAction(state: InputState, ch: string): InputState {
  const composing = state.composing ?? startComposing();
  const isUpper = ch >= "A" && ch <= "Z";
  const lower = ch.toLowerCase();
  const addition = isUpper && composing.spelling.length > 0 ? "-" + lower : lower;
  return { ...state, composing: recompute({ ...composing, spelling: composing.spelling + addition }) };
}

function backspaceAction(state: InputState): InputState {
  if (state.composing) {
    const spelling = state.composing.spelling.slice(0, -1);
    if (spelling.length === 0) {
      return { ...state, composing: null };
    }
    return { ...state, composing: recompute({ ...state.composing, spelling }) };
  }

  if (state.cursor === 0) return state;
  const idx = state.cursor - 1;
  const seg = state.segments[idx];
  const text = seg.kind === "word" ? seg.hangul : seg.text;
  const trimmed = text.slice(0, -1);
  const segments = [...state.segments];
  if (trimmed.length === 0) {
    segments.splice(idx, 1);
    return { ...state, segments, cursor: state.cursor - 1 };
  }
  // 被截斷的 word 段落，原始拼字已經對不上剩下的韓文了，降級成 literal，不再假裝可以重開。
  segments[idx] = { kind: "literal", text: trimmed };
  return { ...state, segments };
}

function spaceAction(state: InputState): InputState {
  const { segments, cursor } = commitComposing(state);
  const withSpace = [...segments];
  withSpace.splice(cursor, 0, { kind: "literal", text: " " });
  return { segments: withSpace, cursor: cursor + 1, composing: null };
}

function enterAction(state: InputState): InputState {
  if (!state.composing || state.composing.spelling.length === 0) {
    const segments = [...state.segments];
    segments.splice(state.cursor, 0, { kind: "literal", text: "\n" });
    return { ...state, segments, cursor: state.cursor + 1, composing: null };
  }
  const { segments, cursor } = commitComposing(state);
  return { segments, cursor, composing: null };
}

function arrowAction(state: InputState, dir: "up" | "down"): InputState {
  if (!state.composing || state.composing.candidates.length === 0) return state;
  const n = state.composing.candidates.length;
  const delta = dir === "down" ? 1 : -1;
  const selectedIndex = (state.composing.selectedIndex + delta + n) % n;
  return { ...state, composing: { ...state.composing, selectedIndex } };
}

function digitAction(state: InputState, n: 1 | 2 | 3): InputState {
  if (!state.composing || state.composing.candidates.length < n) return state;
  return { ...state, composing: { ...state.composing, selectedIndex: n - 1 } };
}

function escapeAction(state: InputState): InputState {
  if (!state.composing) return state;
  return { ...state, composing: { ...state.composing, converting: false, candidates: [], selectedIndex: 0 } };
}

function punctAction(state: InputState, ch: string): InputState {
  const { segments, cursor } = commitComposing(state);
  const withChar = [...segments];
  withChar.splice(cursor, 0, { kind: "literal", text: ch });
  return { segments: withChar, cursor: cursor + 1, composing: null };
}

function clickWordAction(state: InputState, index: number): InputState {
  const adjustedIndex = adjustIndexAfterCommit(state, index);
  const { segments } = commitComposing(state);
  const target = segments[adjustedIndex];
  if (!target || target.kind !== "word") {
    return { segments, cursor: adjustedIndex, composing: null };
  }
  const newSegments = [...segments];
  newSegments.splice(adjustedIndex, 1);
  const candidates = computeCandidates(target.spelling);
  const restoredIndex = candidates.findIndex((c) => c.hangul === target.hangul);
  return {
    segments: newSegments,
    cursor: adjustedIndex,
    composing: {
      spelling: target.spelling,
      converting: true,
      candidates,
      selectedIndex: restoredIndex >= 0 ? restoredIndex : 0,
    },
  };
}

function clickGapAction(state: InputState, index: number): InputState {
  const adjustedIndex = adjustIndexAfterCommit(state, index);
  const { segments } = commitComposing(state);
  return { segments, cursor: adjustedIndex, composing: null };
}

export function reduce(state: InputState, action: Action): InputState {
  switch (action.type) {
    case "char":
      return charAction(state, action.char);
    case "backspace":
      return backspaceAction(state);
    case "space":
      return spaceAction(state);
    case "enter":
      return enterAction(state);
    case "arrow":
      return arrowAction(state, action.dir);
    case "digit":
      return digitAction(state, action.n);
    case "escape":
      return escapeAction(state);
    case "punct":
      return punctAction(state, action.char);
    case "clickWord":
      return clickWordAction(state, action.index);
    case "clickGap":
      return clickGapAction(state, action.index);
  }
}
