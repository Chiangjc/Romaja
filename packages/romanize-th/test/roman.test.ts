import { describe, expect, it } from "vitest";
import { thaiToRoman, thaiWordToSyllables } from "../src/index.js";

const word = (w: string) => thaiWordToSyllables(w).join("-");

describe("thaiWordToSyllables", () => {
  it("隱含母音：有尾音念 o，沒尾音念 a", () => {
    expect(word("คน")).toBe("khon");
    expect(word("ถนน")).toBe("tha-non");
    expect(word("ขนม")).toBe("kha-nom");
    expect(word("สบาย")).toBe("sa-bai");
    expect(word("ตลาด")).toBe("ta-lat");
    expect(word("ตลอด")).toBe("ta-lot");
    expect(word("อร่อย")).toBe("a-roi");
  });

  it("前置母音與複合母音", () => {
    expect(word("เธอ")).toBe("thoe");
    expect(word("เกิด")).toBe("koet");
    expect(word("เลย")).toBe("loei");
    expect(word("เรียน")).toBe("rian");
    expect(word("เพื่อน")).toBe("phuean");
    expect(word("เขียว")).toBe("khiao");
    expect(word("แล้ว")).toBe("laeo");
    expect(word("เพราะ")).toBe("phro");
    expect(word("ไทย")).toBe("thai");
    expect(word("ใจ")).toBe("chai");
    expect(word("ช่วย")).toBe("chuai");
    expect(word("ด่วน")).toBe("duan");
    expect(word("น้ำ")).toBe("nam");
  });

  it("複輔音、假複輔音、ห 帶頭", () => {
    expect(word("ปลา")).toBe("pla");
    expect(word("ความ")).toBe("khwam");
    expect(word("ครับ")).toBe("khrap");
    expect(word("จริง")).toBe("ching");
    expect(word("สร้าง")).toBe("sang");
    expect(word("ทราบ")).toBe("sap");
    expect(word("หนึ่ง")).toBe("nueng");
    expect(word("อยู่")).toBe("yu");
  });

  it("前導子音帶前置母音", () => {
    expect(word("เสมอ")).toBe("sa-moe");
    expect(word("แสดง")).toBe("sa-daeng");
    expect(word("เฉลย")).toBe("cha-loei");
    expect(word("แสง")).toBe("saeng");
    expect(word("เสร็จ")).toBe("set");
  });

  it("不發音的字母", () => {
    expect(word("จันทร์")).toBe("chan");
    expect(word("เสาร์")).toBe("sao");
    expect(word("ชาติ")).toBe("chat");
    expect(word("ประวัติ")).toBe("pra-wat");
    expect(word("กรรม")).toBe("kam");
  });

  it("例外詞表，複合詞裡也找得到", () => {
    expect(word("ผลไม้")).toBe("phon-la-mai");
    expect(word("มหาวิทยาลัย")).toBe("ma-ha-wit-tha-ya-lai");
    expect(word("โทรศัพท์")).toBe("tho-ra-sap");
    expect(word("ก็")).toBe("ko");
  });
});

describe("thaiToRoman", () => {
  it("切詞後轉寫，詞之間加空格", () => {
    expect(thaiToRoman("ฉันรักเธอมากที่สุดในโลก")).toBe("chan rak thoe mak thi-sut nai lok");
  });

  it("可以不加連字號", () => {
    expect(thaiToRoman("สวัสดีครับ", { hyphenate: false })).toBe("sawatdi khrap");
  });

  it("ๆ 重複前一個詞", () => {
    expect(thaiToRoman("เร็วๆ")).toBe("reo reo");
  });

  it("標點、數字、換行、拉丁字照留", () => {
    expect(thaiToRoman("สวัสดีครับ, คุณชื่ออะไร?\nวันนี้ ๑๒๓")).toBe("sa-wat-di khrap, khun chue a-rai?\nwan ni 123");
    expect(thaiToRoman("ฉันชอบ BTS มาก")).toBe("chan chop BTS mak");
  });

  it("空字串", () => {
    expect(thaiToRoman("")).toBe("");
  });
});
