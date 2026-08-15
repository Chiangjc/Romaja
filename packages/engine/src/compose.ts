import { CHO, JUNG, JONG } from "./tables.js";

export const SYLLABLE_BASE = 0xac00;
export const SYLLABLE_END = 0xd7a3;

export interface Decomposed {
  cho: number;
  jung: number;
  jong: number;
}

export function compose(cho: number, jung: number, jong: number): string {
  const codepoint = SYLLABLE_BASE + cho * (JUNG.length * JONG.length) + jung * JONG.length + jong;
  return String.fromCodePoint(codepoint);
}

export function decompose(char: string): Decomposed | null {
  const codepoint = char.codePointAt(0);
  if (codepoint === undefined || codepoint < SYLLABLE_BASE || codepoint > SYLLABLE_END) {
    return null;
  }
  const offset = codepoint - SYLLABLE_BASE;
  const cho = Math.floor(offset / (JUNG.length * JONG.length));
  const jung = Math.floor((offset % (JUNG.length * JONG.length)) / JONG.length);
  const jong = offset % JONG.length;
  return { cho, jung, jong };
}
