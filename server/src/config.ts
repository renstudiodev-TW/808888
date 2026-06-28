// 設定集中讀取。用 getter 延遲讀 process.env，讓 Node 與 Cloudflare Workers
// (worker 在 fetch 時把 env 併入 process.env) 都能正確取得。憑證一律走環境變數，
// 絕不寫死、不 commit。
function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const config = {
  get port() { return Number(env("PORT", "8787")); },
  get baseUrl() { return env("BASE_URL", "http://localhost:8787"); },

  get adminUser() { return env("ADMIN_USER", "admin"); },
  get adminPassword() { return env("ADMIN_PASSWORD", "changeme-dev-only"); },
  get sessionSecret() { return env("SESSION_SECRET", "dev-insecure-secret-change-me"); },

  line: {
    get channelId() { return env("LINE_CHANNEL_ID"); },
    get channelSecret() { return env("LINE_CHANNEL_SECRET"); },
    get callbackUrl() { return env("LINE_CALLBACK_URL", "http://localhost:8787/auth/line/callback"); },
    get messagingToken() { return env("LINE_MESSAGING_TOKEN"); },
  },

  // 金流＝藍新 NewebPay（RC 已申請）。欄位沿用通用名，Phase D 實作藍新加密。
  pay: {
    get merchantId() { return env("NEWEBPAY_MERCHANT_ID"); },
    get hashKey() { return env("NEWEBPAY_HASH_KEY"); },
    get hashIv() { return env("NEWEBPAY_HASH_IV"); },
    get apiUrl() { return env("NEWEBPAY_API_URL", "https://ccore.newebpay.com/MPG/period"); },
  },
};

export function lineConfigured(): boolean {
  return Boolean(config.line.channelId && config.line.channelSecret);
}
export function lineMessagingConfigured(): boolean {
  return Boolean(config.line.messagingToken);
}
export function ecpayConfigured(): boolean {
  // 沿用此函式名（多處引用）；現指藍新金流是否已設定
  return Boolean(config.pay.merchantId && config.pay.hashKey && config.pay.hashIv);
}
