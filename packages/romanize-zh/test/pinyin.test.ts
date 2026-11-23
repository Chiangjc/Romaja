import { describe, expect, it } from "vitest";
import { hanziToPinyin } from "../src/index.js";

describe("hanziToPinyin", () => {
  it("繁體多音字照詞判斷", () => {
    expect(hanziToPinyin("我們一起去銀行")).toBe("wǒ men yì qǐ qù yín háng");
    expect(hanziToPinyin("長大以後")).toBe("zhǎng dà yǐ hòu");
    expect(hanziToPinyin("還是覺得")).toBe("hái shì jué de");
    expect(hanziToPinyin("什麼")).toBe("shén me");
    expect(hanziToPinyin("一行字 行走")).toBe("yì háng zì xíng zǒu");
    expect(hanziToPinyin("睡著了 看著你")).toBe("shuì zháo le kàn zhe nǐ");
  });

  it("簡體一樣能轉", () => {
    expect(hanziToPinyin("长大以后我才明白")).toBe("zhǎng dà yǐ hòu wǒ cái míng bái");
  });

  it("兩岸讀音不同的字詞照台灣念法", () => {
    expect(hanziToPinyin("垃圾")).toBe("lè sè");
    expect(hanziToPinyin("星期 期待")).toBe("xīng qí qí dài");
    expect(hanziToPinyin("認識 知識")).toBe("rèn shì zhī shì");
    expect(hanziToPinyin("標識")).toBe("biāo zhì");
    expect(hanziToPinyin("可惜 休息")).toBe("kě xí xiū xí");
    expect(hanziToPinyin("微笑 危險")).toBe("wéi xiào wéi xiǎn");
    expect(hanziToPinyin("突然 寂寞 擁抱")).toBe("tú rán jí mò yǒng bào");
    expect(hanziToPinyin("誰")).toBe("shéi");
    expect(hanziToPinyin("研究 品質 企業")).toBe("yán jiù pǐn zhí qì yè");
    expect(hanziToPinyin("暫時 廣播")).toBe("zhàn shí guǎng bò");
  });

  it("發／髮 簡體合併成同一個字，靠詞分辨", () => {
    expect(hanziToPinyin("頭髮 發現")).toBe("tóu fǎ fā xiàn");
  });

  it("輕聲照台灣習慣，只有虛詞、詞尾、親屬疊字念輕聲", () => {
    expect(hanziToPinyin("朋友 喜歡 知道 時候")).toBe("péng yǒu xǐ huān zhī dào shí hòu");
    expect(hanziToPinyin("東西 衣服 名字 漂亮")).toBe("dōng xī yī fú míng zì piào liàng");
    expect(hanziToPinyin("謝謝 媽媽 石頭 桌子")).toBe("xiè xie mā ma shí tou zhuō zi");
    expect(hanziToPinyin("好嗎 走吧 你呢 我的")).toBe("hǎo ma zǒu ba nǐ ne wǒ de");
    expect(hanziToPinyin("星星")).toBe("xīng xīng");
  });

  it("一、不 照實際念法變調", () => {
    expect(hanziToPinyin("一起 一個 不是")).toBe("yì qǐ yí gè bú shì");
  });

  it("標點換成半形，前後空格照英文習慣", () => {
    expect(hanziToPinyin("重新開始，還是覺得快樂！")).toBe("chóng xīn kāi shǐ, hái shì jué de kuài lè!");
    expect(hanziToPinyin("他說：「你好。」")).toBe('tā shuō: "nǐ hǎo."');
    expect(hanziToPinyin("（副歌）")).toBe("(fù gē)");
  });

  it("英文、數字照原樣留著，跟拼音之間有空格", () => {
    expect(hanziToPinyin("為了你 I love you 123")).toBe("wèi le nǐ I love you 123");
    expect(hanziToPinyin("我愛你baby")).toBe("wǒ ài nǐ baby");
  });

  it("聲調樣式", () => {
    expect(hanziToPinyin("你們好嗎", { tone: "number" })).toBe("ni3 men5 hao3 ma5");
    expect(hanziToPinyin("你們好嗎", { tone: "none" })).toBe("ni men hao ma");
    expect(hanziToPinyin("綠色", { tone: "none" })).toBe("lü se");
    expect(hanziToPinyin("綠色")).toBe("lǜ sè");
  });

  it("空字串與空白", () => {
    expect(hanziToPinyin("")).toBe("");
    expect(hanziToPinyin("  你好  ")).toBe("nǐ hǎo");
  });
});
