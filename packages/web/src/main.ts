import { toHangulText } from "@romanization/engine";

const input = document.querySelector<HTMLTextAreaElement>("#input")!;
const output = document.querySelector<HTMLDivElement>("#output")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#copy")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clear")!;

function render() {
  output.textContent = toHangulText(input.value);
}

input.addEventListener("input", render);

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(output.textContent ?? "");
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
});

clearBtn.addEventListener("click", () => {
  input.value = "";
  output.textContent = "";
  input.focus();
});

render();
