// 把 kuromoji 的日文詞典（*.dat.gz，約 17 MB）複製到 public/dict/ja/，讓日文頁在瀏覽器裡載入。
// 詞典跟著 npm 套件走，不進 git；dev 和 build 之前都會跑一次，檔案沒變就跳過。

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const requireFromJa = createRequire(join(here, "../../romanize-ja/package.json"));
const source = join(dirname(requireFromJa.resolve("@sglkc/kuromoji/package.json")), "dict");
const target = join(here, "../public/dict/ja");

mkdirSync(target, { recursive: true });
let copied = 0;
for (const name of readdirSync(source).filter((f) => f.endsWith(".dat.gz"))) {
  const from = join(source, name);
  const to = join(target, name);
  if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
  copyFileSync(from, to);
  copied++;
}
if (copied) console.log(`copied ${copied} Japanese dictionary files to public/dict/ja`);
