// latype.com 的 Worker：網站本身是靜態檔（dist），這支只處理 POST /api/feedback。
//
// 回饋不存資料庫，直接用 Cloudflare Email Routing 寄到站長信箱：
// - FEEDBACK_MAIL：wrangler.jsonc 的 send_email binding
// - FEEDBACK_FROM：寄件人，必須是 latype.com 的地址（wrangler.jsonc 的 vars）
// - FEEDBACK_TO：收件人 contact@latype.com（wrangler.jsonc 的 vars，binding 也限定只能寄到這個地址）
//
// 靜態檔比對得到時 Cloudflare 會直接回傳，不會進到這裡。

import { EmailMessage } from "cloudflare:email";

const KINDS = new Set(["idea", "bug", "other"]);
const KIND_LABEL = { idea: "想要的功能", bug: "轉錯了／壞掉了", other: "其他" };
const MAX_MESSAGE = 3000;
const ALLOWED_ORIGINS = [/^https:\/\/([a-z0-9-]+\.)*latype\.com$/, /^https:\/\/[a-z0-9-]+\.workers\.dev$/];

export default {
  /** @param {Request} request @param {any} env */
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/feedback") return handleFeedback(request, env);
    return env.ASSETS.fetch(request);
  },
};

/** @param {Request} request @param {any} env */
async function handleFeedback(request, env) {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  const origin = request.headers.get("Origin") || "";
  if (!ALLOWED_ORIGINS.some((re) => re.test(origin))) return json({ error: "origin" }, 403);

  /** @type {any} */
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "body" }, 400);
  }

  // 機器人陷阱：真人看不到這一格，有填就假裝成功，不寄信
  if (body.website) return json({ ok: true });

  const message = String(body.message || "").trim();
  if (!message || message.length > MAX_MESSAGE) return json({ error: "message" }, 400);
  const kind = KINDS.has(body.kind) ? body.kind : "other";
  const email = String(body.email || "").trim().slice(0, 200);
  const replyTo = /^[^\s@<>",]+@[^\s@<>",]+\.[^\s@<>",]+$/.test(email) ? email : "";
  const page = String(body.page || "").slice(0, 300);
  const device = String(body.device || "").slice(0, 300);

  if (!env.FEEDBACK_TO || !env.FEEDBACK_FROM) return json({ error: "config" }, 500);

  const text = [
    message,
    "",
    "——",
    `類型：${KIND_LABEL[kind]}`,
    `頁面：${page}`,
    `回覆信箱：${email || "（沒填）"}`,
    `裝置：${device}`,
    `國家：${request.headers.get("CF-IPCountry") || "?"}`,
  ].join("\n");

  const subject = `[latype 回饋] ${KIND_LABEL[kind]}：${oneLine(message).slice(0, 40)}`;
  const raw = buildMime({ from: env.FEEDBACK_FROM, to: env.FEEDBACK_TO, replyTo, subject, text });

  try {
    await env.FEEDBACK_MAIL.send(new EmailMessage(env.FEEDBACK_FROM, env.FEEDBACK_TO, raw));
  } catch (e) {
    console.error("feedback send failed", e);
    return json({ error: "send" }, 502);
  }
  return json({ ok: true });
}

/**
 * 組一封純文字的 UTF-8 信。標頭的中文用 RFC 2047 編碼，內文用 base64。
 * @param {{ from: string, to: string, replyTo: string, subject: string, text: string }} m
 */
function buildMime({ from, to, replyTo, subject, text }) {
  const domain = from.split("@")[1] || "latype.com";
  const headers = [
    `From: ${encodeWord("latype 回饋")} <${from}>`,
    `To: <${to}>`,
    ...(replyTo ? [`Reply-To: <${replyTo}>`] : []),
    `Subject: ${encodeWord(subject)}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];
  const b64 = base64(text).replace(/.{76}/g, "$&\r\n");
  return headers.join("\r\n") + "\r\n\r\n" + b64 + "\r\n";
}

/**
 * RFC 2047：每個編碼字最長 75 字元，長標題切成好幾段（按字切，不切斷 UTF-8），段與段之間換行續接。
 * @param {string} s
 */
function encodeWord(s) {
  const chars = [...s];
  const parts = [];
  for (let i = 0; i < chars.length; i += 12) parts.push(`=?UTF-8?B?${base64(chars.slice(i, i + 12).join(""))}?=`);
  return parts.join("\r\n ");
}

/** @param {string} s */
function base64(s) {
  let bin = "";
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** @param {string} s */
function oneLine(s) {
  return s.replace(/\s+/g, " ").trim();
}

/** @param {unknown} data @param {number} [status] */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
