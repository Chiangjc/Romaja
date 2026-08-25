import { dashUnit, finalizePending, tryConvert } from "./convert.js";

export type Mode = "hiragana" | "katakana";

export type JaSegment = { kind: "kana"; raw: string; hira: string; kata: string } | { kind: "literal"; text: string };

export interface JaState {
  segments: JaSegment[];
  pending: string;
}

export function initialJaState(): JaState {
  return { segments: [], pending: "" };
}

function pushUnits(segments: JaSegment[], units: { raw: string; hira: string; kata: string; literal?: boolean }[]): JaSegment[] {
  const next = segments.slice();
  for (const u of units) {
    next.push(u.literal ? { kind: "literal", text: u.raw } : { kind: "kana", raw: u.raw, hira: u.hira, kata: u.kata });
  }
  return next;
}

/**
 * 把還卡著的殘餘做最後判斷（例如結尾的 "n" 定案為 ん），
 * 無法判斷的部分原樣收進去，不讓使用者打的字憑空消失。
 * 按空白鍵、Enter、複製之前都要呼叫這個。
 */
export function finalizeState(state: JaState): JaState {
  if (state.pending === "") return state;
  const resolved = finalizePending(state.pending);
  if (resolved) {
    return { segments: pushUnits(state.segments, [resolved]), pending: "" };
  }
  return { segments: [...state.segments, { kind: "literal", text: state.pending }], pending: "" };
}

export function feedLetter(state: JaState, ch: string): JaState {
  const buffer = state.pending + ch.toLowerCase();
  const { resolved, pending } = tryConvert(buffer);
  return { segments: pushUnits(state.segments, resolved), pending };
}

export function feedDash(state: JaState): JaState {
  const flushed = finalizeState(state);
  return { segments: pushUnits(flushed.segments, [dashUnit()]), pending: "" };
}

export function feedLiteral(state: JaState, ch: string): JaState {
  const flushed = finalizeState(state);
  return { segments: [...flushed.segments, { kind: "literal", text: ch }], pending: "" };
}

export function feedBackspace(state: JaState): JaState {
  if (state.pending !== "") {
    return { segments: state.segments, pending: state.pending.slice(0, -1) };
  }
  if (state.segments.length === 0) return state;
  return { segments: state.segments.slice(0, -1), pending: "" };
}

export function toPlainText(state: JaState, mode: Mode): string {
  const body = state.segments
    .map((seg) => (seg.kind === "literal" ? seg.text : mode === "hiragana" ? seg.hira : seg.kata))
    .join("");
  return body + state.pending;
}
