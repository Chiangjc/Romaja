import type { LongVowelStyle, Tokenizer } from "@romanization/romanize-ja";
import { currentLocale } from "./i18n.js";

const locale = currentLocale();

const input = document.querySelector<HTMLTextAreaElement>("#rz-input")!;
const output = document.querySelector<HTMLDivElement>("#rz-output")!;
const styleButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-long]"));
const interlinearToggle = document.querySelector<HTMLInputElement>("#opt-interlinear")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#copy")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clear")!;
const copyLabel = copyBtn.textContent ?? locale.copy;
const defaultPlaceholder = output.dataset.placeholder ?? "";

let longVowels: LongVowelStyle = "kana";

// 漢字讀音要靠 kuromoji 的詞典，壓縮後約 17 MB。只看一眼就離開的人不用下載，
// 所以等使用者開始互動（點輸入框、貼上、點範例）才載入。
type Romanize = typeof import("@romanization/romanize-ja").japaneseToRomaji;
let romanize: { fn: Romanize; tokenizer: Tokenizer } | null = null;
let loading: Promise<void> | null = null;
let failed = false;

function ensureLoaded() {
  loading ??= (async () => {
    render();
    const mod = await import("@romanization/romanize-ja");
    const tokenizer = await mod.loadTokenizer("/dict/ja/");
    romanize = { fn: mod.japaneseToRomaji, tokenizer };
  })()
    .catch(() => {
      failed = true;
    })
    .finally(render);
}

function romanizeLine(line: string): string {
  return romanize ? romanize.fn(romanize.tokenizer, line, { longVowels }) : "";
}

// 逐行對照：日文一行、羅馬字一行，空行照留，方便對著歌詞跟唱
function outputText(): string {
  const lines = input.value.split("\n");
  if (!interlinearToggle.checked) return lines.map(romanizeLine).join("\n");
  return lines.map((line) => (line.trim() === "" ? line : `${line}\n${romanizeLine(line)}`)).join("\n");
}

function render() {
  if (failed) output.dataset.placeholder = locale.loadFailed;
  else if (loading && !romanize) output.dataset.placeholder = locale.loadingDict;
  else if (romanize) output.dataset.placeholder = romanizeLine(input.placeholder);
  else output.dataset.placeholder = defaultPlaceholder;

  const empty = input.value.trim() === "" || !romanize;
  output.classList.toggle("empty", empty);
  if (empty) {
    output.textContent = "";
    return;
  }
  if (!interlinearToggle.checked) {
    output.textContent = outputText();
    return;
  }
  // 對照模式：日文行用淡色一般字體，跟羅馬字行分得出來；複製出去的還是純文字 outputText()
  output.replaceChildren(
    ...input.value.split("\n").flatMap((line) => {
      if (line.trim() === "") return [document.createTextNode("\n")];
      const src = document.createElement("span");
      src.className = "rz-src";
      src.textContent = line + "\n";
      return [src, document.createTextNode(romanizeLine(line) + "\n")];
    }),
  );
}

function setStyle(next: LongVowelStyle) {
  longVowels = next;
  for (const btn of styleButtons) {
    const active = btn.dataset.long === longVowels;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  }
  render();
}

input.addEventListener("focus", ensureLoaded);
input.addEventListener("input", () => {
  ensureLoaded();
  render();
});

// 跟其他頁一樣：輸入框是空的時候按 Tab 或 Enter，直接填入範例
input.addEventListener("keydown", (e) => {
  if ((e.key === "Tab" || e.key === "Enter") && input.value === "" && !e.isComposing) {
    e.preventDefault();
    input.value = input.placeholder;
    ensureLoaded();
    render();
  }
});
interlinearToggle.addEventListener("change", render);
for (const btn of styleButtons) btn.addEventListener("click", () => setStyle(btn.dataset.long as LongVowelStyle));

copyBtn.addEventListener("click", async () => {
  if (input.value.trim() === "" || !romanize) return;
  await navigator.clipboard.writeText(outputText());
  copyBtn.textContent = locale.copied;
  setTimeout(() => (copyBtn.textContent = copyLabel), 1000);
});

clearBtn.addEventListener("click", () => {
  input.value = "";
  render();
  input.focus();
});

document.querySelectorAll<HTMLButtonElement>("[data-example]").forEach((btn) => {
  btn.addEventListener("click", () => {
    input.value = btn.dataset.example!;
    ensureLoaded();
    render();
  });
});

render();
