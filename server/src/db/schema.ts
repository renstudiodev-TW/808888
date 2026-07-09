// Schema 以字串常數提供（本地 node:sqlite 與 Cloudflare D1 皆可用，不依賴檔案系統）。
// 同步維護 schema.sql（給 wrangler d1 migrations 參考）。

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  line_user_id    TEXT UNIQUE,
  display_name    TEXT NOT NULL DEFAULT '',
  picture_url     TEXT,
  email           TEXT,
  role            TEXT NOT NULL DEFAULT 'member',
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TEXT NOT NULL,
  last_login_at   TEXT
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL,
  tier                TEXT NOT NULL DEFAULT 'free',
  status              TEXT NOT NULL DEFAULT 'active',
  source              TEXT NOT NULL DEFAULT 'manual',
  started_at          TEXT NOT NULL,
  current_period_end  TEXT,
  ecpay_merchant_member_id TEXT,
  ecpay_gwsr          TEXT,
  note                TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sub_user ON subscriptions(user_id);
CREATE TABLE IF NOT EXISTS push_targets (
  user_id       TEXT PRIMARY KEY,
  line_user_id  TEXT NOT NULL,
  enabled       INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pick_deliveries (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  game        TEXT NOT NULL,
  draw_period TEXT,
  channel     TEXT NOT NULL,
  status      TEXT NOT NULL,
  detail      TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_delivery_user ON pick_deliveries(user_id);
CREATE TABLE IF NOT EXISTS admin_audit (
  id          TEXT PRIMARY KEY,
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_user TEXT,
  detail      TEXT,
  created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS plans (
  tier        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  price_twd   INTEGER NOT NULL,
  features    TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
  mer_order_no  TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  tier          TEXT NOT NULL,
  amount        INTEGER NOT NULL,
  cycle         TEXT NOT NULL DEFAULT 'M',
  status        TEXT NOT NULL DEFAULT 'pending',
  period_no     TEXT,
  trade_no      TEXT,
  raw           TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE TABLE IF NOT EXISTS counters (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO counters (key, value) VALUES ('visits', 0);
`.trim();
