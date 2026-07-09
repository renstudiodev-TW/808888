-- 牌靈 AI 會員系統 schema (SQLite 方言，node:sqlite 本地 / Cloudflare D1 正式皆適用)

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,            -- 內部 id (uuid)
  line_user_id    TEXT UNIQUE,                 -- LINE Login 的 userId
  display_name    TEXT NOT NULL DEFAULT '',
  picture_url     TEXT,
  email           TEXT,
  role            TEXT NOT NULL DEFAULT 'member', -- member | admin
  status          TEXT NOT NULL DEFAULT 'active', -- active | suspended
  created_at      TEXT NOT NULL,
  last_login_at   TEXT
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id),
  tier                TEXT NOT NULL DEFAULT 'free',   -- free | pro | max
  status              TEXT NOT NULL DEFAULT 'active', -- active | trial | canceled | expired
  source              TEXT NOT NULL DEFAULT 'manual', -- manual | ecpay
  started_at          TEXT NOT NULL,
  current_period_end  TEXT,                           -- 本期到期日 (NULL=永久/免費)
  ecpay_merchant_member_id TEXT,                       -- 綠界定期定額綁定識別
  ecpay_gwsr          TEXT,                            -- 綠界授權單號
  note                TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sub_user ON subscriptions(user_id);

-- LINE 推播對象 (報牌通知)
CREATE TABLE IF NOT EXISTS push_targets (
  user_id       TEXT PRIMARY KEY REFERENCES users(id),
  line_user_id  TEXT NOT NULL,
  enabled       INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);

-- 報牌寄送紀錄
CREATE TABLE IF NOT EXISTS pick_deliveries (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  game        TEXT NOT NULL,
  draw_period TEXT,
  channel     TEXT NOT NULL,                 -- line | web
  status      TEXT NOT NULL,                 -- sent | failed | skipped
  detail      TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_delivery_user ON pick_deliveries(user_id);

-- 後台稽核日誌
CREATE TABLE IF NOT EXISTS admin_audit (
  id          TEXT PRIMARY KEY,
  actor       TEXT NOT NULL,                 -- 操作者 (admin 帳號)
  action      TEXT NOT NULL,                 -- 動作描述
  target_user TEXT,
  detail      TEXT,
  created_at  TEXT NOT NULL
);

-- 訂閱方案定義 (可後台調整)
CREATE TABLE IF NOT EXISTS plans (
  tier        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  price_twd   INTEGER NOT NULL,
  features    TEXT NOT NULL,                 -- JSON 陣列
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1
);

-- 金流訂單：建立委託時寫入 pending，藍新幕後通知(Notify)回來時對應回會員並開通訂閱。
CREATE TABLE IF NOT EXISTS orders (
  mer_order_no  TEXT PRIMARY KEY,               -- 送藍新的 MerOrderNo（唯一）
  user_id       TEXT NOT NULL REFERENCES users(id),
  tier          TEXT NOT NULL,                  -- pro | max
  amount        INTEGER NOT NULL,               -- 每期金額
  cycle         TEXT NOT NULL DEFAULT 'M',      -- M=月繳 | Y=年繳
  status        TEXT NOT NULL DEFAULT 'pending',-- pending | paid | failed
  period_no     TEXT,                           -- 藍新委託單號 PeriodNo
  trade_no      TEXT,                           -- 藍新交易序號
  raw           TEXT,                           -- 通知原文（除錯）
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- 通用計數器（累積到訪人次等）。
CREATE TABLE IF NOT EXISTS counters (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
