// 意見回饋：每一頁右下角一顆按鈕，按下去開表單，送到 /api/feedback（worker/index.js 寄信給站長）。
// 由 vite.config.ts 自動插進每一頁，不用在各頁的 HTML 或 main-*.ts 裡引用。

import "./feedback.css";

interface Text {
  button: string;
  title: string;
  hint: string;
  kindLabel: string;
  kinds: [string, string][];
  message: string;
  messagePlaceholder: string;
  email: string;
  emailHint: string;
  cancel: string;
  send: string;
  sending: string;
  sent: string;
  failed: string;
  empty: string;
}

const zh: Text = {
  button: "回饋",
  title: "想跟開發者說什麼？",
  hint: "哪裡轉錯了、哪裡不好用、想要什麼功能，都可以告訴我。每一則我都會看。",
  kindLabel: "回饋類型",
  kinds: [
    ["bug", "轉錯了／壞掉了"],
    ["idea", "想要的功能"],
    ["other", "其他"],
  ],
  message: "內容",
  messagePlaceholder: "例如：打 gaeul 第一個候選是 개울，但我要的是 가을",
  email: "你的 email（選填）",
  emailHint: "想收到回覆再填。",
  cancel: "取消",
  send: "送出",
  sending: "送出中…",
  sent: "收到了，謝謝你！",
  failed: "送出失敗，請稍後再試，或寄信到 contact@latype.com。",
  empty: "請先寫一點內容。",
};

const en: Text = {
  button: "Feedback",
  title: "Tell the developer",
  hint: "Wrong conversions, things that are hard to use, features you want — I read every message.",
  kindLabel: "Type of feedback",
  kinds: [
    ["bug", "Wrong result / broken"],
    ["idea", "Feature request"],
    ["other", "Other"],
  ],
  message: "Message",
  messagePlaceholder: "e.g. typing gaeul gives 개울 first, but I wanted 가을",
  email: "Your email (optional)",
  emailHint: "Only if you'd like a reply.",
  cancel: "Cancel",
  send: "Send",
  sending: "Sending…",
  sent: "Got it — thank you!",
  failed: "Couldn't send. Please try again later, or email contact@latype.com.",
  empty: "Please write something first.",
};

function setup(): void {
  if (document.querySelector(".fb-btn")) return;
  const t = document.documentElement.lang.startsWith("en") ? en : zh;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "fb-btn";
  btn.textContent = t.button;
  btn.setAttribute("aria-haspopup", "dialog");

  const dlg = document.createElement("dialog");
  dlg.className = "fb-dlg";
  dlg.setAttribute("aria-labelledby", "fb-title");
  dlg.innerHTML = `
    <form class="fb-form" novalidate>
      <h2 id="fb-title">${t.title}</h2>
      <p class="fb-hint">${t.hint}</p>
      <div class="fb-kinds" role="radiogroup" aria-label="${t.kindLabel}">
        ${t.kinds
          .map(([k, label], i) => `<label><input type="radio" name="kind" value="${k}"${i ? "" : " checked"}><span>${label}</span></label>`)
          .join("")}
      </div>
      <label class="fb-field">${t.message}
        <textarea name="message" rows="5" maxlength="3000" required placeholder="${t.messagePlaceholder}"></textarea>
      </label>
      <label class="fb-field">${t.email}
        <input name="email" type="email" maxlength="200" autocomplete="email">
        <span class="fb-sub">${t.emailHint}</span>
      </label>
      <label class="fb-trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
      <p class="fb-status" role="status" aria-live="polite"></p>
      <div class="fb-actions">
        <button type="button" class="fb-cancel">${t.cancel}</button>
        <button type="submit" class="fb-send">${t.send}</button>
      </div>
    </form>`;

  document.body.append(btn, dlg);

  const form = dlg.querySelector("form") as HTMLFormElement;
  const status = dlg.querySelector(".fb-status") as HTMLElement;
  const send = dlg.querySelector(".fb-send") as HTMLButtonElement;
  const textarea = form.elements.namedItem("message") as HTMLTextAreaElement;

  btn.addEventListener("click", () => {
    status.textContent = "";
    dlg.showModal();
    textarea.focus();
  });
  dlg.querySelector(".fb-cancel")!.addEventListener("click", () => dlg.close());
  // 點對話框外面的灰底就關掉
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });
  // 打字頁會攔截 keydown（空白、方向鍵、數字選字），對話框裡的按鍵不要傳出去
  dlg.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") e.stopPropagation();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const message = String(data.get("message") || "").trim();
    if (!message) {
      status.textContent = t.empty;
      textarea.focus();
      return;
    }
    send.disabled = true;
    status.textContent = t.sending;
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: data.get("kind"),
          message,
          email: data.get("email"),
          website: data.get("website"),
          page: location.pathname + location.search,
          device: `${innerWidth}×${innerHeight} ${navigator.userAgent}`,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      status.textContent = t.sent;
      setTimeout(() => {
        if (dlg.open) dlg.close();
      }, 1500);
    } catch {
      status.textContent = t.failed;
    } finally {
      send.disabled = false;
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
else setup();
