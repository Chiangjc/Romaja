import {
  feedBackspace,
  feedKey,
  feedLiteral,
  finalizeState,
  initialDubeolsikState,
  toPlainText,
  type DubeolsikState,
} from "@romanization/engine-dubeolsik";
import { currentLocale } from "./i18n.js";

const locale = currentLocale();

const editor = document.querySelector<HTMLDivElement>("#editor")!;
const imeWarning = document.querySelector<HTMLParagraphElement>("#ime-warning")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#copy")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clear")!;
const copyLabel = copyBtn.textContent ?? locale.copy;

let state: DubeolsikState = initialDubeolsikState();

function dispatch(next: DubeolsikState) {
  state = next;
  render();
}

function render() {
  editor.innerHTML = "";
  const frag = document.createDocumentFragment();

  if (state.committed) {
    frag.appendChild(document.createTextNode(state.committed));
  }

  if (state.cho !== null) {
    const span = document.createElement("span");
    span.className = "composing";
    span.textContent = toPlainText(state).slice(state.committed.length);
    frag.appendChild(span);
  }

  const caret = document.createElement("span");
  caret.className = "caret";
  frag.appendChild(caret);

  editor.appendChild(frag);
  editor.classList.toggle("empty", state.committed.length === 0 && state.cho === null);
}

// 手機軟鍵盤打字、刪字是靠 beforeinput/input，不是可靠的 keydown（實體鍵盤才吃得到 keydown）。
// 放行 insertText/刪除這幾種，交給下面的 input 事件轉成 action；其餘（貼上、格式化…）一律擋掉，
// 因為 render() 每次都會整個重畫，DOM 不該被瀏覽器原生行為直接改動。
const PASSTHROUGH_INPUT_TYPES = new Set([
  "insertText",
  "insertCompositionText",
  "insertLineBreak",
  "insertParagraph",
  "deleteContentBackward",
  "deleteContentForward",
  "deleteWordBackward",
]);

editor.addEventListener("beforeinput", (e) => {
  if (PASSTHROUGH_INPUT_TYPES.has(e.inputType)) return;
  e.preventDefault();
});

editor.addEventListener("input", (e) => {
  const inputEvent = e as InputEvent;

  if (inputEvent.inputType === "deleteContentBackward" || inputEvent.inputType === "deleteWordBackward") {
    dispatch(feedBackspace(state));
    return;
  }

  if (inputEvent.inputType === "insertLineBreak" || inputEvent.inputType === "insertParagraph") {
    dispatch(finalizeState(state));
    return;
  }

  if (inputEvent.inputType !== "insertText" || !inputEvent.data) return;
  let next = state;
  for (const ch of inputEvent.data) {
    if (/[a-zA-Z]/.test(ch)) {
      const isUpper = ch >= "A" && ch <= "Z";
      next = feedKey(next, ch.toLowerCase(), isUpper);
    } else if (ch === " ") {
      next = feedLiteral(next, " ");
    } else {
      next = feedLiteral(next, ch);
    }
  }
  dispatch(next);
});

editor.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) return; // 讓 Ctrl/Cmd 組合鍵（複製、全選…）走原生行為

  if (e.isComposing) {
    imeWarning.textContent = locale.imeWarning;
    return;
  }
  imeWarning.textContent = "";

  if ((e.key === "Tab" || e.key === "Enter") && state.committed.length === 0 && state.cho === null) {
    e.preventDefault();
    const example = editor.dataset.placeholder ?? "";
    let next = state;
    for (const ch of example) {
      if (/[a-zA-Z]/.test(ch)) {
        const isUpper = ch >= "A" && ch <= "Z";
        next = feedKey(next, ch.toLowerCase(), isUpper);
      } else if (ch === " ") {
        next = feedLiteral(next, " ");
      }
    }
    dispatch(finalizeState(next));
    return;
  }

  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
    e.preventDefault();
    dispatch(feedKey(state, e.key.toLowerCase(), e.shiftKey));
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

copyBtn.addEventListener("click", async () => {
  dispatch(finalizeState(state));
  await navigator.clipboard.writeText(toPlainText(state));
  copyBtn.textContent = locale.copied;
  setTimeout(() => (copyBtn.textContent = copyLabel), 1000);
});

clearBtn.addEventListener("click", () => {
  state = initialDubeolsikState();
  render();
  editor.focus();
});

// 例句按鈕顯示的是韓文結果（方便使用者知道打出來會是什麼），實際要模擬的物理鍵位
// 放在 data-keys；跟 placeholder／Tab 自動填字用的 data-placeholder（本身就是鍵位序列）分開。
document.querySelectorAll<HTMLButtonElement>("[data-keys]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const keys = btn.dataset.keys ?? "";
    let next = initialDubeolsikState();
    for (const ch of keys) {
      if (/[a-zA-Z]/.test(ch)) {
        const isUpper = ch >= "A" && ch <= "Z";
        next = feedKey(next, ch.toLowerCase(), isUpper);
      } else if (ch === " ") {
        next = feedLiteral(next, " ");
      }
    }
    dispatch(finalizeState(next));
    editor.focus();
  });
});

render();
editor.focus();
