// 日文轉羅馬字。
//
// 漢字的讀音只能靠詞典判斷，這裡用 kuromoji（IPADIC 詞典）做形態素分析，
// 拿到每個詞的讀音之後轉成平文式羅馬字。詞典壓縮後約 17 MB，只在日文頁按需載入。
//
// 斷詞照 kuromoji 的結果，但助動詞、て形這些接在動詞後面的部分黏回前一個詞
// （行き + たい → ikitai、飲ん + で → nonde），助詞（は、が、を）各自分開。

import { isKana, kanaToRomaji } from "./kana.js";

export { kanaToRomaji, toKatakana } from "./kana.js";

/** kuromoji 回傳的 token 裡用得到的欄位。 */
export interface JaToken {
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2?: string;
  reading?: string;
  pronunciation?: string;
}

export type LongVowelStyle = "kana" | "macron";

export interface RomajiOptions {
  /**
   * kana：照假名寫，arigatou、toukyou、koohii。
   * macron：長音加符號，arigatō、tōkyō、kōhī。
   */
  longVowels?: LongVowelStyle;
}

const OPENING: Record<string, string> = { "「": '"', "『": '"', "（": "(", "【": "[", "〈": '"', "《": '"', "“": '"' };
const CLOSING: Record<string, string> = {
  "」": '"', "』": '"', "）": ")", "】": "]", "〉": '"', "》": '"', "”": '"',
  "、": ",", "。": ".", "，": ",", "．": ".", "！": "!", "？": "?", "：": ":", "；": ";", "…": "...", "‥": "..", "～": "~", "〜": "~",
  ",": ",", ".": ".", "!": "!", "?": "?", ":": ":", ";": ";", ")": ")", "]": "]",
};

// 助詞照念法寫：は → wa、へ → e、を → o
const PARTICLES: Record<string, string> = { ハ: "wa", ヘ: "e", ヲ: "o", は: "wa", へ: "e", を: "o" };

/** 這個 token 要不要黏在前一個詞後面。 */
function attaches(token: JaToken, prev: JaToken | null): boolean {
  if (!prev) return false;
  const prevIsVerbal = prev.pos === "動詞" || prev.pos === "形容詞" || prev.pos === "助動詞";
  if (token.pos === "助動詞") return prevIsVerbal || (prev.pos === "助詞" && prev.pos_detail_1 === "接続助詞");
  if (token.pos === "助詞" && token.pos_detail_1 === "接続助詞") {
    return prevIsVerbal && ["て", "で", "ば"].includes(token.surface_form);
  }
  if (token.pos === "動詞" && (token.pos_detail_1 === "非自立" || token.pos_detail_1 === "接尾")) return prev.pos === "動詞";
  if (token.pos === "形容詞" && (token.pos_detail_1 === "非自立" || token.pos_detail_1 === "接尾")) return prevIsVerbal;
  if (token.pos === "名詞" && token.pos_detail_1 === "接尾" && token.pos_detail_2 !== "人名") return prev.pos === "名詞";
  return false;
}

/** 一個 token 的假名讀音：照假名模式用 reading，長音模式用 pronunciation（ー），但 えい 保留（sensei）。 */
function tokenKana(token: JaToken, style: LongVowelStyle): string | null {
  const reading = token.reading && token.reading !== "*" ? token.reading : isKana(token.surface_form) ? token.surface_form : null;
  if (!reading) return null;
  if (style === "kana") return reading;
  const pron = token.pronunciation && token.pronunciation !== "*" ? token.pronunciation : reading;
  if ([...pron].length !== [...reading].length) return pron;
  const r = [...reading];
  return [...pron].map((ch, i) => (ch === "ー" && r[i] === "イ" ? "イ" : ch)).join("");
}

