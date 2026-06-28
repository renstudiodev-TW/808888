// Node 本地入口。正式環境 (Cloudflare Workers) 用 worker.ts。
import "./env.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { NodeSqliteDb, defaultDbFile } from "./db/node-sqlite.js";
import { dbAls, runWithDb } from "./db/index.js";
import { migrate } from "./db/migrate.js";
import { admin } from "./routes/admin.js";
import { member } from "./routes/member.js";
import { config, lineConfigured, ecpayConfigured, lineMessagingConfigured } from "./config.js";
import { readSession } from "./auth.js";

const nodeDb = new NodeSqliteDb(defaultDbFile());
await runWithDb(nodeDb, () => migrate());

const app = new Hono();
app.use("*", logger());
// 每個 request 注入本地 DB context（Workers 版在 worker.ts 注入 D1）
app.use("*", (_c, next) => dbAls.run(nodeDb, next));

app.get("/", async (c) => {
  const s = await readSession(c);
  if (s?.role === "admin") return c.redirect("/admin");
  return c.json({
    service: "17168 server",
    member: s?.role === "member" ? s.name : null,
    integrations: { lineLogin: lineConfigured(), linePush: lineMessagingConfigured(), payment: ecpayConfigured() },
    hint: "後台 /admin；LINE 登入 /auth/line/login；開發登入 /auth/dev-login",
  });
});
app.get("/health", (c) => c.json({ ok: true }));

app.route("/admin", admin);
app.route("/", member);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`17168 server → http://localhost:${info.port}`);
  console.log(`後台 → http://localhost:${info.port}/admin  (帳號 ${config.adminUser})`);
  if (!lineConfigured()) console.log("⚠️ LINE Login 未設定，用 /auth/dev-login 測試");
});
