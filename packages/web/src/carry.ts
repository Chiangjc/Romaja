// 按 ⇄ 切換方向時，把目前的文字帶到另一頁。
// 用 sessionStorage（只在這個分頁、這個瀏覽器裡），不放進網址，文字不會離開瀏覽器。
// 讀寫都可能被瀏覽器擋掉（無痕模式、封鎖網站資料），失敗就當作沒有要帶的文字。

const KEY = "latype:carry";

/** 點 ⇄ 的時候記下目前的文字，導覽照常進行。 */
export function carryOnSwap(getText: () => string) {
  document.querySelector<HTMLAnchorElement>(".dir-swap")?.addEventListener("click", () => {
    try {
      sessionStorage.setItem(KEY, getText());
    } catch {
      // 帶不過去就算了，切換本身不受影響
    }
  });
}

/** 頁面載入時取出另一頁帶過來的文字（取一次就清掉）。 */
export function takeCarried(): string {
  try {
    const text = sessionStorage.getItem(KEY) ?? "";
    sessionStorage.removeItem(KEY);
    return text;
  } catch {
    return "";
  }
}
