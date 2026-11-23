import type { ToneStyle } from "@romanization/romanize-zh";
import { currentLocale } from "./i18n.js";

const locale = currentLocale();

const input = document.querySelector<HTMLTextAreaElement>("#rz-input")!;
const output = document.querySelector<HTMLDivElement>("#rz-output")!;
const toneButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tone]"));
const interlinearToggle = document.querySelector<HTMLInputElement>("#opt-interlinear")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#copy")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clear")!;
const copyLabel = copyBtn.textContent ?? locale.copy;

let tone: ToneStyle = "mark";

// 讀音詞表加繁簡轉換有幾百 KB，等頁面先出來再載入；載好之前輸出區維持 placeholder
type Romanizer = typeof import("@romanization/romanize-zh").hanziToPinyin;
let toPinyin: Romanizer | null = null;

function romanizeLine(line: string): string {
  return toPinyin ? toPinyin(line, { tone }) : "";
}

// 逐行對照：中文一行、拼音一行，空行照留，方便對著歌詞跟唱
function outputText(): string {
  const lines = input.value.split("\n");
  if (!interlinearToggle.checked) return lines.map(romanizeLine).join("\n");
  return lines.map((line) => (line.trim() === "" ? line : `${line}\n${romanizeLine(line)}`)).join("\n");
}

function render() {
  const empty = input.value.trim() === "" || !toPinyin;
  output.classList.toggle("empty", empty);
  if (toPinyin) output.dataset.placeholder = romanizeLine(input.placeholder);
  if (empty) {
    output.textContent = "";
    return;
  }
  if (!interlinearToggle.checked) {
    output.textContent = outputText();
    return;
  }
  // 對照模式：中文行用淡色一般字體，跟拼音行分得出來；複製出去的還是純文字 outputText()
  output.replaceChildren(
    ...input.value.split("\n").flatMap((line) => {
      if (line.trim() === "") return [document.createTextNode("\n")];
      const zh = document.createElement("span");
      zh.className = "rz-src";
      zh.textContent = line + "\n";
      return [zh, document.createTextNode(romanizeLine(line) + "\n")];
    }),
  );
}

function setTone(next: ToneStyle) {
  tone = next;
  for (const btn of toneButtons) {
    const active = btn.dataset.tone === tone;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  }
  render();
}

input.addEventListener("input", render);

// 跟其他頁一樣：輸入框是空的時候按 Tab 或 Enter，直接填入範例
input.addEventListener("keydown", (e) => {
  if ((e.key === "Tab" || e.key === "Enter") && input.value === "" && !e.isComposing) {
    e.preventDefault();
    input.value = input.placeholder;
    render();
  }
});
interlinearToggle.addEventListener("change", render);
for (const btn of toneButtons) btn.addEventListener("click", () => setTone(btn.dataset.tone as ToneStyle));

copyBtn.addEventListener("click", async () => {
  if (input.value.trim() === "" || !toPinyin) return;
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
    render();
  });
});

render();
import("@romanization/romanize-zh").then((mod) => {
  toPinyin = mod.hanziToPinyin;
  render();
});
