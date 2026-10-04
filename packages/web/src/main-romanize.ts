import { hangulToPronunciation, hangulToRoman } from "@romanization/engine";
import { carryOnSwap, takeCarried } from "./carry.js";
import { currentLocale } from "./i18n.js";

type Mode = "pronunciation" | "spelling";

const locale = currentLocale();

const input = document.querySelector<HTMLTextAreaElement>("#rz-input")!;
const output = document.querySelector<HTMLDivElement>("#rz-output")!;
const pronBtn = document.querySelector<HTMLButtonElement>("#mode-pron")!;
const spellBtn = document.querySelector<HTMLButtonElement>("#mode-spell")!;
const syllableToggle = document.querySelector<HTMLInputElement>("#opt-syllable")!;
const interlinearToggle = document.querySelector<HTMLInputElement>("#opt-interlinear")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#copy")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clear")!;
const copyLabel = copyBtn.textContent ?? locale.copy;

let mode: Mode = "spelling";

function romanizeLine(line: string): string {
  const separator = syllableToggle.checked ? "-" : "";
  if (mode === "pronunciation") return hangulToPronunciation(line, { separator });
  // 拼寫模式沒有音變，音節分隔就是在連續的韓文音節之間逐字加分隔字元
  return line.replace(/[가-힣]+/g, (word) => [...word].map(hangulToRoman).join(separator));
}

// 逐行對照：韓文一行、羅馬字一行，空行照留，方便對著歌詞跟唱
function outputText(): string {
  const lines = input.value.split("\n");
  if (!interlinearToggle.checked) return lines.map(romanizeLine).join("\n");
  return lines.map((line) => (line.trim() === "" ? line : `${line}\n${romanizeLine(line)}`)).join("\n");
}

function render() {
  output.classList.toggle("empty", input.value.trim() === "");
  // 輸出區的 placeholder 跟著模式、選項變，對得上輸入框的範例
  output.dataset.placeholder = romanizeLine(input.placeholder);
  if (!interlinearToggle.checked) {
    output.textContent = outputText();
    return;
  }
  // 對照模式：韓文行用淡色一般字體，跟羅馬拼音行分得出來；複製出去的還是純文字 outputText()
  output.replaceChildren(
    ...input.value.split("\n").flatMap((line) => {
      if (line.trim() === "") return [document.createTextNode("\n")];
      const ko = document.createElement("span");
      ko.className = "rz-ko";
      ko.textContent = line + "\n";
      return [ko, document.createTextNode(romanizeLine(line) + "\n")];
    }),
  );
}

function setMode(next: Mode) {
  mode = next;
  pronBtn.classList.toggle("active", mode === "pronunciation");
  spellBtn.classList.toggle("active", mode === "spelling");
  pronBtn.setAttribute("aria-pressed", String(mode === "pronunciation"));
  spellBtn.setAttribute("aria-pressed", String(mode === "spelling"));
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
syllableToggle.addEventListener("change", render);
interlinearToggle.addEventListener("change", render);
pronBtn.addEventListener("click", () => setMode("pronunciation"));
spellBtn.addEventListener("click", () => setMode("spelling"));

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

// 從鍵盤頁按 ⇄ 過來時，帶入那邊打好的韓文
const carried = takeCarried();
if (carried) input.value = carried;
carryOnSwap(() => input.value);

render();
