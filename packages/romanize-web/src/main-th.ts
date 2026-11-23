import { thaiToRoman } from "@romanization/romanize-th";
import { currentLocale } from "./i18n.js";

const locale = currentLocale();

const input = document.querySelector<HTMLTextAreaElement>("#rz-input")!;
const output = document.querySelector<HTMLDivElement>("#rz-output")!;
const sepButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-sep]"));
const interlinearToggle = document.querySelector<HTMLInputElement>("#opt-interlinear")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#copy")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clear")!;
const copyLabel = copyBtn.textContent ?? locale.copy;

// 切詞用瀏覽器內建的 Intl.Segmenter，音節規則只有十幾 KB，不必延後載入
let hyphenate = true;

function romanizeLine(line: string): string {
  return thaiToRoman(line, { hyphenate });
}

// 逐行對照：泰文一行、羅馬拼音一行，空行照留，方便對著歌詞跟唱
function outputText(): string {
  const lines = input.value.split("\n");
  if (!interlinearToggle.checked) return lines.map(romanizeLine).join("\n");
  return lines.map((line) => (line.trim() === "" ? line : `${line}\n${romanizeLine(line)}`)).join("\n");
}

function render() {
  const empty = input.value.trim() === "";
  output.classList.toggle("empty", empty);
  output.dataset.placeholder = romanizeLine(input.placeholder);
  if (empty) {
    output.textContent = "";
    return;
  }
  if (!interlinearToggle.checked) {
    output.textContent = outputText();
    return;
  }
  // 對照模式：泰文行用淡色一般字體，跟拼音行分得出來；複製出去的還是純文字 outputText()
  output.replaceChildren(
    ...input.value.split("\n").flatMap((line) => {
      if (line.trim() === "") return [document.createTextNode("\n")];
      const th = document.createElement("span");
      th.className = "rz-src";
      th.textContent = line + "\n";
      return [th, document.createTextNode(romanizeLine(line) + "\n")];
    }),
  );
}

function setSep(next: boolean) {
  hyphenate = next;
  for (const btn of sepButtons) {
    const active = (btn.dataset.sep === "hyphen") === hyphenate;
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
for (const btn of sepButtons) btn.addEventListener("click", () => setSep(btn.dataset.sep === "hyphen"));

copyBtn.addEventListener("click", async () => {
  if (input.value.trim() === "") return;
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
