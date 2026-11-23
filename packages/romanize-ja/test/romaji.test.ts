import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { japaneseToRomaji, kanaToRomaji, loadTokenizer, type Tokenizer } from "../src/index.js";

const require = createRequire(import.meta.url);
const dicPath = join(dirname(require.resolve("@sglkc/kuromoji/package.json")), "dict") + "/";

let tokenizer: Tokenizer;
beforeAll(async () => {
  tokenizer = await loadTokenizer(dicPath);
}, 30_000);

const ja = (s: string, longVowels: "kana" | "macron" = "kana") => japaneseToRomaji(tokenizer, s, { longVowels });

describe("kanaToRomaji", () => {
  it("平文式拼法", () => {
    expect(kanaToRomaji("しんじつ")).toBe("shinjitsu");
    expect(kanaToRomaji("ちょっと")).toBe("chotto");
    expect(kanaToRomaji("まっちゃ")).toBe("matcha");
    expect(kanaToRomaji("ふじさん")).toBe("fujisan");
    expect(kanaToRomaji("きんえん")).toBe("kin'en");
    expect(kanaToRomaji("パーティー")).toBe("paatii");
    expect(kanaToRomaji("パーティー", { macrons: true })).toBe("pātī");
    expect(kanaToRomaji("ヴァイオリン")).toBe("vaiorin");
  });
});

describe("japaneseToRomaji", () => {
  it("漢字照詞典讀音", () => {
    expect(ja("君の名前は何ですか")).toBe("kimi no namae wa nani desu ka");
    expect(ja("今日は雨")).toBe("kyou wa ame");
    expect(ja("明日も")).toBe("ashita mo");
    expect(ja("一人で歩く")).toBe("hitori de aruku");
    expect(ja("二人の未来")).toBe("futari no mirai");
  });

  it("助詞照念法：は wa、へ e、を o", () => {
    expect(ja("僕は君が好きだった")).toBe("boku wa kimi ga suki datta");
    expect(ja("夢を見ていた")).toBe("yume o mite ita");
    expect(ja("東京へ行く")).toBe("toukyou e iku");
  });

  it("助動詞、て形黏在動詞後面", () => {
    expect(ja("東京に行きたいと思う")).toBe("toukyou ni ikitai to omou");
    expect(ja("ありがとうございました")).toBe("arigatou gozaimashita");
    expect(ja("愛してる")).toBe("aishiteru");
    expect(ja("一緒に帰ろう")).toBe("issho ni kaerou");
  });

  it("長音符號模式", () => {
    expect(ja("ありがとう", "macron")).toBe("arigatō");
    expect(ja("東京に行きたいと思う", "macron")).toBe("tōkyō ni ikitai to omou");
    expect(ja("先生", "macron")).toBe("sensei");
    expect(ja("コーヒー", "macron")).toBe("kōhī");
    expect(ja("コーヒー")).toBe("koohii");
  });

  it("標點換成半形", () => {
    expect(ja("コーヒーを飲んで、一緒に帰ろう！")).toBe("koohii o nonde, issho ni kaerou!");
    expect(ja("「さよなら」と言った")).toBe('"sayonara" to itta');
  });

  it("英文、數字照原樣留著", () => {
    expect(ja("I love you 永遠に")).toBe("I love you eien ni");
  });
});
