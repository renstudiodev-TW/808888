// 資料存取層（repositories），全部 async（node:sqlite 與 D1 共用）。
import { getDb } from "./db/index.js";
import { uuid, nowIso } from "./util.js";
import type { Tier } from "./plans.js";

export interface User {
  id: string;
  line_user_id: string | null;
  display_name: string;
  picture_url: string | null;
  email: string | null;
  role: string;
  status: string;
  created_at: string;
  last_login_at: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: Tier;
  status: string;
  source: string;
  started_at: string;
  current_period_end: string | null;
  ecpay_merchant_member_id: string | null;
  ecpay_gwsr: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberRow extends User {
  tier: Tier | null;
  sub_status: string | null;
  current_period_end: string | null;
}

export const usersRepo = {
  async byId(id: string): Promise<User | undefined> {
    return getDb().get<User>("SELECT * FROM users WHERE id = ?", [id]);
  },
  async byLineId(lineUserId: string): Promise<User | undefined> {
    return getDb().get<User>("SELECT * FROM users WHERE line_user_id = ?", [lineUserId]);
  },
  async create(input: Partial<User> & { display_name: string }): Promise<User> {
    const db = getDb();
    const id = input.id ?? uuid();
    const now = nowIso();
    await db.run(
      `INSERT INTO users (id, line_user_id, display_name, picture_url, email, role, status, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, input.line_user_id ?? null, input.display_name, input.picture_url ?? null,
        input.email ?? null, input.role ?? "member", input.status ?? "active", now, now,
      ]
    );
    return (await usersRepo.byId(id))!;
  },
  async touchLogin(id: string): Promise<void> {
    await getDb().run("UPDATE users SET last_login_at = ? WHERE id = ?", [nowIso(), id]);
  },
  async setStatus(id: string, status: "active" | "suspended"): Promise<void> {
    await getDb().run("UPDATE users SET status = ? WHERE id = ?", [status, id]);
  },
  async count(): Promise<number> {
    return (await getDb().get<{ c: number }>("SELECT COUNT(*) c FROM users"))?.c ?? 0;
  },
};

export const subsRepo = {
  async forUser(userId: string): Promise<Subscription | undefined> {
    return getDb().get<Subscription>(
      "SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
  },
  async create(userId: string, tier: Tier, opts: Partial<Subscription> = {}): Promise<Subscription> {
    const db = getDb();
    const id = uuid();
    const now = nowIso();
    await db.run(
      `INSERT INTO subscriptions (id, user_id, tier, status, source, started_at, current_period_end,
        ecpay_merchant_member_id, ecpay_gwsr, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, tier, opts.status ?? "active", opts.source ?? "manual", opts.started_at ?? now,
        opts.current_period_end ?? null, opts.ecpay_merchant_member_id ?? null,
        opts.ecpay_gwsr ?? null, opts.note ?? null, now, now,
      ]
    );
    return (await db.get<Subscription>("SELECT * FROM subscriptions WHERE id = ?", [id]))!;
  },
  async update(id: string, fields: Partial<Pick<Subscription, "tier" | "status" | "current_period_end" | "note" | "source">>): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = ?`);
      params.push(v);
    }
    if (!sets.length) return;
    sets.push("updated_at = ?");
    params.push(nowIso());
    params.push(id);
    await getDb().run(`UPDATE subscriptions SET ${sets.join(", ")} WHERE id = ?`, params);
  },
  async ensure(userId: string): Promise<Subscription> {
    return (await subsRepo.forUser(userId)) ?? (await subsRepo.create(userId, "free"));
  },
  async countByTier(): Promise<Record<string, number>> {
    const rows = await getDb().all<{ tier: string; c: number }>(
      "SELECT tier, COUNT(*) c FROM subscriptions GROUP BY tier"
    );
    return Object.fromEntries(rows.map((r) => [r.tier, r.c]));
  },
};

export const membersRepo = {
  async list(opts: { q?: string; tier?: string; limit?: number; offset?: number } = {}): Promise<MemberRow[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.q) {
      where.push("(u.display_name LIKE ? OR u.email LIKE ? OR u.line_user_id LIKE ?)");
      const like = `%${opts.q}%`;
      params.push(like, like, like);
    }
    if (opts.tier) {
      where.push("s.tier = ?");
      params.push(opts.tier);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;
    return getDb().all<MemberRow>(
      `SELECT u.*, s.tier AS tier, s.status AS sub_status, s.current_period_end AS current_period_end
       FROM users u
       LEFT JOIN subscriptions s ON s.id = (
         SELECT id FROM subscriptions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
       )
       ${whereSql}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
  },
};

