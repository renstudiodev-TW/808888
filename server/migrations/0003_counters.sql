-- 通用計數器（累積到訪人次等）。以 cookie 去重，每位訪客只 +1 一次，省 D1 寫入。
CREATE TABLE IF NOT EXISTS counters (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO counters (key, value) VALUES ('visits', 0);
