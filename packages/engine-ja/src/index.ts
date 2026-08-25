export { MORA_TABLE, type KanaPair } from "./table.js";
export { tryConvert, finalizePending, type ResolvedUnit } from "./convert.js";
export {
  initialJaState,
  feedLetter,
  feedDash,
  feedLiteral,
  feedBackspace,
  finalizeState,
  toPlainText,
  type JaState,
  type JaSegment,
  type Mode,
} from "./state.js";
