-- D1 初始 schema（與 src/db/schema.ts 同步）。套用：wrangler d1 migrations apply lottery17168 --remote
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
