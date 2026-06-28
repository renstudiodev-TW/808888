// 建表 + 種子方案。async（D1 相容）。可重複執行（IF NOT EXISTS / upsert）。
import { getDb, SCHEMA_SQL } from "./index.js";
import { PLAN_SEED } from "../plans.js";

export async function migrate() {
  const db = getDb();
  await db.exec(SCHEMA_SQL);
  for (const p of PLAN_SEED) {
    await db.run(
      `INSERT INTO plans (tier, name, price_twd, features, sort_order, active)
       VALUES (?, ?, ?, ?, ?, 1)
       ON CONFLICT(tier) DO UPDATE SET name=excluded.name, price_twd=excluded.price_twd,
         features=excluded.features, sort_order=excluded.sort_order`,
      [p.tier, p.name, p.priceTwd, JSON.stringify(p.features), p.sortOrder]
    );
  }
}
