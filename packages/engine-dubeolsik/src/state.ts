import { compose } from "./compose.js";
import {
  COMPAT_CHO,
  JONG_MERGE,
  JONG_SPLIT,
  JUNG_MERGE,
  KEY_CHO,
  KEY_CHO_SHIFT,
  KEY_JONG,
  KEY_JONG_SHIFT,
  KEY_JUNG,
  KEY_JUNG_SHIFT,
} from "./tables.js";

export interface DubeolsikState {
  /** 已經定案、不會再變動的文字。 */
  committed: string;
  /** 正在組的字：三個都是 null 代表沒有任何東西在組。 */
  cho: number | null;
  jung: number | null;
  jong: number | null;
}

export function initialDubeolsikState(): DubeolsikState {
  return { committed: "", cho: null, jung: null, jong: null };
}

/** 把目前正在組的字轉成文字，cho 沒母音接住就退化成獨立字母。 */
function flushComposing(state: DubeolsikState): string {
  if (state.cho === null) return state.committed;
  if (state.jung === null) return state.committed + (COMPAT_CHO[state.cho] ?? "");
  return state.committed + compose(state.cho, state.jung, state.jong ?? 0);
}

function feedConsonant(state: DubeolsikState, key: string, shift: boolean): DubeolsikState {
  const choIndex = shift ? KEY_CHO_SHIFT[key] : KEY_CHO[key];
  if (choIndex === undefined) return state;
  const jongIndex = shift ? KEY_JONG_SHIFT[key] : KEY_JONG[key];

  // 還沒開始組字：這個子音當新字的初聲。
  if (state.cho === null) {
    return { committed: state.committed, cho: choIndex, jung: null, jong: null };
  }

  // 有初聲、還沒母音：前一個子音接不下去了，退化成獨立字母收掉，這個子音重新開始一個字。
  if (state.jung === null) {
    return {
      committed: state.committed + (COMPAT_CHO[state.cho] ?? ""),
      cho: choIndex,
      jung: null,
      jong: null,
    };
  }

  // 有初聲、中聲，還沒終聲：這個子音先「暫定」當終聲，之後可能又被母音搶走變下一個字的初聲。
  if (state.jong === null) {
    if (jongIndex === undefined) {
      // 這個子音沒辦法當終聲（ㅃ／ㄸ／ㅉ）：目前的字直接定案，新字重新開始。
      return {
        committed: state.committed + compose(state.cho, state.jung, 0),
        cho: choIndex,
        jung: null,
        jong: null,
      };
    }
    return { ...state, jong: jongIndex };
  }

  // 已經有終聲：看能不能跟這個子音合併成複合終聲（ㄱ+ㅅ→ㄳ 之類）。
  const merged = jongIndex !== undefined ? JONG_MERGE[`${state.jong},${jongIndex}`] : undefined;
  if (merged !== undefined) {
    return { ...state, jong: merged };
  }

  // 合併不了：目前的字定案，新字重新開始。
  return {
    committed: state.committed + compose(state.cho, state.jung, state.jong),
    cho: choIndex,
    jung: null,
    jong: null,
  };
}

function feedVowel(state: DubeolsikState, key: string, shift: boolean): DubeolsikState {
  const jungIndex = shift ? KEY_JUNG_SHIFT[key] : KEY_JUNG[key];
  if (jungIndex === undefined) return state;

  // 完全空白：這個母音自己開一個字，初聲用隱形的 ㅇ（index 11）。
  if (state.cho === null) {
    return { committed: state.committed, cho: 11, jung: jungIndex, jong: null };
  }

  // 有初聲、還沒中聲：這個母音就是中聲。
  if (state.jung === null) {
    return { ...state, jung: jungIndex };
  }

  // 有初聲、中聲，還沒終聲：看能不能跟目前的中聲合併成複合母音（ㅗ+ㅏ→ㅘ 之類）。
  if (state.jong === null) {
    const merged = JUNG_MERGE[`${state.jung},${jungIndex}`];
    if (merged !== undefined) {
      return { ...state, jung: merged };
    }
    return {
      committed: state.committed + compose(state.cho, state.jung, 0),
      cho: 11,
      jung: jungIndex,
      jong: null,
    };
  }

  // 已經有終聲：終聲要拆給下一個字當初聲——單一終聲整個移過去，複合終聲只移走後半部件。
  const [remainingJong, nextCho] = JONG_SPLIT[state.jong] ?? [0, 11];
  return {
    committed: state.committed + compose(state.cho, state.jung, remainingJong),
    cho: nextCho,
    jung: jungIndex,
    jong: null,
  };
}

/**
 * 餵一個物理鍵位（不分大小寫的字母鍵）進去，回傳新的 state。
 * 不是 두벌식 認得的鍵（標點、空白、數字…）原樣退回，呼叫端自己用 feedLiteral 處理。
 */
export function feedKey(state: DubeolsikState, key: string, shift: boolean): DubeolsikState {
  const lower = key.toLowerCase();
  if (lower in KEY_CHO) {
    return feedConsonant(state, lower, shift);
  }
  if (lower in KEY_JUNG) {
    return feedVowel(state, lower, shift);
  }
  return state;
}

/** 空白、標點、數字這類非 두벌식 字母鍵：先把正在組的字定案，再接上這個字元。 */
export function feedLiteral(state: DubeolsikState, ch: string): DubeolsikState {
  return { committed: flushComposing(state) + ch, cho: null, jung: null, jong: null };
}

export function feedBackspace(state: DubeolsikState): DubeolsikState {
  if (state.jong !== null) return { ...state, jong: null };
  if (state.jung !== null) return { ...state, jung: null };
  if (state.cho !== null) return { ...state, cho: null };
  if (state.committed.length === 0) return state;
  return { ...state, committed: state.committed.slice(0, -1) };
}

/** 把正在組的字定案（例如按 Enter、失焦、複製之前）。 */
export function finalizeState(state: DubeolsikState): DubeolsikState {
  return { committed: flushComposing(state), cho: null, jung: null, jong: null };
}

export function toPlainText(state: DubeolsikState): string {
  return flushComposing(state);
}
