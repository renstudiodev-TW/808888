// LINE Login (OAuth 2.0) + Messaging API 推播。
// 憑證未設定時以 stub 回應，方便本地開發；RC 填入頻道憑證後即為真實串接。
import { config, lineConfigured, lineMessagingConfigured } from "../config.js";

export interface LineProfile {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
}

/** 產生 LINE Login 授權網址 */
export function getLoginUrl(state: string, nonce: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.line.channelId,
    redirect_uri: config.line.callbackUrl,
    state,
    // email 需另外向 LINE 申請權限審核通過才可加回；先不要 email 避免未審而登入報錯。
    scope: "profile openid",
    nonce,
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params}`;
}

/** 用 code 換 token + 取得使用者資料 */
export async function exchangeCode(code: string): Promise<LineProfile> {
  if (!lineConfigured()) {
    throw new Error("LINE 憑證未設定 (LINE_CHANNEL_ID / LINE_CHANNEL_SECRET)");
  }
  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.line.callbackUrl,
      client_id: config.line.channelId,
      client_secret: config.line.channelSecret,
    }),
  });
  if (!tokenRes.ok) throw new Error(`LINE token 交換失敗: ${tokenRes.status}`);
  const token = (await tokenRes.json()) as { access_token: string; id_token?: string };

  const profRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!profRes.ok) throw new Error(`LINE profile 取得失敗: ${profRes.status}`);
  const prof = (await profRes.json()) as { userId: string; displayName: string; pictureUrl?: string };

  return { lineUserId: prof.userId, displayName: prof.displayName, pictureUrl: prof.pictureUrl };
}

/** 推播訊息給單一使用者 (報牌用)。未設定 token 時 stub。 */
export async function pushMessage(
  toLineUserId: string,
  messages: Array<{ type: "text"; text: string }>
): Promise<{ ok: boolean; stub?: boolean; status?: number }> {
  if (!lineMessagingConfigured()) {
    console.log(`[LINE stub] push → ${toLineUserId}:`, messages.map((m) => m.text).join(" / "));
    return { ok: true, stub: true };
  }
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.line.messagingToken}`,
    },
    body: JSON.stringify({ to: toLineUserId, messages }),
  });
  return { ok: res.ok, status: res.status };
}