export const auditRepo = {
  async log(actor: string, action: string, targetUser?: string, detail?: string): Promise<void> {
    await getDb().run(
      "INSERT INTO admin_audit (id, actor, action, target_user, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [uuid(), actor, action, targetUser ?? null, detail ?? null, nowIso()]
    );
  },
  async recent(limit = 50): Promise<Array<{ id: string; actor: string; action: string; target_user: string | null; detail: string | null; created_at: string }>> {
    return getDb().all("SELECT * FROM admin_audit ORDER BY created_at DESC LIMIT ?", [limit]);
  },
};

export const deliveriesRepo = {
  async log(userId: string, game: string, channel: string, status: string, opts: { drawPeriod?: string; detail?: string } = {}): Promise<void> {
    await getDb().run(
      "INSERT INTO pick_deliveries (id, user_id, game, draw_period, channel, status, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [uuid(), userId, game, opts.drawPeriod ?? null, channel, status, opts.detail ?? null, nowIso()]
    );
  },
  async recent(limit = 50): Promise<Array<{ user_id: string; display_name: string; game: string; channel: string; status: string; created_at: string }>> {
    return getDb().all(
      `SELECT d.*, u.display_name FROM pick_deliveries d JOIN users u ON u.id = d.user_id
       ORDER BY d.created_at DESC LIMIT ?`,
      [limit]
    );
  },
};

export const pushRepo = {
  async upsert(userId: string, lineUserId: string, enabled = true): Promise<void> {
    await getDb().run(
      `INSERT INTO push_targets (user_id, line_user_id, enabled, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET line_user_id=excluded.line_user_id, enabled=excluded.enabled`,
      [userId, lineUserId, enabled ? 1 : 0, nowIso()]
    );
  },
  async enabledTargets(): Promise<Array<{ user_id: string; line_user_id: string }>> {
    return getDb().all<{ user_id: string; line_user_id: string }>(
      "SELECT user_id, line_user_id FROM push_targets WHERE enabled = 1"
    );
  },
  async forUser(userId: string): Promise<{ enabled: number } | undefined> {
    return getDb().get<{ enabled: number }>("SELECT enabled FROM push_targets WHERE user_id = ?", [userId]);
  },
};

export interface Order {
  mer_order_no: string;
  user_id: string;
  tier: string;
  amount: number;
  status: string;
  period_no: string | null;
  trade_no: string | null;
  raw: string | null;
  created_at: string;
  updated_at: string;
}

export const ordersRepo = {
  async create(o: { merOrderNo: string; userId: string; tier: string; amount: number }): Promise<void> {
    const now = nowIso();
    await getDb().run(
      `INSERT INTO orders (mer_order_no, user_id, tier, amount, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
      [o.merOrderNo, o.userId, o.tier, o.amount, now, now]
    );
  },
  async byOrderNo(merOrderNo: string): Promise<Order | undefined> {
    return getDb().get<Order>("SELECT * FROM orders WHERE mer_order_no = ?", [merOrderNo]);
  },
  async markPaid(merOrderNo: string, opts: { periodNo?: string; tradeNo?: string; raw?: string }): Promise<void> {
    await getDb().run(
      "UPDATE orders SET status = 'paid', period_no = ?, trade_no = ?, raw = ?, updated_at = ? WHERE mer_order_no = ?",
      [opts.periodNo ?? null, opts.tradeNo ?? null, opts.raw ?? null, nowIso(), merOrderNo]
    );
  },
  async markFailed(merOrderNo: string, raw?: string): Promise<void> {
    await getDb().run(
      "UPDATE orders SET status = 'failed', raw = ?, updated_at = ? WHERE mer_order_no = ?",
      [raw ?? null, nowIso(), merOrderNo]
    );
  },
};

export const countersRepo = {
  async get(key: string): Promise<number> {
    return (await getDb().get<{ value: number }>("SELECT value FROM counters WHERE key = ?", [key]))?.value ?? 0;
  },
  async increment(key: string): Promise<number> {
    await getDb().run(
      "INSERT INTO counters (key, value) VALUES (?, 1) ON CONFLICT(key) DO UPDATE SET value = value + 1",
      [key]
    );
    return countersRepo.get(key);
  },
};
