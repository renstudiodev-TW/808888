// Cloudflare Workers 入口（一站式：靜態前台 + Hono 後端 API/後台 + D1 + Cron）。
import { Hono } from "hono";
import { dbAls } from "./db/index.js";
import { D1Db, type D1Database } from "./db/d1.js";
import { admin } from "./routes/admin.js";
import { member } from "./routes/member.js";
import { publicApi } from "./routes/public.js";
import { readSession } from "./auth.js";
import { runDailyReport } from "./reports.js";
import { lineConfigured, lineMessagingConfigured, ecpayConfigured } from "./config.js";

export interface Env {
  DB: D1Database;
  ASSETS: { fetch(req: Request): Promise<Response> };
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  BASE_URL?: string;
  LINE_CHANNEL_ID?: string;
  LINE_CHANNEL_SECRET?: string;
  LINE_CALLBACK_URL?: string;
  LINE_MESSAGING_TOKEN?: string;
  NEWEBPAY_MERCHANT_ID?: string;
  NEWEBPAY_HASH_KEY?: string;
  NEWEBPAY_HASH_IV?: string;
}

// 把 Worker 的 env 字串變數併入 process.env，讓 config 的 getter 讀得到。
function applyEnv(env: Env) {
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === "string") process.env[k] = v;
  }
}

const app = new Hono<{ Bindings: Env }>();

// 每個 request：注入 D1 context + 環境變數
app.use("*", async (c, next) => {
  applyEnv(c.env);
  return dbAls.run(new D1Db(c.env.DB), next);
});

app.get("/health", (c) => c.json({
  ok: true,
  integrations: { lineLogin: lineConfigured(), linePush: lineMessagingConfigured(), payment: ecpayConfigured() },
}));

app.route("/admin", admin);
app.route("/", publicApi); // /api/draws /api/news（公開）
app.route("/", member); // /auth/* /api/*

// 其餘交給靜態前台（Next.js 靜態輸出）
app.all("*", async (c) => {
  // 已登入 admin 打根目錄 → 進後台
  if (c.req.path === "/") {
    const s = await readSession(c);
    if (s?.role === "admin") return c.redirect("/admin");
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default {
  fetch: app.fetch,
  // Cloudflare Cron Trigger → 每日精選（資料來源 Phase C 接 KV/R2；目前 loadFull 在 Workers 回 null 即 no-op）
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    applyEnv(env);
    ctx.waitUntil(dbAls.run(new D1Db(env.DB), () => runDailyReport("daily539").then(() => undefined)));
  },
};

// Workers 型別（避免額外依賴 @cloudflare/workers-types）
interface ScheduledEvent { readonly scheduledTime: number; readonly cron: string; }
interface ExecutionContext { waitUntil(p: Promise<unknown>): void; passThroughOnException(): void; }
