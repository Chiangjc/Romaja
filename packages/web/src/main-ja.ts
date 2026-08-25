import {
  feedBackspace,
  feedDash,
  feedLetter,
  feedLiteral,
  finalizeState,
  initialJaState,
  toPlainText,
  type JaState,
  type Mode,
} from "@romanization/engine-ja";
import { currentLocale } from "./i18n.js";

const locale = currentLocale();

const editor = document.querySelector<HTMLDivElement>("#editor")!;
const imeWarning = document.querySelector<HTMLParagraphElement>("#ime-warning")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#copy")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clear")!;
const hiraBtn = document.querySelector<HTMLButtonElement>("#mode-hira")!;
const kataBtn = document.querySelector<HTMLButtonElement>("#mode-kata")!;
const copyLabel = copyBtn.textContent ?? "";

let state: JaState = initialJaState();
let mode: Mode = "hiragana";

function dispatch(next: JaState) {
  state = next;
  render();
}

function setMode(next: Mode) {
  mode = next;
  hiraBtn.classList.toggle("active", mode === "hiragana");
  kataBtn.classList.toggle("active", mode === "katakana");
  hiraBtn.setAttribute("aria-pressed", String(mode === "hiragana"));
  kataBtn.setAttribute("aria-pressed", String(mode === "katakana"));
  render();
}

function render() {
  editor.innerHTML = "";
  const frag = document.createDocumentFragment();

  const confirmedText = toPlainText({ segments: state.segments, pending: "" }, mode);
  if (confirmedText) {
    frag.appendChild(document.createTextNode(confirmedText));
  }

  if (state.pending) {
    const pendingSpan = document.createElement("span");
    pendingSpan.className = "composing";
    pendingSpan.textContent = state.pending;
    frag.appendChild(pendingSpan);
  }

  const caret = document.createElement("span");
  caret.className = "caret";
  frag.appendChild(caret);

  editor.appendChild(frag);
  editor.classList.toggle("empty", state.segments.length === 0 && !state.pending);
}

editor.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) return; // 讓 Ctrl/Cmd 組合鍵（複製、全選…）走原生行為

  if (e.isComposing) {
    imeWarning.textContent = locale.imeWarning;
    return;
  }
  imeWarning.textContent = "";

  if (e.key.length === 1 && /[a-zA-Z']/.test(e.key)) {
    e.preventDefault();
    dispatch(feedLetter(state, e.key));
    return;
  }
  if (e.key === "-") {
    e.preventDefault();
    dispatch(feedDash(state));
    return;
  }
  if (e.key === "Backspace") {
    e.preventDefault();
    dispatch(feedBackspace(state));
    return;
  }
  if (e.key === " ") {
    e.preventDefault();
    dispatch(feedLiteral(state, " "));
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    dispatch(finalizeState(state));
    return;
  }
  if (e.key.length === 1) {
    e.preventDefault();
    dispatch(feedLiteral(state, e.key));
  }
});

hiraBtn.addEventListener("click", () => setMode("hiragana"));
kataBtn.addEventListener("click", () => setMode("katakana"));

copyBtn.addEventListener("click", async () => {
  dispatch(finalizeState(state));
  await navigator.clipboard.writeText(toPlainText(state, mode));
  copyBtn.textContent = locale.copied;
  setTimeout(() => (copyBtn.textContent = copyLabel), 1000);
});

clearBtn.addEventListener("click", () => {
  state = initialJaState();
  render();
  editor.focus();
});

document.querySelectorAll<HTMLButtonElement>("[data-example]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const word = btn.dataset.example ?? "";
    let next = initialJaState();
    for (const ch of word) {
      next = feedLetter(next, ch);
    }
    dispatch(finalizeState(next));
    editor.focus();
  });
});

render();
editor.focus();