// IPADIC 把這些詞拆開或讀成少見的念法（一人 → イチ＋ニン），歌詞裡又很常見，直接指定讀音
const READING_FIXES: Record<string, string> = {
  一人: "ヒトリ",
  二人: "フタリ",
  一人一人: "ヒトリヒトリ",
};
const FIX_KEYS = Object.keys(READING_FIXES).sort((a, b) => b.length - a.length);

/** 連續幾個 token 的字面剛好是 READING_FIXES 裡的詞，就合成一個指定讀音的名詞。 */
function applyReadingFixes(tokens: JaToken[]): JaToken[] {
  const out: JaToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    let merged = false;
    for (const key of FIX_KEYS) {
      let text = "";
      let j = i;
      while (j < tokens.length && text.length < key.length) text += tokens[j++].surface_form;
      if (text !== key) continue;
      out.push({ surface_form: key, pos: "名詞", pos_detail_1: "一般", reading: READING_FIXES[key], pronunciation: READING_FIXES[key] });
      i = j - 1;
      merged = true;
      break;
    }
    if (!merged) out.push(tokens[i]);
  }
  return out;
}

type Kind = "start" | "word" | "open" | "close" | "space";

/** 把 kuromoji 的 tokens 組成一行羅馬字。 */
export function tokensToRomaji(tokens: JaToken[], options: RomajiOptions = {}): string {
  const style = options.longVowels ?? "kana";
  let out = "";
  let prev: Kind = "start";
  let prevToken: JaToken | null = null;
  tokens = applyReadingFixes(tokens);
  // 同一個詞（動詞加上黏過來的助動詞）的假名先接起來再轉，促音才接得上（だっ + た → datta）
  let pending = "";

  const flush = () => {
    if (pending) out += kanaToRomaji(pending, { macrons: style === "macron" });
    pending = "";
  };

  for (const token of tokens) {
    const surface = token.surface_form;

    if (token.pos === "記号" || /^[\s　]+$/.test(surface)) {
      flush();
      for (const ch of surface) {
        if (/[\s　]/.test(ch)) {
          if (prev === "word" || prev === "close") {
            out += " ";
            prev = "space";
          }
        } else if (ch in OPENING) {
          if (prev === "word" || prev === "close") out += " ";
          out += OPENING[ch];
          prev = "open";
        } else if (ch in CLOSING) {
          if (prev === "space") out = out.trimEnd();
          out += CLOSING[ch];
          prev = "close";
        } else if (ch === "・") {
          if (prev === "word") {
            out += " ";
            prev = "space";
          }
        } else {
          if (prev === "word" || prev === "close") out += " ";
          out += ch;
          prev = "word";
        }
      }
      prevToken = null;
      continue;
    }

    const glue = prev === "word" && attaches(token, prevToken);
    if (!glue) {
      flush();
      if (prev === "word" || prev === "close") out += " ";
    }
    if (token.pos === "助詞" && surface in PARTICLES) {
      flush();
      out += PARTICLES[surface];
    } else {
      // 詞典裡沒有、又不是假名的字（罕用漢字、英文）照原樣留著：kanaToRomaji 不認得的字元會原樣輸出
      pending += tokenKana(token, style) ?? surface;
    }
    prev = "word";
    prevToken = token;
  }
  flush();
  return out.trimEnd();
}

export interface Tokenizer {
  tokenize(text: string): JaToken[];
}

/** 載入 kuromoji 詞典。dicPath 是放 *.dat.gz 的目錄（瀏覽器用網址，Node 用檔案路徑）。 */
export async function loadTokenizer(dicPath: string): Promise<Tokenizer> {
  const kuromoji = (await import("@sglkc/kuromoji")).default ?? (await import("@sglkc/kuromoji"));
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err: unknown, tokenizer: Tokenizer) => (err ? reject(err) : resolve(tokenizer)));
  });
}

/** 一行日文轉羅馬字。 */
export function japaneseToRomaji(tokenizer: Tokenizer, line: string, options: RomajiOptions = {}): string {
  return tokensToRomaji(tokenizer.tokenize(line), options);
}
