// 片假名轉羅馬字，修正式平文式（Hepburn）：shi、chi、tsu、fu、ji。
// 平假名先轉成片假名再查表，外來語的小字母組合（ティ、ファ、ヴァ）也一起處理。

const DIGRAPHS: Record<string, string> = {
  キャ: "kya", キュ: "kyu", キョ: "kyo", シャ: "sha", シュ: "shu", ショ: "sho", シェ: "she",
  チャ: "cha", チュ: "chu", チョ: "cho", チェ: "che", ニャ: "nya", ニュ: "nyu", ニョ: "nyo",
  ヒャ: "hya", ヒュ: "hyu", ヒョ: "hyo", ミャ: "mya", ミュ: "myu", ミョ: "myo",
  リャ: "rya", リュ: "ryu", リョ: "ryo", ギャ: "gya", ギュ: "gyu", ギョ: "gyo",
  ジャ: "ja", ジュ: "ju", ジョ: "jo", ジェ: "je", ヂャ: "ja", ヂュ: "ju", ヂョ: "jo",
  ビャ: "bya", ビュ: "byu", ビョ: "byo", ピャ: "pya", ピュ: "pyu", ピョ: "pyo",
  ティ: "ti", ディ: "di", トゥ: "tu", ドゥ: "du", テュ: "tyu", デュ: "dyu",
  ファ: "fa", フィ: "fi", フェ: "fe", フォ: "fo", フュ: "fyu",
  ウィ: "wi", ウェ: "we", ウォ: "wo", イェ: "ye", ツァ: "tsa", ツィ: "tsi", ツェ: "tse", ツォ: "tso",
  ヴァ: "va", ヴィ: "vi", ヴェ: "ve", ヴォ: "vo", ヴュ: "vyu", クァ: "kwa", グァ: "gwa",
};

const MONOGRAPHS: Record<string, string> = {
  ア: "a", イ: "i", ウ: "u", エ: "e", オ: "o",
  カ: "ka", キ: "ki", ク: "ku", ケ: "ke", コ: "ko", ガ: "ga", ギ: "gi", グ: "gu", ゲ: "ge", ゴ: "go",
  サ: "sa", シ: "shi", ス: "su", セ: "se", ソ: "so", ザ: "za", ジ: "ji", ズ: "zu", ゼ: "ze", ゾ: "zo",
  タ: "ta", チ: "chi", ツ: "tsu", テ: "te", ト: "to", ダ: "da", ヂ: "ji", ヅ: "zu", デ: "de", ド: "do",
  ナ: "na", ニ: "ni", ヌ: "nu", ネ: "ne", ノ: "no",
  ハ: "ha", ヒ: "hi", フ: "fu", ヘ: "he", ホ: "ho", バ: "ba", ビ: "bi", ブ: "bu", ベ: "be", ボ: "bo",
  パ: "pa", ピ: "pi", プ: "pu", ペ: "pe", ポ: "po",
  マ: "ma", ミ: "mi", ム: "mu", メ: "me", モ: "mo", ヤ: "ya", ユ: "yu", ヨ: "yo",
  ラ: "ra", リ: "ri", ル: "ru", レ: "re", ロ: "ro", ワ: "wa", ヰ: "i", ヱ: "e", ヲ: "o", ン: "n", ヴ: "vu",
  ァ: "a", ィ: "i", ゥ: "u", ェ: "e", ォ: "o", ャ: "ya", ュ: "yu", ョ: "yo", ヮ: "wa", ヵ: "ka", ヶ: "ke",
};

const MACRON: Record<string, string> = { a: "ā", i: "ī", u: "ū", e: "ē", o: "ō" };

/** 平假名轉片假名（ぁ–ゖ 往後平移 0x60），其他字元不動。 */
export function toKatakana(text: string): string {
  return text.replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

export function isKana(text: string): boolean {
  return /^[ぁ-ゖァ-ヺー]+$/.test(text);
}

export interface KanaOptions {
  /** true：長音 ー 寫成 ā ō；false：重複母音 aa oo */
  macrons?: boolean;
}

/** 一段假名轉羅馬字。非假名字元照原樣留著。 */
export function kanaToRomaji(kana: string, options: KanaOptions = {}): string {
  const chars = [...toKatakana(kana)];
  let out = "";
  let geminate = false;
  for (let i = 0; i < chars.length; i++) {
    const pair = chars[i] + (chars[i + 1] ?? "");
    let roma: string | undefined;
    if (DIGRAPHS[pair]) {
      roma = DIGRAPHS[pair];
      i++;
    } else if (chars[i] === "ッ") {
      geminate = true;
      continue;
    } else if (chars[i] === "ー") {
      const last = out.at(-1) ?? "";
      if (last in MACRON) out = options.macrons ? out.slice(0, -1) + MACRON[last] : out + last;
      continue;
    } else {
      roma = MONOGRAPHS[chars[i]];
    }
    if (roma === undefined) {
      if (geminate) geminate = false;
      out += chars[i];
      continue;
    }
    // ん 後面接母音或 y 要加 '，才分得出 kan'i（簡易）和 kani（蟹）
    if (out.endsWith("n") && chars[i - 1] === "ン" && /^[aiueoy]/.test(roma)) out += "'";
    if (geminate) {
      // 促音：重複下一個子音，ch 前面寫 t（matcha）
      if (roma.startsWith("ch")) out += "t";
      else if (/^[^aiueo]/.test(roma)) out += roma[0];
      geminate = false;
    }
    out += roma;
  }
  return out;
}
