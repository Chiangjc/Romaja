// 台灣標準讀音（教育部《國語辭典》）跟大陸普通話不同的常見字詞。
// pinyin-pro 的詞表照大陸標準，這裡在它的結果上改成台灣念法。
// 鍵是簡體字形：查讀音之前已經把繁體轉成簡體了。

/**
 * 整個詞換掉（數字聲調，0 是輕聲），結果不再經過下面的單字規則。
 * 用在聲母韻母都不一樣、或是簡體合併了兩個繁體字的情況
 * （发 同時是「發」和「髮」，只能靠詞分辨）。
 */
export const WORD_READINGS: Record<string, string> = {
  垃圾: "le4 se4",
  头发: "tou2 fa3",
  理发: "li3 fa3",
  白发: "bai2 fa3",
  长发: "chang2 fa3",
  短发: "duan3 fa3",
  金发: "jin1 fa3",
  黑发: "hei1 fa3",
  发型: "fa3 xing2",
  毛发: "mao2 fa3",
  曝光: "pu4 guang1",
  蜗牛: "gua1 niu2",
  骰子: "tou2 zi0",
  从容: "cong1 rong2",
  法国: "fa4 guo2",
  标识: "biao1 zhi4",
  谢谢: "xie4 xie0",
};

/**
 * 單字改讀音。`from` 是大陸讀音的拼法（不含聲調），只有對上才換，
 * 避免動到同一個字的其他讀音（识 在 标识 念 zhì，不換）。
 * `to` 是台灣讀音，數字聲調。
 */
export const CHAR_READINGS: Record<string, { from: string[]; to: string }> = {
  期: { from: ["qi"], to: "qi2" },
  危: { from: ["wei"], to: "wei2" },
  微: { from: ["wei"], to: "wei2" },
  惜: { from: ["xi"], to: "xi2" },
  息: { from: ["xi"], to: "xi2" },
  昔: { from: ["xi"], to: "xi2" },
  夕: { from: ["xi"], to: "xi4" },
  突: { from: ["tu"], to: "tu2" },
  击: { from: ["ji"], to: "ji2" },
  迹: { from: ["ji"], to: "ji1" },
  识: { from: ["shi"], to: "shi4" },
  寂: { from: ["ji"], to: "ji2" },
  暂: { from: ["zan"], to: "zhan4" },
  谁: { from: ["shui", "shei"], to: "shei2" },
  播: { from: ["bo"], to: "bo4" },
  拥: { from: ["yong"], to: "yong3" },
  综: { from: ["zong"], to: "zong4" },
  帆: { from: ["fan"], to: "fan2" },
  企: { from: ["qi"], to: "qi4" },
  质: { from: ["zhi"], to: "zhi2" },
  究: { from: ["jiu"], to: "jiu4" },
  液: { from: ["ye"], to: "yi4" },
  档: { from: ["dang"], to: "dang4" },
  骤: { from: ["zhou"], to: "zou4" },
};

/**
 * 台灣的輕聲比大陸少得多：朋友 péng yǒu、喜歡 xǐ huān、知道 zhī dào。
 * 只有這些虛詞、詞尾維持輕聲，其他字一律還原成本調。
 */
export const NEUTRAL_KEEP = new Set([..."的了着吗呢吧啊呀哇啦喔哦嘛们么子头得地"]);

/** 親屬稱謂、謝謝這類疊字，第二個字照樣念輕聲（媽媽 mā ma、謝謝 xiè xie）。 */
export const NEUTRAL_REDUPLICATION = new Set([..."谢爸妈哥姐弟妹奶爷叔舅姑婆公"]);
