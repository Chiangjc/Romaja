import { initialState, reduce, toPlainText, type Action, type ComposingState, type InputState, type Segment } from "@romanization/input-state";
import { currentLocale } from "./i18n.js";

const locale = currentLocale();

const editor = document.querySelector<HTMLDivElement>("#editor")!;
const imeWarning = document.querySelector<HTMLParagraphElement>("#ime-warning")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#copy")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clear")!;
const copyLabel = copyBtn.textContent ?? locale.copy;

let state: InputState = initialState();

function dispatch(action: Action) {
  state = reduce(state, action);
  render();
}

function renderSegment(seg: Segment, index: number): HTMLSpanElement {
  const span = document.createElement("span");
  span.dataset.segmentIndex = String(index);
  if (seg.kind === "word") {
    span.className = "segment-word";
    span.dataset.kind = "word";
    span.textContent = seg.hangul;
  } else {
    span.className = "segment-literal";
    span.dataset.kind = "literal";
    span.textContent = seg.text;
  }
  return span;
}

function renderComposing(composing: ComposingState): HTMLSpanElement {
  const wrap = document.createElement("span");
  wrap.className = "composing-wrap";

  const hasCandidate = composing.converting && composing.candidates.length > 0;
  const text = document.createElement("span");
  text.className = "composing" + (composing.converting ? "" : " frozen");
  text.textContent = hasCandidate
    ? composing.candidates[Math.min(composing.selectedIndex, composing.candidates.length - 1)].hangul
    : composing.spelling;
  wrap.appendChild(text);

  if (hasCandidate) {
    const popup = document.createElement("div");
    popup.className = "candidates";
    composing.candidates.forEach((c, i) => {
      const item = document.createElement("div");
      item.className = "candidate" + (i === composing.selectedIndex ? " selected" : "");
      item.dataset.candidateIndex = String(i);

      const hangul = document.createElement("span");
      hangul.className = "candidate-hangul";
      hangul.textContent = `${i + 1}. ${c.hangul}`;

      const spelling = document.createElement("span");
      spelling.className = "candidate-spelling";
      spelling.textContent = c.spelling;

      item.append(hangul, spelling);
      popup.appendChild(item);
    });
    wrap.appendChild(popup);
  }

  return wrap;
}

function render() {
  editor.innerHTML = "";
  const frag = document.createDocumentFragment();

  state.segments.slice(0, state.cursor).forEach((seg, i) => frag.appendChild(renderSegment(seg, i)));

  if (state.composing) {
    frag.appendChild(renderComposing(state.composing));
  } else {
    const caret = document.createElement("span");
    caret.className = "caret";
    frag.appendChild(caret);
  }

  state.segments.slice(state.cursor).forEach((seg, i) => frag.appendChild(renderSegment(seg, state.cursor + i)));

  editor.appendChild(frag);
  editor.classList.toggle("empty", state.segments.length === 0 && !state.composing);
}

editor.addEventListener("keydown", (e) => {
  if (e.isComposing) {
    imeWarning.textContent = locale.imeWarning;
    return;
  }
  imeWarning.textContent = "";

  const composing = state.composing !== null;

  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
    e.preventDefault();
    dispatch({ type: "char", char: e.key });
    return;
  }
  if (e.key === "-") {
    e.preventDefault();
    dispatch({ type: "char", char: "-" });
    return;
  }
  if (e.key === "Backspace") {
    e.preventDefault();
    dispatch({ type: "backspace" });
    return;
  }
  if (e.key === " ") {
    e.preventDefault();
    dispatch({ type: "space" });
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    dispatch({ type: "enter" });
    return;
  }
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    if (composing) e.preventDefault();
    dispatch({ type: "arrow", dir: e.key === "ArrowDown" ? "down" : "up" });
    return;
  }
  if (e.key === "Escape") {
    if (composing) e.preventDefault();
    dispatch({ type: "escape" });
    return;
  }
  if (/^[1-3]$/.test(e.key)) {
    e.preventDefault();
    if (composing) {
      dispatch({ type: "digit", n: Number(e.key) as 1 | 2 | 3 });
    } else {
      dispatch({ type: "punct", char: e.key });
    }
    return;
  }
  if (e.key.length === 1) {
    e.preventDefault();
    dispatch({ type: "punct", char: e.key });
  }
});

editor.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  const candidateEl = target.closest<HTMLElement>("[data-candidate-index]");
  if (candidateEl) {
    const n = (Number(candidateEl.dataset.candidateIndex) + 1) as 1 | 2 | 3;
    dispatch({ type: "digit", n });
    editor.focus();
    return;
  }

  const segEl = target.closest<HTMLElement>("[data-segment-index]");
  if (segEl) {
    const index = Number(segEl.dataset.segmentIndex);
    if (segEl.dataset.kind === "word") {
      dispatch({ type: "clickWord", index });
    } else {
      const rect = segEl.getBoundingClientRect();
      const before = e.clientX - rect.left < rect.width / 2;
      dispatch({ type: "clickGap", index: before ? index : index + 1 });
    }
    editor.focus();
    return;
  }

  dispatch({ type: "clickGap", index: state.segments.length });
  editor.focus();
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(toPlainText(state));
  copyBtn.textContent = locale.copied;
  setTimeout(() => (copyBtn.textContent = copyLabel), 1000);
});

clearBtn.addEventListener("click", () => {
  state = initialState();
  render();
  editor.focus();
});

document.querySelectorAll<HTMLButtonElement>("[data-example]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const word = btn.dataset.example ?? "";
    state = initialState();
    for (const ch of word) {
      state = reduce(state, { type: "char", char: ch });
    }
    render();
    editor.focus();
  });
});

render();
editor.focus();
