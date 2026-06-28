// 塞測試會員資料（本地展示後台用）。可重複執行（先清空 users 相關表）。
import "./env.js";
import { NodeSqliteDb, defaultDbFile } from "./db/node-sqlite.js";
import { runWithDb, getDb } from "./db/index.js";
import { migrate } from "./db/migrate.js";
import { usersRepo, subsRepo, pushRepo, deliveriesRepo, auditRepo } from "./repos.js";
import { addDaysIso } from "./util.js";
import type { Tier } from "./plans.js";

interface Seed { name: string; tier: Tier; status: string; suspended?: boolean; days?: number; joinedDaysAgo: number; push?: boolean; }
const seeds: Seed[] = [
  { name: "陳大文", tier: "max", status: "active", days: 25, joinedDaysAgo: 120, push: true },
  { name: "林小美", tier: "pro", status: "active", days: 12, joinedDaysAgo: 88, push: true },
  { name: "王阿明", tier: "pro", status: "trial", days: 5, joinedDaysAgo: 6, push: true },
  { name: "張財神", tier: "max", status: "active", days: 18, joinedDaysAgo: 200, push: true },
  { name: "黃中獎", tier: "free", status: "active", joinedDaysAgo: 3, push: false },
  { name: "吳冷號", tier: "free", status: "active", joinedDaysAgo: 15, push: false },
  { name: "蔡熱門", tier: "pro", status: "canceled", joinedDaysAgo: 60, push: false },
  { name: "劉遺漏", tier: "pro", status: "expired", joinedDaysAgo: 150, push: true },
  { name: "鄭尾數", tier: "free", status: "active", suspended: true, joinedDaysAgo: 40, push: false },
  { name: "周生肖", tier: "max", status: "active", days: 8, joinedDaysAgo: 300, push: true },
];

const nodeDb = new NodeSqliteDb(defaultDbFile());

await runWithDb(nodeDb, async () => {
  await migrate();
  const db = getDb();
  for (const t of ["pick_deliveries", "push_targets", "subscriptions", "admin_audit", "users"]) {
    await db.run(`DELETE FROM ${t}`);
  }
  let seq = 0;
  for (const s of seeds) {
    seq++;
    const user = await usersRepo.create({ line_user_id: `dev_${s.name}`, display_name: s.name, email: `member${seq}@example.com` });
    await db.run("UPDATE users SET created_at = ?, last_login_at = ? WHERE id = ?",
      [addDaysIso(-s.joinedDaysAgo), addDaysIso(-Math.floor(s.joinedDaysAgo / 3)), user.id]);
    if (s.suspended) await usersRepo.setStatus(user.id, "suspended");
    const sub = await subsRepo.ensure(user.id);
    await subsRepo.update(sub.id, {
      tier: s.tier,
      status: s.status,
      current_period_end: s.days ? addDaysIso(s.days) : null,
    });
    if (s.push) await pushRepo.upsert(user.id, `dev_${s.name}`, true);
  }
  const someone = await usersRepo.byLineId("dev_陳大文");
  if (someone) await deliveriesRepo.log(someone.id, "daily539", "line", "sent", { drawPeriod: "115000156", detail: "範例" });
  await auditRepo.log("admin", "系統初始化 seed", undefined, `建立 ${seeds.length} 筆測試會員`);
  console.log(`seed 完成：${seeds.length} 筆測試會員`);
});
