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
  GH_PAT?: string; // GitHub PAT（Actions:write），給 Cron 觸發每日資料重建用
  GH_REPO?: string; // owner/repo，預設 renstudiodev-TW/808888
}

// 由 Cloudflare Cron 可靠觸發 GitHub 的每日資料更新 workflow（比 GitHub 自身排程穩）。
async function triggerGitHubRebuild(env: Env): Promise<void> {
  if (!env.GH_PAT) {
    console.log("[cron] GH_PAT 未設定，略過資料重建觸發");
    return;
  }
  const repo = env.GH_REPO || "renstudiodev-TW/808888";
  const url = `https://api.github.com/repos/${repo}/actions/workflows/daily-update.yml/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GH_PAT}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "808888-worker-cron",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: "main" }),
  });
  console.log(`[cron] 觸發 GitHub 重建 → ${res.status} ${res.status === 204 ? "OK" : await res.text()}`);
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
  // Cloudflare Cron Triggers（可靠，不像 GitHub 排程會飄）：
  //   15:00 UTC (23:00 台灣) → 開獎後觸發 GitHub 重建當日分析資料
  //   01:00 UTC (09:00 台灣) → 推播當日今彩539精選給付費會員
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    applyEnv(env);
    if (event.cron === "0 15 * * *") {
      ctx.waitUntil(triggerGitHubRebuild(env));
    } else {
      ctx.waitUntil(dbAls.run(new D1Db(env.DB), () => runDailyReport("daily539").then(() => undefined)));
    }
  },
};

// Workers 型別（避免額外依賴 @cloudflare/workers-types）
interface ScheduledEvent { readonly scheduledTime: number; readonly cron: string; }
interface ExecutionContext { waitUntil(p: Promise<unknown>): void; passThroughOnException(): void; }
