export interface KanaPair {
  hira: string;
  kata: string;
}

/**
 * 羅馬字 → 假名，key 最長 3 個字元。這是日本人自己打日文常用的羅馬字輸入表，
 * 同一個音故意收錄多種常見拼法（shi/si、chi/ti、tsu/tu、fu/hu、ja/zya/jya…），
 * 跟市面上的日文輸入法行為一致。
 */
export const MORA_TABLE: Record<string, KanaPair> = {
  a: { hira: "あ", kata: "ア" },
  i: { hira: "い", kata: "イ" },
  u: { hira: "う", kata: "ウ" },
  e: { hira: "え", kata: "エ" },
  o: { hira: "お", kata: "オ" },

  ka: { hira: "か", kata: "カ" },
  ki: { hira: "き", kata: "キ" },
  ku: { hira: "く", kata: "ク" },
  ke: { hira: "け", kata: "ケ" },
  ko: { hira: "こ", kata: "コ" },
  kya: { hira: "きゃ", kata: "キャ" },
  kyu: { hira: "きゅ", kata: "キュ" },
  kyo: { hira: "きょ", kata: "キョ" },

  ga: { hira: "が", kata: "ガ" },
  gi: { hira: "ぎ", kata: "ギ" },
  gu: { hira: "ぐ", kata: "グ" },
  ge: { hira: "げ", kata: "ゲ" },
  go: { hira: "ご", kata: "ゴ" },
  gya: { hira: "ぎゃ", kata: "ギャ" },
  gyu: { hira: "ぎゅ", kata: "ギュ" },
  gyo: { hira: "ぎょ", kata: "ギョ" },

  sa: { hira: "さ", kata: "サ" },
  shi: { hira: "し", kata: "シ" },
  si: { hira: "し", kata: "シ" },
  su: { hira: "す", kata: "ス" },
  se: { hira: "せ", kata: "セ" },
  so: { hira: "そ", kata: "ソ" },
  sha: { hira: "しゃ", kata: "シャ" },
  sya: { hira: "しゃ", kata: "シャ" },
  shu: { hira: "しゅ", kata: "シュ" },
  syu: { hira: "しゅ", kata: "シュ" },
  sho: { hira: "しょ", kata: "ショ" },
  syo: { hira: "しょ", kata: "ショ" },

  za: { hira: "ざ", kata: "ザ" },
  ji: { hira: "じ", kata: "ジ" },
  zi: { hira: "じ", kata: "ジ" },
  zu: { hira: "ず", kata: "ズ" },
  ze: { hira: "ぜ", kata: "ゼ" },
  zo: { hira: "ぞ", kata: "ゾ" },
  ja: { hira: "じゃ", kata: "ジャ" },
  zya: { hira: "じゃ", kata: "ジャ" },
  jya: { hira: "じゃ", kata: "ジャ" },
  ju: { hira: "じゅ", kata: "ジュ" },
  zyu: { hira: "じゅ", kata: "ジュ" },
  jyu: { hira: "じゅ", kata: "ジュ" },
  jo: { hira: "じょ", kata: "ジョ" },
  zyo: { hira: "じょ", kata: "ジョ" },
  jyo: { hira: "じょ", kata: "ジョ" },

  ta: { hira: "た", kata: "タ" },
  chi: { hira: "ち", kata: "チ" },
  ti: { hira: "ち", kata: "チ" },
  tsu: { hira: "つ", kata: "ツ" },
  tu: { hira: "つ", kata: "ツ" },
  te: { hira: "て", kata: "テ" },
  to: { hira: "と", kata: "ト" },
  cha: { hira: "ちゃ", kata: "チャ" },
  tya: { hira: "ちゃ", kata: "チャ" },
  chu: { hira: "ちゅ", kata: "チュ" },
  tyu: { hira: "ちゅ", kata: "チュ" },
  cho: { hira: "ちょ", kata: "チョ" },
  tyo: { hira: "ちょ", kata: "チョ" },

  da: { hira: "だ", kata: "ダ" },
  di: { hira: "ぢ", kata: "ヂ" },
  du: { hira: "づ", kata: "ヅ" },
  de: { hira: "で", kata: "デ" },
  do: { hira: "ど", kata: "ド" },
  dya: { hira: "ぢゃ", kata: "ヂャ" },
  dyu: { hira: "ぢゅ", kata: "ヂュ" },
  dyo: { hira: "ぢょ", kata: "ヂョ" },

  na: { hira: "な", kata: "ナ" },
  ni: { hira: "に", kata: "ニ" },
  nu: { hira: "ぬ", kata: "ヌ" },
  ne: { hira: "ね", kata: "ネ" },
  no: { hira: "の", kata: "ノ" },
  nya: { hira: "にゃ", kata: "ニャ" },
  nyu: { hira: "にゅ", kata: "ニュ" },
  nyo: { hira: "にょ", kata: "ニョ" },

  ha: { hira: "は", kata: "ハ" },
  hi: { hira: "ひ", kata: "ヒ" },
  fu: { hira: "ふ", kata: "フ" },
  hu: { hira: "ふ", kata: "フ" },
  he: { hira: "へ", kata: "ヘ" },
  ho: { hira: "ほ", kata: "ホ" },
  hya: { hira: "ひゃ", kata: "ヒャ" },
  hyu: { hira: "ひゅ", kata: "ヒュ" },
  hyo: { hira: "ひょ", kata: "ヒョ" },

  ba: { hira: "ば", kata: "バ" },
  bi: { hira: "び", kata: "ビ" },
  bu: { hira: "ぶ", kata: "ブ" },
  be: { hira: "べ", kata: "ベ" },
  bo: { hira: "ぼ", kata: "ボ" },
  bya: { hira: "びゃ", kata: "ビャ" },
  byu: { hira: "びゅ", kata: "ビュ" },
  byo: { hira: "びょ", kata: "ビョ" },

  pa: { hira: "ぱ", kata: "パ" },
  pi: { hira: "ぴ", kata: "ピ" },
  pu: { hira: "ぷ", kata: "プ" },
  pe: { hira: "ぺ", kata: "ペ" },
  po: { hira: "ぽ", kata: "ポ" },
  pya: { hira: "ぴゃ", kata: "ピャ" },
  pyu: { hira: "ぴゅ", kata: "ピュ" },
  pyo: { hira: "ぴょ", kata: "ピョ" },

  ma: { hira: "ま", kata: "マ" },
  mi: { hira: "み", kata: "ミ" },
  mu: { hira: "む", kata: "ム" },
  me: { hira: "め", kata: "メ" },
  mo: { hira: "も", kata: "モ" },
  mya: { hira: "みゃ", kata: "ミャ" },
  myu: { hira: "みゅ", kata: "ミュ" },
  myo: { hira: "みょ", kata: "ミョ" },

  ya: { hira: "や", kata: "ヤ" },
  yu: { hira: "ゆ", kata: "ユ" },
  yo: { hira: "よ", kata: "ヨ" },

  ra: { hira: "ら", kata: "ラ" },
  ri: { hira: "り", kata: "リ" },
  ru: { hira: "る", kata: "ル" },
  re: { hira: "れ", kata: "レ" },
  ro: { hira: "ろ", kata: "ロ" },
  rya: { hira: "りゃ", kata: "リャ" },
  ryu: { hira: "りゅ", kata: "リュ" },
  ryo: { hira: "りょ", kata: "リョ" },

  wa: { hira: "わ", kata: "ワ" },
  wo: { hira: "を", kata: "ヲ" },
};

export const CHOONPU: KanaPair = { hira: "ー", kata: "ー" };
export const SOKUON: KanaPair = { hira: "っ", kata: "ッ" };
export const HATSUON: KanaPair = { hira: "ん", kata: "ン" };
