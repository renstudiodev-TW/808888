import { Hono } from "hono";
import { requireAdmin, clearSession } from "../auth.js";
import { usersRepo, subsRepo, membersRepo, auditRepo, deliveriesRepo, settingsRepo } from "../repos.js";
import { Dashboard, MembersPage, MemberDetail, AuditPage, DeliveriesPage } from "../views/pages.js";
import { lineConfigured, ecpayConfigured, lineMessagingConfigured } from "../config.js";
import { runDailyReport } from "../reports.js";
import { addDaysIso } from "../util.js";
import type { Tier } from "../plans.js";

function configWarn(): string[] {
  const w: string[] = [];
  if (!lineConfigured()) w.push("LINE Login");
  if (!lineMessagingConfigured()) w.push("LINE 推播");
  if (!ecpayConfigured()) w.push("藍新金流");
  return w;
}

export const admin = new Hono();

admin.get("/logout", (c) => {
  clearSession(c);
  return c.redirect("/");
});

// 後台改為純 LINE 驗證：站長 LINE 帳號(白名單)登入即可進入，無帳密登入。
admin.use("/*", requireAdmin);

admin.get("/", async (c) => {
  const s = c.get("session") as { name: string };
  const byTier = await subsRepo.countByTier();
  const stats = {
    totalUsers: await usersRepo.count(),
    byTier,
    paying: (byTier.pro ?? 0) + (byTier.max ?? 0),
    recentMembers: await membersRepo.list({ limit: 8 }),
  };
  return c.html(<Dashboard session={s} stats={stats} configWarn={configWarn()} />);
});

admin.get("/members", async (c) => {
  const s = c.get("session") as { name: string };
  const q = c.req.query("q") ?? "";
  const tier = c.req.query("tier") ?? "";
  const rows = await membersRepo.list({ q: q || undefined, tier: tier || undefined, limit: 100 });
  return c.html(<MembersPage session={s} rows={rows} q={q} tier={tier} configWarn={configWarn()} />);
});

admin.get("/members/:id", async (c) => {
  const s = c.get("session") as { name: string };
  const id = c.req.param("id");
  const user = await usersRepo.byId(id);
  if (!user) return c.notFound();
  const sub = await subsRepo.ensure(id);
  const all = await deliveriesRepo.recent(50);
  const deliveries = all.filter((d) => d.user_id === id) as never[];
  return c.html(<MemberDetail session={s} user={user} sub={sub} deliveries={deliveries} configWarn={configWarn()} />);
});

admin.post("/members/:id/status", async (c) => {
  const s = c.get("session") as { name: string };
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  const status = String(body.status) === "suspended" ? "suspended" : "active";
  await usersRepo.setStatus(id, status);
  await auditRepo.log(s.name, status === "suspended" ? "停權會員" : "解除停權", id);
  return c.redirect(`/admin/members/${id}`);
});

admin.post("/members/:id/subscription", async (c) => {
  const s = c.get("session") as { name: string };
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  const tier = String(body.tier ?? "free") as Tier;
  const status = String(body.status ?? "active");
  const extendDays = Number(body.extendDays ?? 0);
  const endDate = String(body.endDate ?? "");
  const note = String(body.note ?? "").slice(0, 200);
  const sub = await subsRepo.ensure(id);
  // 手動調整一律標記來源為 manual，與付費(newebpay)區隔，避免混淆。
  const fields: Record<string, unknown> = { tier, status, source: "manual" };
  if (note) fields.note = note;
  if (endDate) {
    fields.current_period_end = new Date(`${endDate}T00:00:00.000Z`).toISOString();
  } else if (extendDays > 0) {
    const base = sub.current_period_end && new Date(sub.current_period_end) > new Date()
      ? new Date(sub.current_period_end) : new Date();
    fields.current_period_end = addDaysIso(extendDays, base);
  }
  await subsRepo.update(sub.id, fields);
  await auditRepo.log(s.name, "調整訂閱(手動)", id, `tier=${tier} status=${status}${endDate ? ` 到期${endDate}` : extendDays > 0 ? ` +${extendDays}天` : ""}${note ? ` 備註:${note}` : ""}`);
  return c.redirect(`/admin/members/${id}`);
});

admin.get("/audit", async (c) => {
  const s = c.get("session") as { name: string };
  return c.html(<AuditPage session={s} rows={await auditRepo.recent(100)} configWarn={configWarn()} />);
});

admin.get("/deliveries", async (c) => {
  const s = c.get("session") as { name: string };
  return c.html(<DeliveriesPage session={s} rows={(await deliveriesRepo.recent(100)) as never[]} pushEnabled={await settingsRepo.isPushEnabled()} configWarn={configWarn()} />);
});
admin.post("/settings/push", async (c) => {
  const s = c.get("session") as { name: string };
  const body = await c.req.parseBody();
  const on = String(body.on) === "1";
  await settingsRepo.setPushEnabled(on);
  await auditRepo.log(s.name, on ? "開啟全域LINE推播" : "關閉全域LINE推播");
  return c.redirect("/admin/deliveries");
});
admin.post("/deliveries/run", async (c) => {
  const s = c.get("session") as { name: string };
  const res = await runDailyReport("daily539");
  await auditRepo.log(s.name, "手動觸發精選", undefined, `寄送${res.sent} 略過${res.skipped}${res.stub ? " (LINE stub)" : ""}`);
  return c.redirect("/admin/deliveries");
});
