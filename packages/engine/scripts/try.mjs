import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { toHangulText } from "../dist/text.js";
import { toHangulCandidates } from "../dist/rank.js";

const rl = createInterface({ input: stdin, output: stdout });

console.log("羅馬字轉韓文（Phase 1 引擎，Ctrl+C 離開）");
console.log("整句：直接打，用空白分詞");
console.log("看候選：只打一個詞，前面加 ? ，例如 ?gaeul\n");

while (true) {
  let line;
  try {
    line = await rl.question("> ");
  } catch {
    break; // stdin 關閉（EOF / Ctrl+D）
  }
  if (line.startsWith("?")) {
    const word = line.slice(1).trim().toLowerCase();
    const candidates = toHangulCandidates(word).slice(0, 5);
    if (candidates.length === 0) {
      console.log("  (無合法切法)");
    } else {
      candidates.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
    }
  } else {
    console.log("  " + toHangulText(line));
  }
}
rl.close();
