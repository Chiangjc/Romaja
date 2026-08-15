import { CHO, JUNG, JONG } from "./tables.js";
import { decompose } from "./compose.js";

export function hangulToRoman(text: string): string {
  let result = "";
  for (const char of text) {
    const d = decompose(char);
    if (d === null) {
      result += char;
      continue;
    }
    result += CHO[d.cho].latin + JUNG[d.jung].latin + JONG[d.jong].latin;
  }
  return result;
}
