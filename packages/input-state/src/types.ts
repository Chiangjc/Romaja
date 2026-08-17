export interface Candidate {
  hangul: string;
  spelling: string; // 標示切法，例如 "ga-eul"
}

export type Segment =
  | { kind: "word"; spelling: string; hangul: string }
  | { kind: "literal"; text: string };

export interface ComposingState {
  spelling: string;
  converting: boolean;
  candidates: Candidate[];
  selectedIndex: number;
}

export interface InputState {
  segments: Segment[];
  cursor: number;
  composing: ComposingState | null;
}

export type Action =
  | { type: "char"; char: string }
  | { type: "backspace" }
  | { type: "space" }
  | { type: "enter" }
  | { type: "arrow"; dir: "up" | "down" }
  | { type: "digit"; n: 1 | 2 | 3 }
  | { type: "escape" }
  | { type: "punct"; char: string }
  | { type: "clickWord"; index: number }
  | { type: "clickGap"; index: number };
